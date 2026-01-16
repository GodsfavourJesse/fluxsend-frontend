const CHUNK_SIZE = 64 * 1024;

export async function sendFile(
    file: File,
    fileId: string,
    send: (data: any) => void,
    sendBinary: (buffer: ArrayBuffer) => void,
    onProgress?: (percent: number) => void
) {
    send({
        type: "file-meta",
        fileId,
        name: file.name,
        size: file.size,
        mime: file.type,
    });

    let offset = 0;

    while (offset < file.size) {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        const buffer = await chunk.arrayBuffer();

        sendBinary(buffer); // ✅ REAL FILE DATA
        offset += CHUNK_SIZE;

        onProgress?.(Math.floor((offset / file.size) * 100));
    }

    send({ type: "file-complete", fileId });
}
