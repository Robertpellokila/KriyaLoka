
import { offlineDB } from "./database.js";

const createOperationId = () => {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("Browser tidak mendukung pembuatan ID unik.");
  }

  return globalThis.crypto.randomUUID();
};

export const queueService = {
  // Menambahkan operasi ke antrean
  async enqueue({ userId, type, payload }) {
    if (!userId) {
      throw new Error("User ID wajib tersedia.");
    }

    if (!type || !payload) {
      throw new Error("Jenis operasi dan payload wajib tersedia.");
    }

    const operationId = createOperationId();
    const now = new Date().toISOString();

    const operation = {
      operationId,
      userId,
      type,
      payload,
      status: "pending",
      attemptCount: 0,
      lastError: null,
      nextRetryAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await offlineDB.syncQueue.add(operation);

    return operation;
  },

  // Mengambil operasi yang siap disinkronisasi
  async getPendingOperations(userId) {
    if (!userId) return [];

    const now = new Date().toISOString();

    const operations = await offlineDB.syncQueue
      .where("[userId+status]")
      .equals([userId, "pending"])
      .sortBy("createdAt");

    return operations.filter(
      (operation) => operation.nextRetryAt <= now
    );
  },

  // Menandai operasi sedang diproses
  async markProcessing(id) {
    return offlineDB.syncQueue.update(id, {
      status: "processing",
      updatedAt: new Date().toISOString(),
    });
  },

  // Menghapus operasi yang berhasil disinkronisasi
  async markCompleted(id) {
    return offlineDB.syncQueue.delete(id);
  },

  // Menandai operasi gagal dan menjadwalkan percobaan ulang
  async markFailed(id, error) {
    const operation = await offlineDB.syncQueue.get(id);

    if (!operation) return;

    const attemptCount = (operation.attemptCount || 0) + 1;

    // Exponential backoff: 5 detik, 10 detik, 20 detik, dst.
    const delay = Math.min(
      5000 * 2 ** (attemptCount - 1),
      5 * 60 * 1000
    );

    const nextRetryAt = new Date(
      Date.now() + delay
    ).toISOString();

    return offlineDB.syncQueue.update(id, {
      status: "pending",
      attemptCount,
      lastError: String(error?.message || error || "Unknown error"),
      nextRetryAt,
      updatedAt: new Date().toISOString(),
    });
  },

  // Mengambil jumlah operasi yang masih menunggu
  async getPendingCount(userId) {
    if (!userId) return 0;

    return offlineDB.syncQueue
      .where("[userId+status]")
      .equals([userId, "pending"])
      .count();
  },

  // Menghapus antrean milik pengguna tertentu
  async clearUserQueue(userId) {
    if (!userId) return;

    return offlineDB.syncQueue
      .where("userId")
      .equals(userId)
      .delete();
  },
};

export default queueService;
