// src/components/PDFViewer.jsx
import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min";
import { FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight } from "react-icons/fi";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFViewer({ file }) {
  const containerRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const canvasRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [isRendering, setIsRendering] = useState(false);

  // Load PDF document
  useEffect(() => {
    if (!file) return;

    setFileName(file.name);
    
    const loadingTask = pdfjsLib.getDocument({
      url: URL.createObjectURL(file),
    });

    loadingTask.promise.then(
      (loadedPdf) => {
        setPdf(loadedPdf);
        setNumPages(loadedPdf.numPages);
      },
      (error) => {
        console.error("Error loading PDF:", error);
      }
    );

    return () => {
      // Cleanup URL object when component unmounts
      if (file) URL.revokeObjectURL(URL.createObjectURL(file));
    };
  }, [file]);

  // Render current page
  useEffect(() => {
    if (!pdf) return;

    const renderPage = async () => {
      setIsRendering(true);
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Set canvas dimensions to match viewport
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Use higher pixel ratio for sharper rendering
      const pixelRatio = window.devicePixelRatio || 1;
      const scaledViewport = page.getViewport({ scale: scale * pixelRatio });
      
      // Scale the canvas display size
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      
      // Increase internal canvas size for better resolution
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      
      // Scale the context to ensure correct drawing
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport,
        enableWebGL: true,
        renderInteractiveForms: true
      };

      await page.render(renderContext).promise;
      setIsRendering(false);
    };

    renderPage();
  }, [pdf, currentPage, scale]);

  const changePage = (delta) => {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  const changeZoom = (delta) => {
    setScale((prevScale) => {
      const newScale = prevScale + delta;
      return newScale >= 0.5 && newScale <= 3 ? newScale : prevScale;
    });
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200">
      {fileName && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <h3 className="font-medium text-gray-700 truncate" title={fileName}>
            {fileName}
          </h3>
        </div>
      )}
      <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1}
            className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            {currentPage} / {numPages}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={currentPage >= numPages}
            className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeZoom(-0.2)}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <FiZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => changeZoom(0.2)}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <FiZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 flex justify-center">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 z-10">
            <div className="w-8 h-8">
              <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="my-4 shadow-md bg-white" />
      </div>
    </div>
  );
}




