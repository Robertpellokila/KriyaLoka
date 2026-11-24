<script setup>
import {
  ShieldCheck,
  ChevronRight,
  LogOut,
} from "lucide-vue-next";

defineProps({
  menuItems: {
    type: Array,
    default: () => [],
  },
  activeSection: {
    type: String,
    default: "overview",
  },
  userName: {
    type: String,
    default: "Pengguna",
  },
  userEmail: {
    type: String,
    default: "-",
  },
  userInitial: {
    type: String,
    default: "P",
  },
  mobileOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["change-section", "logout"]);
</script>

<template>
  <aside
    class="account-sidebar"
    :class="{ 'mobile-open': mobileOpen }"
  >
    <div class="account-user-card">
      <div class="user-avatar">{{ userInitial }}</div>

      <div class="user-info">
        <strong>{{ userName }}</strong>
        <span>{{ userEmail }}</span>
      </div>

      <div class="buyer-badge">
        <ShieldCheck :size="13" />
        Buyer
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <nav class="account-menu">
      <button
        v-for="item in menuItems"
        :key="item.id"
        type="button"
        class="menu-item"
        :class="{ active: activeSection === item.id }"
        @click="emit('change-section', item.id)"
      >
        <component :is="item.icon" :size="19" />
        <span>{{ item.label }}</span>

        <ChevronRight
          v-if="activeSection === item.id"
          class="menu-chevron"
          :size="16"
        />
      </button>
    </nav>

    <div class="sidebar-divider"></div>

    <button
      type="button"
      class="menu-item logout-button"
      @click="emit('logout')"
    >
      <LogOut :size="19" />
      <span>Keluar</span>
    </button>
  </aside>
</template>
