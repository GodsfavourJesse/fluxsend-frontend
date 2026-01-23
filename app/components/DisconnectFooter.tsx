"use client";

import { motion } from "framer-motion";
import { LogOut, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGlobalSocket } from "../providers/SocketProvider";
import toast from "react-hot-toast";

type Props = {
    isHost: boolean;
    peerName?: string;
    onDisconnect?: () => void;
};

export function DisconnectFooter({ isHost, peerName, onDisconnect }: Props) {
    const router = useRouter();
    const socket = useGlobalSocket();

    const handleDisconnect = () => {
        // Notify peer before disconnecting
        if (socket.ready) {
            socket.send({
                type: "graceful-disconnect",
                message: `${peerName || "Peer"} left the room`
            });
        }

        // Clear connection state
        localStorage.removeItem("fluxsend_peer_name");
        localStorage.removeItem("fluxsend_is_host");
        localStorage.removeItem("fluxsend_connected");

        toast.success(isHost ? "Room closed" : "Left room");
        
        // Call custom disconnect handler if provided
        if (onDisconnect) {
            onDisconnect();
        }

        // Navigate back to home
        setTimeout(() => {
            router.push("/");
        }, 100);
    };

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 pb-6 px-4"
        >
            <div className="max-w-2xl mx-auto">
                <div className="bg-gradient-to-r from-red-400 to-red-500 rounded-2xl shadow-2xl p-4 backdrop-blur-lg">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-white">
                            {isHost ? (
                                <XCircle className="w-5 h-5" />
                            ) : (
                                <LogOut className="w-5 h-5" />
                            )}
                            <div>
                                <p className="text-sm font-semibold">
                                    {peerName ? `Connected to ${peerName}` : "Connected"}
                                </p>
                                <p className="text-xs opacity-90">
                                    {isHost ? "Close room to end session" : "Leave room to disconnect"}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleDisconnect}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors shadow-md cursor-pointer active:scale-95"
                        >
                            {isHost ? (
                                <>
                                    <XCircle className="w-4 h-4" />
                                    Close Room
                                </>
                            ) : (
                                <>
                                    <LogOut className="w-4 h-4" />
                                    Leave Room
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}