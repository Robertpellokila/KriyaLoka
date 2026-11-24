<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRouter } from "vue-router";
import {
  Bell,
  CheckCheck,
  Trash2,
  Package,
  ShoppingBag,
  Store,
  CreditCard,
  Info,
  X,
  Check,
  AlertCircle,
} from "lucide-vue-next";

import { useNotificationStore } from "../../stores/notification.js";

const router = useRouter();
const notificationStore = useNotificationStore();

const isOpen = ref(false);
const feedback = ref("");
const feedbackType = ref("success");

const notifications = computed(() => notificationStore.notifications);
const unreadCount = computed(() => notificationStore.unreadCount);
const loading = computed(() => notificationStore.loading);
const updating = computed(() => notificationStore.updating);
const hasUnread = computed(() => notificationStore.hasUnread);

const notificationIcon = (type) => {
  const normalizedType = String(type || "").toLowerCase();

  if (normalizedType.includes("product") || normalizedType.includes("produk")) {
    return Package;
  }

  if (normalizedType.includes("seller") || normalizedType.includes("penjual")) {
    return Store;
  }

  if (normalizedType.includes("order") || normalizedType.includes("pesanan")) {
    return ShoppingBag;
  }

  if (
    normalizedType.includes("payment") ||
    normalizedType.includes("pembayaran")
  ) {
    return CreditCard;
  }

  return Info;
};

const formatDate = (date) => {
  if (!date) return "";

  const notificationDate = new Date(date);

  if (Number.isNaN(notificationDate.getTime())) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(notificationDate);
};

const formatCount = (count) => {
  return count > 99 ? "99+" : count;
};

const showFeedback = (message, type = "success") => {
  feedback.value = message;
  feedbackType.value = type;
};

const clearFeedback = () => {
  feedback.value = "";
  feedbackType.value = "success";
};

const toggleDropdown = async () => {
  isOpen.value = !isOpen.value;
  clearFeedback();

  if (isOpen.value) {
    try {
      await notificationStore.fetchNotifications();
    } catch (error) {
      showFeedback(error.message || "Gagal memuat notifikasi.", "error");
    }
  }
};

const closeDropdown = () => {
  isOpen.value = false;
};

const handleNotificationClick = async (notification) => {
  try {
    if (!notification.read_at) {
      await notificationStore.markAsRead(notification.id);
    }

    closeDropdown();

    const target = notification.action_url;

    // Hanya izinkan navigasi ke route internal.
    if (
      typeof target === "string" &&
      target.startsWith("/") &&
      !target.startsWith("//")
    ) {
      await router.push(target);
    }
  } catch (error) {
    showFeedback(error.message || "Gagal membuka notifikasi.", "error");
  }
};

const handleNotificationKeydown = (event, notification) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleNotificationClick(notification);
  }
};

const handleMarkAllRead = async () => {
  try {
    await notificationStore.markAllAsRead();
    showFeedback("Semua notifikasi sudah dibaca.");
  } catch (error) {
    showFeedback(error.message || "Gagal memperbarui notifikasi.", "error");
  }
};

const handleDelete = async (event, notificationId) => {
  event.stopPropagation();

  try {
    await notificationStore.deleteNotification(notificationId);
    showFeedback("Notifikasi berhasil dihapus.");
  } catch (error) {
    showFeedback(error.message || "Gagal menghapus notifikasi.", "error");
  }
};

const handleRefresh = async () => {
  try {
    await notificationStore.fetchNotifications();
    clearFeedback();
  } catch (error) {
    showFeedback(error.message || "Gagal memperbarui notifikasi.", "error");
  }
};

const handleEscape = (event) => {
  if (event.key === "Escape" && isOpen.value) {
    closeDropdown();
  }
};

onMounted(async () => {
  try {
    // Hubungkan realtime terlebih dahulu.
    await notificationStore.subscribeToNotifications();

    // Ambil data terbaru setelah subscription aktif.
    await notificationStore.fetchNotifications();
  } catch (error) {
    console.error("Notification initialization:", error);
  }

  document.addEventListener("keydown", handleEscape);
});

onBeforeUnmount(async () => {
  document.removeEventListener("keydown", handleEscape);

  await notificationStore.unsubscribeFromNotifications();
});
</script>

