"use client";

import { useState } from "react";
import { X, Eye, Upload } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { sendFile } from "@/lib/sendFile";
import PreviewModal from "../features/transfer/PreviewModal";
import TransferModal from "../features/transfer/TransferModal";
import { Branding } from "../components/Branding";

type SelectedFile = {
    id: string;
    file: File;
    preview?: string;
    progress: number;
    status: "pending" | "sending" | "done";
};

export default function SenderPage() {
    const [files, setFiles] = useState<SelectedFile[]>([]);
    const [previewFile, setPreviewFile] = useState<SelectedFile | null>(null);
    const [sending, setSending] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);

    const socket = useSocket(() => {}); // ready to send

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const selected: SelectedFile[] = Array.from(e.target.files).map((file) => ({
            id: crypto.randomUUID(),
            file,
            preview: file.type.startsWith("image") || file.type.startsWith("video") ? URL.createObjectURL(file) : undefined,
            progress: 0,
            status: "pending",
        }));

        setFiles((prev) => [...prev, ...selected]);
        e.target.value = "";
    };

    const removeFile = (id: string) => {
        if (sending) return;
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const startSending = async () => {
        if (!socket.ready || sending) return;
        setSending(true);
        setShowTransferModal(true);

        for (const item of files) {
            if (item.status !== "pending") continue;

            setFiles((prev) =>
                prev.map((f) => (f.id === item.id ? { ...f, status: "sending" } : f))
            );

            await sendFile(item.file, item.id, socket.send, (p) =>
                setFiles((prev) =>
                prev.map((f) => (f.id === item.id ? { ...f, progress: p } : f))
                )
            );

            setFiles((prev) =>
                prev.map((f) => (f.id === item.id ? { ...f, status: "done" } : f))
            );
        }

        setSending(false);
    };

    const overallProgress =
        files.length === 0 ? 0 : Math.floor(files.reduce((a, b) => a + b.progress, 0) / files.length);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">

            {/* LOGO */}
            <div className="w-full flex mb-10 items-center justify-center">    
                <Branding />
            </div>

            <div className="mt-20">
                <h1 className="text-2xl font-semibold">Share files</h1>
                <p className="text-neutral-500">Securely transfer files to connected device</p>
            </div>

            <label className="flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-2xl p-10 hover:bg-neutral-50 transition">
                <Upload className="w-6 h-6" />
                <span className="font-medium">Select files</span>
                <span className="text-sm text-neutral-500">Images, videos, documents, APKs</span>
                <input type="file" multiple hidden onChange={handleSelect} />
            </label>

            {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {files.map((item) => (
                        <div key={item.id} className="relative border rounded-xl p-3 space-y-2">
                            <button onClick={() => removeFile(item.id)} className="absolute top-2 right-2 text-neutral-400 hover:text-red-500">
                                <X size={16} />
                            </button>

                            <div className="h-20 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
                                {item.preview ? (
                                    item.file.type.startsWith("video") ? (
                                        <video src={item.preview} className="h-full" />
                                    ) : (
                                        <img src={item.preview} className="h-full" />
                                    )
                                    ) : (
                                    <   span className="text-xs text-neutral-500">FILE</span>
                                )}
                            </div>

                            <div className="text-sm truncate">{item.file.name}</div>

                            <button onClick={() => setPreviewFile(item)} className="flex items-center gap-1 text-xs text-blue-600">
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
                    className="w-full py-4 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
                >
                    {sending ? "Sending…" : `Start transfer`}
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
