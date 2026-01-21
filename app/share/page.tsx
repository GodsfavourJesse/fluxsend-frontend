"use client";

import { useState, useRef, useEffect } from "react";
import { X, Eye, Upload, Camera, Folder, Clipboard, Type, Zap } from "lucide-react";
import { useGlobalSocket } from "../providers/SocketProvider";
import { sendFile } from "@/lib/sendFile";
import { offerFile } from "@/lib/offerFile";
import PreviewModal from "../features/modals/transfermodals/PreviewModal";
import { Branding } from "../components/Branding";
import TransferModal from "../features/modals/transfermodals/TransferModal";
import toast from "react-hot-toast";
import { saveTransferState, resumeTransfer } from "@/lib/transferHistory";
import CameraModal from "../features/modals/transfermodals/CameraModal";
import TextShareModal from "../features/modals/transfermodals/TextShareModal";
import { DisconnectFooter } from "../components/DisconnectFooter";
import { useRouter } from "next/navigation";

type SelectedFile = {
    id: string;
    file: File;
    preview?: string;
    progress: number;
    status: "pending" | "sending" | "done" | "paused";
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
    
    const acceptedFiles = useRef<Set<string>>(new Set());
    const lastBytes = useRef(0);
    const currentBytes = useRef(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // Use global socket
    const socket = useGlobalSocket();

    // Get connection state from localStorage
    useEffect(() => {
        const storedPeerName = localStorage.getItem("fluxsend_peer_name");
        const storedIsHost = localStorage.getItem("fluxsend_is_host") === "true";
        const isConnected = localStorage.getItem("fluxsend_connected") === "true";
        
        if (storedPeerName) setPeerName(storedPeerName);
        setIsHost(storedIsHost);

        // Redirect if not connected
        if (!isConnected) {
            toast.error("Not connected. Please pair first.");
            router.push("/");
        }
    }, [router]);

    // Register message handler
    useEffect(() => {
        if (!socket.ready) return;

        const cleanup = socket.on((msg) => {
            if (msg?.type === "file-accept") {
                acceptedFiles.current.add(msg.fileId);
            }
            
            if (msg?.type === "graceful-disconnect") {
                toast.error(msg.message || "Peer left the room");
                localStorage.removeItem("fluxsend_connected");
                setTimeout(() => router.push("/"), 2000);
            }
            
            if (msg?.type === "peer-disconnected") {
                toast.error("Peer disconnected");
                localStorage.removeItem("fluxsend_connected");
                setTimeout(() => router.push("/"), 2000);
            }
        });

        return cleanup;
    }, [socket.ready, router]);

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
    };

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        processFiles(Array.from(e.target.files));
        e.target.value = "";
    };

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const folderFiles = Array.from(e.target.files);
        toast.success(`Selected ${folderFiles.length} files from folder`);
        processFiles(folderFiles);
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
        toast.success("Photo added to queue");
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
        if (!socket.ready || sending) return;

        setSending(true);
        setShowTransferModal(true);
        currentBytes.current = 0;
        lastBytes.current = 0;

        for (const item of files) {
            if (item.status !== "pending") continue;

            try {
                const fileId = offerFile(item.file, socket.send);

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === item.id ? { ...f, status: "sending" } : f
                    )
                );

                const timeout = Date.now() + 60000;
                while (!acceptedFiles.current.has(fileId)) {
                    if (Date.now() > timeout) {
                        toast.error(`${item.file.name} was not accepted`);
                        setFiles((prev) =>
                            prev.map((f) =>
                                f.id === item.id ? { ...f, status: "pending" } : f
                            )
                        );
                        continue;
                    }
                    await new Promise((r) => setTimeout(r, 200));
                }

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
                        currentBytes.current = (p / 100) * item.file.size;
                    }
                );

                await saveTransferState(fileId, item.file);

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === item.id ? { ...f, status: "done" } : f
                    )
                );
            } catch (error) {
                console.error(`Error sending ${item.file.name}:`, error);
                toast.error(`Failed to send ${item.file.name}`);
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === item.id ? { ...f, status: "paused" } : f
                    )
                );
            }
        }

        setSending(false);
        setTransferSpeed(0);
        toast.success("All files sent!");
    };

    const overallProgress =
        files.length === 0 ? 0 : Math.floor(files.reduce((a, b) => a + b.progress, 0) / files.length);

    const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

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
                            <button 
                                onClick={() => removeFile(item.id)} 
                                className="rounded-full bg-white p-1 absolute top-1 right-2 text-red-400 hover:text-red-500 cursor-pointer"
                                disabled={sending}
                            >
                                <X size={20} />
                            </button>

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

                            {item.status === "paused" && (
                                <button 
                                    className="text-xs text-blue-600"
                                    onClick={() => resumeTransfer(item.id)}
                                >
                                    Resume
                                </button>
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
                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {sending ? `Sending… ${transferSpeed.toFixed(1)} MB/s` : `Start transfer (${files.length} files)`}
                </button>
            )}

            {showTransferModal && (
                <TransferModal
                    files={files}
                    overallProgress={overallProgress}
                    sending={sending}
                    transferSpeed={transferSpeed}
                    onClose={() => setShowTransferModal(false)}
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
        </div>
    );
}