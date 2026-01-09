"use client";

import { FC, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/app/components/Button";
import { QrCode, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Dynamic import for QR scanner
const QrReader = dynamic(
  () => import("react-qr-reader").then((mod) => mod.QrReader),
  { ssr: false }
);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onJoinRoom: (code: string) => void;
};

export const PairDeviceModal: FC<Props> = ({ isOpen, onClose, onJoinRoom }) => {
  const [manualCode, setManualCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const handleJoin = () => {
    if (manualCode.trim()) {
      onJoinRoom(manualCode.trim().toUpperCase());
      setManualCode("");
    }
  };

  const handleScan = (data: string | null) => {
    if (data) {
      const match = data.match(/fluxsend:\/\/join\/([A-Z0-9]+)/i);
      if (match) {
        onJoinRoom(match[1].toUpperCase());
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Modal container */}
          <motion.div
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative flex flex-col gap-6"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.35, type: "spring", stiffness: 300 }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition text-lg"
            >
              ✕
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-[#0B0F1A]">
              Connect to a device
            </h2>

            {/* Toggle buttons */}
            <div className="flex justify-center gap-3 flex-wrap">
              <motion.button
                onClick={() => setShowScanner(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-5 py-2 rounded-2xl border transition
                            ${showScanner ? "bg-blue-50 border-blue-300 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <QrCode className="w-5 h-5 text-blue-500" />
                Scan QR
              </motion.button>

              <motion.button
                onClick={() => setShowScanner(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-5 py-2 rounded-2xl border transition
                            ${!showScanner ? "bg-blue-50 border-blue-300 shadow-sm" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <Pencil className="w-5 h-5 text-blue-500" />
                Manual Code
              </motion.button>
            </div>

            {/* Animated content */}
            <div className="relative flex justify-center">
              <AnimatePresence mode="wait">
                {showScanner ? (
                  <motion.div
                    key="scanner"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-lg w-full max-w-xs"
                    style={{ height: "300px" }}
                  >
                    {/* Glow background */}
                    <motion.div
                      className="absolute inset-0 bg-blue-50 rounded-3xl opacity-20"
                      animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />

                    <QrReader
                      onResult={(result) => {
                        if (result?.text) handleScan(result.text);
                      }}
                      constraints={{ facingMode: "environment" }}
                      className="w-full h-full rounded-3xl relative z-10"
                    />

                    {/* Animated scanning line */}
                    <motion.div
                      className="absolute left-0 top-0 w-full h-1 bg-blue-400 opacity-60 rounded-full"
                      animate={{ y: ["0%", "100%"] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="manual"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-3 w-full max-w-xs mx-auto"
                  >
                    <p className="text-sm text-gray-600 text-center">
                      Enter pairing code manually:
                    </p>
                    <input
                      type="text"
                      placeholder="XXXX-XXXX"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      className="w-full rounded-3xl border border-gray-200 px-4 py-2 text-center font-mono tracking-widest text-lg
                                 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 shadow-sm transition"
                    />
                    <Button onClick={handleJoin} className="w-full mt-2">
                      Join Room
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
