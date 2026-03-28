import type { Transcript } from "./state";
const API_BASE_URL = import.meta.env.VITE_CHAT_API;
export async function Chat(messages: Transcript[], systemInstruction?: string) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      system_instruction: systemInstruction,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch from AI");
  }

  const data = await response.json();
  return data.response; // Returns the 'content' string from your FastAPI
}
