"use client";

import { useState } from "react";

export default function LanguageSwitcher() {
  // Initialize directly from localStorage instead of useEffect
  const [language, setLanguage] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("language") || "en"
      : "en"
  );

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const lang = e.target.value;
    setLanguage(lang);

    localStorage.setItem("language", lang);

    window.dispatchEvent(new Event("languageChange"));
  }

  return (
    <select
      value={language}
      onChange={handleChange}
      className="border p-2 rounded"
    >
      <option value="en">English</option>
      <option value="ta">தமிழ்</option>
      <option value="hi">हिन्दी</option>
    </select>
  );
}
