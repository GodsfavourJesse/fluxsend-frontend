"use client";

import { useState, useEffect } from "react";
import { createContext, useContext } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAutoRole } from "@/hooks/useAutoRole";
import { useFileOffer } from "@/hooks/useFileOffer";

export type Role = "idle" | "sender" | "receiver";

type ConnectionContextType = {
    role: Role;
    socketReady: boolean;
    offer: any | null;
    setRole: (r: Role) => void;
    clearOffer: () => void;
    socket: ReturnType<typeof useSocket>;
};

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function useConnection() {
    const ctx = useContext(ConnectionContext);
    if (!ctx) throw new Error("useConnection must be used inside ConnectionProvider");
    return ctx;
}

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
    const socket = useSocket();
    const { role, handleMessage: routeRole, setRole } = useAutoRole();
    const { offer, handleOffer, clearOffer } = useFileOffer();
    const [socketReady, setSocketReady] = useState(false);

    // auto-detect role & file offers
    useEffect(() => {
        if (!socket.ready) return;
        setSocketReady(true);

        socket.setOnMessage((msg) => {
            routeRole(msg);

            if (msg.type === "file-offer") handleOffer(msg);
            if (msg.type === "file-offer-rejected") clearOffer();
            if (msg.type === "disconnect") {
                clearOffer();
                setRole("idle");
            }
        });

        return () => socket.setOnMessage(() => {});
    }, [socket.ready]);

    return (
        <ConnectionContext.Provider
            value={{ role, socketReady, offer, setRole, clearOffer, socket }}
        >
            {children}
        </ConnectionContext.Provider>
    );
}
