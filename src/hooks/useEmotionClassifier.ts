import * as tf from "@tensorflow/tfjs";
import { useEffect, useState } from "react";
const EMOTIONS = ["Neutral", "Happy", "Sad", "Angry", "Surprised"];

export const useEmotionClassifier = (
  setCurrentEmotion: React.Dispatch<React.SetStateAction<string>>,
) => {
  const [classifier, setClassifier] = useState<tf.Sequential | null>(null);
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
  const predictEmotion = (features) => {
    // Validate inputs to prevent runtime errors
    if (!classifier) {
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
        const predictionTensor = classifier.predict(inputTensor);

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

  return { classifier, status, predictEmotion };
};
