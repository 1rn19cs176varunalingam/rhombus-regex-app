import { useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_BASE;
export default function ChangesPreviewPage({ changes , downloadToken,engine}) {
  const navigate = useNavigate();

    const handleDownload = async () => {
    if (!downloadToken) return;
    const url = `${API_BASE}/download/?token=${downloadToken}`;
    const response = await fetch(url);
    if (response.ok) {
      const blob = await response.blob();
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = "changed_file.csv";
      a.click();
      window.URL.revokeObjectURL(a.href);
    } else {
      alert("Download failed.");
    }
  };
  if(engine=="pyspark")
  {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded">Back</button>
                <button
          onClick={handleDownload}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Download Changed File
        </button>
      </div>
    )


  }

  if (!changes || changes.length === 0) {
    return (
      <div className="p-4">
        <button onClick={() => navigate(-1)} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded">Back</button>
        <h2 className="text-xl font-bold mb-4">Preview of Changes</h2>
        <div>No changes detected.</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button onClick={() => navigate(-1)} className="mb-4 bg-blue-500 text-white px-4 py-2 rounded">Back</button>
      <h2 className="text-xl font-bold mb-4">Preview of Changes</h2>
      <table className="min-w-full mb-4 border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Row</th>
            <th className="border px-2 py-1">Column</th>
            <th className="border px-2 py-1">Before</th>
            <th className="border px-2 py-1">After</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((chg, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">{chg.row}</td>
              <td className="border px-2 py-1">{chg.column}</td>
              <td className="border px-2 py-1">{String(chg.original_value ?? "")}</td>
              <td className="border px-2 py-1">{String(chg.new_value ?? "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
        {downloadToken && (
        <button
          onClick={handleDownload}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Download Changed File
        </button>
      )}
    </div>
  );
}