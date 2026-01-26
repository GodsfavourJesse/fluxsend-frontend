import { useGlobalSocket } from "@/app/providers/SocketProvider";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export function useFileReceiver(sender?: (data: any) => void) {
    const [incomingOffers, setIncomingOffers] = useState<any[]>([]);
    const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
    const currentFile = useRef<any | null>(null);
    const senderRef = useRef<((data: any) => void) | null>(null);
    const [progress, setProgress] = useState(0);
    const socket = useGlobalSocket();

    useEffect(() => {
        if (sender) senderRef.current = sender;
    }, [sender]);

    function setSender(fn: (data: any) => void) {
        senderRef.current = fn;
    }

    const handleMessage = useCallback((msg: any) => {
        // Handle binary chunks (ArrayBuffer or wrapped binary message)
        if (msg instanceof ArrayBuffer || msg?.type === "file-chunk-raw") {
            if (!currentFile.current) {
                console.warn("Received chunk but no currentFile");
                return;
            }

            const buffer = msg instanceof ArrayBuffer ? msg : msg.buffer;
            
            currentFile.current.chunks.push(buffer);
            currentFile.current.received += buffer.byteLength;

            const newProgress = Math.floor(
                (currentFile.current.received / currentFile.current.size) * 100
            );
            
            setProgress(newProgress);
            
            if (newProgress % 20 === 0) {
                console.log(`Progress: ${newProgress}%`);
            }
            return;
        }

        // Handle JSON messages
        console.log("Receiver got message:", msg?.type || "unknown");

        switch (msg?.type) {
            case "file-offer":
                console.log("File offer received:", msg.file);
                setIncomingOffers((prev) => {
                    // Prevent duplicates
                    if (prev.find(f => f.fileId === msg.file.fileId)) {
                        return prev;
                    }
                    return [...prev, msg.file];
                });
                break;

            case "file-meta":
                console.log("File meta received:", msg.name);
                currentFile.current = {
                    fileId: msg.fileId,
                    name: msg.name,
                    size: msg.size,
                    mime: msg.mime,
                    received: 0,
                    chunks: [],
                };
                setProgress(0);
                toast.loading(`Receiving ${msg.name}...`, { id: `recv-${msg.fileId}` });
                break;

            case "file-complete":
                if (!currentFile.current) {
                    console.warn("File complete but no currentFile");
                    return;
                }
                
                console.log("File complete:", currentFile.current.name);
                
                // Dismiss loading toast
                toast.dismiss(`recv-${currentFile.current.fileId}`);
                
                // Create blob from chunks
                const blob = new Blob(currentFile.current.chunks, { 
                    type: currentFile.current.mime 
                });

                setReceivedFiles((prev) => [
                    ...prev,
                    {
                        fileId: currentFile.current.fileId,
                        name: currentFile.current.name,
                        size: currentFile.current.size,
                        mime: currentFile.current.mime,
                        blob: blob,
                    }
                ]);

                toast.success(`${currentFile.current.name} received!`);
                
                currentFile.current = null;
                setProgress(100);
                break;

            case "clipboard-share":
                console.log("Clipboard received");
                navigator.clipboard.writeText(msg.text).then(() => {
                    toast.success("Clipboard content received!");
                }).catch(() => {
                    toast.error("Failed to save to clipboard");
                });
                break;

            case "text-share":
                console.log("Text received");
                // Create a downloadable text file
                const textBlob = new Blob([msg.text], { type: "text/plain" });
                const textUrl = URL.createObjectURL(textBlob);
                const a = document.createElement("a");
                a.href = textUrl;
                a.download = `text-${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(textUrl);
                toast.success("Text received!");
                break;
        }
    }, []);



    useEffect(() => {
        return socket.on(handleMessage); //receieves binary + JSON
    }, [socket, handleMessage]);



    function accept(fileId: string) {
        console.log("Accepting file:", fileId);
        if (!senderRef.current) {
            console.error("No sender function available");
            toast.error("Cannot accept file: not connected");
            return;
        }
        
        senderRef.current({ type: "file-accept", fileId });
        setIncomingOffers((prev) => prev.filter((f) => f.fileId !== fileId));
        toast.success("File accepted, receiving...");
    }

    function reject(fileId: string) {
        console.log("Rejecting file:", fileId);
        if (!senderRef.current) {
            console.error("No sender function available");
            return;
        }
        
        senderRef.current({ type: "file-reject", fileId });
        setIncomingOffers((prev) => prev.filter((f) => f.fileId !== fileId));
        toast("File declined", { icon: "❌" });
    }

    function download(file: any) {
        console.log("Downloading file:", file.name);
        
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Downloaded ${file.name}`);
    }

    function reset() {
        setIncomingOffers([]);
        setReceivedFiles([]);
        currentFile.current = null;
        setProgress(0);
    }

    return {
        incomingOffers,
        receivedFiles,
        currentFile,
        progress,
        handleMessage,
        accept,
        reject,
        download,
        setSender,
        reset,
    };
}