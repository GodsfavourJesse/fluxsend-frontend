export type PairingCode = {
  roomId: string;
  token?: string; // Optional for manual entry
};

export function parsePairingCode(input: string): PairingCode | null {
    if (!input) return null;

    const raw = input.trim();

    // QR/Deep link format: fluxsend://join/ROOMID?token=TOKEN
    const deepLinkMatch = raw.match(
        /fluxsend:\/\/join\/([A-Z0-9-]+)\?token=([A-Z0-9-]+)/i
    );
    if (deepLinkMatch) {
        return { 
            roomId: deepLinkMatch[1].toUpperCase(), 
            token: deepLinkMatch[2] 
        };
    }

    // Manual format with token: ROOMID-TOKEN (legacy support)
    if (raw.includes("-")) {
        const parts = raw.split("-");
        if (parts.length >= 2) {
            return { 
                roomId: parts[0].toUpperCase(), 
                token: parts.slice(1).join("-") 
            };
        }
    }

    // Manual format (room ID only): ROOMID
    // Just the room ID without token
    if (/^[A-Z0-9]+$/i.test(raw)) {
        return { 
            roomId: raw.toUpperCase() 
            // No token - server will handle this
        };
    }

    return null;
}