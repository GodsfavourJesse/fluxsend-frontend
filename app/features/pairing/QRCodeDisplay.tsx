"use client";

import { QRCodeCanvas } from "qrcode.react";

type Props = {
    roomId: string;
    size?: number;
};

export function QRCodeDisplay({ roomId, size = 180 }: Props) {
    return (
        <div className="flex justify-center rounded-2xl bg-white p-6 shadow-sm">
            <QRCodeCanvas value={`fluxsend://join/${roomId}`} size={size} />
        </div>
    );
}
