// import { useEffect, useRef, useState } from "react";

// type MessageHandler = (data: any) => void;

// export function useSocket(onMessage?: MessageHandler) {
//     const socketRef = useRef<WebSocket | null>(null);
//     const messageHandler = useRef<MessageHandler | null>(onMessage ?? null);
//     const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
//     const reconnectAttempts = useRef(0);
//     const [ready, setReady] = useState(false);
//     const [reconnecting, setReconnecting] = useState(false);
//     const shouldReconnect = useRef(true);

//     const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";
//     const MAX_RECONNECT_ATTEMPTS = 5;
//     const RECONNECT_DELAY_BASE = 2000;

//     const connect = () => {
//         // Clean up existing connection
//         if (socketRef.current) {
//             socketRef.current.close();
//             socketRef.current = null;
//         }

//         try {
//             const ws = new WebSocket(WS_URL);
//             ws.binaryType = "arraybuffer";
//             socketRef.current = ws;

//             ws.onopen = () => {
//                 setReady(true);
//                 setReconnecting(false);
//                 reconnectAttempts.current = 0;
//                 console.log("WebSocket connected");
//             };

//             ws.onmessage = (e) => {
//                 if (!messageHandler.current) return;

//                 if (e.data instanceof ArrayBuffer) {
//                     messageHandler.current({
//                         type: "file-chunk-raw", 
//                         buffer: e.data 
//                     });
//                     return;
//                 }

//                 try {
//                     const data = JSON.parse(e.data);

//                     // CRITICAL: Auto-respond to ping immediately
//                     if (data.type === "ping") {
//                         ws.send(JSON.stringify({ type: "pong" }));
//                         return;
//                     }

//                     messageHandler.current(data);
//                 } catch (err) {
//                     console.warn("Invalid WS message", err);
//                 }
//             };

//             ws.onclose = (event) => {
//                 setReady(false);
//                 console.log(`WebSocket closed. Code: ${event.code}`);

//                 // Auto-reconnect if not intentional
//                 if (shouldReconnect.current && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
//                     reconnectAttempts.current++;
//                     const delay = RECONNECT_DELAY_BASE * reconnectAttempts.current;
                    
//                     setReconnecting(true);
//                     console.log(`Reconnecting in ${delay}ms... (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
                    
//                     reconnectTimer.current = setTimeout(() => {
//                         connect();
//                     }, delay);
//                 } else if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
//                     console.error("Max reconnection attempts reached");
//                     setReconnecting(false);
//                 }
//             };

//             ws.onerror = (err) => {
//                 console.error("WebSocket error:", err);
//             };
//         } catch (error) {
//             console.error("Failed to create WebSocket:", error);
//             setReady(false);
//         }
//     };

//     useEffect(() => {
//         shouldReconnect.current = true;
//         connect();

//         return () => {
//             shouldReconnect.current = false;
            
//             if (reconnectTimer.current) {
//                 clearTimeout(reconnectTimer.current);
//             }
            
//             if (socketRef.current) {
//                 socketRef.current.close();
//                 socketRef.current = null;
//             }
//         };
//     }, []);

//     return {
//         ready,
//         reconnecting,
        
//         send: (data: any) => {
//             if (socketRef.current?.readyState === WebSocket.OPEN) {
//                 socketRef.current.send(JSON.stringify(data));
//             } else {
//                 console.warn("Cannot send: WebSocket not ready");
//             }
//         },

//         sendBinary: (buf: ArrayBuffer) => {
//             if (socketRef.current?.readyState === WebSocket.OPEN) {
//                 socketRef.current.send(buf);
//             } else {
//                 console.warn("Cannot send binary: WebSocket not ready");
//             }
//         },

//         setOnMessage: (fn: MessageHandler) => {
//             messageHandler.current = fn;
//         },

//         reconnect: () => {
//             reconnectAttempts.current = 0;
//             connect();
//         },

//         disconnect: () => {
//             shouldReconnect.current = false;
//             if (socketRef.current) {
//                 socketRef.current.close();
//             }
//         },

//         socketRef,
//     };
// }