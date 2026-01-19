"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useFileReceiver } from "@/hooks/useFileReceiver";
import { Branding } from "../components/Branding";
import { X, Download, CheckCircle } from "lucide-react";

/* ================= FILE OFFER TOAST ================= */
function FileOfferToast({
    offer,
    onAccept,
    onReject,
}: {
    offer: {
        fileId: string;
        name: string;
        size: number;
    };
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}) {
    return (
        <div className="fixed bottom-4 right-4 w-[90%] sm:w-96 bg-white rounded-2xl shadow-xl p-4 z-50 animate-slide-up">
            <div className="flex justify-between items-center">
                <div className="truncate font-semibold text-sm">{offer.name}</div>
                    <button onClick={() => onReject(offer.fileId)}>
                        <X size={18} className="text-red-500" />
                    </button>
            </div>

            <p className="text-xs text-neutral-500 mt-1">
                {(offer.size / 1024).toFixed(1)} KB
            </p>

            <div className="flex gap-2 mt-3">
                <button
                    onClick={() => onAccept(offer.fileId)}
                    className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-xs font-semibold"
                >
                    Accept
                </button>
                <button
                    onClick={() => onReject(offer.fileId)}
                    className="flex-1 border border-red-500 text-red-500 rounded-xl py-2 text-xs font-semibold"
                >
                    Reject
                </button>
            </div>
        </div>
    );
}

/* ================= PROGRESS MODAL ================= */
function ReceiveProgressModal({
    fileName,
    progress,
}: {
    fileName: string;
    progress: number;
}) {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
            <div className="bg-neutral-900 w-full max-w-md rounded-2xl p-6">
                <h2 className="text-white text-lg font-semibold truncate">
                    Receiving {fileName}
                </h2>

                <div className="mt-4 w-full bg-neutral-700 h-3 rounded-full overflow-hidden">
                    <div
                        className="bg-blue-500 h-3 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p className="text-xs text-neutral-300 mt-2">{progress}% completed</p>
            </div>
        </div>
    );
}

/* ================= MAIN RECEIVER PAGE ================= */
export default function ReceiverPage() {
    const socket = useSocket();
    const receiver = useFileReceiver();
    const [showProgress, setShowProgress] = useState(false);

    useEffect(() => {
        if (!socket.ready) return;

        socket.setOnMessage(receiver.handleMessage);
        receiver.setSender(socket.send);

        return () => {
            receiver.reset();
        };
    }, [socket.ready]);

    /* Show progress modal only when receiving */
    useEffect(() => {
        if (receiver.currentFile?.current && receiver.progress < 100) {
            setShowProgress(true);
        } else {
            setShowProgress(false);
        }
    }, [receiver.progress, receiver.currentFile]);

    return (
        <div className="min-h-screen bg-neutral-100 px-4 py-6 max-w-5xl mx-auto">

            <div className="w-full flex mb-10 items-center justify-center">    
                <Branding />
            </div>
            
            <div className="mt-20">
                <h1 className="text-2xl font-bold mb-1">Incoming Files</h1>
                <p className="text-neutral-500 text-sm">
                    Accept or reject files sent to this device.
                </p>
            </div>

            {/* ===== FILE OFFER TOASTS ===== */}
            {receiver.incomingOffers.map((offer) => (
                <FileOfferToast
                    key={offer.fileId}
                    offer={offer}
                    onAccept={receiver.accept}
                    onReject={receiver.reject}
                />
            ))}

            {/* ===== PROGRESS MODAL ===== */}
            {showProgress && receiver.currentFile?.current && (
                <ReceiveProgressModal
                    fileName={receiver.currentFile.current.name}
                    progress={receiver.progress}
                />
            )}

            {/* ===== RECEIVED FILES ===== */}
            {receiver.receivedFiles.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-4">Received</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {receiver.receivedFiles.map((file) => (
                            <div
                                key={file.fileId}
                                className="bg-white rounded-2xl p-4 shadow-md flex flex-col gap-3"
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="text-green-500" size={18} />
                                    <span className="text-sm font-medium truncate">
                                        {file.name}
                                    </span>
                                </div>

                                <button
                                    onClick={() => receiver.download(file)}
                                    className="mt-auto flex items-center justify-center gap-1 bg-blue-600 text-white rounded-xl py-2 text-xs font-semibold"
                                >
                                    <Download size={14} />
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
