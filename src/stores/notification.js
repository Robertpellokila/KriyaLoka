import { defineStore } from "pinia";
import { supabase } from "../services/supabase.js";

// Realtime channel
let notificationChannel = null;
let subscribedUserId = null;

// Mencegah beberapa proses subscription berjalan bersamaan
let subscriptionPromise = null;

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    updating: false,
    error: null,
  }),

  getters: {
    unreadNotifications: (state) =>
      state.notifications.filter((item) => !item.read_at),

    readNotifications: (state) =>
      state.notifications.filter((item) => item.read_at),

    hasUnread: (state) => state.unreadCount > 0,
  },

  actions: {
    // =========================================
    // AUTHENTICATION
    // =========================================

    async getCurrentUser() {
      const { data, error } = await supabase.auth.getUser();

      if (error) throw error;

      if (!data?.user) {
        throw new Error("Pengguna belum login.");
      }

      return data.user;
    },

    // =========================================
    // FETCH NOTIFICATIONS
    // =========================================

    async fetchNotifications(limit = 50) {
      this.loading = true;
      this.error = null;

      try {
        const user = await this.getCurrentUser();

        const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

        const [notificationResult, countResult] = await Promise.all([
          supabase
            .from("notifications")
            .select("*")
            .eq("recipient_id", user.id)
            .order("created_at", { ascending: false })
            .limit(safeLimit),

          supabase
            .from("notifications")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("recipient_id", user.id)
            .is("read_at", null),
        ]);

        if (notificationResult.error) {
          throw notificationResult.error;
        }

        if (countResult.error) {
          throw countResult.error;
        }

        this.notifications = notificationResult.data || [];
        this.unreadCount = countResult.count || 0;

        return this.notifications;
      } catch (error) {
        this.error = error.message || "Gagal mengambil notifikasi.";

        throw error;
      } finally {
        this.loading = false;
      }
    },

    // =========================================
    // MARK ONE NOTIFICATION AS READ
    // =========================================

    async markAsRead(notificationId) {
      this.updating = true;
      this.error = null;

      try {
        const user = await this.getCurrentUser();

        const notification = this.notifications.find(
          (item) => item.id === notificationId,
        );

        if (!notification || notification.read_at) {
          return;
        }

        const readAt = new Date().toISOString();

        const { error } = await supabase
          .from("notifications")
          .update({ read_at: readAt })
          .eq("id", notificationId)
          .eq("recipient_id", user.id)
          .is("read_at", null);

        if (error) throw error;

        // Perbarui state hanya jika masih belum dibaca.
        // Ini mencegah pengurangan unreadCount dua kali
        // jika event Realtime sudah lebih dahulu diproses.

        const currentNotification = this.notifications.find(
          (item) => item.id === notificationId,
        );

        if (currentNotification && !currentNotification.read_at) {
          this.notifications = this.notifications.map((item) =>
            item.id === notificationId ? { ...item, read_at: readAt } : item,
          );

          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      } catch (error) {
        this.error = error.message || "Gagal memperbarui notifikasi.";

        throw error;
      } finally {
        this.updating = false;
      }
    },

    // =========================================
    // MARK ALL AS READ
    // =========================================

    async markAllAsRead() {
      this.updating = true;
      this.error = null;

      try {
        const user = await this.getCurrentUser();
        const readAt = new Date().toISOString();

        const { error } = await supabase
          .from("notifications")
          .update({ read_at: readAt })
          .eq("recipient_id", user.id)
          .is("read_at", null);

        if (error) throw error;

        this.notifications = this.notifications.map((item) => ({
          ...item,
          read_at: item.read_at || readAt,
        }));

        this.unreadCount = 0;
      } catch (error) {
        this.error = error.message || "Gagal menandai semua notifikasi.";

        throw error;
      } finally {
        this.updating = false;
      }
    },

    // =========================================
    // DELETE NOTIFICATION
    // =========================================

    async deleteNotification(notificationId) {
      this.updating = true;
      this.error = null;

      try {
        const user = await this.getCurrentUser();

        const { error } = await supabase
          .from("notifications")
          .delete()
          .eq("id", notificationId)
          .eq("recipient_id", user.id);

        if (error) throw error;

        // Ambil state terbaru setelah query selesai.
        // Realtime mungkin sudah menghapus item lebih dahulu.

        const currentNotification = this.notifications.find(
          (item) => item.id === notificationId,
        );

        if (currentNotification && !currentNotification.read_at) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }

        this.notifications = this.notifications.filter(
          (item) => item.id !== notificationId,
        );
      } catch (error) {
        this.error = error.message || "Gagal menghapus notifikasi.";

        throw error;
      } finally {
        this.updating = false;
      }
    },

    // =========================================
    // REALTIME SUBSCRIPTION
    // =========================================

    async subscribeToNotifications() {
      const user = await this.getCurrentUser();

      // Sudah terhubung dengan akun yang sama
      if (notificationChannel && subscribedUserId === user.id) {
        return;
      }

      // Tunggu proses subscription yang sedang berjalan
      if (subscriptionPromise) {
        await subscriptionPromise;

        if (notificationChannel && subscribedUserId === user.id) {
          return;
        }
      }

      subscriptionPromise = (async () => {
        await this.unsubscribeFromNotifications();

        subscribedUserId = user.id;

        notificationChannel = supabase
          .channel(`notifications-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `recipient_id=eq.${user.id}`,
            },
            (payload) => {
              this.handleRealtimeNotification(payload);
            },
          )
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR") {
              this.error = "Koneksi realtime notifikasi mengalami masalah.";
            }

            if (status === "TIMED_OUT") {
              this.error = "Koneksi realtime notifikasi mengalami timeout.";
            }
          });
      })();

      try {
        await subscriptionPromise;
      } catch (error) {
        this.error =
          error.message || "Gagal menghubungkan notifikasi realtime.";

        throw error;
      } finally {
        subscriptionPromise = null;
      }
    },

    // =========================================
    // HANDLE REALTIME EVENTS
    // =========================================

    handleRealtimeNotification(payload) {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      // INSERT
      if (eventType === "INSERT" && newRecord?.id) {
        const alreadyExists = this.notifications.some(
          (item) => item.id === newRecord.id,
        );

        if (!alreadyExists) {
          this.notifications = [newRecord, ...this.notifications].slice(0, 50);

          if (!newRecord.read_at) {
            this.unreadCount += 1;
          }
        }
      }

      // UPDATE
      if (eventType === "UPDATE" && newRecord?.id) {
        const oldNotification = this.notifications.find(
          (item) => item.id === newRecord.id,
        );

        if (oldNotification) {
          const wasUnread = !oldNotification.read_at;
          const isUnread = !newRecord.read_at;

          if (wasUnread && !isUnread) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          } else if (!wasUnread && isUnread) {
            this.unreadCount += 1;
          }

          this.notifications = this.notifications.map((item) =>
            item.id === newRecord.id ? newRecord : item,
          );
        }
      }

      // DELETE
      if (eventType === "DELETE" && oldRecord?.id) {
        const deletedNotification = this.notifications.find(
          (item) => item.id === oldRecord.id,
        );

        if (deletedNotification && !deletedNotification.read_at) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }

        this.notifications = this.notifications.filter(
          (item) => item.id !== oldRecord.id,
        );
      }
    },

    // =========================================
    // UNSUBSCRIBE REALTIME
    // =========================================

    async unsubscribeFromNotifications() {
      if (notificationChannel) {
        const channel = notificationChannel;

        notificationChannel = null;
        subscribedUserId = null;

        await supabase.removeChannel(channel);
      }
    },

    // =========================================
    // RESET STATE
    // =========================================

    resetNotifications() {
      this.notifications = [];
      this.unreadCount = 0;
      this.loading = false;
      this.updating = false;
      this.error = null;
    },
  },
});
