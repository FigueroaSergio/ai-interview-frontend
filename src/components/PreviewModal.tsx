import React from "react";

interface PreviewModalProps {
  previewText: string;
  setPreviewText: (val: string) => void;
  previewEmotion: string;
  previewVideoUrl: string;
  handleReRecord: () => void;
  handleSend: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  previewText,
  setPreviewText,
  previewEmotion,
  previewVideoUrl,
  handleReRecord,
  handleSend,
}) => {
  const isInvalid = !previewText || previewText.trim() === "";

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
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Transcription</span>
            <textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 text-on-surface font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none min-h-[120px] shadow-sm"
              placeholder="What did you say?"
            />
            {isInvalid && (
              <span className="text-[10px] text-[#a8362a] font-bold uppercase tracking-widest pl-1">
                Message required
              </span>
            )}
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
            disabled={isInvalid}
            className={`flex-1 transition-all text-white font-medium text-sm py-4 px-6 rounded-xl shadow-[0_20px_50px_rgba(23,28,38,0.05)] ${
              isInvalid 
                ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-50 shadow-none grayscale" 
                : "bg-gradient-to-br from-primary to-primary-container hover:opacity-90 hover:-translate-y-0.5"
            }`}
          >
            Send Entry
          </button>
        </div>
      </div>
    </div>
  );
};
