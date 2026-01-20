// lib/encryption.ts - Simple E2E Encryption using Web Crypto API

export class FileEncryption {
    private key: CryptoKey | null = null;

    // Generate a shared encryption key
    async generateKey(): Promise<string> {
        const key = await window.crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        );

        this.key = key;

        // Export key to share with peer
        const exportedKey = await window.crypto.subtle.exportKey("raw", key);
        return this.arrayBufferToBase64(exportedKey);
    }

    // Import shared key from peer
    async importKey(base64Key: string): Promise<void> {
        const keyBuffer = this.base64ToArrayBuffer(base64Key);

        this.key = await window.crypto.subtle.importKey(
            "raw",
            keyBuffer,
            {
                name: "AES-GCM",
                length: 256,
            },
            true,
            ["encrypt", "decrypt"]
        );
    }

    // Encrypt file chunk
    async encrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
        if (!this.key) throw new Error("Encryption key not set");

        // Generate random IV for each chunk
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            this.key,
            data
        );

        // Prepend IV to encrypted data
        const result = new Uint8Array(iv.length + encrypted.byteLength);
        result.set(iv, 0);
        result.set(new Uint8Array(encrypted), iv.length);

        return result.buffer;
    }

    // Decrypt file chunk
    async decrypt(data: ArrayBuffer): Promise<ArrayBuffer> {
        if (!this.key) throw new Error("Decryption key not set");

        // Extract IV from beginning
        const iv = new Uint8Array(data.slice(0, 12));
        const encryptedData = data.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            this.key,
            encryptedData
        );

        return decrypted;
    }

    // Helper: ArrayBuffer to Base64
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Helper: Base64 to ArrayBuffer
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
}

// Singleton instance
let encryptionInstance: FileEncryption | null = null;

export function getEncryption(): FileEncryption {
    if (!encryptionInstance) {
        encryptionInstance = new FileEncryption();
    }
    return encryptionInstance;
}

// Hash function for verification
export async function hashData(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}