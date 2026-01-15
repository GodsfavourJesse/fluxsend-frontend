const CHUNK_SIZE = 64 * 1024; // 64KB

export async function sendFile(
  file: File,
  fileId: string,
  send: (data: any) => void,
  onProgress?: (percent: number) => void
) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // 1️⃣ Send metadata (transfer start)
  send({
    type: "file-meta",
    fileId,
    name: file.name,
    size: file.size,
    mime: file.type,
    totalChunks,
  });

  let offset = 0;
  let chunkIndex = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await chunk.arrayBuffer();

    send({
      type: "file-chunk",
      fileId,
      index: chunkIndex,
      data: buffer,
    });

    offset += CHUNK_SIZE;
    chunkIndex++;

    onProgress?.(Math.floor((offset / file.size) * 100));
  }

  // 3️⃣ Complete
  send({ type: "file-complete", fileId });
}
