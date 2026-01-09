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

type PairState = "idle" | "waiting" | "connecting" | "connected";

export default function Home() {
    const [pairState, setPairState] = useState<PairState>("idle");
    const [roomId, setRoomId] = useState<string | null>(null);
    const [peerName, setPeerName] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const socket = useSocket((message) => {
        switch (message.type) {
            case "room-created":
                setRoomId(message.roomId);
                setPairState("waiting");
                break;

            case "joining":
                setPairState("connecting");
                break;

            case "peer-connected":
                setPeerName(message.peerName);
                setPairState("connected");
                break;
        }
    });

    useEffect(() => {
        socket.connect();
    }, []);

    const createRoom = () => {
        socket.send({
            type: "create-room",
            deviceName: getDeviceName(),
        });
    };

    const refreshRoom = () => {
        setRoomId(null);
        createRoom();
    }

    const cancelWaiting = () => {
        setRoomId(null);
        setPairState("idle");
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
                                            Waiting for another device
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
                                            className="h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-700 text-white cursor-pointer"
                                            onClick={refreshRoom}
                                        >
                                            Refresh
                                        </Button>
                                        <Button
                                            className="h-10 px-4 rounded-xl bg-red-500 text-neutral-700 hover:bg-red-700 cursor-pointer"
                                            onClick={cancelWaiting}
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* CONNECTING */}
                            {pairState === "connecting" && (
                                <motion.div
                                    key="connecting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center gap-5 py-6"
                                >
                                    <motion.div
                                        className="relative h-14 w-14 rounded-full border-2 border-blue-200"
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                    >
                                        <div className="absolute inset-1 rounded-full bg-blue-500/10" />
                                    </motion.div>

                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-medium text-[#0B0F1A]">
                                            Connecting…
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            Establishing secure connection
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* CONNECTED */}
                            {pairState === "connected" && peerName && (
                                <motion.div
                                    key="connected"
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="text-center space-y-3 py-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 260 }}
                                        className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center"
                                    >
                                        <span className="text-green-600 text-xl">✓</span>
                                    </motion.div>

                                    <p className="text-green-600 font-medium">
                                        Connected successfully
                                    </p>
                                    <p className="text-sm text-neutral-600">
                                        Connected to <span className="font-medium">{peerName}</span>
                                    </p>
                                </motion.div>
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
        </main>
    );
}
