import React from "react";

export default function Table({ columns = [], rows = [] }) {
  return (
    <div style={{ maxHeight: 480, overflow: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ position: "sticky", top: 0, background: "#2c1355ff" }}>
          <tr>
            {columns.map((c) => (
              <th key={c} style={{ textAlign: "left", borderBottom: "1px solid #982323ff", padding: "8px" }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c} style={{ borderBottom: "1px solid #960404ff", padding: "8px", fontSize: 14 }}>
                  {String(r?.[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}