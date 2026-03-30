import { useState, useRef, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PreviewModal } from "./components/PreviewModal";
import { CameraModal } from "./components/CameraModal";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-core";
import { env } from "@huggingface/transformers";

import { InterviewContext, Roles } from "./core/state";
import { useFaceMeshDetector } from "./hooks/useFaceMeshDetector";
import { useWhisperASR } from "./hooks/useWhisperASR";
import { useEmotionClassifier } from "./hooks/useEmotionClassifier";
import { AudioLines, RefreshCw } from "lucide-react";
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;

env.allowLocalModels = false;

export const Screen = () => {
  const [status, setStatus] = useState("Initializing models...");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("None");
  const [cameraStarted, setCameraStarted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const location = useLocation();
  const setupData = location.state;
  const [previewText, setPreviewText] = useState("");
  const [previewEmotion, setPreviewEmotion] = useState("");
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<any>(null);

  console.log("Screen rendering");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recordingStartTime = useRef<number>(0);
  const currentDurationRef = useRef<number>(0);

  const { detector, status: faceStatus } = useFaceMeshDetector();
  const { whisperPipeline, status: whisperStatus } = useWhisperASR();
  const { status: classifierStatus, predictEmotion } =
    useEmotionClassifier(setCurrentEmotion);

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
  const state = InterviewContext.useSelector((s) => s);
  const send = InterviewContext.useActorRef().send;

  useEffect(() => {
    if (setupData && state.value === "setup") {
      send({
        type: "SUBMIT_SETUP",
        name: setupData.name,
        difficulty: setupData.difficulty,
        quantity: setupData.quantity,
      });
    }
  }, [setupData, state.value, send]);

  useEffect(() => {
    if ([faceStatus, whisperStatus, classifierStatus].includes("error")) {
      setStatus("Error loading models. Check console.");
      return;
    }

    if (
      [faceStatus, whisperStatus, classifierStatus].every((s) => s === "ready")
    ) {
      setStatus("Ready");
      return;
    }

    setStatus("Initializing models...");
  }, [faceStatus, whisperStatus, classifierStatus]);

  useEffect(() => {
    if (status === "Ready" && !cameraStarted) {
      startCamera();
      setCameraStarted(true);
    }
  }, [status, cameraStarted]);
  useEffect(() => {
    const init = async () => {
      console.log("ENTER");

      const transcript = state.context.transcript;
      const lastIndex = transcript.length - 1;
      if (!transcript[lastIndex]) {
        return;
      }
      if (transcript[lastIndex].role === Roles.User) {
        return;
      }
      console.log("LAST AI");

      if (transcript[lastIndex].audio) {
        playAudio(transcript[lastIndex].audio);
      }
    };
    init();
  }, [state.context.transcript]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.context.transcript, isProcessing, state.value]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;
          videoRef.current.play();
          requestAnimationFrame(processFrame);
        };
      }
      setCameraStarted(true);
    } catch (e) {
      console.error("Camera access denied", e);
      setStatus("Camera access denied");
      setShowCameraModal(true);
    }
  };

  const handleRetryCamera = async () => {
    setShowCameraModal(false);
    setCameraStarted(false);
    await startCamera();
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
    if (!offCtx) return;
    offCtx.drawImage(video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    const faces = await detector.estimateFaces(offscreen, {
      flipHorizontal: false,
    });

    const draw = false;
    if (draw) {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    }

    if (faces && faces.length > 0) {
      const face = faces[0];

      const mirroredKeypoints = face.keypoints.map((k) => ({
        ...k,
        x: VIDEO_WIDTH - k.x,
      }));
      if (draw) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        drawMesh(ctx, mirroredKeypoints);
      }
      const features = face.keypoints.flatMap((k) => [
        k.x / VIDEO_WIDTH,
        k.y / VIDEO_HEIGHT,
        (k.z || 0) / 100,
      ]);

      predictEmotion(features);
    }

    requestAnimationFrame(processFrame);
  };

  const drawMesh = (ctx: CanvasRenderingContext2D, keypoints: any[]) => {
    keypoints.forEach((pt: any) => {
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

  const playAudio = async (audio: any) => {
    if (playingAudio && playingAudio !== audio) {
      playingAudio.pause();
      playingAudio.currentTime = 0;
    }

    setPlayingAudio(audio);

    audio.onended = () => setPlayingAudio(null);
    audio.onpause = () => setPlayingAudio(null);

    try {
      await audio.play();
    } catch (e) {
      setPlayingAudio(null);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (!mediaRecorderRef.current) return;
      mediaRecorderRef.current.stop();
      currentDurationRef.current = Date.now() - recordingStartTime.current;
      setIsRecording(false);
    } else {
      if (playingAudio) {
        playingAudio.pause();
        playingAudio.currentTime = 0;
        setPlayingAudio(null);
      }

      chunksRef.current = [];
      if (!videoRef.current) return;
      const stream = videoRef.current.srcObject as MediaStream;
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = handleVideoCaptured;
      recordingStartTime.current = Date.now();
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
      const audioContext = new window.AudioContext({ sampleRate: 16000 });
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const offlineAudio = audioBuffer.getChannelData(0);

      let text = "(no transcription)";
      if (whisperPipeline) {
        const result: any = await whisperPipeline(offlineAudio, {
          return_timestamps: "word",
        });
        text = (result?.text || "").trim() || text;
      }

      const emotion = emotionRef.current;
      const videoUrl = URL.createObjectURL(blob);

      setPreviewText(text);
      setPreviewEmotion(emotion);
      setPreviewVideoUrl(videoUrl);
      setShowPreview(true);
    } catch (err) {
      console.error("Processing failed", err);
      setStatus("Processing failed.");
    } finally {
      setIsProcessing(false);
      setStatus("Ready");
    }
  };

  const handleSend = () => {
    send({
      type: "SUBMIT",
      payload: previewText,
      videoUrl: previewVideoUrl,
      durationMs: currentDurationRef.current,
    });
    setShowPreview(false);
    setPreviewText("");
    setPreviewEmotion("");
    setPreviewVideoUrl("");
  };

  const handleReRecord = () => {
    setShowPreview(false);
    setPreviewText("");
    setPreviewEmotion("");
    setPreviewVideoUrl("");
  };

  if (!setupData) {
    return <Navigate to="/setup" replace />;
  }

  if (state.matches("completed")) {
    return <Navigate to="/evaluation" replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-surface text-on-surface font-sans p-6 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-surface-container-low p-4 px-6 rounded-2xl">
        <h1 className="text-xl font-bold flex items-center gap-3 tracking-tight">
          <div
            className={`w-3 h-3 rounded-full ${status === "Ready" ? "bg-green-500" : "bg-yellow-500"}`}
          />
          Edge AI Video Chat
        </h1>
        <div className="px-4 py-1.5 bg-surface-container-highest rounded-full text-xs font-medium text-on-surface-variant">
          {status}
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left: Video + Mesh overlay */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative flex-1 bg-surface-container rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(23,28,38,0.05)] border-none">
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
            <div className="absolute top-6 left-6 z-10">
              <div className="bg-surface/80 backdrop-blur-md px-5 py-3 rounded-2xl">
                <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant block mb-1">
                  Facial Analysis
                </span>
                <div className="text-2xl font-black text-primary">
                  {currentEmotion !== "None" ? currentEmotion : "Detecting..."}
                </div>
              </div>
            </div>

            {/* Record button */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={toggleRecording}
                disabled={isProcessing || status !== "Ready"}
                className={`group relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                  isRecording
                    ? "bg-[#a8362a] shadow-[0_20px_50px_rgba(168,54,42,0.3)]"
                    : "bg-surface-container-lowest hover:bg-surface-container-low shadow-[0_20px_50px_rgba(23,28,38,0.08)]"
                } ${isProcessing ? "opacity-30 grayscale cursor-not-allowed" : ""}`}
              >
                <div
                  className={`transition-all duration-300 ${isRecording ? "w-8 h-8 bg-surface-container-lowest rounded-lg" : "w-7 h-7 bg-primary rounded-full"}`}
                />
                <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface text-on-surface text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_10px_20px_rgba(23,28,38,0.05)]">
                  {isRecording ? "Stop Recording" : "Record & Analyze"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col bg-surface-container-low rounded-[2rem] overflow-hidden">
          <div className="p-6 bg-surface-container flex items-center justify-between border-b-none">
            <span className="font-bold text-on-surface text-sm">
              Session History
            </span>
            <div className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-full uppercase tracking-wider font-bold">
              On-Device Processing
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {state.context.transcript.map((m: any, idx: number) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-5 rounded-3xl text-sm font-medium ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary-container text-white rounded-tr-sm shadow-[0_10px_20px_rgba(97,61,222,0.15)]"
                      : "bg-surface-container-lowest text-on-surface rounded-tl-sm shadow-[0_10px_30px_rgba(23,28,38,0.05)]"
                  }`}
                >
                  {m.content}

                  {m.videoUrl && (
                    <video
                      src={m.videoUrl}
                      controls
                      className="mt-4 w-full max-w-xs rounded-xl mirrored-video drop-shadow-sm"
                    />
                  )}
                  <br />
                  {m.audio && (
                    <button
                      onClick={() => playAudio(m.audio)}
                      className="mt-4 px-4 py-2 bg-surface-container-highest hover:bg-surface-container text-on-surface font-semibold text-xs rounded-xl transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <AudioLines
                          className={
                            playingAudio === m.audio
                              ? "animate-pulse text-primary"
                              : ""
                          }
                        />
                        {playingAudio === m.audio ? "Playing..." : "Play Audio"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(state.matches({ gatheringInfo: "aiAsking" }) ||
              state.matches({ interviewing: "aiThinking" }) ||
              state.matches("evaluating")) && (
              <div className="flex justify-start animate-in">
                <div className="bg-surface-container-lowest text-on-surface max-w-xs lg:max-w-md px-5 py-4 rounded-3xl rounded-tl-sm shadow-[0_10px_30px_rgba(23,28,38,0.05)]">
                  <div className="flex items-center space-x-3 font-medium text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-surface-container-highest p-5 rounded-3xl rounded-tl-sm text-sm font-medium text-on-surface flex items-center gap-3 shadow-[0_10px_30px_rgba(23,28,38,0.05)]">
                  <div className="flex gap-1.5">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: `${d}s` }}
                      />
                    ))}
                  </div>
                  Analyzing audio and expression...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {(state.matches("error") ||
            status.toUpperCase().includes("ERROR") ||
            status.toUpperCase().includes("FAILED")) && (
            <div className="px-6 py-5 bg-surface-container-low border-t border-surface-container-highest animate-in relative z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="text-center group-hover:scale-105 transition-transform">
                  <span className="text-[10px] text-red-500 uppercase font-black tracking-[0.25em] block mb-1.5 opacity-80">
                    System Alert
                  </span>
                  <p className="text-on-surface text-sm font-bold leading-tight">
                    {state.matches("error")
                      ? state.context.errorMessage
                      : status}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (state.matches("error")) {
                      send({ type: "RETRY" });
                    } else if (status === "Processing failed.") {
                      setStatus("Ready");
                    } else {
                      window.location.reload();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-[#a8362a] text-white font-black rounded-2xl shadow-[0_20px_40px_rgba(168,54,42,0.25)] hover:scale-[1.02] active:scale-95 transition-all group"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                  RETRY SYSTEM
                </button>
              </div>
            </div>
          )}

          <div className="p-4 bg-surface-container">
            <div className="text-[10px] text-on-surface-variant uppercase font-bold text-center leading-relaxed tracking-wider">
              No data leaves this browser.
              <br />
              MediaPipe Face Mesh + Transformers.js (Whisper)
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <PreviewModal
          previewText={previewText}
          setPreviewText={setPreviewText}
          previewEmotion={previewEmotion}
          previewVideoUrl={previewVideoUrl}
          handleReRecord={handleReRecord}
          handleSend={handleSend}
        />
      )}

      {showCameraModal && <CameraModal handleRetryCamera={handleRetryCamera} />}

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-in { animation: slide-in 0.3s ease-out forwards; }
        .mirrored-video {
          transform: scaleX(-1);
        }
        /* Resets the controls so they aren't flipped */
        .mirrored-video::-webkit-media-controls-panel {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};
