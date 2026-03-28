import React from "react";

interface CameraModalProps {
  handleRetryCamera: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ handleRetryCamera }) => {
  return (
    <div className="fixed inset-0 bg-surface/80 backdrop-blur-xl flex justify-center items-center z-50 p-6">
      <div className="bg-surface-container-lowest p-10 rounded-[1.5rem] max-w-md w-full text-center shadow-[0_20px_50px_rgba(23,28,38,0.05)]">
        <h2 className="text-[2rem] leading-tight font-medium mb-4 text-[#a8362a] tracking-tight">
          Camera Access Denied
        </h2>
        <p className="mb-8 text-on-surface-variant font-medium">
          We need access to your camera to run the interview. Please:
        </p>
        <div className="text-left mb-8 text-on-surface-variant space-y-4 bg-surface-container-low p-6 rounded-xl">
          <div className="flex items-start gap-4"><span className="text-primary font-bold">1</span> Check your browser permissions</div>
          <div className="flex items-start gap-4"><span className="text-primary font-bold">2</span> Make sure no other app is using your camera</div>
          <div className="flex items-start gap-4"><span className="text-primary font-bold">3</span> Refresh the page and try again</div>
        </div>
        <button
          onClick={handleRetryCamera}
          className="w-full bg-gradient-to-br from-primary to-primary-container hover:opacity-90 text-white font-medium text-sm py-4 px-6 rounded-xl shadow-[0_20px_50px_rgba(23,28,38,0.05)] transition-all hover:-translate-y-0.5"
        >
          Retry Camera Access
        </button>
      </div>
    </div>
  );
};
