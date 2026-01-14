import { useEffect, useRef, useState } from "react";

export function useSocket(onMessage: (data: any) => void) {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
    const [ready, setReady] = useState(false);

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

    function connect() {
        if (!WS_URL || socketRef.current) return;

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            setReady(true);

            heartbeatTimer.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "ping" }));
                }
            }, 15000);
        };

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                onMessage(data);
            } catch {}
        };

        ws.onclose = () => {
            setReady(false);
            clearInterval(heartbeatTimer.current!);
            socketRef.current = null;
            reconnectTimer.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => ws.close();

        socketRef.current = ws;
    }

    function send(data: any) {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            return;
        }
        socketRef.current.send(JSON.stringify(data));
    }

    useEffect(() => {
        connect();
        return () => socketRef.current?.close();
    }, []);

    return { send, ready };
}
