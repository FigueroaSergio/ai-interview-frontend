import { useEffect, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

export const useFaceMeshDetector = () => {
  const [detector, setDetector] =
    useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
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
