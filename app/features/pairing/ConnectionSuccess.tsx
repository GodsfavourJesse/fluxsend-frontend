"use client";

import { motion } from "framer-motion";

export function ConnectionSuccess({ peer }: { peer: string }) {
    return (
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
                Connected to <span className="font-medium">{peer}</span>
            </p>
        </motion.div>
    );
}
