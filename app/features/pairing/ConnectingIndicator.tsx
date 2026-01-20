"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type ConnectingIndicatorProps = {
    peer?: string;
    handshakeDuration?: number;
    onRetry?: () => void;
    disconnected?: boolean;
};

export function ConnectingIndicator({
    peer,
    handshakeDuration = 3000, // ✅ Fast default: 3s
    onRetry,
    disconnected = false,
}: ConnectingIndicatorProps) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (disconnected) return;

        setProgress(0);
        const interval = 50; // Update every 50ms for smooth animation
        const step = (interval / handshakeDuration) * 100;

        const timer = setInterval(() => {
            setProgress((prev) => Math.min(prev + step, 100));
        }, interval);

        return () => clearInterval(timer);
    }, [handshakeDuration, disconnected]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={disconnected ? "disconnected" : "connecting"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-5 py-6"
            >
                {disconnected ? (
                    <>
                        <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-600 text-xl">✕</span>
                        </div>
                        <p className="text-red-600 font-medium">Connection lost</p>
                        <button
                            onClick={onRetry}
                            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                        >
                            Retry
                        </button>
                    </>
                ) : (
                    <>
                        {/* Spinner */}
                        <div className="relative h-14 w-14">
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-blue-100"
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent"
                                animate={{ rotate: 360 }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />
                            
                            {/* Progress indicator */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-600">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                        </div>
                        
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium">
                                {peer ? `Connecting to ${peer}` : "Connecting"}
                            </p>
                            <p className="text-xs text-neutral-500">
                                Establishing secure connection...
                            </p>
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}