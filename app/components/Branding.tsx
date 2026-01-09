"use client";

import { motion } from "framer-motion";

export function Branding() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex justify-center"
    >
      <div className="flex items-center gap-4 relative">
        {/* Logo Mark */}
        <motion.div
          className="
            relative
            h-14 w-14
            rounded-2xl
            bg-gradient-to-br
            from-[#4F8CFF]
            via-[#3A6FE0]
            to-[#1F3C88]
            flex items-center justify-center
            shadow-lg
          "
          animate={{
            boxShadow: [
              "0 0 0 rgba(79,140,255,0)",
              "0 0 24px rgba(79,140,255,0.35)",
              "0 0 0 rgba(79,140,255,0)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Signal animation */}
          <motion.div
            className="absolute inset-0 rounded-2xl border border-white/30"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          <span className="text-white text-xl font-semibold tracking-tight">
            F
          </span>
        </motion.div>

        {/* Brand Name */}
        <div className="flex flex-col leading-none">
          <motion.h1
            className="
              text-4xl
              font-semibold
              tracking-tight
              bg-gradient-to-r
              from-[#0B0F1A]
              via-[#1F3C88]
              to-[#4F8CFF]
              bg-clip-text
              text-transparent
            "
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Fluxsend
          </motion.h1>

          <motion.span
            className="text-xs tracking-widest text-neutral-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            INSTANT · SECURE · PEER-TO-PEER
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
