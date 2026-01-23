"use client";

import { useState, useRef, useEffect } from "react";
import { X, Eye, Upload, Camera, Folder, Clipboard, Type, Zap } from "lucide-react";
import { useGlobalSocket } from "../providers/SocketProvider";
import { sendFile } from "@/lib/sendFile";
import { offerFile } from "@/lib/offerFile";
import PreviewModal from "../features/modals/transfermodals/PreviewModal";
import { Branding } from "../components/Branding";
import TransferModal from "../features/modals/transfermodals/TransferModal";
import toast, { Toaster } from "react-hot-toast";
import CameraModal from "../features/modals/transfermodals/CameraModal";
import TextShareModal from "../features/modals/transfermodals/TextShareModal";
import { DisconnectFooter } from "../components/DisconnectFooter";
import { useRouter } from "next/navigation";

type SelectedFile = {
    id: string;
    file: File;
    preview?: string;
    progress: number;
    status: "pending" | "sending" | "done" | "paused" | "error";
};

type ShareMode = "files" | "text" | "clipboard" | "camera";

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024;

export default function SenderPage() {
    const router = useRouter();
    const [files, setFiles] = useState<SelectedFile[]>([]);
    const [previewFile, setPreviewFile] = useState<SelectedFile | null>(null);
    const [sending, setSending] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [showTextModal, setShowTextModal] = useState(false);
    const [shareMode, setShareMode] = useState<ShareMode>("files");
    const [isDragging, setIsDragging] = useState(false);
    const [transferSpeed, setTransferSpeed] = useState(0);
    const [peerName, setPeerName] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    const acceptedFiles = useRef<Set<string>>(new Set());
    const rejectedFiles = useRef<Set<string>>(new Set());
    const lastBytes = useRef(0);
    const currentBytes = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const hasCheckedConnection = useRef(false);

    const socket = useGlobalSocket();

    // Connection guard - runs once on mount
    useEffect(() => {
        if (hasCheckedConnection.current) return;
        hasCheckedConnection.current = true;

        const storedPeerName = localStorage.getItem("fluxsend_peer_name");
        const storedIsHost = localStorage.getItem("fluxsend_is_host") === "true";
        const connected = localStorage.getItem("fluxsend_connected") === "true";
        
        if (!connected || !storedPeerName) {
            toast.error("Not connected. Please pair first.");
            router.replace("/");
            return;
        }

        setPeerName(storedPeerName);
        setIsHost(storedIsHost);
        setIsConnected(true);
    }, [router]);

    // Message handler
    useEffect(() => {
        if (!socket.ready || !isConnected) return;

        const cleanup = socket.on((msg) => {
            if (msg?.type === "file-accept") {
                console.log("File accepted:", msg.fileId);
                acceptedFiles.current.add(msg.fileId);
                rejectedFiles.current.delete(msg.fileId);
            }
            
            if (msg?.type === "file-reject") {
                console.log("File rejected:", msg.fileId);
                rejectedFiles.current.add(msg.fileId);
                toast.error("File was declined by receiver");
                
                setFiles((prev) =>
                    prev.map((f) => {
                        // Find by matching file offer
                        const wasRejected = rejectedFiles.current.has(msg.fileId);
                        if (wasRejected && f.status === "sending") {
                            return { ...f, status: "error" };
                        }
                        return f;
                    })
                );
            }
            
            if (msg?.type === "graceful-disconnect" || msg?.type === "peer-disconnected") {
                const disconnectMsg = msg.type === "graceful-disconnect" 
                    ? msg.message || "Peer left the room"
                    : "Peer disconnected";
                    
                toast.error(disconnectMsg);
                localStorage.removeItem("fluxsend_connected");
                localStorage.removeItem("fluxsend_peer_name");
                localStorage.removeItem("fluxsend_is_host");
                
                setTimeout(() => router.replace("/"), 2000);
            }
        });

        return cleanup;
    }, [socket.ready, isConnected, router]);

    // Transfer speed calculation
    useEffect(() => {
        if (!sending) return;

        const interval = setInterval(() => {
            const bytesPerSecond = currentBytes.current - lastBytes.current;
            setTransferSpeed(bytesPerSecond / 1024 / 1024);
            lastBytes.current = currentBytes.current;
        }, 1000);

        return () => clearInterval(interval);
    }, [sending]);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        processFiles(droppedFiles);
    };

    const processFiles = (selectedFiles: File[]) => {
        const oversizedFiles = selectedFiles.filter(f => f.size > MAX_FILE_SIZE);
        if (oversizedFiles.length > 0) {
            toast.error(`${oversizedFiles.length} file(s) exceed 500MB limit`);
            return;
        }

        const currentTotal = files.reduce((sum, f) => sum + f.file.size, 0);
        const newTotal = selectedFiles.reduce((sum, f) => sum + f.size, 0);
        
        if (currentTotal + newTotal > MAX_TOTAL_SIZE) {
            toast.error(`Total file size would exceed 2GB limit`);
            return;
        }

        const selected: SelectedFile[] = selectedFiles.map((file) => ({
            id: crypto.randomUUID(),
            file,
            preview: file.type.startsWith("image") || file.type.startsWith("video") 
                ? URL.createObjectURL(file) 
                : undefined,
            progress: 0,
            status: "pending",
        }));

        setFiles((prev) => [...prev, ...selected]);
        toast.success(`Added ${selectedFiles.length} file(s)`);
    };

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        processFiles(Array.from(e.target.files));
        e.target.value = "";
    };

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        processFiles(Array.from(e.target.files));
        e.target.value = "";
    };

    const handleClipboardSend = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                toast.error("Clipboard is empty");
                return;
            }

            socket.send({
                type: "clipboard-share",
                text,
            });

            toast.success("Clipboard content sent!");
        } catch (error) {
            toast.error("Failed to read clipboard");
        }
    };

    const handleCameraCapture = (photo: Blob) => {
        const file = new File([photo], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        processFiles([file]);
        setShowCameraModal(false);
    };

    const handleTextSend = (text: string) => {
        socket.send({
            type: "text-share",
            text,
        });
        setShowTextModal(false);
        toast.success("Text sent!");
    };

    const removeFile = (id: string) => {
        if (sending) return;
        
        const fileToRemove = files.find(f => f.id === id);
        if (fileToRemove?.preview) {
            URL.revokeObjectURL(fileToRemove.preview);
        }
        
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    useEffect(() => {
        return () => {
            files.forEach(f => {
                if (f.preview) URL.revokeObjectURL(f.preview);
            });
        };
    }, [files]);

    const startSending = async () => {
        if (!socket.ready || sending || !isConnected) {
            toast.error("Not ready to send");
            return;
        }

        setSending(true);
        setShowTransferModal(true);
        currentBytes.current = 0;
        lastBytes.current = 0;
        acceptedFiles.current.clear();
        rejectedFiles.current.clear();

        let successCount = 0;
        let failCount = 0;

        for (const item of files) {
            if (item.status !== "pending") continue;

            try {
                console.log(`📤 Offering file: ${item.file.name}`);
                
                const fileId = offerFile(item.file, socket.send);

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === item.id ? { ...f, status: "sending" } : f
                    )
                );

                // Wait for accept/reject with timeout
                const startTime = Date.now();
                const timeout = 30000;
                
                while (!acceptedFiles.current.has(fileId) && !rejectedFiles.current.has(fileId)) {
                    if (Date.now() - startTime > timeout) {
                        throw new Error("File offer timeout");
                    }
                    await new Promise((r) => setTimeout(r, 100));
                }

                if (rejectedFiles.current.has(fileId)) {
                    throw new Error("File rejected by receiver");
                }

                console.log(`✅ File accepted, sending: ${item.file.name}`);

                await sendFile(
                    item.file,
                    fileId,
                    socket.send,
                    socket.sendBinary,
                    (p) => {
                        setFiles((prev) =>
                            prev.map((f) =>
                                f.id === item.id ? { ...f, progress: p } : f
                            )
                        );
                        
                        const bytesNow = (p / 100) * item.file.size;
                        currentBytes.current = bytesNow;
                    }
                );

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === item.id ? { ...f, status: "done", progress: 100 } : f
                    )
                );
                
                successCount++;
                console.log(`✅ File sent: ${item.file.name}`);
                
            } catch (error) {
                console.error(`❌ Error sending ${item.file.name}:`, error);
                toast.error(`Failed: ${item.file.name}`);
                
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === item.id ? { ...f, status: "error" } : f
                    )
                );
                failCount++;
            }
        }

        setSending(false);
        setTransferSpeed(0);
        
        if (successCount > 0) {
            toast.success(`✅ ${successCount} file(s) sent!`);
        }
        if (failCount > 0) {
            toast.error(`❌ ${failCount} file(s) failed`);
        }
    };

    const overallProgress =
        files.length === 0 ? 0 : Math.floor(files.reduce((a, b) => a + b.progress, 0) / files.length);

    const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-neutral-600">Checking connection...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen p-6 max-w-4xl mx-auto space-y-6 pb-32"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-blue-500">
                    <div className="text-center">
                        <Upload className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                        <p className="text-2xl font-semibold text-blue-600">Drop files here</p>
                    </div>
                </div>
            )}

            <div className="w-full flex mb-10 items-center justify-center">    
                <Branding />
            </div>

            <div className="mt-20">
                <h1 className="text-2xl font-semibold">Share anything</h1>
                <p className="text-neutral-500">Files, text, clipboard, or photos</p>
                
                {files.length > 0 && (
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs text-neutral-400">
                            {files.length} file(s) • {totalSizeMB} MB total
                        </p>
                        {sending && transferSpeed > 0 && (
                            <div className="flex items-center gap-2 text-xs text-green-600">
                                <Zap size={14} />
                                <span>{transferSpeed.toFixed(2)} MB/s</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-4 gap-2">
                <button
                    onClick={() => setShareMode("files")}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer ${
                        shareMode === "files" 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                >
                    <Upload className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-[10px] md:text-xs">Files</span>
                </button>

                <button
                    onClick={() => setShowTextModal(true)}
                    className="p-3 rounded-xl border-2 border-neutral-200 hover:bg-neutral-50 transition cursor-pointer"
                >
                    <Type className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-[10px] md:text-xs">Text</span>
                </button>

                <button
                    onClick={handleClipboardSend}
                    className="p-3 rounded-xl border-2 border-neutral-200 hover:bg-neutral-50 transition cursor-pointer"
                >
                    <Clipboard className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-[10px] md:text-xs">Clipboard</span>
                </button>

                <button
                    onClick={() => setShowCameraModal(true)}
                    className="p-3 rounded-xl border-2 border-neutral-200 hover:bg-neutral-50 transition cursor-pointer"
                >
                    <Camera className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-[10px] md:text-xs">Camera</span>
                </button>
            </div>

            {shareMode === "files" && (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-2xl p-8 hover:bg-neutral-50 transition">
                            <Upload className="w-6 h-6" />
                            <span className="font-medium text-sm">Select Files</span>
                            <span className="text-xs text-neutral-500">Max 500MB per file</span>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                multiple 
                                hidden 
                                onChange={handleSelect} 
                            />
                        </label>

                        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-2xl p-8 hover:bg-neutral-50 transition">
                            <Folder className="w-6 h-6" />
                            <span className="font-medium text-sm">Select Folder</span>
                            <span className="text-xs text-neutral-500">Upload entire folder</span>
                            <input 
                                ref={folderInputRef}
                                type="file" 
                                {...{ webkitdirectory: "true" } as any}
                                hidden 
                                onChange={handleFolderSelect} 
                            />
                        </label>
                    </div>

                    <p className="text-xs text-center text-neutral-400">
                        or drag and drop files anywhere on this page
                    </p>
                </>
            )}

            {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {files.map((item) => (
                        <div key={item.id} className="relative border border-gray-200 bg-white rounded-xl p-3 space-y-2">
                            {item.status !== "sending" && (
                                <button 
                                    onClick={() => removeFile(item.id)} 
                                    className="rounded-full bg-white p-1 absolute top-1 right-2 text-red-400 hover:text-red-500 cursor-pointer z-10"
                                    disabled={sending}
                                >
                                    <X size={20} />
                                </button>
                            )}

                            <div className="h-20 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {item.preview ? (
                                    item.file.type.startsWith("video") ? (
                                        <video src={item.preview} className="h-full" />
                                    ) : (
                                        <img src={item.preview} className="h-full w-full object-cover" alt={item.file.name} />
                                    )
                                ) : (
                                    <span className="text-xs text-neutral-500">FILE</span>
                                )}
                            </div>

                            <div className="text-sm truncate">{item.file.name}</div>
                            <div className="text-xs text-neutral-400">
                                {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                            </div>

                            {item.status === "sending" && (
                                <div className="w-full bg-neutral-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all"
                                        style={{ width: `${item.progress}%` }}
                                    />
                                </div>
                            )}

                            {item.status === "done" && (
                                <p className="text-xs text-green-600 font-medium">✓ Sent</p>
                            )}

                            {item.status === "error" && (
                                <p className="text-xs text-red-600 font-medium">✕ Failed</p>
                            )}

                            <button 
                                onClick={() => setPreviewFile(item)} 
                                className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer"
                            >
                                <Eye size={14} /> Preview
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {files.length > 0 && (
                <button
                    onClick={startSending}
                    disabled={!socket.ready || sending}
                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-blue-700 transition"
                >
                    {sending ? `Sending… ${overallProgress}%` : `Start transfer (${files.length} files)`}
                </button>
            )}

            {showTransferModal && (
                <TransferModal
                    files={files}
                    overallProgress={overallProgress}
                    sending={sending}
                    transferSpeed={transferSpeed}
                    onClose={() => !sending && setShowTransferModal(false)}
                />
            )}

            {showCameraModal && (
                <CameraModal
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCameraModal(false)}
                />
            )}

            {showTextModal && (
                <TextShareModal
                    onSend={handleTextSend}
                    onClose={() => setShowTextModal(false)}
                />
            )}

            {previewFile && <PreviewModal file={previewFile.file} onClose={() => setPreviewFile(null)} />}

            <DisconnectFooter 
                isHost={isHost} 
                peerName={peerName || undefined}
            />

            <Toaster position="top-center" />
        </div>
    );
}