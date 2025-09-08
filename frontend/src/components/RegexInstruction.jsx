import React from "react";


export default function RegexInstruction({
  instructions,
  setInstructions,
  convertInstruction,
  loading,
  preview
}) {
  return (
    <div style={{ marginTop: 24, fontSize: 18, fontWeight: "bold" }}>
      <label style={{ fontSize: 13, marginBottom: 4 }}>
        Describe the pattern you wanna change
        <input
          type="text"
          placeholder="e.g. Change all dates to YYYY-MM-DD format"
          disabled={!preview}
          title={!preview ? "Please upload a file first" : ""}
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 4 }}
        />
      </label>
      <span title={!preview ? "Please upload a file first" : ""} style={{ fontSize: 11, color: "#666" }}>
      <button className="px-6 py-2.5 rounded-full cursor-pointer text-white hover:text-blue-700 text-sm tracking-wider font-medium border border-blue-300 outline-0 bg-blue-700 hover:bg-transparent transition-all duration-300"
        onClick={convertInstruction}
        
        disabled={(loading || !instructions.trim()) || !preview}
        style={{ padding: "8px 14px", marginTop: 8 }}
      >
        {loading ? "Converting..." : "Convert to Regex"}
      </button>
      </span>
    </div>
  );
}