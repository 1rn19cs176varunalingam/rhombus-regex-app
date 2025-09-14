import { useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";

export default function PreviewPage({ preview }) {
  const navigate = useNavigate();
  if (!preview) return <div>No preview data.</div>;
  const columns = preview.length > 0 ? Object.keys(preview[0]) : [];

  const Row = ({ index, style }) => (
    <div
      style={{
        ...style,
        display: "flex",
        background: index % 2 === 0 ? "#222" : "#181818",
        color: "#fff",
      }}
      key={index}
    >
      {columns.map(col => (
        <div
          key={col}
          style={{
            flex: 1,
            padding: "8px",
            border: "1px solid #444",
            maxWidth: 150,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={String(preview[index][col] ?? "")}
        >
          {String(preview[index][col] ?? "")}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4">
      <button onClick={() => navigate(-1)} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded">Back</button>
      <div className="overflow-auto border rounded" style={{ height: 600 }}>
        {/* Table header */}
        <div style={{ display: "flex", background: "#333", color: "#fff", fontWeight: "bold" }}>
          {columns.map(col => (
            <div
              key={col}
              style={{
                flex: 1,
                padding: "8px",
                border: "1px solid #444",
                maxWidth: 150,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {col}
            </div>
          ))}
        </div>
        {/* Virtualized rows to load only required rows */}
        <List
          height={550}
          itemCount={preview.length}
          itemSize={35}
          width={"100%"}
        >
          {Row}
        </List>
      </div>
    </div>
  );
}