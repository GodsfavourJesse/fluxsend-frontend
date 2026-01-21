"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Send, Download, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from 'react-confetti';

export default function ConnectedActionChooser({
    peer,
    onSend,
    onReceive,
}: {
    peer: string;
    onSend: () => void;
    onReceive: () => void;
}) {
    const [showConfetti, setShowConfetti] = useState(true);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight
        });

        const timer = setTimeout(() => setShowConfetti(false), 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600/95 via-purple-600/95 to-pink-600/95 backdrop-blur-xl p-4"
            >
                {/* Confetti Effect */}
                {showConfetti && (
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={500}
                        gravity={0.3}
                    />
                )}

                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.3, 1],
                            rotate: [0, -90, 0],
                        }}
                        transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-white/10 to-transparent rounded-full blur-3xl"
                    />
                </div>

                {/* Main Content */}
                <motion.div
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 200, 
                        damping: 20,
                        delay: 0.2
                    }}
                    className="relative z-10 w-full max-w-2xl"
                >
                    {/* Success Icon */}
                    <div className="flex justify-center mb-8">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 200, 
                                damping: 15,
                                delay: 0.3
                            }}
                            className="relative"
                        >
                            {/* Glow Effect */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute inset-0 bg-white rounded-full blur-2xl"
                            />
                            
                            <div className="relative w-32 h-32 rounded-full bg-white shadow-2xl flex items-center justify-center">
                                <CheckCircle className="w-20 h-20 text-green-500" strokeWidth={2.5} />
                            </div>

                            {/* Sparkles */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0"
                            >
                                <Sparkles className="absolute -top-2 left-1/2 w-6 h-6 text-yellow-300" />
                                <Sparkles className="absolute top-1/2 -right-2 w-5 h-5 text-yellow-300" />
                                <Sparkles className="absolute -bottom-2 left-1/4 w-4 h-4 text-yellow-300" />
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-center mb-4"
                    >
                        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                            Connected! 🎉
                        </h1>
                        <p className="text-xl sm:text-2xl text-white/90 font-medium">
                            You're now paired with
                        </p>
                        <p className="text-3xl sm:text-4xl font-bold text-white mt-2 drop-shadow-lg">
                            {peer}
                        </p>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-center text-white/80 text-lg mb-12 max-w-md mx-auto"
                    >
                        Choose what you want to do. Transfer is instant, secure, and encrypted.
                    </motion.p>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto"
                    >
                        {/* Send Button */}
                        <motion.button
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onSend}
                            className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-2xl hover:shadow-white/20 transition-all duration-300"
                        >
                            {/* Gradient Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative z-10">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Send className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Send Files
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Share photos, videos, documents & more
                                </p>
                            </div>

                            {/* Shine Effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "100%" }}
                                transition={{ duration: 0.6 }}
                            />
                        </motion.button>

                        {/* Receive Button */}
                        <motion.button
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onReceive}
                            className="group relative overflow-hidden bg-white rounded-3xl p-8 shadow-2xl hover:shadow-white/20 transition-all duration-300"
                        >
                            {/* Gradient Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative z-10">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                    <Download className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Receive Files
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Get files sent from {peer}
                                </p>
                            </div>

                            {/* Shine Effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "100%" }}
                                transition={{ duration: 0.6 }}
                            />
                        </motion.button>
                    </motion.div>

                    {/* Features */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="mt-12 flex items-center justify-center gap-8 text-white/80"
                    >
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            <span className="text-sm">Lightning Fast</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm">Encrypted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-sm">No Limits</span>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}