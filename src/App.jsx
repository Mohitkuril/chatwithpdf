// src/App.jsx
import { useState, useEffect } from "react";
import PDFUploader from "./components/PDFUploader";
import UploadProgress from "./components/UploadProgress";
import ChatInterface from "./components/ChatInterface";
import PDFViewer from "./components/PDFViewer";

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
            setIsLoading(false);
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
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress((e.loaded / e.total) * 100);
      }
    };
    reader.onloadend = async () => {
      setPdfData(reader.result); // Set uploaded PDF data

      // Store in IndexedDB
      try {
        await savePDF(file);
      } catch (error) {
        console.error("Error saving PDF:", error);
        // Continue anyway, but log the error
      }

      setIsUploading(false); // End upload
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
      <div className="h-screen flex justify-center items-center">
        <div className="text-xl">Loading...</div>
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
            <div className="flex-1 overflow-hidden p-4">
              <ChatInterface pdfData={pdfData} />
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewer file={pdfFile} />
            </div>
          </div>
          <button
            onClick={handleClear}
            className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded"
          >
            Start New Chat
          </button>
        </>
      )}
    </div>
  );
}
