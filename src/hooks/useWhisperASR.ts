import { useEffect, useState } from "react";
import {
  AutomaticSpeechRecognitionPipeline,
  pipeline,
} from "@huggingface/transformers";

export const useWhisperASR = () => {
  const [whisperPipeline, setWhisperPipeline] =
    useState<AutomaticSpeechRecognitionPipeline | null>(null);
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
