"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type ConnectionSuccessProps = {
    peer: string;
    onRetry?: () => void;
    disconnected?: boolean;
    duration?: number;
};

export function ConnectionSuccess({
    peer,
    onRetry,
    disconnected = false,
    duration = 0.4,
}: ConnectionSuccessProps) {

    const router = useRouter();

    return (
        <motion.div
            key={disconnected ? "disconnected" : "connected"}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration, ease: "easeOut" }}
            className="text-center space-y-3 py-4"
        >
            {disconnected ? (
                <>
                    <div className="mx-auto h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 text-xl">✕</span>
                    </div>
                    <p className="text-red-600 font-medium">Connection lost</p>
                    <button
                        onClick={onRetry}
                        className="mt-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                    >
                        Retry
                    </button>
                </>
            ) : (
                <>
                    <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 text-xl">✓</span>
                    </div>
                    <p className="text-green-600 font-medium">Connected successfully</p>
                    <p className="text-sm text-neutral-600">
                        Connected to <span className="font-medium">{peer}</span>
                    </p>

                    {/* New Button for sharing */}
                    <button
                        onClick={() => router.push("/share")}
                        className="mt-3 px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
                    >
                        Start Sharing
                    </button>
                </>
            )}
        </motion.div>
    );
}
