import { useState } from "react";
import { FileMeta } from "@/types/socket";

export function useFileOffer() {
    const [offer, setOffer] = useState<{
        file: FileMeta[];
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