"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QrCode, Link2 } from "lucide-react";

export default function PairPage() {
  const [pairCode, setPairCode] = useState("");

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8"
      >
        {/* Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[#0B0F1A] tracking-tight">
            Fluxsend
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Pair devices. Send instantly.
          </p>
        </div>

        {/* QR Section */}
        <div className="border border-dashed border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="h-40 w-40 bg-[#F5F7FB] rounded-xl flex items-center justify-center">
              <QrCode className="h-20 w-20 text-[#4F8CFF]" />
            </div>
          </div>
          <p className="text-center text-sm text-gray-600">
            Scan this QR code on the other device to pair
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Code Pairing */}
        <div className="space-y-4">
          <label className="text-sm text-[#0B0F1A] font-medium">
            Enter pairing code
          </label>
          <div className="flex items-center gap-3">
            <input
              value={pairCode}
              onChange={(e) => setPairCode(e.target.value)}
              placeholder="e.g. FX-92KD"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4F8CFF]/30 text-sm"
            />
            <button className="px-4 py-3 rounded-xl bg-[#4F8CFF] text-white text-sm font-medium hover:opacity-90 transition">
              <Link2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Secure peer-to-peer pairing · No accounts required
        </p>
      </motion.div>
    </div>
  );
}
