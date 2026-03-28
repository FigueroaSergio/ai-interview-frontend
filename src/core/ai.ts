import { Roles, type ContextInterview, type Transcript } from "./state";
import { Chat } from "./chat";
const API_BASE_URL = import.meta.env.VITE_CHAT_API;

export const generateVoice = async (text: string) => {
  if (!text) return;

  try {
    const response = await fetch(`${API_BASE_URL}/audio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    });

    if (!response.ok) throw new Error("Generation failed");

    // 1. Convert response stream to a Blob
    const blob = await response.blob();

    // 2. Create a "Temporal" URL for the blob
    const audioUrl = URL.createObjectURL(blob);

    return new Audio(audioUrl);
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
  const systemInstruction = `Act as a Lead Interviewer. Evaluate the candidate for the role: ${context.role}.`;

  const messages = [
    {
      role: "user",
      content: `Resume: ${context.resume}\n\nTranscript: ${JSON.stringify(context.transcript)}`,
    },
  ];
  const result = await Chat(messages, systemInstruction);
  const text = result ?? "";
  const audio = await generateVoice(text);
  return { text, audio };
}
