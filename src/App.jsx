import { useState, useEffect } from "react";
import PDFUploader from "./components/PDFUploader";
import UploadProgress from "./components/UploadProgress";
import ChatInterface from "./components/ChatInterface";
import PDFViewer from "./components/PDFViewer";
import { FiTrash2 } from "react-icons/fi";

const dbName = "pdfChatDB";
const storeName = "pdfFiles";

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

const savePDF = async (file) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(file, "currentPDF");

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

const getPDF = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get("currentPDF");

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

const deletePDF = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete("currentPDF");

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

export default function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredPDF = async () => {
      try {
        const storedFile = await getPDF();
        if (storedFile) {
          setPdfFile(storedFile);

          const reader = new FileReader();
          reader.onload = (e) => {
            setPdfData(e.target.result);
            setTimeout(() => {
              setIsLoading(false);
            }, 1500);
          };
          reader.onerror = () => {
            console.error("Error reading file");
            setIsLoading(false);
          };
          reader.readAsArrayBuffer(storedFile);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading stored PDF:", error);
        setIsLoading(false);
      }
    };

    loadStoredPDF();
  }, []);

  const handleUpload = (file) => {
    setIsUploading(true);
    setPdfFile(file);

    const reader = new FileReader();
    reader.onloadstart = () => setUploadProgress(0);

    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress >= 100) {
          clearInterval(interval);

          setTimeout(() => {
            setPdfData(reader.result);

            savePDF(file).catch((error) => {
              console.error("Error saving PDF:", error);
            });

            setTimeout(() => {
              setIsUploading(false);
            }, 500);
          }, 3000);
        }
        setUploadProgress(progress);
      }, 150);
    };

    reader.onload = () => {
      simulateProgress();
    };

    reader.onerror = () => {
      console.error("Error reading file");
      setIsUploading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleClear = async () => {
    try {
      await deletePDF();
    } catch (error) {
      console.error("Error deleting PDF:", error);
    }

    setPdfFile(null);
    setPdfData(null);
    setUploadProgress(0);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 mb-4">
            <svg
              className="animate-spin h-10 w-10 text-purple-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <div className="text-xl font-medium text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full md:h-screen flex flex-col">
      {!pdfData ? (
        <>
          <PDFUploader onUpload={handleUpload} />
          {isUploading && <UploadProgress progress={uploadProgress} />}
        </>
      ) : (
        <>
          <div className="flex flex-col-reverse md:flex-row h-full">
            <div className="flex-1 overflow-hidden">
              <ChatInterface pdfData={pdfData} />
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewer file={pdfFile} />
            </div>
          </div>
          <button
            onClick={handleClear}
            className="absolute top-4 right-4 p-2 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md transition-colors"
            title="Start New Chat"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
