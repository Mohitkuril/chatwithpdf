// src/components/UploadProgress.jsx
import { useState, useEffect } from "react";

export default function UploadProgress({ progress }) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [showLoader, setShowLoader] = useState(true);

  // Smooth progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress((current) => {
        if (current < progress) {
          return Math.min(current + 1, progress);
        }
        return current;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [progress]);

  // Keep loader visible for minimum time
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 3000); // Keep showing for 3 seconds after reaching 100%

      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (!showLoader && progress >= 100) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col justify-center items-center z-20">
      <div className="flex items-center space-x-3 mb-4">
        <div className="animate-spin h-5 w-5 text-purple-600">
          <svg
            className="h-5 w-5"
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
        <p className="text-lg font-medium text-gray-800">Uploading PDF</p>
      </div>
      <div className="w-64 md:w-96 bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          className="bg-purple-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-gray-600">
        {Math.round(displayProgress)}%
      </p>
    </div>
  );
}
