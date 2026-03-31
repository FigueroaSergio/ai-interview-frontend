import { Roles, type ContextInterview, type Transcript } from "./state";
import { Chat } from "./chat";
const API_BASE_URL = import.meta.env.VITE_CHAT_API;

class WavStreamPlayer {
  private audioContext: AudioContext;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null;
  private nextStartTime: number = 0;
  private isProcessing = false;
  private headerInfo: { sampleRate: number; channels: number } | null = null;
  private allChunks: Uint8Array[] = [];
  private isStreamExhausted = false;
  private cachedFullBuffer: AudioBuffer | null = null;

  public onended?: () => void;
  public onpause?: () => void;
  public currentTime: number = 0;

  constructor(response: Response) {
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    this.reader = response.body!.getReader();
  }

  async play() {
    if (this.isProcessing) {
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      return;
    }

    if (this.isStreamExhausted) {
      this.playFromCache();
      return;
    }

    this.isProcessing = true;
    this.nextStartTime = this.audioContext.currentTime;

    try {
      let leftover = new Uint8Array(0);
      let headerSkipped = false;

      while (this.reader) {
        const { done, value } = await this.reader.read();

        if (done) {
          this.isStreamExhausted = true;
          this.reader = null;
          this.prepareFullBuffer();

          const remainingTime =
            (this.nextStartTime - this.audioContext.currentTime) * 1000;
          setTimeout(
            () => {
              if (this.onended) this.onended();
              this.isProcessing = false;
            },
            Math.max(0, remainingTime),
          );
          break;
        }

        this.allChunks.push(value);

        let chunk = new Uint8Array(leftover.length + value.length);
        chunk.set(leftover);
        chunk.set(value, leftover.length);
        leftover = new Uint8Array(0);

        if (!headerSkipped) {
          if (chunk.length < 44) {
            leftover = chunk;
            continue;
          }
          const view = new DataView(
            chunk.buffer,
            chunk.byteOffset,
            chunk.byteLength,
          );
          const sampleRate = view.getUint32(24, true);
          const channels = view.getUint16(22, true);
          this.headerInfo = { sampleRate, channels };

          chunk = chunk.slice(44);
          headerSkipped = true;
        }

        if (chunk.length > 0) {
          if (chunk.length % 2 !== 0) {
            leftover = chunk.slice(chunk.length - 1);
            chunk = chunk.slice(0, chunk.length - 1);
          }

          if (chunk.length > 0) {
            this.enqueueChunk(chunk);
          }
        }
      }
    } catch (e) {
      console.error("Streaming error", e);
      this.isProcessing = false;
    }
  }

  private prepareFullBuffer() {
    if (!this.headerInfo || this.allChunks.length === 0) return;

    const { sampleRate, channels } = this.headerInfo;
    const totalLength = this.allChunks.reduce((acc, c) => acc + c.length, 0);
    const fullRaw = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.allChunks) {
      fullRaw.set(chunk, offset);
      offset += chunk.length;
    }

    const pcmData = fullRaw.slice(44);
    const samplesPerChannel = pcmData.length / 2 / channels;
    const buffer = this.audioContext.createBuffer(
      channels,
      samplesPerChannel,
      sampleRate,
    );
    const view = new DataView(pcmData.buffer);

    for (let c = 0; c < channels; c++) {
      const channelData = buffer.getChannelData(c);
      for (let i = 0; i < samplesPerChannel; i++) {
        const off = (i * channels + c) * 2;
        if (off + 1 < pcmData.length) {
          channelData[i] = view.getInt16(off, true) / 32768.0;
        }
      }
    }
    this.cachedFullBuffer = buffer;
  }

  private playFromCache() {
    if (!this.cachedFullBuffer) return;

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.cachedFullBuffer;
    source.connect(this.audioContext.destination);
    source.onended = () => {
      this.isProcessing = false;
      if (this.onended) this.onended();
    };

    this.isProcessing = true;
    source.start(0);
  }

  private enqueueChunk(chunk: Uint8Array) {
    if (!this.headerInfo) return;

    const { sampleRate, channels } = this.headerInfo;
    const samplesPerChannel = chunk.length / 2 / channels;
    const audioBuffer = this.audioContext.createBuffer(
      channels,
      samplesPerChannel,
      sampleRate,
    );
    const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);

    for (let c = 0; c < channels; c++) {
      const channelData = audioBuffer.getChannelData(c);
      for (let i = 0; i < samplesPerChannel; i++) {
        const offset = (i * channels + c) * 2;
        channelData[i] = view.getInt16(offset, true) / 32768.0;
      }
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const playTime = Math.max(
      this.audioContext.currentTime,
      this.nextStartTime,
    );
    source.start(playTime);
    this.nextStartTime = playTime + audioBuffer.duration;
  }

  pause() {
    this.audioContext.suspend();
    if (this.onpause) this.onpause();
  }
}

