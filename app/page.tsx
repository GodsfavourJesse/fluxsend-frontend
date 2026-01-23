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

type PairState = "idle" | "waiting" | "connecting" | "action-chooser" | "redirecting";

export default function Home() {
    const router = useRouter();
    const [pairState, setPairState] = useState<PairState>("idle");
    const [roomId, setRoomId] = useState<string | null>(null);
    const [peerName, setPeerName] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [roomToken, setRoomToken] = useState<string | null>(null);
    const [connectingProgress, setConnectingProgress] = useState(0);
    
    const connectingToastId = useRef<string | null>(null);
    const connectingTimer = useRef<NodeJS.Timeout | null>(null);
    const hasRedirected = useRef(false);
    
    const socket = useGlobalSocket();
    
    // Check if already connected on mount
    useEffect(() => {
        const isConnected = localStorage.getItem("fluxsend_connected") === "true";
        const storedPeerName = localStorage.getItem("fluxsend_peer_name");
        
        if (isConnected && storedPeerName && !hasRedirected.current) {
            // Already connected, show action chooser immediately
            setPeerName(storedPeerName);
            setIsHost(localStorage.getItem("fluxsend_is_host") === "true");
            setPairState("action-chooser");
        }
    }, []);
    
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
                    setConnectingProgress(0);
                    
                    if (!connectingToastId.current) {
                        connectingToastId.current = toast.loading(`Connecting to ${msg.peerName}...`, {
                            id: "connecting-toast"
                        });
                    }

                    if (connectingTimer.current) {
                        clearInterval(connectingTimer.current);
                    }
                    
                    // Faster animation: 100% in 2 seconds
                    let currentProgress = 0;
                    connectingTimer.current = setInterval(() => {
                        currentProgress += 5; // 5% every 100ms = 2 seconds total
                        if (currentProgress >= 100) {
                            currentProgress = 100;
                            if (connectingTimer.current) {
                                clearInterval(connectingTimer.current);
                            }
                        }
                        setConnectingProgress(currentProgress);
                    }, 100);
                    break;
                            
                case "connection-established":
                    console.log("Connection established with:", msg.peerName);
                    
                    // Clear timer and set to 100%
                    if (connectingTimer.current) {
                        clearInterval(connectingTimer.current);
                        connectingTimer.current = null;
                    }
                    setConnectingProgress(100);
                    
                    setPeerName(msg.peerName);
                    setRoomToken(null);
                    
                    // Dismiss toast
                    if (connectingToastId.current) {
                        toast.dismiss(connectingToastId.current);
                        toast.dismiss("connecting-toast");
                        connectingToastId.current = null;
                    }
                    
                    // Store connection state
                    localStorage.setItem("fluxsend_peer_name", msg.peerName);
                    localStorage.setItem("fluxsend_is_host", isHost.toString());
                    localStorage.setItem("fluxsend_connected", "true");
                    
                    // Show success toast
                    toast.success(`Connected to ${msg.peerName}! 🎉`, { duration: 2000 });
                    
                    // Wait 300ms for smooth transition, then show action chooser
                    setTimeout(() => {
                        setPairState("action-chooser");
                    }, 300);
                    break;
                    
                case "peer-disconnected":
                case "graceful-disconnect":
                    if (connectingTimer.current) {
                        clearInterval(connectingTimer.current);
                        connectingTimer.current = null;
                    }
                    if (connectingToastId.current) {
                        toast.dismiss(connectingToastId.current);
                        toast.dismiss("connecting-toast");
                        connectingToastId.current = null;
                    }
                    
                    const disconnectMsg = msg.type === "graceful-disconnect" 
                        ? msg.message || "Peer disconnected"
                        : "Peer disconnected";
                    
                    toast.error(disconnectMsg);
                    resetPairingState();
                    break;
                        
                case "error":
                    if (connectingTimer.current) {
                        clearInterval(connectingTimer.current);
                        connectingTimer.current = null;
                    }
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
        setConnectingProgress(0);
        hasRedirected.current = false;
        
        if (connectingTimer.current) {
            clearInterval(connectingTimer.current);
            connectingTimer.current = null;
        }
        
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
        if (connectingTimer.current) {
            clearInterval(connectingTimer.current);
            connectingTimer.current = null;
        }
        if (connectingToastId.current) {
            toast.dismiss(connectingToastId.current);
            toast.dismiss("connecting-toast");
            connectingToastId.current = null;
        }
        
        resetPairingState();
        if (isHost) {
            createRoom();
        } else {
            setIsModalOpen(true);
        }
    };

    const handleModeSelection = (mode: "send" | "receive") => {
        if (hasRedirected.current) return;
        
        hasRedirected.current = true;
        setPairState("redirecting");
        
        const path = mode === "send" ? "/share" : "/receiver";
        console.log(`Redirecting to ${path}`);
        
        // Immediate redirect
        router.push(path);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (connectingTimer.current) {
                clearInterval(connectingTimer.current);
            }
        };
    }, []);

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

                            {pairState === "connecting" && (
                                <ConnectingIndicator 
                                    peer={peerName || undefined}
                                    progress={connectingProgress}
                                    disconnected={false}
                                    onRetry={retryConnection}
                                />
                            )}

                            {pairState === "action-chooser" && peerName && (
                                <ConnectedActionChooser
                                    peer={peerName}
                                    onSend={() => handleModeSelection("send")}
                                    onReceive={() => handleModeSelection("receive")}
                                />
                            )}
                            
                            {pairState === "redirecting" && (
                                <motion.div
                                    key="redirecting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center gap-4 py-8"
                                >
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-neutral-600">Redirecting...</p>
                                </motion.div>
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
                    setConnectingProgress(0);
                    setIsModalOpen(false);

                    if (connectingTimer.current) {
                        clearInterval(connectingTimer.current);
                    }
                    
                    let currentProgress = 0;
                    connectingTimer.current = setInterval(() => {
                        currentProgress += 5;
                        if (currentProgress >= 100) {
                            currentProgress = 100;
                            if (connectingTimer.current) {
                                clearInterval(connectingTimer.current);
                            }
                        }
                        setConnectingProgress(currentProgress);
                    }, 100);
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