<template>
  <div class="notification-wrapper">
    <!-- Notification Trigger -->
    <button
      type="button"
      class="notification-trigger"
      :class="{ active: isOpen }"
      aria-label="Buka notifikasi"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggleDropdown"
    >
      <Bell :size="21" :stroke-width="1.8" />

      <span v-if="unreadCount > 0" class="notification-badge">
        {{ formatCount(unreadCount) }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition name="notification-dropdown">
      <div v-if="isOpen" class="notification-dropdown" @click.stop>
        <!-- Header -->
        <div class="notification-header">
          <div>
            <h3>Notifikasi</h3>
            <p>
              {{ unreadCount }}
              notifikasi belum dibaca
            </p>
          </div>

          <div class="header-actions">
            <button
              v-if="hasUnread"
              type="button"
              class="header-action"
              title="Tandai semua dibaca"
              aria-label="Tandai semua dibaca"
              :disabled="updating"
              @click="handleMarkAllRead"
            >
              <CheckCheck :size="17" />
            </button>

            <button
              type="button"
              class="header-action"
              title="Refresh"
              aria-label="Refresh notifikasi"
              :disabled="loading"
              @click="handleRefresh"
            >
              <span :class="{ spinning: loading }">↻</span>
            </button>

            <button
              type="button"
              class="header-action close-action"
              aria-label="Tutup notifikasi"
              @click="closeDropdown"
            >
              <X :size="17" />
            </button>
          </div>
        </div>

        <!-- Feedback -->
        <div
          v-if="feedback"
          class="notification-feedback"
          :class="feedbackType"
        >
          <Check v-if="feedbackType === 'success'" :size="15" />

          <AlertCircle v-else :size="15" />

          {{ feedback }}
        </div>

        <!-- Loading -->
        <div
          v-if="loading && notifications.length === 0"
          class="notification-state"
        >
          <div class="loading-spinner"></div>
          <p>Memuat notifikasi...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="notifications.length === 0" class="notification-state">
          <div class="empty-icon">
            <Bell :size="25" />
          </div>

          <h4>Belum ada notifikasi</h4>
          <p>Aktivitas terbaru akan muncul di sini.</p>
        </div>

        <!-- Notification List -->
        <div v-else class="notification-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read_at }"
          >
            <!-- Notification Icon -->
            <div class="notification-icon">
              <component :is="notificationIcon(notification.type)" :size="19" />
            </div>

            <!-- Notification Content -->
            <div
              class="notification-content"
              role="button"
              tabindex="0"
              @click="handleNotificationClick(notification)"
              @keydown="handleNotificationKeydown($event, notification)"
            >
              <div class="notification-title-row">
                <h4>{{ notification.title }}</h4>

                <span v-if="!notification.read_at" class="unread-dot"></span>
              </div>

              <p>{{ notification.message }}</p>

              <span class="notification-time">
                {{ formatDate(notification.created_at) }}
              </span>
            </div>

            <!-- Delete Button -->
            <button
              type="button"
              class="delete-notification"
              title="Hapus notifikasi"
              aria-label="Hapus notifikasi"
              :disabled="updating"
              @click="handleDelete($event, notification.id)"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="notification-footer">
          <span> Menampilkan {{ notifications.length }} notifikasi </span>
        </div>
      </div>
    </Transition>

    <!-- Click Outside Overlay -->
    <div
      v-if="isOpen"
      class="notification-overlay"
      @click="closeDropdown"
    ></div>
  </div>
</template>

<style scoped>
.notification-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  z-index: 100;
}

.notification-trigger {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px solid #e9e0d4;
  border-radius: 12px;
  background: #fffdf9;
  color: #62574b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-trigger:hover,
.notification-trigger.active {
  background: #f6eee5;
  color: #943c14;
  border-color: #d9b59f;
}

.notification-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: #943c14;
  color: white;
  font-size: 10px;
  font-weight: 700;
  border: 2px solid #fffdf9;
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 390px;
  max-width: calc(100vw - 28px);
  background: #fffdf9;
  border: 1px solid #e9e0d4;
  border-radius: 16px;
  box-shadow: 0 15px 45px rgba(58, 42, 29, 0.16);
  overflow: hidden;
  z-index: 102;
}

.notification-header {
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee7de;
}

.notification-header h3 {
  margin: 0;
  color: #392d24;
  font-size: 16px;
  font-weight: 700;
}

.notification-header p {
  margin: 4px 0 0;
  color: #968879;
  font-size: 12px;
}

.header-actions {
  display: flex;
  gap: 5px;
}

.header-action {
  width: 31px;
  height: 31px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #827466;
  cursor: pointer;
  font-size: 23px;
}

.header-action:hover {
  background: #f5eee6;
  color: #943c14;
}

.header-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

.notification-feedback {
  padding: 9px 16px;
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
}

.notification-feedback.success {
  background: #edf5e9;
  color: #496d3d;
}

.notification-feedback.error {
  background: #fff0ec;
  color: #ad3825;
}

.notification-list {
  max-height: 390px;
  overflow-y: auto;
}

.notification-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px 16px;
  border-bottom: 1px solid #f0eae2;
  background: transparent;
  text-align: left;
  transition: background 0.2s ease;
}

.notification-item:hover {
  background: #faf5ee;
}

.notification-item.unread {
  background: #fcf5ee;
}

.notification-item.unread:hover {
  background: #f8eee4;
}

.notification-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #f4e8dc;
  color: #943c14;
}

.notification-content {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  outline: none;
}

.notification-content:focus-visible {
  border-radius: 5px;
  outline: 2px solid #943c14;
  outline-offset: 3px;
}

.notification-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.notification-title-row h4 {
  margin: 0;
  color: #403329;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
}

.notification-content p {
  margin: 5px 0 7px;
  color: #766b60;
  font-size: 12px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.notification-time {
  color: #a09283;
  font-size: 10px;
}

.unread-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #943c14;
}

.delete-notification {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #b0a397;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.notification-item:hover .delete-notification,
.delete-notification:focus-visible {
  opacity: 1;
}

.delete-notification:hover {
  background: #fce9e5;
  color: #b43d2b;
}

.delete-notification:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.notification-state {
  min-height: 190px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 25px;
  text-align: center;
}

.empty-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5eee6;
  color: #a18d79;
}

.notification-state h4 {
  margin: 13px 0 5px;
  color: #4a3b30;
  font-size: 14px;
}

.notification-state p {
  margin: 0;
  color: #9a8d80;
  font-size: 12px;
}

.loading-spinner {
  width: 25px;
  height: 25px;
  border: 3px solid #eaded1;
  border-top-color: #943c14;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.notification-footer {
  padding: 11px 16px;
  background: #fcf9f4;
  color: #9a8d80;
  font-size: 11px;
  text-align: center;
}

.notification-overlay {
  position: fixed;
  inset: 0;
  z-index: 101;
  background: transparent;
}

.notification-dropdown-enter-active,
.notification-dropdown-leave-active {
  transition: all 0.18s ease;
}

.notification-dropdown-enter-from,
.notification-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-7px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .notification-dropdown {
    position: fixed;
    top: 70px;
    right: 12px;
    width: calc(100vw - 24px);
    max-width: none;
  }

  .delete-notification {
    opacity: 1;
  }
}
</style>
