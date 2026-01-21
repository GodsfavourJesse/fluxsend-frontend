"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalSocket } from "./providers/SocketProvider";
import { Button } from "./components/Button";
import { Container } from "./components/Container";
import { Branding } from "./components/Branding";
import { QRCodeDisplay } from "./features/pairing/QRCodeDisplay";
import { PairDeviceModal } from "./features/modals/pairmodals/PairDeviceModal";
import { getDeviceName } from "./utils/getDeviceName";
import { RefreshCcw, X } from "lucide-react";
import { ConnectingIndicator } from "./features/pairing/ConnectingIndicator";
import ConnectedActionChooser from "./features/pairing/ConnectedActionChooser";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { PWARegister } from "./components/PWARegister";

type PairState = "idle" | "waiting" | "connecting" | "connected" | "disconnected";

export default function Home() {
    const router = useRouter();
    const [pairState, setPairState] = useState<PairState>("idle");
    const [roomId, setRoomId] = useState<string | null>(null);
    const [peerName, setPeerName] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [roomToken, setRoomToken] = useState<string | null>(null);
    const [connectedMode, setConnectedMode] = useState<null | "send" | "receive">(null);
    
    const connectingToastId = useRef<string | null>(null);
    
    const socket = useGlobalSocket();
    
    useEffect(() => {
        if (!socket.ready) return;

        const cleanup = socket.on((msg) => {
            console.log("Home received:", msg.type);

            switch (msg.type) {
                case "room-created":
                    setRoomId(msg.roomId);
                    setRoomToken(msg.token);
                    setPairState("waiting");
                    setIsHost(true);
                    toast.success("Room created!", { duration: 2000 });
                    break;
                        
                case "peer-joining":
                    setPeerName(msg.peerName);
                    setPairState("connecting");
                    
                    // Show connecting toast ONCE
                    if (!connectingToastId.current) {
                        connectingToastId.current = toast.loading(`Connecting to ${msg.peerName}...`, {
                            id: "connecting-toast"
                        });
                    }
                    break;
                            
                case "connection-established":
                    console.log("Connection established with:", msg.peerName);
                    
                    setPeerName(msg.peerName);
                    setPairState("connected");
                    setRoomToken(null);
                    
                    // CRITICAL: Dismiss connecting toast
                    if (connectingToastId.current) {
                        toast.dismiss(connectingToastId.current);
                        toast.dismiss("connecting-toast");
                        connectingToastId.current = null;
                    }
                    
                    // Store connection state
                    localStorage.setItem("fluxsend_peer_name", msg.peerName);
                    localStorage.setItem("fluxsend_is_host", isHost.toString());
                    localStorage.setItem("fluxsend_connected", "true");
                    
                    // NO TOAST HERE - let the modal handle the celebration
                    break;
                    
                case "peer-disconnected":
                    if (connectingToastId.current) {
                        toast.dismiss(connectingToastId.current);
                        toast.dismiss("connecting-toast");
                        connectingToastId.current = null;
                    }
                    toast.error("Peer disconnected");
                    setPairState("disconnected");
                    localStorage.removeItem("fluxsend_connected");
                    break;
                        
                case "error":
                    if (connectingToastId.current) {
                        toast.dismiss(connectingToastId.current);
                        toast.dismiss("connecting-toast");
                        connectingToastId.current = null;
                    }
                    toast.error(msg.message);
                    resetPairingState();
                    break;
            }
        });

        return cleanup;
    }, [socket.ready, isHost]);

    const resetPairingState = () => {
        setPairState("idle");
        setRoomId(null);
        setPeerName(null);
        setIsHost(false);
        setRoomToken(null);
        setConnectedMode(null);
        
        if (connectingToastId.current) {
            toast.dismiss(connectingToastId.current);
            toast.dismiss("connecting-toast");
            connectingToastId.current = null;
        }
        
        localStorage.removeItem("fluxsend_peer_name");
        localStorage.removeItem("fluxsend_is_host");
        localStorage.removeItem("fluxsend_connected");
    };

    const createRoom = () => {
        if (!socket.ready) {
            toast.error("Not connected to server");
            return;
        }
        
        socket.send({
            type: "create-room",
            deviceName: getDeviceName(),
        });
    };
    
    const refreshRoom = () => {
        resetPairingState();
        createRoom();
    };
    
    const cancelWaiting = () => {
        resetPairingState();
    };
    
    const retryConnection = () => {
        if (connectingToastId.current) {
            toast.dismiss(connectingToastId.current);
            toast.dismiss("connecting-toast");
            connectingToastId.current = null;
        }
        
        if (isHost) {
            resetPairingState();
            createRoom();
        } else {
            setIsModalOpen(true);
        }
    };

    useEffect(() => {
        if (!socket.ready && pairState === "connected") {
            const timeout = setTimeout(() => {
                setPairState("disconnected");
            }, 20000);

            return () => clearTimeout(timeout);
        }
    }, [socket.ready, pairState]);

    useEffect(() => {
        if (connectedMode === "send") {
            console.log("📤 Navigating to /share");
            router.push("/share");
        }
        else if (connectedMode === "receive") {
            console.log("📥 Navigating to /receiver");
            router.push("/receiver");
        }
    }, [connectedMode, router]);

    return (
        <main className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
            <Container>
                <div className="flex flex-col gap-14">
                    <Branding />

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

                    <motion.div
                        layout
                        className="bg-white rounded-3xl p-8 shadow-sm space-y-6"
                    >
                        <AnimatePresence mode="wait">
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
                                        disabled={!socket.ready}
                                        className="w-full h-12 rounded-xl cursor-pointer disabled:opacity-50"
                                    >
                                        {socket.ready ? "Create pairing code" : "Connecting to server..."}
                                    </Button>

                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        disabled={!socket.ready}
                                        className="w-full h-12 rounded-xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition cursor-pointer disabled:opacity-50"
                                    >
                                        Connect to a device
                                    </button>
                                </motion.div>
                            )}
 
                            {pairState === "waiting" && roomId && roomToken && (
                                <motion.div
                                    key="waiting"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.35 }}
                                    className="space-y-6"
                                >
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(roomId);
                                            toast.success("Room ID copied!", { duration: 2000 });
                                        }}
                                        className="w-full h-12 rounded-xl text-sm font-medium bg-gradient-to-br from-[#4F8CFF] via-[#3A6FE0] to-[#1F3C88] transition cursor-pointer text-white"
                                    >
                                        Copy room ID
                                    </button>

                                    <div className="space-y-1 text-center">
                                        <p className="text-sm text-neutral-500">
                                            Share this room ID
                                        </p>
                                        <div className="text-2xl font-mono tracking-widest text-[#0B0F1A]">
                                            {roomId}
                                        </div>
                                        <p className="text-xs text-neutral-400 mt-2">
                                            Others can join by entering this code
                                        </p>
                                    </div>

                                    <div className="relative flex justify-center items-center">
                                        <motion.div
                                            className="absolute rounded-full bg-blue-400/20 blur-2xl"
                                            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
                                            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                                            style={{ width: 220, height: 220 }}
                                        />

                                        <div className="relative z-10 bg-white p-3 rounded-2xl shadow-md">
                                            <QRCodeDisplay roomId={roomId} token={roomToken} size={200} />
                                        </div>
                                    </div>

                                    <p className="text-xs text-neutral-400 text-center">
                                        Scan the QR code for instant secure pairing
                                    </p>

                                    <div className="flex justify-center gap-4 mt-2">
                                        <Button
                                            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-blue-500 hover:bg-blue-700 text-white cursor-pointer transition-colors"
                                            onClick={refreshRoom}
                                        >
                                           <RefreshCcw size={16} /> Refresh 
                                        </Button>
                                        <Button
                                            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-red-500 text-white hover:bg-red-700 cursor-pointer transition-colors"
                                            onClick={cancelWaiting}
                                        >
                                           <X size={16} /> Close 
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {(pairState === "connecting" || pairState === "disconnected") && (
                                <ConnectingIndicator 
                                    peer={peerName || undefined}
                                    handshakeDuration={3000}
                                    disconnected={pairState === "disconnected"}
                                    onRetry={retryConnection}
                                />
                            )}

                            {pairState === "connected" && peerName && !connectedMode && (
                                <ConnectedActionChooser
                                    peer={peerName}
                                    onSend={() => {
                                        console.log("🚀 User chose to send");
                                        setConnectedMode("send");
                                    }}
                                    onReceive={() => {
                                        console.log("🚀 User chose to receive");
                                        setConnectedMode("receive");
                                    }}
                                />
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </Container>

            <PairDeviceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onJoinRoom={(code) => {
                    if (!socket.ready) {
                        toast.error("Not connected to server");
                        return;
                    }

                    // Show connecting toast
                    if (!connectingToastId.current) {
                        connectingToastId.current = toast.loading("Connecting...", {
                            id: "connecting-toast"
                        });
                    }

                    socket.send({
                        type: "join-room",
                        roomId: code.roomId,
                        ...(code.token && { token: code.token }),
                        deviceName: getDeviceName(),
                    });

                    setPairState("connecting");
                    setIsModalOpen(false);
                }}
            />

            <Toaster position="top-center" toastOptions={{
                duration: 3000,
                style: {
                    background: '#fff',
                    color: '#0B0F1A',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
            }} />

            <PWARegister />
        </main>
    );
}