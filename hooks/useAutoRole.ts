import { WSMessage } from "@/types/socket";
import { useState } from "react";

export type Role = "idle" | "sender" | "receiver";

export function useAutoRole() {
    const [role, setRole] = useState<Role>("idle");

    const handleMessage = (msg: WSMessage) => {
        switch (msg.type) {
            case "file-offer":
                setRole("receiver");
                break;
            case "file-offer-accepted":
                setRole("sender");
                break;
            case "disconnect":
                setRole("idle");
                break;
        }
    };

    return {
        role,
        handleMessage,
        setRole,
    };
}