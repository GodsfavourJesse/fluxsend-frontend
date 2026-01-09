export function parsePairingCode(raw: string): string | null {
  const match = raw.match(/fluxsend:\/\/join\/([A-Z0-9-]+)/i);
  return match ? match[1].toUpperCase() : null;
}
