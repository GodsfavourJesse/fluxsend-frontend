import { useRef, useState } from "react";

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
  status: "receiving" | "done";
};

export function useFileReceiver(send: (data: any) => void) {
  const [incomingOffers, setIncomingOffers] = useState<IncomingOffer[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<ActiveFile[]>([]);
  const currentFile = useRef<ActiveFile | null>(null);
  const [progress, setProgress] = useState(0);

  function handleMessage(msg: any) {
    // ✅ FILE OFFER
    if (msg?.type === "file-offer") {
      setIncomingOffers((prev) => [...prev, msg.file]);
      return;
    }

    // ✅ FILE META (start receiving)
    if (msg?.type === "file-meta") {
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

    // ✅ FILE COMPLETE
    if (msg?.type === "file-complete" && currentFile.current) {
      currentFile.current.status = "done";
      setReceivedFiles((prev) => [...prev, currentFile.current!]);
      setProgress(100);
      currentFile.current = null;
      return;
    }

    // ✅ BINARY FILE CHUNK
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
    send({ type: "file-accept", fileId });
    setIncomingOffers((prev) => prev.filter((f) => f.fileId !== fileId));
  }

  function reject(fileId: string) {
    send({ type: "file-reject", fileId });
    setIncomingOffers((prev) => prev.filter((f) => f.fileId !== fileId));
  }

  function download(file: ActiveFile) {
    const blob = new Blob(file.chunks, { type: file.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
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
    clearAll,
  };
}
