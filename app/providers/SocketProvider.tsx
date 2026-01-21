"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

type MessageHandler = (data: any) => void;

type SocketContextType = {
    socket: WebSocket | null;
    ready: boolean;
    send: (data: any) => void;
    sendBinary: (buf: ArrayBuffer) => void;
    on: (handler: MessageHandler) => () => void; // Returns cleanup function
    reconnect: () => void;
};

const SocketContext = createContext<SocketContextType | null>(null);

export function useGlobalSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error("useGlobalSocket must be used inside SocketProvider");
    return ctx;
}

export function SocketProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const handlersRef = useRef<Set<MessageHandler>>(new Set());
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const shouldReconnect = useRef(true);

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY_BASE = 2000;

    const connect = () => {
        // Don't recreate if already connected
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            console.log("Socket already connected");
            return;
        }

        // Clean up old connection
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        try {
            console.log("🔌 Creating WebSocket connection...");
            const ws = new WebSocket(WS_URL);
            ws.binaryType = "arraybuffer";
            socketRef.current = ws;

            ws.onopen = () => {
                setReady(true);
                reconnectAttempts.current = 0;
                console.log("WebSocket connected globally");
            };

            ws.onmessage = (e) => {
                let data: any;

                if (e.data instanceof ArrayBuffer) {
                    data = {
                        type: "file-chunk-raw",
                        buffer: e.data
                    };
                } else {
                    try {
                        data = JSON.parse(e.data);

                        // Auto-respond to ping
                        if (data.type === "ping") {
                            ws.send(JSON.stringify({ type: "pong" }));
                            return;
                        }
                    } catch (err) {
                        console.warn("Invalid WS message", err);
                        return;
                    }
                }

                // Broadcast to ALL registered handlers
                handlersRef.current.forEach((handler) => {
                    try {
                        handler(data);
                    } catch (err) {
                        console.error("Handler error:", err);
                    }
                });
            };

            ws.onclose = (event) => {
                setReady(false);
                console.log(`WebSocket closed. Code: ${event.code}`);

                // Auto-reconnect
                if (shouldReconnect.current && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts.current++;
                    const delay = RECONNECT_DELAY_BASE * reconnectAttempts.current;
                    
                    console.log(`Reconnecting in ${delay}ms... (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
                    
                    reconnectTimer.current = setTimeout(() => {
                        connect();
                    }, delay);
                } else if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
                    console.error("Max reconnection attempts reached");
                }
            };

            ws.onerror = (err) => {
                console.error("WebSocket error:", err);
            };
        } catch (error) {
            console.error("Failed to create WebSocket:", error);
            setReady(false);
        }
    };

    // Initialize once on mount
    useEffect(() => {
        shouldReconnect.current = true;
        connect();

        // Cleanup on unmount
        return () => {
            console.log("SocketProvider unmounting");
            shouldReconnect.current = false;
            
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
            }
            
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, []);

    // Context API
    const send = (data: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        } else {
            console.warn("Cannot send: WebSocket not ready");
        }
    };

    const sendBinary = (buf: ArrayBuffer) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(buf);
        } else {
            console.warn("Cannot send binary: WebSocket not ready");
        }
    };

    // Register message handler (returns cleanup function)
    const on = (handler: MessageHandler) => {
        handlersRef.current.add(handler);
        
        // Return cleanup function
        return () => {
            handlersRef.current.delete(handler);
        };
    };

    const reconnectFn = () => {
        reconnectAttempts.current = 0;
        connect();
    };

    return (
        <SocketContext.Provider
            value={{
                socket: socketRef.current,
                ready,
                send,
                sendBinary,
                on,
                reconnect: reconnectFn,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}