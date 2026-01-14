"use client";

import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { useEffect } from "react";

type ConnectingIndicatorProps = {
    peer?: string;
    handshakeDuration?: number;
    onRetry?: () => void;
    disconnected?: boolean;
};

export function ConnectingIndicator({
    peer,
    handshakeDuration = 15000,
    onRetry,
    disconnected = false,
}: ConnectingIndicatorProps) {
    const progress = useMotionValue(0);

    useEffect(() => {
        if (disconnected) return;

        progress.set(0);
        const interval = 16;
        const step = (interval / handshakeDuration) * 100;

        const timer = setInterval(() => {
            const next = progress.get() + step;
            progress.set(Math.min(next, 100));
        }, interval);

        return () => clearInterval(timer);
    }, [handshakeDuration, disconnected, progress]);

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
                            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                        >
                            Retry
                        </button>
                    </>
                ) : (
                    <>
                        <div className="relative h-14 w-14 rounded-full border-2 border-blue-200">
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-blue-500/50"
                                style={{
                                    strokeDasharray: 100,
                                    strokeDashoffset: 100 - progress.get(),
                                }}
                            />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium">Connecting…</p>
                            <p className="text-xs text-neutral-500">
                                {peer
                                    ? `Establishing connection to ${peer}`
                                    : "Establishing secure connection"}
                            </p>
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
