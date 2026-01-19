"use client";

export default function PreviewModal({
  file,
  onClose,
}: {
  file: File & { preview?: string };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl p-4 shadow-lg flex flex-col space-y-4">
        <button
          onClick={onClose}
          className="self-end text-red-500 font-semibold"
        >
          Close
        </button>

        {file.preview && file.type.startsWith("image") && (
          <img src={file.preview} className="w-full rounded" />
        )}

        {file.preview && file.type.startsWith("video") && (
          <video src={file.preview} controls className="w-full rounded" />
        )}

        {!file.preview && <div className="p-6 text-center">No preview available</div>}
      </div>
    </div>
  );
}
