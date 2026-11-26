<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

import PublicLayout from "./layouts/PublicLayout.vue";
import AuthLayout from "./layouts/AuthLayout.vue";

const route = useRoute();

const isOnline = ref(navigator.onLine);

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine;
};

onMounted(() => {
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
});

onBeforeUnmount(() => {
  window.removeEventListener("online", updateOnlineStatus);
  window.removeEventListener("offline", updateOnlineStatus);
});
</script>

<template>
  <div class="app-shell">
    <!-- Layout aplikasi -->
    <AuthLayout v-if="route.meta.authLayout" />
    <PublicLayout v-else-if="!route.meta.hidePublicLayout" />
    <RouterView v-else />

    <!-- Indikator offline, tidak menutupi aplikasi -->
    <Transition name="offline-transition">
      <div v-if="!isOnline" class="offline-indicator">
        <span class="offline-dot"></span>
        <span>Kamu sedang offline</span>
      </div>
    </Transition>
  </div>
</template>

<style>
.offline-indicator {
  position: fixed;
  left: 50%;
  bottom: calc(16px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 99999;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;

  width: max-content;
  max-width: calc(100% - 32px);
  padding: 11px 17px;

  color: #fff;
  background: #4f5b2a;
  border-radius: 30px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);

  font-size: 12px;
  font-weight: 650;

  pointer-events: none;
}

.offline-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  background: #f3c76a;
  border-radius: 50%;
}

.offline-transition-enter-active,
.offline-transition-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.offline-transition-enter-from,
.offline-transition-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
