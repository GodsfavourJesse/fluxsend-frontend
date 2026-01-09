"use client";

import { motion } from "framer-motion";


export default function ScannerFrame({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black/5 border border-zinc-200">
            {/* Camera / QR scanner */}
            {children}

            {/* Glow pulse */}
            <motion.div
                className="absolute inset-0 rounded-2xl ring-2 ring-blue-500/20"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Scanning line */}
            <motion.div
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                initial={{ top: "10%" }}
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Corner accents */}
            <div className="absolute inset-3 rounded-xl border border-white/20 pointer-events-none" />

            {/* Status text */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur">
                Scanning…
            </div>
        </div>
    );
}
