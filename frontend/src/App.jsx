//importing all the necessary libraries and components
import { useState } from 'react'
import axios from 'axios'// using axios to make api calls
import Table from './components/Table';
import FileUpload from './components/FileUpload';
import RegexInstruction from './components/RegexInstruction';
import RegexForm from './components/RegexForm';
import Result from './components/Result';
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import PreviewPage from "./components/PreviewPage";
import ChangesPreviewPage from "./components/ChangesPreviewPage";
import StyledButton from './styles/StyledButton';

import './App.css'

//setting up the base url for the api
const API_BASE= import.meta.env.VITE_API_BASE;

export default function App(){

  //Here, I have defined all the states required for the app
  const navigate=useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [file, setFile]=useState(null);
  const [preview, setPreview]=useState(null);
  const [loading, setLoading]=useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [transformLoading, setTransformLoading] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);
  const[pattern,setPattern]=useState("");
  const[replacement,setReplacement]=useState("");
  const[columns,setColumns]=useState("");
  const[flags,setFlags]=useState("");
  const[analysis,setAnalysis]=useState(null);
  const[result,setResult]=useState(null);
  const [pandasCode, setPandasCode] = useState("");
  const[instructions,setInstructions]=useState("");
  const[downloadToken,setDownloadToken]=useState("");
  const [fileError, setFileError] = useState("");
  const [convertError, setConvertError] = useState("");
  const [riskError, setRiskError] = useState("");
//Used this to just check with he backend
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
  //Function to upload the file to the backend
      async function uploadFile(){
      setPreview(null);
      setFileError("");
      setMessage("");
      if(!file){
        setFileError("Please select a file");
        return;
      }
      const form = new FormData();
      form.append("file", file);
      try{
        setUploadLoading(true);
      const {data}= await axios.post(`${API_BASE}` + "/upload/preview/", form, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
      });
      setPreview(data.preview);
      setMessage("File uploaded successfully");
    }catch(error){
      setFileError("Could not upload file");
    }finally{
      setUploadLoading(false);
    }
    }
    //Function to navigate to the preview page
    function handlePreview(){
      navigate("/preview");
    }
    //Function to transform the file based on the regex pattern
    async function Transform()
    {
      const fileSizeGB = file ? file.size / (1024 * 1024 * 1024) : 0;
      const endpoint = fileSizeGB > 1 ? "/local-spark-transform/" : "/transform/";//checking file size to whether to use spark or not
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
        setTransformLoading(true);
      const {data}= await axios.post(`${API_BASE}${endpoint}`, form, {
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
        setTransformLoading(false);
      }





    }
    //Function to convert the natural language instructions to regex pattern
    async function convertInstruction(){
      setConvertError("");
      if(!instructions.trim()){
        setConvertError("Please provide instructions");
        return;
      }
      try{
        setConvertLoading(true);
        const columns = preview.length > 0 ? Object.keys(preview[0]) : [];
        const NoRows= preview.length;
        const sampleRows= preview.slice(0,5);
        const {data} = await axios.post(`${API_BASE}/nl2regex/`, { instruction: instructions, columns: columns,rows: sampleRows, no: NoRows || [] });
 
        setPattern(data?.pattern ?? "");
        
        setPandasCode(data?.pandas_code ?? "");
        setReplacement(data?.replacement ?? "");
        

        setColumns(data?.suggested_columns.join(",") ?? []);
        
        setFlags(data?.flags ?? "");
        setMessage("Successfully converted instructions to regex");

      }
        catch(error){
          const msg=error?.response?.data?.error || error.message || "Could not convert instructions";
          setConvertError(msg);
        }finally{
          setConvertLoading(false);
    }
  }
  //function to analyze the regex pattern for potential risks
  async function analyzeRegex(){
    setAnalysis(null);
    setRiskError("");
        const allColumns = preview && preview.length > 0 ? Object.keys(preview[0]) : [];

    const selectedColumns = columns
      ? columns.split(",").map(col => col.trim()).filter(Boolean)
      : [];
    const sampleRows = preview ? preview.slice(0, 5) : [];
    if(!pattern.trim() && !pandasCode.trim()){
      setRiskError("Please provide a regex pattern");
      return;
    }
    try{
      setRiskLoading(true);
      const {data}= await axios.post(`${API_BASE}` + "/risk/", { pattern, replacement, allColumns, selectedColumns, sampleRows,instructions, pandas_code: pandasCode });
      console.log("Risk API response:", data);
      setAnalysis(data);
      document.querySelector(".analysis-box")?.scrollIntoView({ behavior: "smooth" });
    }catch(error){
      const msg=error?.response?.data?.error || error.message || "Could not analyze regex";
      setRiskError(msg);
    }finally{
      setRiskLoading(false);
    }
  }

  

//The main return function which renders the components and sets up the routes
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
              <FileUpload
                file={file}
                setFile={setFile}
                uploadFile={uploadFile}
                loading={loading}
                onPreview={handlePreview}
                previewReady={!!preview}
              />
              {fileError && <p style={{ color: 'red' }}>Error: {fileError}</p>}
              <RegexInstruction
                instructions={instructions}
                setInstructions={setInstructions}
                convertInstruction={convertInstruction}
                loading={convertLoading}
                preview={preview}
              />
              {convertError && <p style={{ color: 'red' }}>Error: {convertError}</p>}
              <button className='bg-secondary border-secondary border bg-[#0BB489] rounded-md m-4  inline-flex items-center justify-center py-3 px-7 text-center text-base font-medium text-white hover:bg-green hover:border-[#0BB489] disabled:bg-gray-3 disabled:border-gray-3 disabled:text-dark-5
              disabled:cursor-not-allowed
              disabled:opacity-50' onClick={analyzeRegex} disabled={!pattern && !pandasCode}>
                Risk Analysis:(Before changing data)
              </button>
              {riskError && <p style={{ color: 'red' }}>Error: {riskError}</p>}
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
                loading={convertLoading}
                preview={preview}
                Transform={Transform}
                pandasCode={pandasCode}
              />
              <Result result={result} />

                    <button className="w-full border-2 m-4 -ml-1 border-blue-600 text-blue-600 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition
                    disabled:cursor-not-allowed
                    disabled:opacity-50" onClick={() => navigate('/changes-preview')} disabled={!result}>
        View Changes and Download File
      </button>
                    {message && <p style={{ color: 'green' }}>Message from API: {message}</p>}
              {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            </div>
            
          }
        />
      <Route path="/preview" element={<PreviewPage preview={preview} />} />

      <Route path="/changes-preview" element={
        <ChangesPreviewPage
        changes={result?.changes || []}
        downloadToken={result?.download_token}
        engine={result?.engine}
        
        
      />
      } />
      </Routes>
    </div>
  );
}

















