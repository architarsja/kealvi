"use client";

import { useState } from "react";

export default function PollCard() {
  const [selected, setSelected] = useState("");

  const options = [
    "React",
    "Next.js",
    "Supabase",
    "TypeScript",
  ];

  const vote = () => {
    if (!selected){
    alert("Please select an option");
      return;
    }

    alert(`You voted for ${selected}`);
  };

  return (
    <div className="border rounded-lg p-4 mb-6">
      <h2 className="text-xl font-bold mb-3">
        Live Poll
      </h2>

      <p className="mb-3">
        Which technology should we discuss next?
      </p>

      {options.map((option) => (
        <div key={option} className="mb-2">
          <label>
            <input
              type="radio"
              name="poll"
              value={option}
              onChange={(e) =>
                setSelected(e.target.value)
              }
            />
            <span className="ml-2">{option}</span>
          </label>
        </div>
      ))}

      <button
        onClick={vote}
        className="mt-3 border px-4 py-2 rounded"
      >
        Vote
      </button>
    </div>
  );
}