import { useEffect, useState } from "react";
const KOKORO_MODEL_ID = "onnx-community/Kokoro-82M-ONNX";
import { KokoroTTS } from "kokoro-js";

export const useKokoroTTS = () => {
  const [tts, setTts] = useState<any>(null);
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
