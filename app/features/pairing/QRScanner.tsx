"use client";

import { FC } from "react";
import { QrReader } from "react-qr-reader";

type Props = {
  onScan: (code: string) => void;
};

export const QRScanner: FC<Props> = ({ onScan }) => {
  return (
    <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-md">
      <QrReader
        onResult={(result, error) => {
          if (!!result) {
            onScan(result.getText());
          }
          if (!!error) {
            // console.log(error); // optional debug
          }
        }}
        constraints={{ facingMode: "environment" }}
        className="rounded-xl overflow-hidden"
      />
    </div>
  );
};
