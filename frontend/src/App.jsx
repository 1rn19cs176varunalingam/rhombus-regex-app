import { useState } from 'react'
import axios from 'axios'

const API_BASE= import.meta.env.VITE_API_BASE;

export default function App(){
  const [message, setMessage] = useState("");
  const [eror, setError] = useState("");
  const [file, setFile]=useState(null);
  const [preview, setPreview]=useState(null);
  const [loading, setLoading]=useState(false);

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
          <button type="submit">Upload</button>
        </form>
        <div style={{ marginTop: 8, fontSize: 14 }}>
            {file ? <>Selected: <strong>{file.name}</strong></> : "No file chosen"}
        </div>

        <button onClick={uploadFile} disabled={loading} style={{marginTop:12}}>
          {loading ? "Uploading..." : "Upload and Preview"}
        </button>
        {preview && (
          <pre style={{ marginTop: 12, background: "black", padding: 12, borderRadius: 4, maxHeight: 400, overflow: "auto" }}>
            {JSON.stringify(preview, null, 2)}
          </pre>  
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
}
  
        

  










