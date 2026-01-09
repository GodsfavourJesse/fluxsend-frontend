import { useRef, useState } from "react";

export function useSocket(onMessage: (data: any) => void) {
    const socketRef = useRef<WebSocket | null>(null);
    const [ready, setReady] = useState(false);

    function connect() {
        const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

        ws.onopen = () => {
            setReady(true);
        };

        ws.onmessage = (e) => {
            onMessage(JSON.parse(e.data));
        };

        ws.onclose = () => {
            setReady(false);
        };

        socketRef.current = ws;
    }

    function send(data: any) {
        if (!ready || !socketRef.current) {
            console.warn("Socket not ready yet, cannot send:", data);
            return;
        }
        socketRef.current.send(JSON.stringify(data));
    }

    return { connect, send, ready };
}
