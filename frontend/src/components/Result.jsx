import React from "react";
import Table from "./Table";
//component to display the result section with before and after transformation data
export default function ResultSection({ result }) {
  if (!result) return null;
  return (
    <div id="transform-result" style={{ marginTop: 24 }}>
      <div style={{ marginBottom: 8 }}>
        <strong>File:</strong> {result.filename} &nbsp;|&nbsp;
        <strong>Rows×Cols:</strong> {result.shape?.[0]} × {result.shape?.[1]} &nbsp;|&nbsp;
        <strong>Matched cells:</strong> {result.matches} &nbsp;|&nbsp;
        <strong>Target columns:</strong> {result.columns?.join(", ") || "—"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Before (first 10 rows)</div>
          <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            <Table columns={result.columns} rows={result.before} />
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>After (first 10 rows)</div>
          <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
            <Table
              columns={result.columns}
              rows={result.after}
            />
          </div>
        </div>
      </div>
    </div>
  );
}