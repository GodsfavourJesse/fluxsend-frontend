import { motion } from "framer-motion";

export function ConnectingIndicator({ peer }: { peer?: string }) {
    return (
        <div className="flex flex-col items-center gap-4">
            <motion.div
                className="h-14 w-14 rounded-full border-4 border-blue-200 border-t-blue-500"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />

            <p className="text-sm text-gray-600">
                Connecting{peer ? ` to ${peer}` : "..."}
            </p>
        </div>
    );
}
