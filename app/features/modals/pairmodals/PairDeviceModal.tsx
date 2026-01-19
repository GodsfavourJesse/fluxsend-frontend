"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Keyboard, X } from "lucide-react";
import { QRScanner } from "../../pairing/QRScanner";
import { parsePairingCode } from "@/app/utils/parsePairingCode";
import { Button } from "@/app/components/Button";
import ScannerFrame from "../../pairing/ScannerFrame";
import toast from "react-hot-toast";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onJoinRoom: (data: {roomId: string; token?: string}) => void;
};

export function PairDeviceModal({ isOpen, onClose, onJoinRoom }: Props) {
    const [mode, setMode] = useState<"scan" | "manual">("scan");
    const [manualCode, setManualCode] = useState("");
    const [locked, setLocked] = useState(false);

    const handleScan = (raw: string) => {
        if (locked) return;

        const code = parsePairingCode(raw);
        if (!code) {
            toast.error("Invalid QR code");
            return;
        }

        // QR codes MUST have a token
        if (!code.token) {
            toast.error("QR code is missing security token");
            return;
        }

        setLocked(true);
        toast.loading("Connecting...");
        onJoinRoom(code);
    };

    const handleManualConnect = () => {
        const parsed = parsePairingCode(manualCode);
        if (!parsed) {
            toast.error("Invalid room ID");
            return;
        }

        // Manual entry uses ONLY room ID (no token required)
        toast.loading("Connecting...");
        onJoinRoom({ roomId: parsed.roomId });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center sm:items-center justify-center px-4 bg-black/50 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="
                        relative w-full max-w-md
                        rounded-3xl
                        bg-white/90 backdrop-blur-xl
                        shadow-[0_20px_60px_rgba(0,0,0,0.25)]
                        p-6 sm:p-8
                        "
                        initial={{ y: 80, opacity: 0, scale: 0.96 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 80, opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <button
                            onClick={onClose}
                            className="
                                absolute top-4 right-4
                                p-2 rounded-full
                                text-zinc-500
                                hover:text-zinc-800
                                hover:bg-zinc-100/60
                                transition cursor-pointer
                            "
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6 text-center">
                            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900">
                                Connect a device
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500">
                                {mode === "scan" 
                                    ? "Scan QR code for secure instant pairing"
                                    : "Enter the room ID to join"
                                }
                            </p>
                        </div>

                        <div className="flex gap-3 mb-6">
                            <Toggle
                                active={mode === "scan"}
                                onClick={() => setMode("scan")}
                                icon={<QrCode className="w-4 h-4" />}
                            >
                                Scan QR
                            </Toggle>

                            <Toggle
                                active={mode === "manual"}
                                onClick={() => setMode("manual")}
                                icon={<Keyboard className="w-4 h-4" />}
                            >
                                Enter code
                            </Toggle>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mode}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                            >
                                {mode === "scan" ? (
                                    <div className="space-y-3">
                                        <ScannerFrame>    
                                            <QRScanner onScan={handleScan} />
                                        </ScannerFrame>
                                        <p className="text-xs text-center text-zinc-400">
                                            QR codes include security token for instant secure connection
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <input
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                            placeholder="Enter Room ID"
                                            className="
                                                w-full rounded-xl px-4 py-3
                                                text-center font-mono text-lg tracking-widest
                                                border border-zinc-300
                                                text-zinc-800 placeholder:text-zinc-400
                                                focus:outline-none
                                                focus:ring-2 focus:ring-blue-600/40
                                                focus:border-blue-600
                                                transition
                                            "
                                        />

                                        <p className="text-xs text-center text-zinc-500">
                                            Enter the room ID shown on the other device
                                        </p>

                                        <Button
                                            className="
                                                w-full h-12 rounded-xl
                                                bg-blue-600 hover:bg-blue-700
                                                text-white font-medium
                                                shadow-md hover:shadow-lg
                                                transition-all cursor-pointer
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                            "
                                            onClick={handleManualConnect}
                                            disabled={!manualCode.trim()}
                                        >
                                            Join room
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Toggle({ active, onClick, icon, children }: any) {
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.98 }}
            className={`
                flex-1 flex items-center justify-center gap-2
                rounded-xl py-2.5 sm:py-3 text-sm sm:text-base
                transition-all cursor-pointer
                ${
                active
                    ? "bg-blue-600/10 text-blue-700 shadow-sm ring-1 ring-blue-600/20"
                    : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }
            `}
        >
            {icon}
            {children}
        </motion.button>
    );
}