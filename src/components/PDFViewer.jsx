import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min";
import {
  FiZoomIn,
  FiZoomOut,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PDFViewer({ file }) {
  const containerRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const canvasRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [autoScale, setAutoScale] = useState(true);

  // Load PDF when file changes
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
        // Force auto-scaling on PDF load
        setAutoScale(true);
      },
      (error) => {
        console.error("Error loading PDF:", error);
      }
    );

    return () => {
      if (file) URL.revokeObjectURL(URL.createObjectURL(file));
    };
  }, [file]);

  // Calculate and apply auto-scale when needed
  const calculateAutoScale = async () => {
    if (!pdf || !containerRef.current) return;

    try {
      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1.0 });

      // Get available width (subtract padding)
      const isMobile = window.innerWidth < 768;
      const containerWidth = containerRef.current.clientWidth;
      const availableWidth = containerWidth - (isMobile ? 32 : 48);

      // Calculate scale needed to fit the width
      let newScale = availableWidth / viewport.width;

      // Cap scale for very small screens
      if (isMobile && newScale < 0.5) newScale = 0.5;
      if (newScale > 2) newScale = 2;

      return newScale;
    } catch (error) {
      console.error("Error calculating auto-scale:", error);
      return 1.0;
    }
  };

  // Render page when page or scale changes
  useEffect(() => {
    const renderPage = async () => {
      if (!pdf || !canvasRef.current) return;

      setIsRendering(true);
      try {
        // Calculate new scale if auto-scaling is enabled
        let effectiveScale = scale;
        if (autoScale) {
          const calculatedScale = await calculateAutoScale();
          effectiveScale = calculatedScale;
          setScale(calculatedScale);
          setAutoScale(false);
        }

        const page = await pdf.getPage(currentPage);
        const viewport = page.getViewport({ scale: effectiveScale });

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        // Set canvas display dimensions
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        // Adjust for high-DPI displays
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);

        // Scale context to match pixel ratio
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport,
          enableWebGL: true,
          renderInteractiveForms: true,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error("Error rendering PDF page:", error);
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();
  }, [pdf, currentPage, scale, autoScale]);

  // Auto-fit on window resize
  useEffect(() => {
    const handleResize = () => {
      if (pdf) setAutoScale(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pdf]);

  const changePage = (delta) => {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
      // Force auto-scaling on page change
      setAutoScale(true);
    }
  };

  const changeZoom = (delta) => {
    setScale((prevScale) => {
      const newScale = prevScale + delta;
      const limitedScale =
        newScale >= 0.5 && newScale <= 3 ? newScale : prevScale;
      // Disable auto-scaling when manually zooming
      setAutoScale(false);
      return limitedScale;
    });
  };

  const fitToWidth = async () => {
    if (!pdf) return;
    setAutoScale(true);
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200">
      {fileName && (
        <div className="px-4 py-2 bg-white border-b border-gray-200">
          <h3 className="font-medium text-gray-700 truncate" title={fileName}>
            {fileName}
          </h3>
        </div>
      )}

      {/* Controls - Responsive layout */}
      <div className="flex flex-wrap justify-between items-center p-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-1 mr-2">
          <button
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1 || isRendering}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium">
            {currentPage} / {numPages}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={currentPage >= numPages || isRendering}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-1 mt-1 sm:mt-0">
          <button
            onClick={() => changeZoom(-0.1)}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="Zoom out"
            disabled={isRendering}
          >
            <FiZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium min-w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => changeZoom(0.1)}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            aria-label="Zoom in"
            disabled={isRendering}
          >
            <FiZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={fitToWidth}
            className="ml-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            aria-label="Fit to width"
            disabled={isRendering}
          >
            Fit
          </button>
        </div>
      </div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 relative"
      >
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 z-10">
            <div className="w-8 h-8">
              <svg
                className="animate-spin h-8 w-8 text-purple-600"
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
          </div>
        )}
        <div className="flex justify-center">
          <div className="p-4 inline-block">
            <canvas ref={canvasRef} className="shadow-md bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
