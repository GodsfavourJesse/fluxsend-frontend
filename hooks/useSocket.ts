import { useEffect, useRef, useState } from "react";

export function useSocket(onMessage: (data: any) => void) {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const [ready, setReady] = useState(false);

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

    function connect() {
        if (!WS_URL || socketRef.current) return;

        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
            setReady(true);
        };

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);

                if (data.type === "ping") {
                    ws.send(JSON.stringify({ type: "pong" }));
                    return;
                }

                onMessage(data);
            } catch {}
        };

        ws.onclose = () => {
            setReady(false);
            socketRef.current = null;
            reconnectTimer.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => ws.close();
    }

    const send = (data: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        }
    };

    useEffect(() => {
        connect();
        return () => {
            reconnectTimer.current && clearTimeout(reconnectTimer.current);
            socketRef.current?.close();
        };
    }, []);

    return { send, ready };
}
