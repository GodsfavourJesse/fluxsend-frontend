import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useSmartRouting({
    hasIncomingOffer,
    hasSelectedFiles,
}: {
    hasIncomingOffer: boolean;
    hasSelectedFiles: boolean;
}) {
    const router =  useRouter();

    useEffect(() => {
        if(hasIncomingOffer) {
            router.push("/receiver");
        } else if (hasSelectedFiles) {
            router.push("/sender");
        }
    }, [hasIncomingOffer, hasSelectedFiles]);
}