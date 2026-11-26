<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

import PublicLayout from "./layouts/PublicLayout.vue";
import AuthLayout from "./layouts/AuthLayout.vue";
import SplashScreen from "@/components/SplashScreen.vue";

const route = useRoute();

// ==========================================
// SPLASH SCREEN
// ==========================================

const showSplash = ref(!sessionStorage.getItem("kriyaloka-splash-seen"));

function finishSplash() {
  sessionStorage.setItem("kriyaloka-splash-seen", "true");
  showSplash.value = false;
}

// ==========================================
// ONLINE / OFFLINE DETECTION
// ==========================================

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
    <!-- ================================== -->
    <!-- LAYOUT APLIKASI -->
    <!-- ================================== -->

    <AuthLayout v-if="route.meta.authLayout" />
    <PublicLayout v-else-if="!route.meta.hidePublicLayout" />
    <RouterView v-else />

    <!-- ================================== -->
    <!-- INDIKATOR OFFLINE -->
    <!-- ================================== -->

    <Transition name="offline-transition">
      <div v-if="!isOnline" class="offline-indicator">
        <span class="offline-dot"></span>
        <span>Kamu sedang offline</span>
      </div>
    </Transition>

    <!-- ================================== -->
    <!-- SPLASH SCREEN -->
    <!-- ================================== -->

    <Transition name="splash-reveal">
      <SplashScreen v-if="showSplash" @finish="finishSplash" />
    </Transition>
  </div>
</template>

<style>
/* ==========================================
   SPLASH SCREEN - SMOOTH FADE OUT
========================================== */

.splash-reveal-enter-active {
  transition: opacity 0.3s ease;
}

.splash-reveal-leave-active {
  transition: opacity 0.9s ease-in-out;
  will-change: opacity;
}

.splash-reveal-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .splash-reveal-enter-active,
  .splash-reveal-leave-active {
    transition-duration: 0.01ms;
  }
}
/* ==========================================
   OFFLINE INDICATOR
========================================== */

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
