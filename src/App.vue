<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute, RouterView } from "vue-router";

import PublicLayout from "./layouts/PublicLayout.vue";
import AuthLayout from "./layouts/AuthLayout.vue";
import NotFoundView from "./views/NotFoundView.vue";

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

    <!-- Offline screen -->
    <Transition name="offline-transition">
      <div v-if="!isOnline" class="offline-screen">
        <NotFoundView type="offline" />
      </div>
    </Transition>
  </div>
</template>

<style>
.offline-screen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  overflow-y: auto;
  background: #f8f6ef;
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
  transform: translateY(12px);
}
</style>
