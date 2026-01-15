"use client";

import { Check, X } from "lucide-react";

type Offer = {
  fileId: string;
  name: string;
  size: number;
  mime: string;
};

export default function FileOfferToast({
  offer,
  onAccept,
  onReject,
}: {
  offer: Offer;
  onAccept: (fileId: string) => void;
  onReject: (fileId: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 bg-neutral-900 text-white p-4 rounded-xl shadow-lg flex flex-col space-y-2 w-80">
      <div className="font-semibold">Incoming File</div>
      <div className="truncate">{offer.name} ({(offer.size / 1024).toFixed(1)} KB)</div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => onReject(offer.fileId)}
          className="py-1 px-3 bg-red-600 rounded-lg hover:bg-red-700 transition"
        >
          <X size={16} /> Reject
        </button>
        <button
          onClick={() => onAccept(offer.fileId)}
          className="py-1 px-3 bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center gap-1"
        >
          <Check size={16} /> Accept
        </button>
      </div>
    </div>
  );
}
