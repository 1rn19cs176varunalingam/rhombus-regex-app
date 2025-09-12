import React from "react";
//Component to handle user input for regex pattern, replacement, columns, and flags
export default function RegexForm({
  pattern,
  setPattern,
  replacement,
  setReplacement,
  columns,
  setColumns,
  flags,
  setFlags,
  loading,
  preview,
  Transform,
  pandasCode
}) {
  return (
    
<div className="bg-[#181829] rounded-2xl shadow-lg p-8 max-w-xl mx-auto mt-8">
  <h2 className="text-3xl font-bold text-white text-center mb-2">Regex Pattern Matcher</h2>
  <p className="text-center text-gray-400 mb-6">Describe the pattern you wanna change</p>
  <div className="grid grid-cols-2 gap-4 mb-6">
    <label className="flex flex-col">
      <span className="text-gray-300 mb-1">Regex pattern</span>
      <input
        type="text"
        className="rounded-lg px-3 py-2 bg-[#23233a] text-white placeholder-gray-500 focus:outline-none"
        placeholder="e.g. \\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,7}\\b"
        value={pattern}
        onChange={e => setPattern(e.target.value)}
      />
    </label>
    <label className="flex flex-col">
      <span className="text-gray-300 mb-1">Replacement</span>
      <input
        type="text"
        className="rounded-lg px-3 py-2 bg-[#23233a] text-white placeholder-gray-500 focus:outline-none"
        placeholder="e.g. REDACTED"
        value={replacement}
        onChange={e => setReplacement(e.target.value)}
      />
    </label>
    <label className="flex flex-col col-span-2">
      <span className="text-gray-300 mb-1">Columns (optional)</span>
      <input
        type="text"
        className="rounded-lg px-3 py-2 bg-[#23233a] text-white placeholder-gray-500 focus:outline-none"
        placeholder="e.g. Email, Notes (leave empty = all text cols)"
        value={columns}
        onChange={e => setColumns(e.target.value)}
      />
    </label>
    <label className="flex flex-col col-span-2">
      <span className="text-gray-300 mb-1">Flags (optional)</span>
      <input
        type="text"
        className="rounded-lg px-3 py-2 bg-[#23233a] text-white placeholder-gray-500 focus:outline-none"
        placeholder="e.g. i (ignore case), m, s"
        value={flags}
        onChange={e => setFlags(e.target.value)}
      />
    </label>
  </div>
  <button
    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
    onClick={Transform}
    disabled={loading || !preview}
  >
    {loading ? "Transforming..." : "Transform Data"}
  </button>
</div>
  );
}