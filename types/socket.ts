export type WSMessage = 
    | { type: "pair-joined"; roomId: string }
    | { type: "file-offer"; files: FileMeta[]; totalSize: number }
    | { type:  "file-offer-accepted" }
    | { type: "file-offer-rejected" }
    | { type: "file-chunk-raw"; buffer: ArrayBuffer }
    | { type: "file-complete"; fileId: string }
    | { type: "disconnect" };

export type FileMeta = {
    id: string;
    name: string;
    size: number;
    type: string;
};