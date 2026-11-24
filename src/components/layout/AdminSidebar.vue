<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  LayoutDashboard,
  Store,
  Package,
  PackageCheck,
  Users,
  ShoppingBag,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-vue-next";

import { useAuthStore } from "../../stores/auth.js";
import { useAdminStore } from "../../stores/admin.js";

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const adminStore = useAdminStore();

const emit = defineEmits(["logout-error"]);

const navigation = [
  {
    label: "Dashboard",
    to: "/dashboard/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Manajemen Penjual",
    to: "/dashboard/admin/sellers",
    icon: Store,
    group: "sellers",
    showPendingCount: true,
    children: [
      {
        label: "Daftar Penjual",
        to: "/dashboard/admin/sellers",
        icon: Store,
      },
    ],
  },
  {
    label: "Manajemen Produk",
    to: "/dashboard/admin/products",
    icon: Package,
  },
  {
    label: "Review Produk",
    to: "/dashboard/admin/product-review",
    icon: PackageCheck,
  },
  {
    label: "Manajemen Pengguna",
    to: "/dashboard/admin/pengguna",
    icon: Users,
  },
  {
    label: "Manajemen Pesanan",
    to: "/dashboard/admin/pesanan",
    icon: ShoppingBag,
  },
];

const expandedGroups = ref({
  sellers: route.path.startsWith("/dashboard/admin/sellers"),
});

function toggleGroup(group) {
  expandedGroups.value[group] = !expandedGroups.value[group];
}

function isGroupActive(item) {
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

function isActive(item) {
  if (item.exact) {
    return route.path === item.to;
  }

  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

const isSellerDetail = computed(() => {
  return (
    route.path.startsWith("/dashboard/admin/sellers/") &&
    Boolean(route.params.sellerId)
  );
});

// Otomatis buka grup sesuai halaman yang sedang dikunjungi.
watch(
  () => route.path,
  (path) => {
    if (path.startsWith("/dashboard/admin/sellers")) {
      expandedGroups.value.sellers = true;
    }
  },
);

const adminInitial = computed(() => {
  return authStore.profile?.full_name?.charAt(0)?.toUpperCase() || "A";
});

const logout = async () => {
  try {
    await authStore.logout();
    await router.push("/login");
  } catch (error) {
    emit(
      "logout-error",
      error.message || "Gagal logout. Silakan coba kembali.",
    );
  }
};
</script>

<template>
  <aside class="admin-sidebar">
    <!-- Brand -->
    <RouterLink to="/" class="admin-brand">
      <span class="brand-symbol">K</span>

      <span>
        <strong>KriyaLoka</strong>
        <small>Admin Console</small>
      </span>
    </RouterLink>

    <!-- Navigation -->
    <div class="sidebar-label">MENU UTAMA</div>

    <nav class="sidebar-nav">
      <template v-for="item in navigation" :key="item.to">
        <!-- EXPANDABLE GROUP -->
        <div v-if="item.children" class="nav-group">
          <button
            type="button"
            class="nav-item nav-group-trigger"
            :class="{
              active: isGroupActive(item),
              expanded: expandedGroups[item.group],
            }"
            :aria-expanded="expandedGroups[item.group]"
            @click="toggleGroup(item.group)"
          >
            <component :is="item.icon" :size="18" />

            <span>{{ item.label }}</span>

            <span
              v-if="
                item.showPendingCount &&
                adminStore.statistics.pendingSellers > 0
              "
              class="nav-count"
            >
              {{ adminStore.statistics.pendingSellers }}
            </span>

            <component
              :is="expandedGroups[item.group] ? ChevronDown : ChevronRight"
              :size="15"
              class="group-chevron"
            />
          </button>

          <!-- SUBMENU -->
          <div v-if="expandedGroups[item.group]" class="nav-submenu">
            <RouterLink
              v-for="child in item.children"
              :key="child.to"
              :to="child.to"
              class="nav-subitem"
              :class="{
                active: route.path === child.to && !isSellerDetail,
              }"
            >
              <component :is="child.icon" :size="15" />
              <span>{{ child.label }}</span>
            </RouterLink>

            <!-- Detail Penjual hanya muncul saat sedang membuka detail -->
            <div
              v-if="item.group === 'sellers' && isSellerDetail"
              class="nav-subitem active current-subitem"
            >
              <FileText :size="15" />
              <span>Detail Penjual</span>
            </div>
          </div>
        </div>

        <!-- NORMAL MENU -->
        <RouterLink
          v-else
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item) }"
        >
          <component :is="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </template>
    </nav>

    <!-- Admin Account -->
    <div class="sidebar-bottom">
      <div class="admin-account">
        <div class="admin-avatar">
          {{ adminInitial }}
        </div>

        <div class="admin-account-info">
          <strong>
            {{ authStore.profile?.full_name || "Administrator" }}
          </strong>

          <small>Super Admin</small>
        </div>
      </div>

      <button class="logout-button" type="button" @click="logout">
        <LogOut :size="17" />
        <span>Logout</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.admin-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex: 0 0 250px;
  flex-direction: column;
  width: 250px;
  height: 100vh;
  padding: 27px 18px 20px;
  border-right: 1px solid #e9e3db;
  background: #fff;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 7px 35px;
  color: #332b25;
  text-decoration: none;
}

