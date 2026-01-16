export function parsePairingCode(raw: string): { roomId: string; token: string } | null {
    const match = raw.match(/fluxsend:\/\/join\/([A-Z0-9-]+)\?token=([A-Z0-9-]+)/i);

    if (!match) return null;

    return {
        roomId: match[1].toUpperCase(),
        token: match[2],
    };
}
