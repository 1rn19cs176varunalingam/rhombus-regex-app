import { useState } from 'react'
import axios from 'axios'
import Table from './components/Table';
import FileUpload from './components/FileUpload';
import RegexInstruction from './components/RegexInstruction';
import RegexForm from './components/RegexForm';
import Result from './components/Result';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import PreviewPage from "./components/PreviewPage";
import ChangesPreviewPage from "./components/ChangesPreviewPage";

import './App.css'


const API_BASE= import.meta.env.VITE_API_BASE;

export default function App(){

  const navigate=useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [file, setFile]=useState(null);
  const [preview, setPreview]=useState(null);
  const [loading, setLoading]=useState(false);
  const[pattern,setPattern]=useState("");
  const[replacement,setReplacement]=useState("");
  const[columns,setColumns]=useState("");
  const[flags,setFlags]=useState("");
  const[analysis,setAnalysis]=useState(null);
  const[result,setResult]=useState(null);
  const [pandasCode, setPandasCode] = useState("");
  const[instructions,setInstructions]=useState("");
  const[downloadToken,setDownloadToken]=useState("");

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
      async function uploadFile(){
      setPreview(null);
      setError("");
      setMessage("");
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
      setMessage("File uploaded successfully");
      }catch(error){
        setError("Could not upload file");
      }finally{
        setLoading(false);
      } 
    }
    function handlePreview(){
      navigate("/preview");
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
      if(!pattern.trim() && !pandasCode)
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
      if(pandasCode) form.append("pandas_code", pandasCode);
      
      
      try{
        setLoading(true);
      const {data}= await axios.post(`${API_BASE}` + "/transform/", form, {
        headers: {
          "Content-Type": "multipart/form-data"
      },});
      setResult(data);

      document.querySelector("#transform-result")?.scrollIntoView({ behavior: "smooth" });
      setDownloadToken(data.download_token);

      }catch(error){
        const msg=error?.response?.data?.error || error.message || "Could not transform file";
        setError(msg);
      }finally{
        setLoading(false);
      }





    }
    async function convertInstruction(){
      setError("");
      if(!instructions.trim()){
        setError("Please provide instructions");
        return;
      }
      try{
        setLoading(true);
        const columns = preview.length > 0 ? Object.keys(preview[0]) : [];
        const NoRows= preview.length;
        const sampleRows= preview.slice(0,5);
        const {data} = await axios.post(`${API_BASE}/nl2regex/`, { instruction: instructions, columns: columns,rows: sampleRows, no: NoRows || [] });
        if(data?.pattern){
          setPattern(data.pattern);
        }
        setPandasCode(data?.pandas_code ?? "");
        setReplacement(data?.replacement ?? "");
        

        setColumns(data?.suggested_columns.join(",") ?? []);
        
        setFlags(data?.flags ?? "");
        setMessage("Successfully converted instructions to regex");

      }
        catch(error){
          const msg=error?.response?.data?.error || error.message || "Could not convert instructions";
          setError(msg);
        }finally{
          setLoading(false);
    }
  }
  async function analyzeRegex(){
    setAnalysis(null);
    setError("");
        const allColumns = preview && preview.length > 0 ? Object.keys(preview[0]) : [];

    const selectedColumns = columns
      ? columns.split(",").map(col => col.trim()).filter(Boolean)
      : [];
    const sampleRows = preview ? preview.slice(0, 5) : [];
    if(!pattern.trim()){
      setError("Please provide a regex pattern");
      return;
    }
    try{
      setLoading(true);
      const {data}= await axios.post(`${API_BASE}` + "/risk/", { pattern, replacement, allColumns, selectedColumns, sampleRows,instructions });
      console.log("Risk API response:", data);
      setAnalysis(data);
      document.querySelector(".analysis-box")?.scrollIntoView({ behavior: "smooth" });
  }
    catch(error){
      const msg=error?.response?.data?.error || error.message || "Could not analyze regex";
      setError(msg);
    }finally{
      setLoading(false);
    }
  }

  


  return (
    <div>
      <h1 className="text-4xl font-extrabold text-center text-blue-600 py-6 mb-8 border-b border-gray-300">
        Regex Pattern Matcher
      </h1>
      
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h1>API Health Check</h1>
      <button onClick={ping}>Ping API</button>
              <FileUpload
                file={file}
                setFile={setFile}
                uploadFile={uploadFile}
                loading={loading}
                onPreview={handlePreview}
                previewReady={!!preview}
              />
              <RegexInstruction
                instructions={instructions}
                setInstructions={setInstructions}
                convertInstruction={convertInstruction}
                loading={loading}
                preview={preview}
              />
              <button onClick={analyzeRegex} disabled={!pattern}>
                Risk Analysis:(Before changing data)
              </button>
              {analysis && (
                <div className="my-4">
                  <div className="mb-2 font-semibold">Regex Risk Assessment</div>
                  <div className="w-full bg-gray-300 rounded h-6 overflow-hidden">
                    <div
                      className={`h-6 rounded ${analysis.risk_percent > 70 ? "bg-red-500" : analysis.risk_percent > 40 ? "bg-yellow-400" : "bg-green-500"}`}
                      style={{ width: `${analysis.risk_percent}%`, transition: "width 0.5s" }}
                    />
                  </div>
                  <div className={`mt-2 text-sm  ${analysis.risk_percent > 70 ? "bg-red-500" : analysis.risk_percent > 40 ? "bg-yellow-400" : "bg-green-500"} text-gray-800`}>
                    Risk: <b>{analysis.risk_percent}%</b> — {analysis.reason}
                  </div>
                </div>
              )}
              <RegexForm
                pattern={pattern}
                setPattern={setPattern}
                replacement={replacement}
                setReplacement={setReplacement}
                columns={columns}
                setColumns={setColumns}
                flags={flags}
                setFlags={setFlags}
                loading={loading}
                preview={preview}
                Transform={Transform}
              />
              <Result result={result} />
              {message && <p style={{ color: 'green' }}>Message from API: {message}</p>}
              {error && <p style={{ color: 'red' }}>Error: {error}</p>}
                    <button onClick={() => navigate('/changes-preview')} disabled={!result}>
        View Changes Preview
      </button>
            </div>
            
          }
        />
        <Route path="/preview" element={<PreviewPage preview={preview} />} />

      <Route path="/changes-preview" element={
        <ChangesPreviewPage
        changes={result?.changes || []}
        downloadToken={result?.download_token}
        
        
      />
      } />
      </Routes>
    </div>
  );
}

  

  
        

  










