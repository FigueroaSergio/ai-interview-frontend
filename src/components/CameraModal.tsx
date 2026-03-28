import React from "react";

interface CameraModalProps {
  handleRetryCamera: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ handleRetryCamera }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg text-black max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">
          Camera Access Denied
        </h2>
        <p className="mb-6 text-gray-700">
          We need access to your camera to run the interview. Please:
        </p>
        <ul className="text-left mb-6 text-gray-700 space-y-2">
          <li>1. Check your browser permissions</li>
          <li>2. Make sure no other app is using your camera</li>
          <li>3. Refresh the page and try again</li>
        </ul>
        <button
          onClick={handleRetryCamera}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded w-full"
        >
          Retry Camera Access
        </button>
      </div>
    </div>
  );
};
