"use client";
import { CheckCircle, Zap, Pause, Play } from "lucide-react";

type SelectedFile = {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "sending" | "done" | "paused";
};

export default function TransferModal({
  files,
  overallProgress,
  sending,
  transferSpeed,
  onClose,
  onPause,
  onResume,
}: {
  files: SelectedFile[];
  overallProgress: number;
  sending: boolean;
  transferSpeed?: number;
  onClose: () => void;
  onPause?: (fileId: string) => void;
  onResume?: (fileId: string) => void;
}) {
  const formatSpeed = (mbps: number) => {
    if (mbps < 1) return `${(mbps * 1024).toFixed(0)} KB/s`;
    return `${mbps.toFixed(2)} MB/s`;
  };

  const estimateTimeRemaining = () => {
    if (!transferSpeed || transferSpeed === 0) return "Calculating...";
    
    const totalBytes = files.reduce((sum, f) => sum + f.file.size, 0);
    const completedBytes = files.reduce((sum, f) => sum + (f.file.size * f.progress / 100), 0);
    const remainingBytes = totalBytes - completedBytes;
    const remainingSeconds = remainingBytes / (transferSpeed * 1024 * 1024);

    if (remainingSeconds < 60) return `${Math.ceil(remainingSeconds)}s`;
    if (remainingSeconds < 3600) return `${Math.ceil(remainingSeconds / 60)}m`;
    return `${Math.ceil(remainingSeconds / 3600)}h`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-neutral-900 rounded-xl p-6 space-y-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Transferring Files</h2>
          
          {transferSpeed && transferSpeed > 0 && (
            <div className="flex items-center gap-2 text-green-400">
              <Zap size={16} />
              <span className="text-sm font-mono">{formatSpeed(transferSpeed)}</span>
            </div>
          )}
        </div>

        <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-500 h-3 transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">{overallProgress}% completed</span>
          {sending && <span className="text-neutral-400">ETA: {estimateTimeRemaining()}</span>}
        </div>

        <div className="space-y-2 max-h-52 overflow-y-auto">
          {files.map((f) => (
            <div key={f.id} className="flex justify-between items-center text-sm text-white bg-neutral-800 rounded-lg p-3">
              <div className="flex-1 truncate">
                <div className="truncate font-medium">{f.file.name}</div>
                <div className="text-xs text-neutral-400 mt-1">
                  {(f.file.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>

              <div className="flex items-center gap-3">
                {f.status === "done" ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : f.status === "paused" ? (
                  <button
                    onClick={() => onResume?.(f.id)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Play size={20} />
                  </button>
                ) : f.status === "sending" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">{f.progress}%</span>
                    {onPause && (
                      <button
                        onClick={() => onPause(f.id)}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        <Pause size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-neutral-500">Pending...</span>
                )}
              </div>
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