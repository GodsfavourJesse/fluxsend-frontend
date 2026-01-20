import { useRef, useState } from "react";

// Hook now accepts an optional sender function
export function useFileReceiver(sender?: (data: any) => void) {
    const [incomingOffers, setIncomingOffers] = useState<any[]>([]);
    const [receivedFiles, setReceivedFiles] = useState<any[]>([]);
    const currentFile = useRef<any | null>(null);
    const senderRef = useRef<(data: any) => void>();
    const [progress, setProgress] = useState(0);

    // If sender is provided during initialization, set it
    if (sender && !senderRef.current) {
        senderRef.current = sender;
    }

    function setSender(fn: (data: any) => void) {
        senderRef.current = fn;
    }

    function handleMessage(msg: any) {
        if (msg?.type === "file-offer") {
            setIncomingOffers((prev) => [...prev, msg.file]);
            return;
        }

        if (msg?.type === "file-meta") {
            currentFile.current = {
                ...msg,
                received: 0,
                chunks: [],
            };
            setProgress(0);
            return;
        }

        if (msg?.type === "file-complete" && currentFile.current) {
            setReceivedFiles((prev) => [...prev, currentFile.current]);
            currentFile.current = null;
            setProgress(100);
            return;
        }

        if (msg instanceof ArrayBuffer && currentFile.current) {
            currentFile.current.chunks.push(msg);
            currentFile.current.received += msg.byteLength;
            setProgress(
                Math.floor(
                    (currentFile.current.received / currentFile.current.size) * 100
                )
            );
        }
    }

    function accept(fileId: string) {
        senderRef.current?.({ type: "file-accept", fileId });
        setIncomingOffers((prev) => prev.filter((f) => f.fileId !== fileId));
    }

    function reject(fileId: string) {
        senderRef.current?.({ type: "file-reject", fileId });
        setIncomingOffers((prev) => prev.filter((f) => f.fileId !== fileId));
    }

    function download(file: any) {
        const blob = new Blob(file.chunks, { type: file.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
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