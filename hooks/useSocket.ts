import { useEffect, useRef, useState } from "react";

export function useSocket(onMessage: (data: any) => void) {
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
    const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
    const lastPong = useRef(Date.now());
    const [ready, setReady] = useState(false);

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

    function connect() {
        if (!WS_URL || socketRef.current) return;

        const ws = new WebSocket(WS_URL);
        socketRef.current =ws;

        ws.onopen = () => {
            setReady(true);

            // Heartbeat: send ping every 10s
            heartbeatTimer.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: "ping" }));
                }
            }, 10000);
        };

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);

                // Respond to server ping
                if (data.type === "ping") {
                    ws.send(JSON.stringify({
                        type: "pong"
                    }));
                    return;
                }

                // Track last pong for heartbeat monitoring
                if (data.type === "pong") {
                    lastPong.current = Date.now();
                    return;
                }

                onMessage(data);
            } catch {}
        };

        ws.onclose = () => {
            setReady(false);
            clearInterval(heartbeatTimer.current!);
            socketRef.current = null;

            // Attempt reconnect after 3s
            reconnectTimer.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => ws.close();
    }

    const send = (data: any) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        }
    };


    // Monitor peer disconnected every 3s
    useEffect(() => {
        const monitor = setInterval(() => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                const now = Date.now();
                if (now - lastPong.current > 10000) {
                    // Peer hasn't responded, consider disconnected
                    onMessage({
                        type: "peer-disconnected"
                    });
                    socketRef.current.close();
                }
            }
        }, 3000);

        connect();

        return () => {
            clearInterval(monitor);
            clearInterval(heartbeatTimer.current!);
            reconnectTimer.current && clearTimeout(reconnectTimer.current);
            socketRef.current?.close();
        };
    }, []);

    return { send, ready };
}