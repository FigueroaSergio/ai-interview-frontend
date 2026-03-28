import React from "react";
import { useNavigate } from "react-router-dom";

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white justify-center items-center">
      <h1 className="text-4xl font-bold mb-8">AI Interview Assistant</h1>
      <p className="text-lg mb-8 text-center">
        Prepare for your next interview with AI-powered practice.
        <br />
        Face detection, emotion analysis, and voice transcription.
      </p>
      <button
        onClick={() => {
          navigate("/setup");
        }}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Start Interview
      </button>
    </div>
  );
};
