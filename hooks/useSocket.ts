import { useEffect, useRef, useState } from "react";

export function useSocket(onMessage: (data: any) => void) {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
    const [ready, setReady] = useState(false);

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;

    if (!WS_URL) {
        throw new Error("NEXT_PUBLIC_WS_URL is not defined");
    }

    function connect() {
        if (socketRef.current) return;

        console.log("COnnecting to WebSocket...");

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log("Websocket connected");
            setReady(true);

            heartbeatTimer.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "ping" }));
                }
            }, 30000);
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log("WS message:", data);
            onMessage(data);
        };

        ws.onclose = () => {
            console.warn("Websocket closed, retrying...")
            setReady(false);
            socketRef.current = null;

            if (heartbeatTimer.current) {
                clearInterval(heartbeatTimer.current);
            }

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
