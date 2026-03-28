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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg text-black max-w-md">
        <h2 className="text-2xl mb-4">Review Your Recording</h2>
        <p className="mb-2">
          <strong>Transcription:</strong> "{previewText}"
        </p>
        <p className="mb-4">
          <strong>Emotion:</strong> {previewEmotion}
        </p>
        {previewVideoUrl && (
          <video
            src={previewVideoUrl}
            controls
            className="w-full mb-4 rounded mirrored-video"
          />
        )}
        <div className="flex gap-4">
          <button
            onClick={handleReRecord}
            className="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded"
          >
            Re-record
          </button>
          <button
            onClick={handleSend}
            className="bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