export const generateVoice = async (text: string) => {
  if (!text) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/audio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    });

    if (!response.ok) throw new Error("Generation failed");
    if (!response.body) throw new Error("No response body");

    return new WavStreamPlayer(response) as any;
  } catch (error) {
    console.error("Error generating audio:", error);
  }
  return null;
};
export async function getInterviewQuestion(stateContext: ContextInterview) {
  // Construct the "Brain" prompt using the XState Context
  const systemInstruction = `
    You are an expert interviewer. 
    Role: ${stateContext.role}
    Rule: Ask ONE concise question. Stay in character.
    Don't not add ani emoji or markdown to your answer

  `;
  // Candidate Resume: ${stateContext.resume}

  console.log("QUESTION");
  const history = [...stateContext.transcript];
  history.push({ role: Roles.User, content: "Next question please." });

  const result = await Chat(history, systemInstruction);
  const text = result ?? "";
  const audio = await generateVoice(text);
  return { text, audio };
}
export async function getIntakeAI(stateContext: ContextInterview) {
  // 2. Their Resume or a summary of their experience.
  const transcript = stateContext.transcript;
  const systemInstruction = `
    You are an AI Intake Assistant. Your job is to politely ask the user for:
    1. The Job Description or Role they are interviewing for.
    
    If they haven't provided one of these, ask for it nicely and shorter. 
    If they provide both, acknowledge it and say you are ready to start.
    Don't not add ani emoji or markdown to your answer
    ${transcript.length > 0 ? `Current Transcript: ${JSON.stringify(transcript)}` : ""}
  `;
  console.log("INTAKE");
  const history = stateContext.transcript;

  const result = await Chat(history, systemInstruction);
  const text = result ?? "";
  const audio = await generateVoice(text);
  return { text, audio };
}

export async function checkCompleteness(transcript: Transcript[]) {
  const checkPrompt = `
Act as a precise data extraction engine. Analyze the provided Transcript and extract the "Target Role".

### Rules:
1. isComplete: Set to true only if a specific target role is provided. Otherwise, set to false.
2. Format: Return ONLY a valid JSON object. Do not include any introductory text, markdown code blocks (\`\`\`json), or post-response commentary.
3. Content: If data is missing, use "Not provided" for that specific field.

### Data:
Transcript: ${JSON.stringify(transcript)}

### Output Schema:
{
  "isComplete": boolean,
  "extractedRole": "string",
}
  `;
  console.log("CHECK");

  const result = await Chat([], checkPrompt);
  function cleanJsonResponse(rawString: string) {
    return rawString.replace(/```json|```/g, "").trim();
  }

  return JSON.parse(cleanJsonResponse(result ?? ""));
}

export async function getFinalEvaluation(context: ContextInterview) {
  const systemInstruction = `
<Task>
Act as a Senior Hiring Committee member. Analyze the transcript of the interview session.
</Task>

<Evaluation_Criteria>
- Communication: Did they use filler words? Was the tone appropriate?
- Technical Depth: Did they demonstrate 'Senior' level knowledge or just 'Junior' surface level?
- STAR Alignment: Rate each answer 1-10 on how well they followed the STAR framework.
</Evaluation_Criteria>

<Output_Format>
Provide ONLY a valid JSON object. Do not include any introductory text, markdown code blocks, or post-response commentary. The output must be perfectly parseable by JSON.parse().
{
  "overall_score": 0-100,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "missed_opportunities": "Specific things the candidate should have mentioned based on their resume but didn't.",
  "improved_responses": [
    {"question": "string", "better_version": "string"}
  ]
}
</Output_Format>
  `;

  const messages = [
    {
      role: "user" as Roles,
      content: `Role: ${context.role}\nResume: ${context.resume}\n\nTranscript: ${JSON.stringify(context.transcript)}`,
    },
  ];

  console.log("FINAL EVALUATION");
  const result = await Chat(messages, systemInstruction);

  function cleanJsonResponse(rawString: string) {
    return rawString.replace(/^```json|```$/gm, "").trim();
  }

  let finalEvaluation = "";
  try {
    const rawText = result ?? "";
    const cleaned = cleanJsonResponse(rawText);
    // ensure it's valid JSON
    JSON.parse(cleaned);
    finalEvaluation = cleaned;
  } catch (e) {
    console.warn("Failed to parse evaluation output", e);
    finalEvaluation = JSON.stringify({
      overall_score: 0,
      strengths: [],
      weaknesses: ["Failed to parse AI response"],
      missed_opportunities: "",
      improved_responses: [],
    });
  }

  return { text: finalEvaluation, audio: null };
}
