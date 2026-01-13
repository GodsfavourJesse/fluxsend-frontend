import { useEffect, useRef, useState } from "react";

export function useSocket(onMessage: (data: any) => void) {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
    const [ready, setReady] = useState(false);

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

    function connect() {
        if (!WS_URL) {
            console.error("WebSocket URL is not defined");
            return;
        }

        if (socketRef.current) return;

        console.log("COnnecting to WebSocket...");

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            setReady(true);
            console.log("Websocket connected");

            heartbeatTimer.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "ping" }));
                }
            }, 15000);
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            // console.log("WS message:", data);
            onMessage(data);
        };

        ws.onclose = () => {
            setReady(false);
            // console.warn("Websocket closed, retrying...")
            clearInterval(heartbeatTimer.current!);
            socketRef.current = null;
            reconnectTimer.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => ws.close();

        socketRef.current = ws;
    }

    function send(data: any) {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            console.warn("WS not ready, message skipped:", data);
            return;
        }
        socketRef.current.send(JSON.stringify(data));
    }

    useEffect(() => {
        connect();
        return () => {
            socketRef.current?.close();
        };
    }, []);

    return { send, ready };
}
