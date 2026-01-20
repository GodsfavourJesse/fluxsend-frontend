"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export function PWARegister() {
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/service-worker.js')
                    .then((registration) => {
                        console.log('✅ Service Worker registered:', registration.scope);

                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            newWorker?.addEventListener('statechange', () => {
                                if (newWorker.state === 'activated') {
                                    toast.success('App updated! Refresh for new features.');
                                }
                            });
                        });
                    })
                    .catch((error) => {
                        console.log('❌ Service Worker registration failed:', error);
                    });
            });
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is running in standalone mode');
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            toast.success('FluxSend installed! 🎉');
        }

        setDeferredPrompt(null);
        setShowInstallPrompt(false);
    };

    if (!showInstallPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-2xl shadow-2xl p-4 z-50 border border-gray-200">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📱</span>
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm text-gray-900">
                        Install FluxSend
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Install for faster access and offline support
                    </p>
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleInstallClick}
                            className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Install
                        </button>
                        <button
                            onClick={() => setShowInstallPrompt(false)}
                            className="px-3 text-xs text-gray-500 hover:text-gray-700"
                        >
                            Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}