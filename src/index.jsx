import React, { useState, useRef, useEffect } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-core";
import * as tf from "@tensorflow/tfjs";
import { pipeline, env } from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";
import { useMachine } from "@xstate/react";
import { interviewMachine, Roles } from "./core/state";
import { generateVoice } from "./core/ai";
const EMOTIONS = ["Neutral", "Happy", "Sad", "Angry", "Surprised"];
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const KOKORO_MODEL_ID = "onnx-community/Kokoro-82M-ONNX";

env.allowLocalModels = false;
env.useBrowserCache = true;

const generateMessageId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const useFaceMeshDetector = () => {
  const [detector, setDetector] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;

    const init = async () => {
      try {
        await tf.ready();
        await tf.setBackend("webgl");

        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const created = await faceLandmarksDetection.createDetector(model, {
          runtime: "tfjs",
          modelType: "short",
          maxFaces: 1,
          refineLandmarks: true,
          solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
          detectorModelConfig: { maxFaces: 1, scoreThreshold: 0.3 },
        });

        if (!alive) return;
        setDetector(created);
        setStatus("ready");
      } catch (err) {
        console.error("Face mesh load failed", err);
        if (alive) setStatus("error");
      }
    };

    init();
    return () => {
      alive = false;
      if (detector && detector.dispose) detector.dispose();
    };
  }, []);

  return { detector, status };
};

const useWhisperASR = () => {
  const [whisperPipeline, setWhisperPipeline] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;

    const init = async () => {
      try {
        const pipe = await pipeline(
          "automatic-speech-recognition",
          "Xenova/whisper-tiny.en",
          { dtype: "q4" },
        );

        if (!alive) return;
        setWhisperPipeline(() => pipe);
        setStatus("ready");
      } catch (err) {
        console.error("Whisper load failed", err);
        if (alive) setStatus("error");
      }
    };

    init();
    return () => {
      alive = false;
    };
  }, []);

  return { whisperPipeline, status };
};

const useEmotionClassifier = () => {
  const [classifier, setClassifier] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;

    const init = () => {
      try {
        const nn = tf.sequential();
        nn.add(
          tf.layers.dense({
            units: 64,
            activation: "relu",
            inputShape: [1434],
          }),
        );
        nn.add(tf.layers.dropout({ rate: 0.2 }));
        nn.add(tf.layers.dense({ units: 32, activation: "relu" }));
        nn.add(
          tf.layers.dense({ units: EMOTIONS.length, activation: "softmax" }),
        );

        nn.compile({
          optimizer: "adam",
          loss: "categoricalCrossentropy",
          metrics: ["accuracy"],
        });

        if (alive) {
          setClassifier(nn);
          setStatus("ready");
        }
      } catch (err) {
        console.error("Classifier init failed", err);
        if (alive) setStatus("error");
      }
    };

    init();
    return () => {
      alive = false;
    };
  }, []);

  return { classifier, status };
};

const useKokoroTTS = () => {
  const [tts, setTts] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;

    const init = async () => {
      try {
        const model = await KokoroTTS.from_pretrained(KOKORO_MODEL_ID, {
          dtype: "q4",
        });

        if (!alive) return;
        setTts(model);
        setStatus("ready");
      } catch (err) {
        console.error("Kokoro TTS load failed", err);
        if (alive) setStatus("error");
      }
    };

    init();
    return () => {
      alive = false;
    };
  }, []);

  return { tts, status };
};

