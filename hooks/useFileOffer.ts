import { useState } from "react";
import { FileMeta } from "@/types/socket";

export function useFileOffer() {
    const [offer, setOffer] = useState<{
        files: FileMeta[]; // Changed from 'file' to 'files'
        totalSize: number;
    } | null>(null);

    const handleOffer = (data: {
        files: FileMeta[];
        totalSize: number;
    }) => {
        setOffer(data);
    };

    const clearOffer = () => setOffer(null);

    return {
        offer,
        handleOffer,
        clearOffer,
    };
}