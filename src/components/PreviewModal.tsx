import React from "react";

interface PreviewModalProps {
  previewText: string;
  previewEmotion: string;
  previewVideoUrl: string;
  handleReRecord: () => void;
  handleSend: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  previewText,
  previewEmotion,
  previewVideoUrl,
  handleReRecord,
  handleSend,
}) => {
  return (
    <div className="fixed inset-0 bg-surface/80 backdrop-blur-xl flex justify-center items-center z-50 p-6 animate-[fadeIn_0.3s_ease-out]">
      <div className="bg-surface-container-lowest p-10 rounded-[1.5rem] max-w-md w-full shadow-[0_20px_50px_rgba(23,28,38,0.05)] animate-[slideInUp_0.4s_ease-out]">
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <h2 className="text-[2rem] leading-tight font-medium mb-6 text-on-surface tracking-tight">Review Recording</h2>
        
        <div className="bg-surface-container-low p-6 rounded-[1.5rem] mb-6 flex flex-col gap-4">
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Transcription</span>
            <p className="text-on-surface font-medium">"{previewText}"</p>
          </div>
          <div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Detected Emotion</span>
            <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
              {previewEmotion}
            </span>
          </div>
        </div>

        {previewVideoUrl && (
          <div className="rounded-[1.5rem] overflow-hidden mb-8 bg-surface-container-high border-none">
            <video
              src={previewVideoUrl}
              controls
              className="w-full mirrored-video block"
            />
          </div>
        )}
        <div className="flex gap-4">
          <button
            onClick={handleReRecord}
            className="flex-1 bg-surface-container-highest hover:bg-surface-container-high transition-colors text-on-surface font-medium text-sm py-4 px-6 rounded-xl"
          >
            Re-record
          </button>
          <button
            onClick={handleSend}
            className="flex-1 bg-gradient-to-br from-primary to-primary-container hover:opacity-90 transition-all hover:-translate-y-0.5 text-white font-medium text-sm py-4 px-6 rounded-xl shadow-[0_20px_50px_rgba(23,28,38,0.05)]"
          >
            Send Entry
          </button>
        </div>
      </div>
    </div>
  );
};
