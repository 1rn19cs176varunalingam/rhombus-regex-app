import React, { useState } from "react";
import StyledButton from "../styles/StyledButton";

export default function RegexInstruction({
  instructions,
  setInstructions,
  convertInstruction,
  loading,
  preview
}) {
  // Optional: state for "system ready" message
  const [systemReady, setSystemReady] = useState(false);

  // Optional: your extra function
  const handleGenerate = () => {
    setSystemReady(true);
    // ...any other logic you want...
  };

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
      <span
        title={!preview ? "Please upload a file first" : ""}
        style={{ fontSize: 11, color: "#666" }}
      >
        <StyledButton
          onClick={() => {
            convertInstruction();
            handleGenerate(); convertInstruction
          }}
          disabled={loading || !instructions.trim() || !preview}
          style={{ padding: "8px 14px", marginTop: 10 }}
        >
          {loading ? "Converting..." : "Convert to Regex"}
        </StyledButton>
      </span>
      {systemReady && (
        <div style={{ marginTop: 16, color: "#0BB489", fontWeight: "bold" }}>
          System is ready!
        </div>
      )}
    </div>
  );
}