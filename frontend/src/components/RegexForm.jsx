import React from "react";

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
  Transform
}) {
  return (
    <div style={{ marginTop: 24, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <label>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Regex pattern</div>
          <input
            type="text"
            placeholder="e.g. \\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,7}\\b"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Replacement</div>
          <input
            type="text"
            placeholder="e.g. REDACTED"
            value={replacement}
            onChange={e => setReplacement(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Columns (optional)</div>
          <input
            type="text"
            placeholder="e.g. Email, Notes (leave empty = all text cols)"
            value={columns}
            onChange={e => setColumns(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
        <label>
          <div style={{ fontSize: 13, marginBottom: 4 }}>Flags (optional)</div>
          <input
            type="text"
            placeholder="e.g. i (ignore case), m, s"
            value={flags}
            onChange={e => setFlags(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>
      </div>
      <button
        onClick={Transform}
        disabled={loading || !preview}
        style={{ marginTop: 12 }}
      >
        {loading ? "Transforming..." : "Transform Data"}
      </button>
    </div>
  );
}