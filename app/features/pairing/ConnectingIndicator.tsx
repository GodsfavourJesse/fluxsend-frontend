"use client";

import { motion, AnimatePresence } from "framer-motion";

type ConnectingIndicatorProps = {
    peer?: string;
    progress: number;
    onRetry?: () => void;
    disconnected?: boolean;
};

export function ConnectingIndicator({
    peer,
    progress,
    onRetry,
    disconnected = false,
}: ConnectingIndicatorProps) {
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
                        {/* Spinner with Progress */}
                        <div className="relative h-20 w-20">
                            {/* Background circle */}
                            <svg className="absolute inset-0" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#E5E7EB"
                                    strokeWidth="8"
                                />
                            </svg>
                            
                            {/* Progress circle */}
                            <svg 
                                className="absolute inset-0 -rotate-90" 
                                viewBox="0 0 100 100"
                            >
                                <motion.circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: progress / 100 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    style={{
                                        pathLength: progress / 100,
                                        strokeDasharray: "0 1"
                                    }}
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#8B5CF6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            
                            {/* Progress text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold text-blue-600">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                        </div>
                        
                        <div className="text-center space-y-1">
                            <p className="text-sm font-medium">
                                {peer ? `Connecting to ${peer}` : "Connecting"}
                            </p>
                            <p className="text-xs text-neutral-500">
                                {progress < 30 && "Initiating connection..."}
                                {progress >= 30 && progress < 60 && "Establishing secure channel..."}
                                {progress >= 60 && progress < 90 && "Verifying encryption..."}
                                {progress >= 90 && "Almost there..."}
                            </p>
                        </div>
                    </>
                )}
            </motion.div>
        </AnimatePresence>
    );
}