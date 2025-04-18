export default function UploadProgress({ progress }) {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col justify-center items-center z-10">
      <p className="text-lg mb-4 font-medium">Uploading...</p>
      <div className="w-1/2 bg-gray-300 h-4 rounded-full overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2">{Math.round(progress)}%</p>
    </div>
  );
}
