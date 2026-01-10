import { useRef, useState } from "react";

export function useSocket(onMessage: (data: any) => void) {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const [ready, setReady] = useState(false);

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL!;

    function connect() {
        if (socketRef.current) return;

        console.log("🔌 Connecting to WS...");

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log("✅ WS connected");
            setReady(true);

            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
                reconnectTimer.current = null;
            }
        };

        ws.onmessage = (e) => {
            onMessage(JSON.parse(e.data));
        };

        ws.onclose = () => {
            console.warn("⚠️ WS closed, retrying...");
            setReady(false);
            socketRef.current = null;

            reconnectTimer.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
            ws.close();
        };

        socketRef.current = ws;
    }

    function send(data: any) {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        socket.send(JSON.stringify(data));
    }

    return { connect, send, ready };
}
