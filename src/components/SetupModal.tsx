import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const SetupModal = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionQuantity, setQuestionQuantity] = useState(5);

  return (
    <div className="flex flex-col h-screen bg-slate-900 justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg text-black max-w-md w-full shadow-2xl">
        <h2 className="text-2xl mb-4 font-bold">Setup Your Interview</h2>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Your Name:</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full p-2 border rounded bg-gray-100 text-black"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">
            Difficulty Level:
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full p-2 border rounded bg-gray-100 text-black"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">
            Number of Questions:
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={questionQuantity}
            onChange={(e) => setQuestionQuantity(Number(e.target.value))}
            className="w-full p-2 border rounded bg-gray-100 text-black"
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
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
        >
          Start Interview
        </button>
      </div>
    </div>
  );
};
