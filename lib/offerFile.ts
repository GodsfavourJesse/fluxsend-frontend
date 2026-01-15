const CHUNK_SIZE = 64 * 1024;

export function offerFile(
  file: File,
  send: (data: any) => void
) {
  const fileId = crypto.randomUUID();
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  send({
    type: "file-offer",
    file: {
      fileId,
      name: file.name,
      size: file.size,
      mime: file.type,
      totalChunks
    }
  });

  return { fileId, totalChunks };
}
