import { useRef, useState } from "react";

export function useFileReceiver(sender?: (data: any) => void) {
    const [incomingOffers, setIncomingOffers] = useState<any[]>([]);
    const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
    const currentFile = useRef<any | null>(null);
    const senderRef = useRef<((data: any) => void) | null>(null);
    const [progress, setProgress] = useState(0);

    if (sender && !senderRef.current) {
        senderRef.current = sender;
    }

    function setSender(fn: (data: any) => void) {
        senderRef.current = fn;
    }

    function handleMessage(msg: any) {
        console.log("Receiver got message:", msg?.type || "binary");

        // Handle file offer
        if (msg?.type === "file-offer") {
            console.log("File offer received:", msg.file);
            setIncomingOffers((prev) => {
                // Prevent duplicates
                if (prev.find(f => f.fileId === msg.file.fileId)) {
                    return prev;
                }
                return [...prev, msg.file];
            });
            return;
        }

        // Handle file metadata
        if (msg?.type === "file-meta") {
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
            return;
        }

        // Handle file complete
        if (msg?.type === "file-complete" && currentFile.current) {
            console.log("File complete:", currentFile.current.name);
            
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

            currentFile.current = null;
            setProgress(100);
            return;
        }

        // Handle binary chunks (ArrayBuffer or raw message)
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
            
            if (newProgress % 10 === 0) {
                console.log(`Progress: ${newProgress}%`);
            }
        }
    }

    function accept(fileId: string) {
        console.log("Accepting file:", fileId);
        senderRef.current?.({ type: "file-accept", fileId });
        setIncomingOffers((prev) => prev.filter((f) => f.fileId !== fileId));
    }

    function reject(fileId: string) {
        console.log("Rejecting file:", fileId);
        senderRef.current?.({ type: "file-reject", fileId });
        setIncomingOffers((prev) => prev.filter((f) => f.fileId !== fileId));
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