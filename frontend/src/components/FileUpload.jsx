export default function FileUpload({ file, setFile, uploadFile, loading }) {
  return (
    <div>
      <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button onClick={uploadFile} disabled={loading}>Upload</button>
      {file && <div>Selected: {file.name}</div>}
    </div>
  );
}