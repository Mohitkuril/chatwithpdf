import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFViewer({ file }) {
  const containerRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const canvasRef = useRef(null);

  // Load PDF document
  useEffect(() => {
    if (!file) return;

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
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      await page.render(renderContext).promise;
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
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 bg-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={currentPage >= numPages}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Next
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeZoom(-0.2)}
            className="px-2 py-1 bg-gray-300 rounded"
          >
            -
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button
            onClick={() => changeZoom(0.2)}
            className="px-2 py-1 bg-gray-300 rounded"
          >
            +
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto p-4 bg-gray-200">
        <canvas ref={canvasRef} className="mx-auto shadow-lg" />
      </div>
    </div>
  );
}
