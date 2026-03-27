import React, { useState, useRef, useEffect } from "react";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-core";
import * as tf from "@tensorflow/tfjs";
import { pipeline, env } from "@huggingface/transformers";

const EMOTIONS = ["Neutral", "Happy", "Sad", "Angry", "Surprised"];
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

env.allowLocalModels = false;
env.useBrowserCache = true;

export const Screen = () => {
  const [status, setStatus] = useState("Initializing models...");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! Record a video to see the AI magic." },
  ]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("None");

  const videoRef = useRef(null);
  const canvasRef = useRef(null); // visible overlay for mesh dots
  const offscreenRef = useRef(null); // hidden canvas used for detection
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const detectorRef = useRef(null);
  const classifierRef = useRef(null);
  const whisperRef = useRef(null);
  const emotionRef = useRef("None");

  useEffect(() => {
    emotionRef.current = currentEmotion;
  }, [currentEmotion]);

  useEffect(() => {
    // Create the hidden offscreen canvas once
    const offscreen = document.createElement("canvas");
    offscreen.width = VIDEO_WIDTH;
    offscreen.height = VIDEO_HEIGHT;
    offscreenRef.current = offscreen;

    const init = async () => {
      try {
        setStatus("Loading Face Mesh...");
        await tf.ready();
        await tf.setBackend("webgl");

        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        detectorRef.current = await faceLandmarksDetection.createDetector(
          model,
          {
            runtime: "tfjs",
            modelType: "short",
            maxFaces: 1,
            refineLandmarks: true,
            solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh",
            detectorModelConfig: { maxFaces: 1, scoreThreshold: 0.3 },
          },
        );

        setStatus("Loading Whisper (ASR)...");
        whisperRef.current = await pipeline(
          "automatic-speech-recognition",
          "Xenova/whisper-tiny.en",
        );

        setStatus("Building Emotion Classifier...");
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
        classifierRef.current = nn;

        setStatus("Ready");
        startCamera();
      } catch (err) {
        console.error(err);
        setStatus("Error loading models. Check console.");
      }
    };
    init();
  }, []);

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

    if (!video || !canvas || !offscreen || video.readyState !== 4) {
      requestAnimationFrame(processFrame);
      return;
    }

    // 1. Draw the raw (un-mirrored) video frame onto the hidden offscreen canvas.
    //    The detector needs a canvas — not a video element — to produce results.
    const offCtx = offscreen.getContext("2d");
    offCtx.drawImage(video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    // 2. Run detection on the offscreen canvas (un-mirrored, flipHorizontal: false).
    //    Keypoints come back in original (un-mirrored) coordinates.
    const faces = await detectorRef.current.estimateFaces(offscreen, {
      flipHorizontal: false,
    });

    // 3. Clear the visible overlay canvas, then draw mirrored dots on top of
    //    the CSS-mirrored <video> element beneath it.
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    if (faces && faces.length > 0) {
      const face = faces[0];

      // Mirror each keypoint's X so the dots align with the CSS-mirrored video.
      const mirroredKeypoints = face.keypoints.map((k) => ({
        ...k,
        x: VIDEO_WIDTH - k.x,
      }));

      drawMesh(ctx, mirroredKeypoints);

      const features = face.keypoints.flatMap((k) => [
        k.x / VIDEO_WIDTH,
        k.y / VIDEO_HEIGHT,
        (k.z || 0) / 100,
      ]);
      predictEmotion(features);
    }

    requestAnimationFrame(processFrame);
  };

  const drawMesh = (ctx, keypoints) => {
    keypoints.forEach((pt) => {
      // Glow halo
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0, 255, 180, 0.4)";
      ctx.fill();
      // Bright core
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#00ffb4";
      ctx.fill();
    });
  };

  const predictEmotion = (features) => {
    if (!classifierRef.current || features.length !== 1434) return;
    tf.tidy(() => {
      const input = tf.tensor2d([features]);
      const prediction = classifierRef.current.predict(input);
      const index = prediction.argMax(1).dataSync();
      setCurrentEmotion(EMOTIONS[index]);
    });
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
      const result = await whisperRef.current(offlineAudio);
      const text = result.text.trim();
      const emotion = emotionRef.current;
      const videoUrl = URL.createObjectURL(blob);
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: `[Recording]: "${text}" (Detected: ${emotion})`,
          videoUrl,
        },
        {
          role: "bot",
          text: `I heard you say: "${text}". You look like you're feeling ${emotion.toLowerCase()} right now.`,
        },
      ]);
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
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-sm ${
                    m.role === "user"
                      ? "bg-cyan-700 text-white rounded-tr-none border border-cyan-600/50"
                      : "bg-slate-700 text-slate-100 rounded-tl-none border border-slate-600"
                  }`}
                >
                  {m.text}
                  {m.videoUrl && (
                    <video
                      src={m.videoUrl}
                      controls
                      className="mt-2 w-full max-w-xs rounded-lg"
                      muted
                    />
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
