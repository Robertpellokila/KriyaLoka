import { supabase } from "../supabase.js";
import { queueService } from "./queueService.js";

// Daftar handler untuk setiap jenis operasi
const handlers = new Map();

// Mencegah proses sinkronisasi ganda dalam satu tab
let isSyncing = false;

// Mendaftarkan handler sinkronisasi
export const registerSyncHandler = (type, handler) => {
  if (!type || typeof handler !== "function") {
    throw new Error("Handler sinkronisasi tidak valid.");
  }

  handlers.set(type, handler);
};

// Menghapus handler jika diperlukan
export const unregisterSyncHandler = (type) => {
  handlers.delete(type);
};

export const syncService = {
  isSyncing() {
    return isSyncing;
  },

  async syncNow() {
    // Jangan jalankan sinkronisasi ketika offline
    if (!navigator.onLine) {
      return {
        success: false,
        reason: "offline",
        synced: 0,
        failed: 0,
      };
    }

    // Mencegah sinkronisasi ganda
    if (isSyncing) {
      return {
        success: false,
        reason: "already_syncing",
        synced: 0,
        failed: 0,
      };
    }

    isSyncing = true;

    let synced = 0;
    let failed = 0;

    try {
      // Periksa sesi pengguna Supabase
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        return {
          success: false,
          reason: "unauthenticated",
          synced,
          failed,
        };
      }

      // Ambil antrean hanya milik pengguna aktif
      const operations = await queueService.getPendingOperations(user.id);

      for (const operation of operations) {
        // Hentikan jika koneksi internet terputus
        if (!navigator.onLine) break;

        // Pastikan operasi masih milik pengguna aktif
        if (operation.userId !== user.id) continue;

        const handler = handlers.get(operation.type);

        // Lewati jenis operasi yang belum memiliki handler
        if (!handler) continue;

        try {
          await queueService.markProcessing(operation.id);

          // Jalankan proses sinkronisasi
          await handler(operation.payload, operation);

          // Hapus antrean setelah berhasil
          await queueService.markCompleted(operation.id);

          synced++;
        } catch (error) {
          console.error(`Gagal sinkronisasi ${operation.type}:`, error);

          await queueService.markFailed(operation.id, error);

          failed++;
        }
      }

      return {
        success: failed === 0,
        reason: null,
        synced,
        failed,
      };
    } catch (error) {
      console.error("Sync Service Error:", error);

      return {
        success: false,
        reason: "sync_error",
        message: error.message,
        synced,
        failed,
      };
    } finally {
      isSyncing = false;
    }
  },
};

export default syncService;
