"use client";

import { QRCodeCanvas } from "qrcode.react";

type Props = {
    roomId: string;
    token: string;
    size?: number;
};

export function QRCodeDisplay({ roomId, token, size = 180 }: Props) {
    
    //Proper deep link format with token as query parameter
    const deepLink = `fluxsend://join/${roomId}?token=${token}`;
    
    return (
        <div className="flex justify-center rounded-2xl bg-white p-6 shadow-sm">
            <QRCodeCanvas value={deepLink} size={size} />
        </div>
    );
}