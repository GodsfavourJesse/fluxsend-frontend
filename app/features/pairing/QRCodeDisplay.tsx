"use client";

import { FC } from "react";
import { QRCodeCanvas } from "qrcode.react";

type Props = {
  roomId: string;
  size?: number;
};

export const QRCodeDisplay: FC<Props> = ({ roomId, size = 160 }) => {
    // Encode the room ID as a simple URL or string
    const qrValue = `fluxsend://join/${roomId}`;

    return (
        <div className="flex justify-center p-4 bg-white rounded-2xl shadow-md">
            <QRCodeCanvas value={qrValue} size={size} />
        </div>
    );
};
