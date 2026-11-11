<script setup>
import { computed } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import {
  LayoutDashboard,
  ShoppingBag,
  UserRound,
  Store,
  Package,
  ClipboardList,
  LogOut,
  ChevronRight,
} from "lucide-vue-next";

import { useAuthStore } from "../stores/auth.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const role = computed(() => authStore.profile?.role);

const dashboardConfig = computed(() => {
  if (role.value === "seller") {
    return {
      title: "Seller Center",
      subtitle: "Kelola usaha dan produk Anda",
      links: [
        {
          label: "Dashboard",
          path: "/dashboard/penjual",
          icon: LayoutDashboard,
        },
        {
          label: "Profil Toko",
          path: "/dashboard/penjual/toko",
          icon: Store,
        },
        {
          label: "Produk Saya",
          path: "/dashboard/penjual/produk",
          icon: Package,
        },
        {
          label: "Pesanan",
          path: "/dashboard/penjual/pesanan",
          icon: ClipboardList,
        },
        {
          label: "Profil Akun",
          path: "/profil",
          icon: UserRound,
        },
      ],
    };
  }

  return {
    title: "Buyer Center",
    subtitle: "Kelola aktivitas belanja Anda",
    links: [
      {
        label: "Dashboard",
        path: "/dashboard/pembeli",
        icon: LayoutDashboard,
      },
      {
        label: "Pesanan Saya",
        path: "/dashboard/pembeli/pesanan",
        icon: ShoppingBag,
      },
      {
        label: "Profil Akun",
        path: "/profil",
        icon: UserRound,
      },
    ],
  };
});

const isActive = (path) => route.path === path;

const logout = async () => {
  try {
    await authStore.logout();
    await router.push("/login");
  } catch (error) {
    console.error("Gagal logout:", error);
  }
};
</script>

<template>
  <div class="dashboard-layout">
    <aside class="dashboard-sidebar">
      <RouterLink to="/" class="brand">
        <span class="brand-symbol">K</span>

        <span>
          <strong>KriyaLoka</strong>
          <small>{{ dashboardConfig.title }}</small>
        </span>
      </RouterLink>

      <div class="sidebar-description">
        {{ dashboardConfig.subtitle }}
      </div>

      <nav class="sidebar-menu">
        <RouterLink
          v-for="item in dashboardConfig.links"
          :key="item.path"
          :to="item.path"
          class="menu-link"
          :class="{ active: isActive(item.path) }"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
          <ChevronRight
            v-if="isActive(item.path)"
            :size="15"
            class="menu-arrow"
          />
        </RouterLink>
      </nav>

      <div class="sidebar-bottom">
        <div class="account-info">
          <div class="account-avatar">
            {{ authStore.profile?.full_name?.charAt(0) || "U" }}
          </div>

          <div class="account-text">
            <strong>{{ authStore.profile?.full_name }}</strong>
            <small>
              {{ role === "seller" ? "Penjual" : "Pembeli" }}
            </small>
          </div>
        </div>

        <button class="logout-button" @click="logout">
          <LogOut :size="17" />
          Keluar
        </button>
      </div>
    </aside>

    <div class="dashboard-content">
      <header class="dashboard-topbar">
        <div>
          <span class="topbar-caption">Ruang kerja KriyaLoka</span>
          <h1>{{ dashboardConfig.title }}</h1>
        </div>

        <RouterLink to="/" class="visit-store">
          Kunjungi Marketplace
          <ChevronRight :size="16" />
        </RouterLink>
      </header>

      <main class="dashboard-page">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: flex;
  background: #f8f6f2;
  color: #332b25;
}

.dashboard-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex: 0 0 250px;
  flex-direction: column;
  height: 100vh;
  padding: 25px 17px 18px;
  border-right: 1px solid #e9e3db;
  background: #fff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 5px;
  color: #332b25;
  text-decoration: none;
}

.brand-symbol {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 11px;
  background: #943c14;
  color: white;
  font-family: Georgia, serif;
  font-size: 24px;
  font-weight: 700;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 16px;
}

.brand small {
  margin-top: 4px;
  color: #998c81;
  font-size: 11px;
}

.sidebar-description {
  margin: 32px 7px 13px;
  color: #a09388;
  font-size: 11px;
  line-height: 1.6;
}

.sidebar-menu {
  display: grid;
  gap: 6px;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 10px;
  border-radius: 8px;
  color: #766b61;
  font-size: 12px;
  text-decoration: none;
  transition: 0.2s;
}

.menu-link:hover,
.menu-link.active {
  background: #f9eee8;
  color: #943c14;
}

.menu-link.active {
  font-weight: 700;
}

.menu-arrow {
  margin-left: auto;
}

.sidebar-bottom {
  margin-top: auto;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 4px;
  border-top: 1px solid #eee8e1;
}

.account-avatar {
  display: grid;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: #eee3d8;
  color: #943c14;
  font-weight: 800;
}

.account-text {
  min-width: 0;
}

.account-text strong,
.account-text small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-text strong {
  font-size: 11px;
}

.account-text small {
  margin-top: 4px;
  color: #998c81;
  font-size: 10px;
}

.logout-button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #943c14;
  font-size: 12px;
  cursor: pointer;
}

.logout-button:hover {
  background: #fff2ee;
}

.dashboard-content {
  min-width: 0;
  flex: 1;
}

.dashboard-topbar {
  display: flex;
  min-height: 82px;
  align-items: center;
  justify-content: space-between;
  padding: 15px 32px;
  border-bottom: 1px solid #e9e3db;
  background: white;
}

.topbar-caption {
  color: #a09388;
  font-size: 10px;
}

.dashboard-topbar h1 {
  margin: 5px 0 0;
  font-size: 18px;
}

.visit-store {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #943c14;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.dashboard-page {
  padding: 30px 32px;
}

@media (max-width: 720px) {
  .dashboard-layout {
    display: block;
  }

  .dashboard-sidebar {
    position: static;
    width: 100%;
    height: auto;
    padding: 15px;
  }

  .sidebar-description,
  .sidebar-bottom {
    display: none;
  }

  .sidebar-menu {
    display: flex;
    overflow-x: auto;
    margin-top: 15px;
  }

  .menu-link {
    flex-shrink: 0;
  }

  .dashboard-topbar {
    min-height: 68px;
    padding: 12px 16px;
  }

  .dashboard-page {
    padding: 22px 16px;
  }
}
</style>
