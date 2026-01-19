import { useRef, useState } from "react";
import toast from "react-hot-toast";

export type IncomingFile = {
  id: string;
  name: string;
  size: number;
  mime: string;
  progress: number;
  chunks: Uint8Array[];
  completed: boolean;
};

export function useGlobalFileReceiver() {
  const [incomingFiles, setIncomingFiles] = useState<IncomingFile[]>([]);
  const fileMap = useRef<Map<string, IncomingFile>>(new Map());

  function handleMessage(message: any) {
    switch (message.type) {
      case "file-offer": {
        message.files.forEach((file: any) => {
          if (fileMap.current.has(file.id)) return;

          const entry: IncomingFile = {
            id: file.id,
            name: file.name,
            size: file.size,
            mime: file.mime,
            progress: 0,
            chunks: [],
            completed: false,
          };

          fileMap.current.set(file.id, entry);
          setIncomingFiles((prev) => [...prev, entry]);
        });
        break;
      }

      case "file-chunk": {
        const file = fileMap.current.get(message.fileId);
        if (!file) return;

        file.chunks.push(new Uint8Array(message.chunk));
        file.progress = Math.round(
          (message.receivedBytes / message.totalBytes) * 100
        );

        setIncomingFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...file } : f))
        );
        break;
      }

      case "file-complete": {
        const file = fileMap.current.get(message.fileId);
        if (!file) return;

        file.completed = true;
        file.progress = 100;

        setIncomingFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...file } : f))
        );

        toast.success(`${file.name} received`);
        break;
      }
    }
  }

  function downloadFile(id: string) {
    const file = fileMap.current.get(id);
    if (!file || !file.completed) return;

    const blob = new Blob(file.chunks, { type: file.mime });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();

    URL.revokeObjectURL(url);
  }

  return {
    incomingFiles,
    handleMessage,
    downloadFile,
  };
}
