import { WavStreamPlayer } from "wavtools";
import { Roles, type ContextInterview, type Transcript } from "./state";
import { Chat } from "./chat";
const API_BASE_URL = import.meta.env.VITE_CHAT_API;

let globalPlayer: WavStreamPlayer | null = null;

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

    if (!globalPlayer) {
      globalPlayer = new WavStreamPlayer({ sampleRate: 44100 });
      await globalPlayer.connect();
    } else {
      // Interrupt previous playback
      await globalPlayer.interrupt();
    }

    const player = globalPlayer;
    let allPcmChunks: Int16Array[] = [];
    let isStreamFinished = false;

    const audioWrapper = {
      onended: null as (() => void) | null,
      onpause: null as (() => void) | null,
      play: async () => {
        if (player.context && player.context.state === "suspended") {
          await player.context.resume();
        }
        // If the stream finished, we can replay from our cached chunks
        if (isStreamFinished && allPcmChunks.length > 0) {
          await player.interrupt();
          for (const pcm of allPcmChunks) {
            player.add16BitPCM(pcm);
          }
          // Emit onended after a short delay since we re-played
          setTimeout(() => {
            if (audioWrapper.onended) audioWrapper.onended();
          }, 1000); // Approximate duration or we could calculate it
        }
      },
      pause: () => {
        player.interrupt();
        if (audioWrapper.onpause) audioWrapper.onpause();
      },
      get currentTime() { return 0; },
      set currentTime(_: number) { /* ignore */ },
    };

    // Consolidated Stream Processing
    (async () => {
      const reader = response.body!.getReader();
      let bytesReceived = 0;
      let leftOver: Uint8Array | null = null;
      const HEADER_SIZE = 44;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          let data = value;
          if (leftOver) {
            const combined = new Uint8Array(leftOver.length + data.length);
            combined.set(leftOver);
            combined.set(data, leftOver.length);
            data = combined;
            leftOver = null;
          }

          // Skip WAV header logic
          if (bytesReceived < HEADER_SIZE) {
            const needed = HEADER_SIZE - bytesReceived;
            if (data.length <= needed) {
              bytesReceived += data.length;
              continue;
            }
            data = data.slice(needed);
            bytesReceived = HEADER_SIZE;
          }

          // Int16 Alignment Logic (Ensure 2-byte samples)
          if (data.length % 2 !== 0) {
            leftOver = data.slice(-1);
            data = data.slice(0, -1);
          }

          if (data.length > 0) {
            const pcm = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
            allPcmChunks.push(pcm);
            player.add16BitPCM(pcm.buffer);
          }
        }
      } catch (e) {
        console.error("Stream error:", e);
      } finally {
        isStreamFinished = true;
        setTimeout(() => {
          if (audioWrapper.onended) audioWrapper.onended();
        }, 500);
      }
    })().catch(console.error);

    return audioWrapper as any;
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
