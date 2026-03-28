import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const SetupModal = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionQuantity, setQuestionQuantity] = useState(5);

  return (
    <div className="flex flex-col h-screen bg-surface justify-center items-center z-50 p-6">
      <div className="bg-surface-container-lowest p-10 rounded-[1.5rem] w-full max-w-md shadow-[0_20px_50px_rgba(23,28,38,0.05)]">
        <h2 className="text-[2rem] leading-tight font-medium mb-8 text-on-surface tracking-tight">Setup Interview</h2>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-on-surface-variant">Your Name:</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full p-4 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-[3px] focus:ring-primary/20 transition-all font-medium border-none outline-none"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-on-surface-variant">
            Difficulty Level:
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full p-4 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-[3px] focus:ring-primary/20 transition-all font-medium border-none outline-none appearance-none"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2 text-on-surface-variant">
            Number of Questions:
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={questionQuantity}
            onChange={(e) => setQuestionQuantity(Number(e.target.value))}
            className="w-full p-4 rounded-xl bg-surface-container-low text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-[3px] focus:ring-primary/20 transition-all font-medium border-none outline-none"
          />
        </div>
        <button
          onClick={() => {
            if (!userName.trim()) {
              alert("Please enter your name");
              return;
            }
            navigate("/interview", {
              state: {
                name: userName,
                difficulty,
                quantity: questionQuantity,
              }
            });
          }}
          className="w-full bg-gradient-to-br from-primary to-primary-container hover:opacity-90 text-white font-medium text-sm py-4 px-6 rounded-xl shadow-[0_20px_50px_rgba(23,28,38,0.05)] transition-all hover:-translate-y-0.5"
        >
          Start Interview
        </button>
      </div>
    </div>
  );
};
