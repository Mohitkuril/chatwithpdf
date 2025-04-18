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

  return (
    <div className="h-screen flex flex-col justify-center items-center text-center space-y-4">
      <FiUploadCloud className="text-5xl text-blue-600" />
      <p className="text-xl font-semibold">Upload a PDF</p>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        className="cursor-pointer"
      />
    </div>
  );
}
