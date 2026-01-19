"use client";

import { Button } from "@/app/components/Button";
import { motion } from "framer-motion";

export default function ConnectedActionChooser({
    peer,
    onSend,
    onReceive,
}: {
    peer: string;
    onSend: () => void;
    onReceive: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-center"
        >
            <h2 className="text-xl font-semibold">
                Connected to {peer}
            </h2>

            <p className="text-sm text-neutral-500">
                What would you like to do?
            </p>

            <div className="grid grid-cols-2 gap-4">
                <Button
                    onClick={onSend}
                    className="h-14 rounded-2xl bg-blue-600 text-white"
                >
                    Send files
                </Button>

                <Button
                    onClick={onReceive}
                    className="h-14 rounded-2xl border border-neutral-300"
                >
                    Receive files
                </Button>
            </div>
        </motion.div>
    );
}
