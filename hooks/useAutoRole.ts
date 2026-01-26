import { useGlobalSocket } from "@/app/providers/SocketProvider";
import { WSMessage } from "@/types/socket";
import { useEffect, useState } from "react";

export type Role = "idle" | "sender" | "receiver";

export function useAutoRole() {
    const [role, setRole] = useState<Role>("idle");

    const socket = useGlobalSocket();

    useEffect(() => {
        return socket.on((msg) => {
            if (msg.type === "file-offer") setRole("receiver");
            if (msg.type === "file-offer-accepted") setRole("sender");
        });
    }, []);


    return {
        role,
        setRole,
    };
}