.brand-symbol {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  background: #943c14;
  color: #fff;
  font-family: Georgia, serif;
  font-size: 24px;
  font-weight: 700;
}

.admin-brand strong,
.admin-brand small {
  display: block;
}

.admin-brand strong {
  font-size: 16px;
}

.admin-brand small {
  margin-top: 3px;
  color: #998c81;
  font-size: 11px;
}

.sidebar-label {
  padding: 0 10px;
  color: #a69b91;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.sidebar-nav {
  display: grid;
  gap: 7px;
  margin-top: 14px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 11px;
  border-radius: 9px;
  color: #766b61;
  font-size: 13px;
  text-decoration: none;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.nav-item:hover {
  background: #faf5f0;
  color: #943c14;
}

.nav-item.active {
  background: #f9eee8;
  color: #943c14;
  font-weight: 700;
}

.nav-count {
  margin-left: auto;
  padding: 3px 7px;
  border-radius: 20px;
  background: #943c14;
  color: white;
  font-size: 10px;
}

.sidebar-bottom {
  margin-top: auto;
}

.admin-account {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 5px;
  border-top: 1px solid #eee8e1;
}

.admin-avatar {
  display: grid;
  flex-shrink: 0;
  width: 37px;
  height: 37px;
  place-items: center;
  border-radius: 50%;
  background: #eee3d8;
  color: #943c14;
  font-size: 14px;
  font-weight: 800;
}

.admin-account-info {
  min-width: 0;
}

.admin-account-info strong,
.admin-account-info small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-account-info strong {
  font-size: 12px;
}

.admin-account-info small {
  margin-top: 4px;
  color: #998c81;
  font-size: 11px;
}

.logout-button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #8b4935;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.logout-button:hover {
  background: #fff2ee;
}

@media (max-width: 720px) {
  .admin-sidebar {
    position: static;
    width: 100%;
    height: auto;
    padding: 15px 18px;
  }

  .admin-brand {
    padding-bottom: 15px;
  }

  .sidebar-label,
  .sidebar-bottom {
    display: none;
  }

  .sidebar-nav {
    display: flex;
    gap: 5px;
    margin-top: 0;
    overflow-x: auto;
  }

  .nav-item {
    flex: 1;
    justify-content: center;
    min-width: max-content;
    font-size: 11px;
  }

  .nav-item svg {
    flex-shrink: 0;
  }
  .nav-group {
    flex: 0 0 auto;
  }

  .nav-group-trigger {
    min-width: max-content;
  }

  .nav-submenu {
    margin-left: 5px;
  }
}

/* EXPANDABLE MENU */

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-group-trigger {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
}

.nav-group-trigger > span:first-of-type {
  flex: 1;
}

.group-chevron {
  margin-left: auto;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.nav-group-trigger.expanded .group-chevron {
  transform: rotate(0deg);
}

/* SUBMENU */

.nav-submenu {
  display: grid;
  gap: 4px;
  margin: 2px 0 7px 17px;
  padding-left: 13px;
  border-left: 1px solid #e9e3db;
  animation: submenu-enter 0.2s ease;
}

.nav-subitem {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 36px;
  padding: 8px 10px;
  border-radius: 8px;
  color: #8a7e73;
  font-size: 11px;
  text-decoration: none;
  transition: 0.2s ease;
}

.nav-subitem:hover {
  background: #faf5f0;
  color: #943c14;
}

.nav-subitem.active {
  background: #f9eee8;
  color: #943c14;
  font-weight: 700;
}

.current-subitem {
  cursor: default;
}

@keyframes submenu-enter {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