export const Screen = () => {
  const [status, setStatus] = useState("Initializing models...");
  const [messages, setMessages] = useState([
    {
      id: generateMessageId(),
      role: "bot",
      text: "Hello! Record a video to see the AI magic.",
    },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("None");
  const [cameraStarted, setCameraStarted] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const offscreenRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const { detector, status: faceStatus } = useFaceMeshDetector();
  const { whisperPipeline, status: whisperStatus } = useWhisperASR();
  const { classifier, status: classifierStatus } = useEmotionClassifier();
  const { tts, status: ttsStatus } = useKokoroTTS();

  const emotionRef = useRef("None");

  useEffect(() => {
    emotionRef.current = currentEmotion;
  }, [currentEmotion]);

  useEffect(() => {
    const offscreen = document.createElement("canvas");
    offscreen.width = VIDEO_WIDTH;
    offscreen.height = VIDEO_HEIGHT;
    offscreenRef.current = offscreen;
  }, []);
  const [state, send] = useMachine(interviewMachine);

  useEffect(() => {
    if (
      [faceStatus, whisperStatus, classifierStatus, ttsStatus].includes("error")
    ) {
      setStatus("Error loading models. Check console.");
      return;
    }

    if (
      [faceStatus, whisperStatus, classifierStatus, ttsStatus].every(
        (s) => s === "ready",
      )
    ) {
      setStatus("Ready");
      return;
    }

    setStatus("Initializing models...");
  }, [faceStatus, whisperStatus, classifierStatus, ttsStatus]);

  useEffect(() => {
    if (status === "Ready" && !cameraStarted) {
      startCamera();
      setCameraStarted(true);
    }
  }, [status, cameraStarted]);
  useEffect(() => {
    let init = async () => {
      console.log("ENTER");

      const transcript = state.context.transcript;
      let lastIndex = transcript.length - 1;
      if (!transcript[lastIndex]) {
        return;
      }
      if (transcript[lastIndex].role == Roles.User) {
        return;
      }
      console.log("LAST AI");

      const audio = await generateVoice(transcript[lastIndex].content);
      if (audio) {
        playAudio(audio);
      }
    };
    init();
  }, [state.context.transcript]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          requestAnimationFrame(processFrame);
        };
      }
    } catch (e) {
      console.error("Camera access denied", e);
      setStatus("Camera access denied");
    }
  };

  const processFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const offscreen = offscreenRef.current;

    if (
      !video ||
      !canvas ||
      !offscreen ||
      !detector ||
      video.readyState !== 4
    ) {
      requestAnimationFrame(processFrame);
      return;
    }

    const offCtx = offscreen.getContext("2d");
    offCtx.drawImage(video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    const faces = await detector.estimateFaces(offscreen, {
      flipHorizontal: false,
    });

    let draw = false;
    if (draw) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    }

    if (faces && faces.length > 0) {
      const face = faces[0];

      const mirroredKeypoints = face.keypoints.map((k) => ({
        ...k,
        x: VIDEO_WIDTH - k.x,
      }));
      if (draw) {
        drawMesh(ctx, mirroredKeypoints);
      }
      const features = face.keypoints.flatMap((k) => [
        k.x / VIDEO_WIDTH,
        k.y / VIDEO_HEIGHT,
        (k.z || 0) / 100,
      ]);

      predictEmotion(features, classifier);
    }

    requestAnimationFrame(processFrame);
  };

  const drawMesh = (ctx, keypoints) => {
    keypoints.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0, 255, 180, 0.4)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#00ffb4";
      ctx.fill();
    });
  };
  const predictEmotion = (features, classifierModel) => {
    // Validate inputs to prevent runtime errors
    if (!classifierModel) {
      console.warn("Emotion classifier model is not loaded yet");
      return;
    }

    if (!Array.isArray(features) || features.length !== 1434) {
      console.warn(
        `Invalid features array: expected 1434 elements, got ${
          features?.length ?? "undefined"
        }`,
      );
      return;
    }

    // Check for invalid numbers in features
    const hasInvalidValues = features.some(
      (f) => typeof f !== "number" || isNaN(f) || !isFinite(f),
    );
    if (hasInvalidValues) {
      console.warn("Features contain invalid or non-finite values");
      return;
    }

    try {
      // Use tf.tidy to automatically clean up tensors and prevent memory leaks
      tf.tidy(() => {
        // Convert features to tensor with shape [1, 1434] (batch size 1)
        const inputTensor = tf.tensor2d([features], [1, 1434]);

        // Run inference
        const predictionTensor = classifierModel.predict(inputTensor);

        // Get the index of the highest probability class
        const predictedIndex = predictionTensor.argMax(1).dataSync()[0];

        // Validate the predicted index is within the emotions array bounds
        if (
          Number.isInteger(predictedIndex) &&
          predictedIndex >= 0 &&
          predictedIndex < EMOTIONS.length
        ) {
          const detectedEmotion = EMOTIONS[predictedIndex];
          setCurrentEmotion(detectedEmotion);
        } else {
          console.warn(
            `Prediction returned invalid index: ${predictedIndex}. Expected 0-${EMOTIONS.length - 1}`,
          );
        }
      });
    } catch (error) {
      console.error("Error during emotion prediction:", error);
      // Optionally set to a default state or keep current
    }
  };

  const playAudio = async (audio) => {
    await audio.play();
  };

  const appendBotMessage = async (text) => {
    const id = generateMessageId();
    setMessages((prev) => [
      ...prev,
      { id, role: "bot", text, audioData: null, sampleRate: null },
    ]);
    generateAndPlay(text);
    if (!tts || ttsStatus !== "ready") {
      return;
    }

    if (true) return;

    try {
      const result = await tts.generate(text, { voice: "af_bella" });
      if (result && result.audio && result.sampling_rate) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  audioData: result,
                }
              : m,
          ),
        );
        // Auto-play for bot messages
        playAudio(result);
      }
    } catch (err) {
      console.error("TTS generation failed", err);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      chunksRef.current = [];
      const stream = videoRef.current.srcObject;
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = handleVideoCaptured;
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    }
  };

  const handleVideoCaptured = async () => {
    setIsProcessing(true);
    setStatus("Processing Audio...");
    const blob = new Blob(chunksRef.current, { type: "video/webm" });

    try {
      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )({ sampleRate: 16000 });
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const offlineAudio = audioBuffer.getChannelData(0);

      let text = "(no transcription)";
      if (whisperPipeline) {
        const result = await whisperPipeline(offlineAudio, {
          return_timestamps: "word",
        });
        text = (result?.text || "").trim() || text;
      }

      const emotion = emotionRef.current;
      const videoUrl = URL.createObjectURL(blob);
      send({ type: "SUBMIT", payload: text });
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          role: "user",
          text: `[Recording]: "${text}" (Detected: ${emotion})`,
          videoUrl,
        },
      ]);

      await appendBotMessage(
        `I heard you say: "${text}". You look like you're feeling ${emotion.toLowerCase()} right now.`,
      );
    } catch (err) {
      console.error("Processing failed", err);
      setStatus("Processing failed.");
    } finally {
      setIsProcessing(false);
      setStatus("Ready");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans p-4 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${status === "Ready" ? "bg-green-500" : "bg-yellow-500"} animate-pulse`}
          />
          Edge AI Video Chat
        </h1>
        <div className="px-3 py-1 bg-slate-700 rounded-full text-xs font-mono">
          {status}
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left: Video + Mesh overlay */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            {/* Video: CSS-mirrored, shows the live camera feed */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
              muted
              playsInline
            />

            {/* Canvas: transparent, no CSS mirror needed —
                dots are pre-mirrored in JS before drawing */}
            <canvas
              ref={canvasRef}
              width={VIDEO_WIDTH}
              height={VIDEO_HEIGHT}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Emotion badge */}
            <div className="absolute top-6 left-6">
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <span className="text-[10px] uppercase tracking-widest opacity-60 block">
                  Facial Analysis
                </span>
                <div className="text-2xl font-black text-cyan-400 drop-shadow-md">
                  {currentEmotion !== "None" ? currentEmotion : "Detecting..."}
                </div>
              </div>
            </div>

            {/* Record button */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
              <button
                onClick={toggleRecording}
                disabled={isProcessing || status !== "Ready"}
                className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  isRecording
                    ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                    : "bg-white hover:bg-cyan-50 shadow-xl"
                } ${isProcessing ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
              >
                <div
                  className={`transition-all duration-300 ${isRecording ? "w-8 h-8 bg-white rounded-lg" : "w-7 h-7 bg-red-500 rounded-full"}`}
                />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {isRecording ? "Stop Recording" : "Record & Analyze"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
            <span className="font-bold text-slate-400 text-sm">
              Session History
            </span>
            <div className="text-[10px] bg-cyan-900/50 text-cyan-300 px-2 py-1 rounded uppercase tracking-tighter">
              On-Device Processing
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/20">
            {state.context.transcript.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-sm ${
                    m.role === "user"
                      ? "bg-cyan-700 text-white rounded-tr-none border border-cyan-600/50"
                      : "bg-slate-700 text-slate-100 rounded-tl-none border border-slate-600"
                  }`}
                >
                  {m.content}

                  {m.videoUrl && (
                    <video
                      src={m.videoUrl}
                      controls
                      className="mt-2 w-full max-w-xs rounded-lg"
                      muted
                    />
                  )}

                  {m.audioData && (
                    <button
                      onClick={() => playAudio(m.audioData)}
                      className="mt-2 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs rounded"
                    >
                      🔊 Play
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 p-4 rounded-2xl rounded-tl-none text-xs text-slate-400 flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                  Analyzing audio and expression...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-900/50 border-t border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase font-semibold text-center leading-relaxed">
              No data leaves this browser.
              <br />
              MediaPipe Face Mesh + Transformers.js (Whisper)
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-in { animation: slide-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};
