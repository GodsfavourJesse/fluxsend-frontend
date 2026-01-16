"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Keyboard, X } from "lucide-react";
import { QRScanner } from "../pairing/QRScanner";
import { parsePairingCode } from "@/app/utils/parsePairingCode";
import { Button } from "@/app/components/Button";
import ScannerFrame from "../pairing/ScannerFrame";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onJoinRoom: (data: {roomId: string; token: string}) => void;
};

export function PairDeviceModal({ isOpen, onClose, onJoinRoom }: Props) {
    const [mode, setMode] = useState<"scan" | "manual">("scan");
    const [manualCode, setManualCode] = useState("");

    const handleScan = (raw: string) => {
        const code = parsePairingCode(raw);
        if (!code) return;
        onJoinRoom(code);
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
                        {/* Close */}
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

                        {/* Title */}
                        <div className="mb-6 text-center">
                            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-900">
                                Connect a device
                            </h2>
                            <p className="mt-1 text-sm text-zinc-500">
                                Securely pair another device to this session
                            </p>
                        </div>

                        {/* Mode Toggle */}
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
                                Manual code
                            </Toggle>
                        </div>

                        {/* Content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={mode}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                            >
                                {mode === "scan" ? (
                                    <ScannerFrame>    
                                        <QRScanner onScan={handleScan} />
                                    </ScannerFrame>
                                ) : (
                                    <div className="space-y-4">
                                        <input
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value)}
                                            placeholder="XXXX-XXXX"
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

                                        <Button
                                        className="
                                                w-full h-12 rounded-xl
                                                bg-blue-600 hover:bg-blue-700
                                                text-white font-medium
                                                shadow-md hover:shadow-lg
                                                transition-all cursor-pointer
                                            "
                                            onClick={() => {
                                                const parsed = parsePairingCode(manualCode);
                                                if (!parsed) return;
                                                onJoinRoom(parsed);
                                            }}
                                        >
                                            Connect device
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

/* Toggle Button */
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
