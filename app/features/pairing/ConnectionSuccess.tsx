import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export function ConnectionSuccess({ peer }: { peer: string }) {
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260 }}
      className="flex flex-col items-center gap-3"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15 }}
      >
        <CheckCircle className="h-14 w-14 text-green-500" />
      </motion.div>

      <h3 className="text-lg font-medium">
        Connected to {peer}
      </h3>

      <p className="text-sm text-gray-500">
        You can now send files securely
      </p>
    </motion.div>
  );
}
