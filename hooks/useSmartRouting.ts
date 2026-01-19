import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useSmartRouting({
    hasIncomingOffer,
    hasSelectedFiles,
}: {
    hasIncomingfOffer: boolean;
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