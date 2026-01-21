"use client";

import { useEffect, useState } from "react";
import { useGlobalSocket } from "../providers/SocketProvider";
import { useFileReceiver } from "@/hooks/useFileReceiver";
import { Branding } from "../components/Branding";
import { X, Download, CheckCircle, FileText, Image, Video, Music, File, Folder, Clock } from "lucide-react";
import { DisconnectFooter } from "../components/DisconnectFooter";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useFileOfferNotifications } from "@/hooks/useFileOfferNotification";

function getFileIcon(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
        return <Image className="w-5 h-5 text-purple-500" />;
    }
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) {
        return <Video className="w-5 h-5 text-red-500" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext || '')) {
        return <Music className="w-5 h-5 text-green-500" />;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
    if (['zip', 'rar', '7z', 'tar'].includes(ext || '')) {
        return <Folder className="w-5 h-5 text-yellow-500" />;
    }
    return <File className="w-5 h-5 text-neutral-500" />;
}

function FileOfferCard({
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
        <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md"
            >
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        {getFileIcon(offer.name)}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-center mb-2 text-neutral-900">
                    Incoming File
                </h3>
                
                {/* File Info */}
                <div className="bg-neutral-50 rounded-2xl p-4 mb-6">
                    <p className="font-medium text-neutral-900 truncate text-center mb-1">
                        {offer.name}
                    </p>
                    <p className="text-sm text-neutral-500 text-center">
                        {(offer.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onReject(offer.fileId)}
                        className="h-12 rounded-xl border-2 border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50 transition-all active:scale-95"
                    >
                        Decline
                    </button>
                    <button
                        onClick={() => onAccept(offer.fileId)}
                        className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all active:scale-95 shadow-lg shadow-blue-500/30"
                    >
                        Accept
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function ReceiveProgressModal({
    fileName,
    progress,
}: {
    fileName: string;
    progress: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-gradient-to-br from-neutral-900 to-neutral-800 w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center"
                    >
                        <Download className="w-8 h-8 text-white" />
                    </motion.div>
                </div>

                {/* Title */}
                <h2 className="text-white text-xl font-semibold text-center mb-2">
                    Receiving File
                </h2>
                <p className="text-neutral-400 text-sm text-center mb-6 truncate">
                    {fileName}
                </p>

                {/* Progress Bar */}
                <div className="relative w-full h-3 bg-neutral-700 rounded-full overflow-hidden mb-3">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                    />
                </div>

                {/* Progress Text */}
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-400">{progress}%</span>
                    <span className="text-neutral-400">
                        {progress === 100 ? "Complete!" : "In progress..."}
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function ReceiverPage() {
    const router = useRouter();
    const socket = useGlobalSocket();
    const receiver = useFileReceiver();
    const [showProgress, setShowProgress] = useState(false);
    const [peerName, setPeerName] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);

    useFileOfferNotifications(receiver.incomingOffers);

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

    // Register message handler with global socket
    useEffect(() => {
        if (!socket.ready) return;

        const cleanup = socket.on((msg) => {
            receiver.handleMessage(msg);

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

        receiver.setSender(socket.send);

        return cleanup;
    }, [socket.ready, socket, receiver, router]);

    useEffect(() => {
        if (receiver.currentFile?.current && receiver.progress < 100) {
            setShowProgress(true);
        } else {
            setShowProgress(false);
        }
    }, [receiver.progress, receiver.currentFile]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50/30 to-purple-50/30 px-4 py-6 pb-32">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <Branding />
                    
                    {peerName && (
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-neutral-700">
                                Connected to {peerName}
                            </span>
                        </div>
                    )}
                </div>

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        Ready to Receive
                    </h1>
                    <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
                        Waiting for files from <span className="font-semibold text-blue-600">{peerName || "connected device"}</span>
                    </p>
                </motion.div>

                {/* Waiting State */}
                {receiver.receivedFiles.length === 0 && !receiver.incomingOffers.length && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-xl border border-neutral-200/50">
                            {/* Animated Icon */}
                            <div className="flex justify-center mb-8">
                                <motion.div
                                    animate={{ 
                                        scale: [1, 1.05, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{ 
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30"
                                >
                                    <Download className="w-12 h-12 text-white" />
                                </motion.div>
                            </div>

                            <h3 className="text-2xl font-semibold text-center mb-3 text-neutral-900">
                                Waiting for Files
                            </h3>
                            <p className="text-neutral-500 text-center mb-8">
                                Files sent from the connected device will appear here
                            </p>

                            {/* Feature List */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-medium text-neutral-700">Secure Transfer</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
                                        <Clock className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <p className="text-sm font-medium text-neutral-700">Instant Delivery</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                                        <File className="w-6 h-6 text-green-600" />
                                    </div>
                                    <p className="text-sm font-medium text-neutral-700">Any File Type</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Received Files */}
                {receiver.receivedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-neutral-900">
                                Received Files ({receiver.receivedFiles.length})
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {receiver.receivedFiles.map((file, index) => (
                                <motion.div
                                    key={file.fileId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 border border-neutral-200/50 hover:border-blue-300"
                                >
                                    {/* Icon & Badge */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            {getFileIcon(file.name)}
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                            <span className="text-xs font-medium text-green-700">Complete</span>
                                        </div>
                                    </div>

                                    {/* File Info */}
                                    <h3 className="font-semibold text-neutral-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
                                        {file.name}
                                    </h3>
                                    <p className="text-sm text-neutral-500 mb-4">
                                        {(file.blob.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>

                                    {/* Download Button */}
                                    <button
                                        onClick={() => receiver.download(file)}
                                        className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* File Offer Modal */}
                <AnimatePresence>
                    {receiver.incomingOffers.map((offer) => (
                        <FileOfferCard
                            key={offer.fileId}
                            offer={offer}
                            onAccept={receiver.accept}
                            onReject={receiver.reject}
                        />
                    ))}
                </AnimatePresence>

                {/* Progress Modal */}
                <AnimatePresence>
                    {showProgress && receiver.currentFile?.current && (
                        <ReceiveProgressModal
                            fileName={receiver.currentFile.current.name}
                            progress={receiver.progress}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Disconnect Footer */}
            <DisconnectFooter 
                isHost={isHost} 
                peerName={peerName || undefined}
            />
        </div>
    );
}