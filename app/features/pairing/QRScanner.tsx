"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export function QRScanner({ onScan }: { onScan: (v: string) => void }) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const startedRef = useRef(false);

    useEffect(() => {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        scanner
        .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 220 },
            (text) => {
                if (!startedRef.current) return;
                onScan(text);
            }
        )
        .then(() => {
            startedRef.current = true;
        })
        .catch(() => {});

        return () => {
            if (scannerRef.current && startedRef.current) {
                scannerRef.current
                .stop()
                .catch(() => {})
                .finally(() => {
                    startedRef.current = false;
                });
            }
        };
    }, []);

    return (
        <div
            id="qr-reader"
            className="h-72 rounded-xl overflow-hidden bg-black"
        />
    );
}
