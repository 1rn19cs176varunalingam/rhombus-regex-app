import React from "react";

export default function RegexInstruction({
  instructions,
  setInstructions,
  convertInstruction,
  loading
}) {
  return (
    <div style={{ marginTop: 24, fontSize: 18, fontWeight: "bold" }}>
      <label style={{ fontSize: 13, marginBottom: 4 }}>
        Describe the pattern you wanna change
        <input
          type="text"
          placeholder="e.g. redact email addresses"
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 4 }}
        />
      </label>
      <button
        onClick={convertInstruction}
        disabled={loading || !instructions.trim()}
        style={{ padding: "8px 14px", marginTop: 8 }}
      >
        {loading ? "Converting..." : "Convert to Regex"}
      </button>
    </div>
  );
}