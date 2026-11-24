<script setup>
import { RefreshCw } from "lucide-vue-next";

defineProps({
  title: {
    type: String,
    default: "Dashboard",
  },
  breadcrumb: {
    type: String,
    default: "KriyaLoka / Admin",
  },
  refreshing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["refresh"]);
</script>

<template>
  <header class="admin-topbar">
    <div class="topbar-heading">
      <span class="breadcrumb">{{ breadcrumb }}</span>
      <h1>{{ title }}</h1>
    </div>

    <button
      class="refresh-button"
      type="button"
      :disabled="refreshing"
      @click="emit('refresh')"
    >
      <RefreshCw :size="16" :class="{ spinning: refreshing }" />

      <span>
        {{ refreshing ? "Memuat..." : "Refresh" }}
      </span>
    </button>
  </header>
</template>

<style scoped>
.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 34px;
}

.breadcrumb {
  color: #a09388;
  font-size: 12px;
}

.admin-topbar h1 {
  margin: 7px 0 0;
  color: #332b25;
  font-size: 28px;
  font-weight: 700;
}

.refresh-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid #e5ddd4;
  border-radius: 8px;
  background: #fff;
  color: #55473d;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: #faf5f0;
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .admin-topbar h1 {
    font-size: 23px;
  }

  .admin-topbar {
    margin-bottom: 25px;
  }

  .refresh-button {
    padding: 9px 11px;
  }
}

@media (max-width: 430px) {
  .admin-topbar {
    align-items: flex-start;
  }

  .admin-topbar h1 {
    font-size: 21px;
  }
}
</style>
