import { useEffect } from "react";

export function useFileOfferNotifications(offers: any[]) {
    useEffect(() => {
        if (offers.length === 0) return;

        const latestOffer = offers[offers.length - 1];

        // Request notification permission if not granted
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        // Show browser notification
        if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification("FluxSend - Incoming File", {
                body: `${latestOffer.name} (${(latestOffer.size / (1024 * 1024)).toFixed(2)} MB)`,
                icon: "/icon-192x192.png",
                badge: "/icon-72x72.png",
                tag: "fluxsend-file-offer",
                requireInteraction: true,
                // Removed 'actions' - not supported in TypeScript types
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }

        // Vibrate on mobile
        if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200]);
        }

        // Play sound
        try {
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS67emXURALTKXh8LdjHAU2jdXvzn0pBSVzxe/glEILElyx6OyrWBQLRp3e8r5uIgUsgs/y2Ik3CBhju+zmlVMPCkue4fC9YhwFNo3V78xeLgUlc8Xv4ZRGDQ==");
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Ignore if autoplay blocked
            });
        } catch (e) {
            // Ignore audio errors
        }

    }, [offers.length]);
}