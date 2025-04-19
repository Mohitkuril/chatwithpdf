// src/App.jsx
import { useState, useEffect } from "react";
import PDFUploader from "./components/PDFUploader";
import UploadProgress from "./components/UploadProgress";
import ChatInterface from "./components/ChatInterface";
import PDFViewer from "./components/PDFViewer";
import { FiTrash2 } from "react-icons/fi";

// IndexedDB helper functions
const dbName = "pdfChatDB";
const storeName = "pdfFiles";

// Open database
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

// Save file to IndexedDB
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

// Get file from IndexedDB
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

// Delete file from IndexedDB
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
  const [pdfFile, setPdfFile] = useState(null); // Store PDF file
  const [pdfData, setPdfData] = useState(null); // Store PDF data
  const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
  const [isUploading, setIsUploading] = useState(false); // Track upload state
  const [isLoading, setIsLoading] = useState(true); // Track initial loading state

  // Check for stored PDF on component mount
  useEffect(() => {
    const loadStoredPDF = async () => {
      try {
        const storedFile = await getPDF();
        if (storedFile) {
          setPdfFile(storedFile);

          // Read the file as ArrayBuffer
          const reader = new FileReader();
          reader.onload = (e) => {
            setPdfData(e.target.result);
            // Add artificial delay before finishing loading
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

  // Handle file upload
  const handleUpload = (file) => {
    setIsUploading(true); // Start upload
    setPdfFile(file); // Store the file object

    const reader = new FileReader();
    reader.onloadstart = () => setUploadProgress(0);

    // Simulate slower upload to allow progress bar to be visible
    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress >= 100) {
          clearInterval(interval);

          // After reaching 100%, wait for 3 seconds before completing
          setTimeout(() => {
            setPdfData(reader.result); // Set uploaded PDF data

            // Store in IndexedDB
            savePDF(file).catch((error) => {
              console.error("Error saving PDF:", error);
            });

            // Add an extra delay before ending the upload state
            setTimeout(() => {
              setIsUploading(false); // End upload
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

    reader.readAsArrayBuffer(file); // Read file as ArrayBuffer
  };

  // Handle clearing the PDF data and resetting the app
  const handleClear = async () => {
    try {
      await deletePDF();
    } catch (error) {
      console.error("Error deleting PDF:", error);
      // Continue anyway, but log the error
    }

    setPdfFile(null);
    setPdfData(null);
    setUploadProgress(0); // Reset progress bar
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
    <div className="h-screen flex flex-col">
      {!pdfData ? (
        <>
          <PDFUploader onUpload={handleUpload} />
          {isUploading && <UploadProgress progress={uploadProgress} />}
        </>
      ) : (
        <>
          <div className="flex flex-row h-full">
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
