import React, { useState, KeyboardEvent } from "react";
import { FiX } from "react-icons/fi";

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function TagInput({ tags, setTags, placeholder, label }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmed = inputValue.trim().replace(/,$/, "");
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInputValue("");
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          {label}
        </label>
      )}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 min-h-[46px] flex flex-wrap gap-2 focus-within:border-blue-500 transition-colors">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="flex items-center gap-1 bg-zinc-800 text-zinc-200 px-2.5 py-1 rounded-md text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-zinc-400 hover:text-red-400 focus:outline-none"
            >
              <FiX size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          className="flex-1 bg-transparent text-white outline-none min-w-[120px] text-sm"
          placeholder={tags.length === 0 ? placeholder : ""}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
        />
      </div>
    </div>
  );
}
