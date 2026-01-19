"use client";

import { useState, useRef, useEffect } from "react";
import { X, Eye, Upload } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { sendFile } from "@/lib/sendFile";
import { offerFile } from "@/lib/offerFile";
import PreviewModal from "../features/modals/transfermodals/PreviewModal";
import { Branding } from "../components/Branding";
import TransferModal from "../features/modals/transfermodals/TransferModal";
import toast from "react-hot-toast";

type SelectedFile = {
    id: string;
    file: File;
    preview?: string;
    progress: number;
    status: "pending" | "sending" | "done";
};

// File size limits
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB per file
const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024; // 2GB total

export default function SenderPage() {
    const [files, setFiles] = useState<SelectedFile[]>([]);
    const [previewFile, setPreviewFile] = useState<SelectedFile | null>(null);
    const [sending, setSending] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const acceptedFiles = useRef<Set<string>>(new Set());

    const socket = useSocket((msg) => {
        if (msg?.type === "file-accept") {
            acceptedFiles.current.add(msg.fileId);
        }
    });

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const selectedFiles = Array.from(e.target.files);
        
        // Validate individual file sizes
        const oversizedFiles = selectedFiles.filter(f => f.size > MAX_FILE_SIZE);
        if (oversizedFiles.length > 0) {
            toast.error(
                `${oversizedFiles.length} file(s) exceed 500MB limit:\n${oversizedFiles.map(f => f.name).slice(0, 3).join(', ')}${oversizedFiles.length > 3 ? '...' : ''}`
            );
            e.target.value = "";
            return;
        }

        //Validate total size
        const currentTotal = files.reduce((sum, f) => sum + f.file.size, 0);
        const newTotal = selectedFiles.reduce((sum, f) => sum + f.size, 0);
        
        if (currentTotal + newTotal > MAX_TOTAL_SIZE) {
            toast.error(`Total file size would exceed 2GB limit`);
            e.target.value = "";
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
        e.target.value = "";
    };

    const removeFile = (id: string) => {
        if (sending) return;
        
        // Clean up preview URL
        const fileToRemove = files.find(f => f.id === id);
        if (fileToRemove?.preview) {
            URL.revokeObjectURL(fileToRemove.preview);
        }
        
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    // Cleanup preview URLs on unmount
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

        for (const item of files) {
            if (item.status !== "pending") continue;

            try {
                //  Send file offer
                const fileId = offerFile(item.file, socket.send);

                // Mark UI as waiting
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === item.id ? { ...f, status: "sending" } : f
                    )
                );

                // WAIT until receiver accepts (with timeout)
                const timeout = Date.now() + 60000; // 60s timeout
                while (!acceptedFiles.current.has(fileId)) {
                    if (Date.now() > timeout) {
                        toast.error(`${item.file.name} was not accepted`);
                        setFiles((prev) =>
                            prev.map((f) =>
                                f.id === item.id ? { ...f, status: "pending" } : f
                            )
                        );
                        continue; // Skip this file
                    }
                    await new Promise((r) => setTimeout(r, 200));
                }

                // Start actual transfer
                await sendFile(
                    item.file,
                    fileId,
                    socket.send,
                    socket.sendBinary,
                    (p) =>
                        setFiles((prev) =>
                            prev.map((f) =>
                                f.id === item.id ? { ...f, progress: p } : f
                            )
                        )
                );

                // Mark as done
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
                        f.id === item.id ? { ...f, status: "pending" } : f
                    )
                );
            }
        }

        setSending(false);
        toast.success("All files sent!");
    };

    const overallProgress =
        files.length === 0 ? 0 : Math.floor(files.reduce((a, b) => a + b.progress, 0) / files.length);

    const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* LOGO */}
            <div className="w-full flex mb-10 items-center justify-center">    
                <Branding />
            </div>

            <div className="mt-20">
                <h1 className="text-2xl font-semibold">Share files</h1>
                <p className="text-neutral-500">Securely transfer files to connected device</p>
                
                {/* Show file size info */}
                {files.length > 0 && (
                    <p className="text-xs text-neutral-400 mt-2">
                        {files.length} file(s) • {totalSizeMB} MB total
                    </p>
                )}
            </div>

            <label className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-2xl p-10 hover:bg-neutral-50 transition">
                <Upload className="w-6 h-6" />
                <span className="font-medium">Select files</span>
                <span className="text-sm text-neutral-500">Images, videos, documents, APKs</span>
                <span className="text-xs text-neutral-400">Max 500MB per file • 2GB total</span>
                <input type="file" multiple hidden onChange={handleSelect} />
            </label>

            {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {files.map((item) => (
                        <div key={item.id} className="relative border rounded-xl p-3 space-y-2">
                            <button 
                                onClick={() => removeFile(item.id)} 
                                className="absolute top-2 right-2 text-neutral-400 hover:text-red-500"
                                disabled={sending}
                            >
                                <X size={16} />
                            </button>

                            <div className="h-20 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {item.preview ? (
                                    item.file.type.startsWith("video") ? (
                                        <video src={item.preview} className="h-full" />
                                    ) : (
                                        <img src={item.preview} className="h-full object-cover" alt={item.file.name} />
                                    )
                                ) : (
                                    <span className="text-xs text-neutral-500">FILE</span>
                                )}
                            </div>

                            <div className="text-sm truncate">{item.file.name}</div>
                            <div className="text-xs text-neutral-400">
                                {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                            </div>

                            <button 
                                onClick={() => setPreviewFile(item)} 
                                className="flex items-center gap-1 text-xs text-blue-600"
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
                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {sending ? "Sending…" : `Start transfer (${files.length} files)`}
                </button>
            )}

            {showTransferModal && (
                <TransferModal
                    files={files}
                    overallProgress={overallProgress}
                    sending={sending}
                    onClose={() => setShowTransferModal(false)}
                />
            )}

            {previewFile && <PreviewModal file={previewFile.file} onClose={() => setPreviewFile(null)} />}
        </div>
    );
}