"use client";

import { motion } from "framer-motion";

export function ConnectingIndicator({ peer }: { peer?: string }) {
    return (
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
                    {peer ? `Connecting to ${peer}` : "Establishing secure connection"}
                </p>
            </div>
        </motion.div>
    );
}
