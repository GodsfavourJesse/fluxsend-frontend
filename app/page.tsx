"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "./components/Button";
import { Container } from "./components/Container";
import { Branding } from "./components/Branding";
import { QRCodeDisplay } from "./features/pairing/QRCodeDisplay";
import { PairDeviceModal } from "./features/modals/PairDeviceModal";
import { getDeviceName } from "./utils/getDeviceName";
import { RefreshCcw, X } from "lucide-react";
import { ConnectingIndicator } from "./features/pairing/ConnectingIndicator";
import { ConnectionSuccess } from "./features/pairing/ConnectionSuccess";
import toast, { Toaster } from "react-hot-toast";

type PairState = "idle" | "waiting" | "connecting" | "connected";

export default function Home() {
    const [pairState, setPairState] = useState<PairState>("idle");
    const [roomId, setRoomId] = useState<string | null>(null);
    const [peerName, setPeerName] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHost, setIsHost] = useState(false);

    const socket = useSocket((message) => {
        switch (message.type) {

            // HOST creates room
            case "room-created":
                setRoomId(message.roomId);
                setPairState("waiting");
                setIsHost(true); // mark user as host
                break;
                
            // HOST sees guest connecting
            case "peer-joining":
                setPeerName(message.peerName);
                setPairState("connecting");
                break;
            
            // BOTH host & guest reciver this
            case "connection-established":
                setPeerName(message.peerName);
                setPairState("connected");
                toast.success(`Connection established with ${message.peerName}`);
                break;
            
            case "error":
                console.error(message.message);
                setPairState("idle");
                setRoomId(null);
                setPeerName(null);
                setIsHost(false);
                break;
        }
    });


    const createRoom = () => {
        if (!socket.ready) return;
        
        socket.send({
            type: "create-room",
            deviceName: getDeviceName(),
        });
    };

    const refreshRoom = () => {
        setRoomId(null);
        setPairState("idle");
        setIsHost(false);
        setPeerName(null);
        createRoom();
    }

    const cancelWaiting = () => {
        setRoomId(null);
        setPairState("idle");
        setIsHost(false);
        setPeerName(null);
    }

    return (
        <main className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
            <Container>
                <div className="flex flex-col gap-14">
                    {/* Branding */}
                    <Branding />

                    {/* Value Proposition */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-3"
                    >
                        <h1 className="text-3xl font-semibold leading-tight text-[#0B0F1A]">
                            Send files.
                            <br />
                            No friction.
                        </h1>
                        <p className="text-sm text-neutral-600 max-w-sm">
                            Secure peer-to-peer pairing across any network.
                            No accounts. No setup.
                        </p>
                    </motion.div>

                    {/* Pairing Card */}
                    <motion.div
                        layout
                        className="bg-white rounded-3xl p-8 shadow-sm space-y-6"
                    >
                        <AnimatePresence mode="wait">
                            {/* IDLE */}
                            {pairState === "idle" && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.35 }}
                                    className="space-y-4"
                                >
                                    <h2 className="text-lg font-medium text-[#0B0F1A]">
                                        Pair your device
                                    </h2>

                                    <Button
                                        onClick={createRoom}
                                        className="w-full h-12 rounded-xl cursor-pointer"
                                    >
                                        Create pairing code
                                    </Button>

                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="w-full h-12 rounded-xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition cursor-pointer"
                                    >
                                        Connect to a device
                                    </button>
                                </motion.div>
                            )}
 
                            {/* WAITING */}
                            {pairState === "waiting" && roomId && (
                                <motion.div
                                    key="waiting"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.35 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-1 text-center">
                                        <p className="text-sm text-neutral-500">
                                            Waiting for another device...
                                        </p>
                                        <div className="text-2xl font-mono tracking-widest text-[#0B0F1A]">
                                            {roomId}
                                        </div>
                                    </div>

                                    {/* QR Code with glow (FIXED) */}
                                    <div className="relative flex justify-center items-center">
                                        {/* Glow BEHIND the QR */}
                                        <motion.div
                                            className="absolute rounded-full bg-blue-400/20 blur-2xl"
                                            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
                                            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                                            style={{ width: 220, height: 220 }}
                                        />

                                        {/* QR Code ON TOP (sharp & scannable) */}
                                        <div className="relative z-10 bg-white p-3 rounded-2xl shadow-md">
                                            <QRCodeDisplay roomId={roomId} size={200} />
                                        </div>
                                    </div>

                                    <p className="text-xs text-neutral-400 text-center">
                                        Scan the QR code or enter the pairing code on the other device
                                    </p>

                                    {/* Refresh & Close buttons */}
                                    <div className="flex justify-center gap-4 mt-2">
                                        <Button
                                            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-700 text-white cursor-pointer transition-colors"
                                            onClick={refreshRoom}
                                        >
                                           <RefreshCcw size={16} /> Refresh 
                                        </Button>
                                        <Button
                                            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-red-500 text-neutral-700 hover:bg-red-700 cursor-pointer transition-colors"
                                            onClick={cancelWaiting}
                                        >
                                           <X size={16} /> Close 
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* CONNECTING */}
                            {pairState === "connecting" && (
                                <ConnectingIndicator 
                                    peer={peerName || undefined} 
                                    handshakeDuration={1300}
                                    onComplete={() => setPairState("connected")}
                                />
                            )}

                            {/* CONNECTED */}
                            {pairState === "connected" && peerName && (
                                <ConnectionSuccess peer={peerName} />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </Container>

            {/* Modal */}
            <PairDeviceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onJoinRoom={(code) => {
                    socket.send({
                        type: "join-room",
                        roomId: code,
                        deviceName: getDeviceName(),
                    });
                    setPairState("connecting");
                    setIsModalOpen(false);
                }}
            />

            <Toaster position="top-center" />
        </main>
    );
}
