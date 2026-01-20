import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TransferDB extends DBSchema {
    transfers: {
        key: string;
        value: {
            fileId: string;
            fileName: string;
            fileSize: number;
            fileType: string;
            timestamp: number;
            status: 'pending' | 'completed' | 'paused' | 'failed';
            progress: number;
            chunks?: ArrayBuffer[];
        };
    };
    history: {
        key: string;
        value: {
            id: string;
            fileName: string;
            fileSize: number;
            timestamp: number;
            type: 'sent' | 'received';
            peerName?: string;
        };
    };
}

let dbInstance: IDBPDatabase<TransferDB> | null = null;

async function getDB() {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<TransferDB>('fluxsend-transfers', 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('transfers')) {
                db.createObjectStore('transfers', { keyPath: 'fileId' });
            }
            if (!db.objectStoreNames.contains('history')) {
                const historyStore = db.createObjectStore('history', { keyPath: 'id' });
                historyStore.createIndex('timestamp', 'timestamp');
            }
        },
    });

    return dbInstance;
}

export async function saveTransferState(fileId: string, file: File, progress: number = 0) {
    const db = await getDB();

    await db.put('transfers', {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        timestamp: Date.now(),
        status: 'pending',
        progress,
    });
}

export async function updateTransferProgress(fileId: string, progress: number) {
    const db = await getDB();
    const transfer = await db.get('transfers', fileId);

    if (transfer) {
        transfer.progress = progress;
        transfer.status = progress === 100 ? 'completed' : 'pending';
        await db.put('transfers', transfer);
    }
}

export async function pauseTransfer(fileId: string) {
    const db = await getDB();
    const transfer = await db.get('transfers', fileId);

    if (transfer) {
        transfer.status = 'paused';
        await db.put('transfers', transfer);
    }
}

export async function resumeTransfer(fileId: string) {
    const db = await getDB();
    const transfer = await db.get('transfers', fileId);

    if (!transfer) {
        console.error('Transfer not found');
        return null;
    }

    if (transfer.status === 'paused') {
        transfer.status = 'pending';
        await db.put('transfers', transfer);
    }

    return transfer;
}

export async function getActiveTransfers() {
    const db = await getDB();
    const allTransfers = await db.getAll('transfers');
    
    return allTransfers.filter(t => t.status === 'pending' || t.status === 'paused');
}

export async function deleteTransfer(fileId: string) {
    const db = await getDB();
    await db.delete('transfers', fileId);
}

export async function addToHistory(data: {
    fileName: string;
    fileSize: number;
    type: 'sent' | 'received';
    peerName?: string;
}) {
    const db = await getDB();

    await db.add('history', {
        id: crypto.randomUUID(),
        ...data,
        timestamp: Date.now(),
    });
}

export async function getTransferHistory(limit: number = 50) {
    const db = await getDB();
    const allHistory = await db.getAll('history');
    
    return allHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
}

export async function clearOldHistory(daysToKeep: number = 7) {
    const db = await getDB();
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const allHistory = await db.getAll('history');
    const oldEntries = allHistory.filter(h => h.timestamp < cutoffTime);
    
    for (const entry of oldEntries) {
        await db.delete('history', entry.id);
    }
    
    return oldEntries.length;
}