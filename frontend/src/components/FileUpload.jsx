export default function FileUpload({ file, setFile, uploadFile, loading, onPreview, previewReady }) {
  //Component to handle file upload and preview
  return (
    <div className="mb-3 flex gap-4 items-center">
      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={e => setFile(e.target.files?.[0] || null)}
      />
    {file
        ? <span className="text-gray-700 text-sm">{file.name}</span>
        : <span className="text-gray-400 text-sm">No file chosen</span>
      }
      <button
        onClick={uploadFile}
        disabled={loading}
        className="px-6 py-2.5 rounded-md cursor-pointer text-white hover:text-purple-700 text-sm tracking-wider font-medium border-2 outline-0 border-green-700 bg-green-700 hover:bg-transparent transition-all duration-300"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
      <button
        onClick={onPreview}
        disabled={!previewReady}
        className="px-6 py-2.5 rounded-md cursor-pointer text-white hover:text-purple-700 text-sm tracking-wider font-medium border-2 outline-0 border-blue-700 bg-blue-700 hover:bg-transparent transition-all duration-300
        disabled:cursor-not-allowed 
        disabled:opacity-50"
        
      >
        Preview
      </button>
    </div>
  );
}