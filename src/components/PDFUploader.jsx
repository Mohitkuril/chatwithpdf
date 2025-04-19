// src/components/PDFUploader.jsx
import { FiUploadCloud } from "react-icons/fi";

export default function PDFUploader({ onUpload }) {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      onUpload(file);
    } else {
      alert("Please upload a valid PDF file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      onUpload(file);
    } else {
      alert("Please upload a valid PDF file");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center space-y-6"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
          <FiUploadCloud className="text-3xl text-purple-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Upload PDF to start chatting
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Click or drag and drop your file here
          </p>
        </div>
        <label className="w-full">
          <div className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-center cursor-pointer transition-colors duration-300">
            Choose File
          </div>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
