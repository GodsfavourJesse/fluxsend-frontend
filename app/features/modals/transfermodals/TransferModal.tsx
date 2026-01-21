"use client";

import { CheckCircle, Zap, Pause, Play, X } from "lucide-react";

type SelectedFile = {
    id: string;
    file: File;
    progress: number;
    status: "pending" | "sending" | "done" | "paused" | "error";
};

interface TransferModalProps {
    files: SelectedFile[];
    overallProgress: number;
    sending: boolean;
    transferSpeed?: number;
    onClose: () => void;
    onPause?: (fileId: string) => void;
    onResume?: (fileId: string) => void;
}

export default function TransferModal({
    files,
    overallProgress,
    sending,
    transferSpeed = 0,
    onClose,
    onPause,
    onResume,
}: TransferModalProps) {
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
            <div className="w-full max-w-md bg-neutral-900 rounded-2xl p-6 space-y-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Transferring Files</h2>
                    
                    <button
                        onClick={onClose}
                        disabled={sending}
                        className="text-neutral-400 hover:text-white transition disabled:opacity-30"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Speed Indicator */}
                {transferSpeed && transferSpeed > 0 && (
                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        <Zap size={16} className="text-green-400" />
                        <span className="text-sm font-mono text-green-400">
                            {formatSpeed(transferSpeed)}
                        </span>
                    </div>
                )}

                {/* Overall Progress Bar */}
                <div className="space-y-2">
                    <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 transition-all duration-300"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">{overallProgress}% completed</span>
                        {sending && (
                            <span className="text-neutral-400">
                                ETA: {estimateTimeRemaining()}
                            </span>
                        )}
                    </div>
                </div>

                {/* File List */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {files.map((f) => (
                        <div 
                            key={f.id} 
                            className="flex justify-between items-center text-sm text-white bg-neutral-800 rounded-lg p-3 hover:bg-neutral-750 transition"
                        >
                            <div className="flex-1 truncate min-w-0 mr-3">
                                <div className="truncate font-medium">{f.file.name}</div>
                                <div className="text-xs text-neutral-400 mt-1">
                                    {(f.file.size / (1024 * 1024)).toFixed(2)} MB
                                </div>
                                
                                {/* Individual Progress Bar for Sending Files */}
                                {f.status === "sending" && (
                                    <div className="w-full bg-neutral-700 rounded-full h-1.5 mt-2">
                                        <div
                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${f.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Status Icons */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {f.status === "done" ? (
                                    <CheckCircle size={20} className="text-green-500" />
                                ) : f.status === "error" ? (
                                    <div className="text-red-500 text-xs font-medium">Failed</div>
                                ) : f.status === "paused" ? (
                                    <button
                                        onClick={() => onResume?.(f.id)}
                                        className="text-blue-400 hover:text-blue-300 transition"
                                        title="Resume"
                                    >
                                        <Play size={20} />
                                    </button>
                                ) : f.status === "sending" ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-blue-400 font-mono min-w-[3ch] text-right">
                                            {f.progress}%
                                        </span>
                                        {onPause && (
                                            <button
                                                onClick={() => onPause(f.id)}
                                                className="text-yellow-400 hover:text-yellow-300 transition"
                                                title="Pause"
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

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                            {files.filter(f => f.status === "done").length}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">Completed</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                            {files.filter(f => f.status === "sending").length}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">In Progress</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                            {files.filter(f => f.status === "pending").length}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">Waiting</div>
                    </div>
                </div>

                {/* Close Button (only visible when not sending) */}
                {!sending && (
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
                    >
                        Done
                    </button>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #262626;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #525252;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #737373;
                }
            `}</style>
        </div>
    );
}