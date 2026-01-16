export function parsePairingCode(raw: string) {
    const match = raw.match(/fluxsend:\/\/join\/([A-Z0-9-]+)/i);
    if (!match) return null;

    const [roomId, token] = match[1].split(":");
    return roomId && token ? { roomId, token } : null;
}
