import { useRef, useState } from "react";
import { blob } from "stream/consumers";

export type IncomingOffer = {
  fileId: string;
  name: string;
  size: number;
  mime: string;
  totalChunks?: number;
};

export type ActiveFile = {
  fileId: string;
  name: string;
  size: number;
  mime: string;
  received: number;
  chunks: ArrayBuffer[];
  status: "pending" | "receiving" | "done";
};

export function useFileReceiver(send: (data: any) => void) {
    // Incoming file offers
    const [incomingOffers, setIncomingOffers] = useState<IncomingOffer[]>([]);
    
    // Current file being transferred
    const currentFile = useRef<ActiveFile | null>(null);
    const [progress, setProgress] = useState(0);

    // Active received files (after accept)
    const [receivedFiles, setReceivedFiles] = useState<ActiveFile[]>([]);

    //   Keep last received blob in memory only
    const lastReceivedBlob = useRef<{name: string; blob: Blob} | null>(null);

    function handleMessage(data: any) {
        // JSON messages
        if (typeof data === "string") {
        const msg = JSON.parse(data);
        
        // File offer
        if (msg.type === "file-offer") {
            setIncomingOffers((prev) => [...prev, msg.file]);
            return;
        }

        if (msg.type === "file-meta") {
            currentFile.current = {
                fileId: msg.fileId,
                name: msg.name,
                size: msg.size,
                mime: msg.mime,
                received: 0,
                chunks: [],
                status: "receiving",
            };
            setProgress(0);
            return;
        }

        if (msg.type === "file-complete" && currentFile.current) {
            currentFile.current.status = "done";

            // Save to memory-only blob
            lastReceivedBlob.current = {
                name: currentFile.current.name,
                blob: new Blob(currentFile.current.chunks, { type: currentFile.current.mime }),
            };

            setReceivedFiles((prev) => [...prev, currentFile.current!]);
            currentFile.current = null;
            setProgress(100);
            return;
        }

        // Chunk by index
        if (msg.type === "file-chunk" && currentFile.current) {
            currentFile.current.chunks[msg.index] = msg.data;
            currentFile.current.received += msg.data.byteLength;
            setProgress(
            Math.floor((currentFile.current.received / currentFile.current.size) * 100)
            );
            return;
        }
        }

        // Binary chunk
        if (data instanceof ArrayBuffer && currentFile.current) {
        currentFile.current.chunks.push(data);
        currentFile.current.received += data.byteLength;
        setProgress(
            Math.floor((currentFile.current.received / currentFile.current.size) * 100)
        );
        }
    }

    // Accept / Reject
    function accept(fileId: string) {
        send({ type: "file-accept", fileId });
        setIncomingOffers((prev) => prev.filter(f => f.fileId !== fileId));
    }

    function reject(fileId: string) {
        send({ type: "file-reject", fileId });
        setIncomingOffers((prev) => prev.filter(f => f.fileId !== fileId));
    }

    // Download received file
    function download(file: ActiveFile) {
        const blob = new Blob(file.chunks, { type: file.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Clear all memory (on disconnect)
    function clearAll() {
        setIncomingOffers([]);
        setReceivedFiles([]);
        currentFile.current = null;
        setProgress(0);
        lastReceivedBlob.current = null;
    }

    return {
        incomingOffers,
        receivedFiles,
        currentFile,
        progress,
        lastReceivedBlob,
        handleMessage,
        accept,
        reject,
        download,
        clearAll,
    };
}
