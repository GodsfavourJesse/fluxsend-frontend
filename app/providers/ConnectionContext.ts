import { createContext, useContext } from "react";

export type Role = "idle" | "sender" | "receiver";

type ConnectionContextType = {
    role: Role;
    socketReady: boolean;
    offer: any | null;
    setRole: (r: Role) => void;
    clearOffer: () => void;
};

export const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function useConnection() {
    const ctx = useContext(ConnectionContext);
    if (!ctx) throw new Error("useConnection must be used inside ConnectionProvider");
    return ctx;
}
