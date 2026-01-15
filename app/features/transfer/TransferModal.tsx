"use client";
import { CheckCircle } from "lucide-react";

type SelectedFile = {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "sending" | "done";
};

export default function TransferModal({
  files,
  overallProgress,
  sending,
  onClose,
}: {
  files: SelectedFile[];
  overallProgress: number;
  sending: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-neutral-900 rounded-xl p-6 space-y-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white text-center">Transferring Files</h2>

        <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-500 h-3 transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="text-center text-sm text-neutral-400">{overallProgress}% completed</div>

        <div className="space-y-2 max-h-52 overflow-y-auto">
          {files.map((f) => (
            <div key={f.id} className="flex justify-between items-center text-sm text-white">
              <span className="truncate">{f.file.name}</span>
              {f.status === "done" ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <span className="text-neutral-400">{f.status}</span>
              )}
            </div>
          ))}
        </div>

        {!sending && (
          <button
            onClick={onClose}
            className="w-full py-3 bg-white text-black rounded-xl font-semibold hover:bg-neutral-200 transition"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}
