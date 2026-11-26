<script setup>
import { computed } from "vue";
import { ShieldCheck, ChevronRight, LogOut } from "lucide-vue-next";

const props = defineProps({
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
});

const emit = defineEmits(["change-section", "logout"]);

// Pengelompokan menu agar daftar lebih mudah dipindai.
const groupDefinitions = [
  { title: "Akun", ids: ["overview", "profile", "addresses"] },
  { title: "Aktivitas", ids: ["orders", "wishlist", "reviews"] },
  { title: "Lainnya", ids: ["settings"] },
];

const menuGroups = computed(() =>
  groupDefinitions
    .map((group) => ({
      title: group.title,
      items: group.ids
        .map((id) => props.menuItems.find((item) => item.id === id))
        .filter(Boolean),
    }))
    .filter((group) => group.items.length > 0),
);
</script>

<template>
  <aside class="account-sidebar">
    <div class="account-user-card">
      <div class="user-avatar">{{ userInitial }}</div>

      <div class="user-info">
        <strong>{{ userName }}</strong>
        <span>{{ userEmail }}</span>
      </div>

      <div class="buyer-badge">
        <ShieldCheck :size="13" />
        Pembeli
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <nav class="account-menu" aria-label="Menu akun">
      <div
        v-for="group in menuGroups"
        :key="group.title"
        class="account-menu-group"
      >
        <p class="menu-group-title">{{ group.title }}</p>

        <button
          v-for="item in group.items"
          :key="item.id"
          type="button"
          class="menu-item"
          :class="{ active: activeSection === item.id }"
          :aria-current="activeSection === item.id ? 'page' : undefined"
          @click="emit('change-section', item.id)"
        >
          <component :is="item.icon" :size="19" />
          <span>{{ item.label }}</span>

          <ChevronRight class="menu-chevron" :size="16" />
        </button>
      </div>
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