import { useState } from 'react'
import axios from 'axios'

const API_BASE= import.meta.env.VITE_API_BASE;

export default function App(){
  const [message, setMessage] = useState("");
  const [eror, setError] = useState("");
  const [file, setFile]=useState(null);
  const [preview, setPreview]=useState(null);
  const [loading, setLoading]=useState(false);


  const[pattern,setPattern]=useState("");
  const[replacement,setReplacement]=useState("");
  const[columns,setColumns]=useState("");
  const[flags,setFlags]=useState("");

  const[result,setResult]=useState(null);

  async function ping(){
    
    setError("");
    setMessage("");

    try{
      const response = await axios.get(`${API_BASE}` + "/health/");
      setMessage(response.data.status);
    }catch(error){
      setError("Could not fetch data");
    }
  }
    return(
      <div>
        <h1>API Health Check</h1>
        <button onClick={ping}>Ping API</button>
        <form onSubmit={(e)=>e.preventDefault()} style={{display:"flex",gap:12,alignItems:"center"}}>
          <input type="file" accept =".csv,.xlsx" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
         
        </form>
        <div style={{ marginTop: 8, fontSize: 14 }}>
            {file ? <>Selected: <strong>{file.name}</strong></> : "No file chosen"}
        </div>

        <button onClick={uploadFile} disabled={loading} style={{marginTop:12}}>
          {loading ? "Uploading..." : "Upload and Preview"}
        </button>
        {preview && (
          
          <div style={{ marginTop: 20 }}>
            <pre style={{color: "white"}}>{JSON.stringify(preview, null, 2)}</pre>
            <div style={{ marginBottom: 8 }}>
              <strong>File:</strong> {preview.filename} &nbsp;|&nbsp;
              <strong>Rows×Cols:</strong> {preview.length} × {preview.length > 0 ? Object.keys(preview[0]).length : 0}
            </div>
            <div style={{ border: "1px solid #a01e1eff", borderRadius: 8, overflow: "hidden" }}>
              <Table columns={preview.length > 0 ? Object.keys(preview[0]) : []} rows={preview} />
            </div>
          </div>
          

        )}

        <div style={{ marginTop: 24, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Regex pattern</div>
            <input
              type="text"
              placeholder="e.g. \\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,7}\\b"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Replacement</div>
            <input
              type="text"
              placeholder="e.g. REDACTED"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Columns (optional)</div>
            <input
              type="text"
              placeholder="e.g. Email, Notes (leave empty = all text cols)"
              value={columns}
              onChange={(e) => setColumns(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label>
            <div style={{ fontSize: 13, marginBottom: 4 }}>Flags (optional)</div>
            <input
              type="text"
              placeholder="e.g. i (ignore case), m, s"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>
      </div>
      <button onClick={Transform} disabled={loading || !preview} style={{ marginTop: 12 }}>
        {loading ? "Transforming..." : "Transform Data"}
       </button>
      {result && (
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
                <Table columns={result.columns} rows={result.after} />
              </div>
            </div>
          </div>
        </div>
      )}






        {message && <p style={{color: 'green'}}>Message from API: {message}</p>}
        {eror && <p style={{color: 'red'}}>Error: {eror}</p>}
      </div>


    );

    async function uploadFile(){
      setPreview(null);
      setError("");
      if(!file){
        setError("Please select a file");
        return;
      }
      const form = new FormData();
      form.append("file", file);
      try{
        setLoading(true);
      const {data}= await axios.post(`${API_BASE}` + "/upload/preview/", form, {
        headers: {
          "Content-Type": "multipart/form-data"
      },});
      setPreview(data.preview);
      }catch(error){
        setError("Could not upload file");
      }finally{
        setLoading(false);
      } 
    }

    async function Transform()
    {
      setResult(null);
      setError("");
      if( !file)
      {
        setError("please upload a file first");
        return;
      }
      if(!pattern.trim())
      {
        setError("Please provide a regex pattern");
        return;
      }
      const form = new FormData();
      form.append("file", file);
      form.append("pattern", pattern);
      form.append("replacement", replacement);
      if(columns.trim())form.append("columns", columns);
      if(flags.trim())form.append("flags", flags);
      try{
        setLoading(true);
      const {data}= await axios.post(`${API_BASE}` + "/transform/", form, {
        headers: {
          "Content-Type": "multipart/form-data"
      },});
      setResult(data);

      document.querySelector("#transform-result")?.scrollIntoView({ behavior: "smooth" });

      }catch(error){
        const msg=error?.response?.data?.error || error.message || "Could not transform file";
        setError(msg);
      }finally{
        setLoading(false);
      }





    }

  function Table({ columns = [], rows = [] }) {
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


  
}
  
        

  










