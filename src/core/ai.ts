import { GoogleGenAI } from "@google/genai";
import type { ContextInterview, Transcript } from "./state";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY ?? "",
});
const model = "gemma-3-27b-it";
export async function getInterviewQuestion(stateContext: ContextInterview) {
  // Construct the "Brain" prompt using the XState Context
  const systemInstruction = `
    You are an expert interviewer. 
    Role: ${stateContext.role}
    Rule: Ask ONE concise question. Stay in character.
  `;
  // Candidate Resume: ${stateContext.resume}

  console.log("QUESTION");
  const history = stateContext.transcript.map((msg) => ({
    role: msg.role === "ai" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
  history.push({ role: "model", parts: [{ text: systemInstruction }] });
  const chat = await ai.chats.create({
    model,
    history,
  });

  const result = await chat.sendMessage({ message: "Next question please." });
  return result.text ?? "";
}
export async function getIntakeAI(transcript: Transcript[]) {
  // 2. Their Resume or a summary of their experience.

  const prompt = `
    You are an AI Intake Assistant. Your job is to politely ask the user for:
    1. The Job Description or Role they are interviewing for.
    
    If they haven't provided one of these, ask for it nicely and shorter. 
    If they provide both, acknowledge it and say you are ready to start.
    Current Transcript: ${JSON.stringify(transcript)}
  `;
  console.log("INTAKE");

  const result = await ai.models.generateContent({ model, contents: prompt });
  return result.text ?? "";
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

  const result = await ai.models.generateContent({
    model,
    contents: checkPrompt,
  });
  function cleanJsonResponse(rawString: string) {
    return rawString.replace(/```json|```/g, "").trim();
  }

  return JSON.parse(cleanJsonResponse(result.text ?? ""));
}

export async function getFinalEvaluation(context: ContextInterview) {
  const prompt = `
    Act as a Lead Interviewer. 
    Evaluate the candidate for the role: ${context.role}.
    Resume Context: ${context.resume}
    
    Transcript: ${JSON.stringify(context.transcript)}
    
    Provide a score (0-100), key strengths, and specific feedback on how to improve 
    their technical depth in the answers provided.
  `;
  console.log("EVALUATION");

  const result = await ai.models.generateContent({
    model,
    contents: prompt,
  });
  return result.text ?? "";
}
