"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type ConnectingIndicatorProps = {
    peer?: string;
    handshakeDuration?: number; // in ms, default 1300
    onComplete?: () => void;
};

export function ConnectingIndicator({
    peer,
    handshakeDuration = 1300,
    onComplete,
}: ConnectingIndicatorProps) {
    const [progress, setProgress] = useState(0);

    // Animate progress from 0 → 100% over handshakeDuration
    useEffect(() => {
        setProgress(0);
        const interval = 10; // update every 10ms
        const step = (interval / handshakeDuration) * 100;
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev + step >= 100) {
                    clearInterval(timer);
                    if (onComplete) onComplete(); // signal completion
                    return 100;
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [handshakeDuration, onComplete]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="connecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-5 py-6"
            >
                {/* Spinner */}
                <motion.div
                    className="relative h-14 w-14 rounded-full border-2 border-blue-200"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                >
                    <div className="absolute inset-1 rounded-full bg-blue-500/10" />
                    {/* Progress ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full border-4 border-blue-500/50"
                        style={{ strokeDasharray: 100, strokeDashoffset: 100 - progress }}
                    />
                </motion.div>

                <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-[#0B0F1A]">
                        Connecting…
                    </p>
                    <p className="text-xs text-neutral-500">
                        {peer
                            ? `Establishing connection to ${peer}`
                            : "Establishing secure connection"}
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
