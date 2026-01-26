"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";

type MessageHandler = (data: any) => void;

type SocketContextType = {
    ready: boolean;
    send: (data: any) => void;
    sendBinary: (buf: ArrayBuffer) => void;
    on: (handler: MessageHandler, type?: string) => () => void;
    reconnect: () => void;
};

type TypedHandler = {
    handler: MessageHandler;
    type?: string;
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
    const handlersRef = useRef<Set<TypedHandler>>(new Set());
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const shouldReconnect = useRef(true);
    const messageQueue = useRef<any[]>([]);
    const isConnecting = useRef(false);

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY_BASE = 2000;

    // OPTIMIZED: Flush queued messages when connection opens
    const flushMessageQueue = useCallback(() => {
        if (messageQueue.current.length > 0 && socketRef.current?.readyState === WebSocket.OPEN) {
            console.log(`Flushing ${messageQueue.current.length} queued messages`);
            messageQueue.current.forEach(msg => {
                try {
                    socketRef.current?.send(JSON.stringify(msg));
                } catch (error) {
                    console.error("Failed to send queued message:", error);
                }
            });
            messageQueue.current = [];
        }
    }, []);

    const connect = useCallback(() => {
        // Prevent multiple simultaneous connection attempts
        if (isConnecting.current) {
            console.log("Connection already in progress");
            return;
        }

        // Don't recreate if already connected
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            console.log("Socket already connected");
            return;
        }

        isConnecting.current = true;

        // Clean up old connection
        if (socketRef.current) {
            try {
                socketRef.current.close();
            } catch (e) {
                // Ignore close errors
            }
            socketRef.current = null;
        }

        try {
            console.log("🔌 Creating WebSocket connection...");
            const ws = new WebSocket(WS_URL);
            ws.binaryType = "arraybuffer";
            socketRef.current = ws;

            ws.onopen = () => {
                setReady(true);
                isConnecting.current = false;
                reconnectAttempts.current = 0;
                console.log("WebSocket connected");
                
                // Flush any queued messages
                flushMessageQueue();
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
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: "pong" }));
                            }
                            return;
                        }
                    } catch (err) {
                        console.warn("Invalid WS message", err);
                        return;
                    }
                }

                // OPTIMIZED: Broadcast to matching handlers only
                handlersRef.current.forEach(({ handler, type }) => {
                    if (!type || data?.type === type) {
                        try {
                            handler(data);
                        } catch (error) {
                            console.error("Handler error:", error);
                        }
                    }
                });
            };

            ws.onclose = (event) => {
                setReady(false);
                isConnecting.current = false;
                console.log(`🔌 WebSocket closed. Code: ${event.code}`);

                // Auto-reconnect with exponential backoff
                if (shouldReconnect.current && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts.current++;
                    const delay = Math.min(
                        RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttempts.current - 1),
                        30000 // Max 30 seconds
                    );
                    
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
                isConnecting.current = false;
            };
        } catch (error) {
            console.error("Failed to create WebSocket:", error);
            setReady(false);
            isConnecting.current = false;
        }
    }, [WS_URL, flushMessageQueue]);

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
                try {
                    socketRef.current.close();
                } catch (e) {
                    // Ignore close errors
                }
                socketRef.current = null;
            }
        };
    }, [connect]);

    // OPTIMIZED: Send with automatic queuing if not connected
    const send = useCallback((data: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            try {
                socketRef.current.send(JSON.stringify(data));
            } catch (error) {
                console.error("Send error:", error);
                // Queue for retry
                messageQueue.current.push(data);
            }
        } else {
            console.warn("Socket not ready, queuing message");
            messageQueue.current.push(data);
            
            // Limit queue size to prevent memory issues
            if (messageQueue.current.length > 100) {
                console.warn("Message queue overflow, dropping oldest messages");
                messageQueue.current = messageQueue.current.slice(-100);
            }
        }
    }, []);

    // OPTIMIZED: Binary send with validation
    const sendBinary = useCallback((buf: ArrayBuffer) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            try {
                socketRef.current.send(buf);
            } catch (error) {
                console.error("Binary send error:", error);
            }
        } else {
            console.warn("Cannot send binary: WebSocket not ready");
        }
    }, []);

    // Register message handler (returns cleanup function)
    const on = useCallback((handler: MessageHandler, type?: string) => {
        const entry = { handler, type };
        handlersRef.current.add(entry);
        
        // Return cleanup function
        return () => {
            handlersRef.current.delete(entry);
        };
    }, []);

    const reconnectFn = useCallback(() => {
        reconnectAttempts.current = 0;
        messageQueue.current = []; // Clear queue on manual reconnect
        connect();
    }, [connect]);

    return (
        <SocketContext.Provider
            value={{
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