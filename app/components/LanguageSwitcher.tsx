"use client";

import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const saved =
      localStorage.getItem("language") || "en";

    setLanguage(saved);
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    const lang = e.target.value;

    setLanguage(lang);

    localStorage.setItem(
      "language",
      lang
    );

    window.dispatchEvent(
      new Event("languageChange")
    );
  }

  return (
    <select
      value={language}
      onChange={handleChange}
      className="border p-2 rounded"
    >
      <option value="en">
        English
      </option>

      <option value="ta">
        தமிழ்
      </option>

      <option value="hi">
        हिन्दी
      </option>
    </select>
  );
}