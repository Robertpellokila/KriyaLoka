
<script setup>
import {
  computed,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";

import {
  RouterLink,
  useRouter,
  useRoute,
} from "vue-router";

import {
  Search,
  ShoppingBag,
  Menu,
  X,
  UserRound,
} from "lucide-vue-next";

import { useCartStore } from "../../stores/cart.js";
import { useAuthStore } from "@/stores/auth.js";

import NotificationBell from "../notifications/NotificationBell.vue";

// ==========================================
// STORES & ROUTER
// ==========================================

const cartStore = useCartStore();
const authStore = useAuthStore();

const router = useRouter();
const route = useRoute();

// ==========================================
// STATE
// ==========================================

const searchQuery = ref("");
const mobileMenuOpen = ref(false);

// Liquid navigation
const desktopNav = ref(null);
const navItems = ref([]);

const indicatorStyle = ref({
  width: "0px",
  transform: "translate3d(0, -50%, 0)",
});

const indicatorReady = ref(false);

// ==========================================
// ROLE NAVIGATION
// ==========================================

const dashboardPath = computed(() => {
  const destinations = {
    buyer: "/account",
    seller: "/dashboard/penjual",
    super_admin: "/dashboard/admin",
  };

  return destinations[authStore.role] || "/";
});

// ==========================================
// LIQUID NAVIGATION
// ==========================================

// Menentukan menu aktif berdasarkan URL
const activeNavIndex = computed(() => {
  if (route.path === "/") return 0;

  if (route.path === "/katalog") return 1;

  return -1;
});

// Menyimpan elemen menu berdasarkan index
function setNavItem(element, index) {
  if (element?.$el) {
    element = element.$el;
  }

  navItems.value[index] = element || null;
}

// Menghitung posisi indikator
async function updateLiquidIndicator() {
  await nextTick();

  const index = activeNavIndex.value;
  const nav = desktopNav.value;
  const activeItem = navItems.value[index];

  if (!nav || !activeItem || index < 0) {
    indicatorStyle.value = {
      width: "0px",
      transform: "translate3d(0, -50%, 0)",
    };

    indicatorReady.value = false;
    return;
  }

  const navRect = nav.getBoundingClientRect();
  const itemRect = activeItem.getBoundingClientRect();

  const left = itemRect.left - navRect.left;
  const width = itemRect.width;

  indicatorStyle.value = {
    width: `${width}px`,
    transform: `translate3d(${left}px, -50%, 0)`,
  };

  indicatorReady.value = true;
}

// Memperbarui posisi ketika ukuran layar berubah
function handleResize() {
  updateLiquidIndicator();
}

// ==========================================
// SEARCH PRODUCTS
// ==========================================

function searchProducts() {
  const query = searchQuery.value.trim();

  router.push({
    name: "catalog",
    query: query ? { q: query } : {},
  });

  mobileMenuOpen.value = false;
}

// ==========================================
// MOBILE MENU
// ==========================================

function closeMenu() {
  mobileMenuOpen.value = false;
}

// ==========================================
// WATCH ROUTE
// ==========================================

watch(
  () => route.fullPath,
  async () => {
    await updateLiquidIndicator();
    closeMenu();
  },
);

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(() => {
  updateLiquidIndicator();

  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <header class="site-header">
    <div class="header-inner container">

      <!-- ==================================
           BRAND
      =================================== -->

      <RouterLink
        to="/"
        class="brand"
        @click="closeMenu"
      >
        <span class="brand-symbol">K</span>

        <span class="brand-name">
          Kriya<span>Loka</span>
        </span>
      </RouterLink>

      <!-- ==================================
           DESKTOP SEARCH
      =================================== -->

      <form
        class="header-search"
        @submit.prevent="searchProducts"
      >
        <Search :size="19" />

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Cari kerajinan perak, anyaman, ukiran..."
        />

        <button type="submit" aria-label="Cari">
          Cari
        </button>
      </form>

      <!-- ==================================
           DESKTOP NAVIGATION
           LIQUID EFFECT
      =================================== -->

      <nav
        ref="desktopNav"
        class="desktop-nav liquid-nav"
      >
        <!-- Liquid Indicator -->

        <span
          class="liquid-indicator"
          :class="{ ready: indicatorReady }"
          :style="indicatorStyle"
        ></span>

        <!-- Beranda -->

        <RouterLink
          :ref="(el) => setNavItem(el, 0)"
          to="/"
          :class="{
            'is-liquid-active': activeNavIndex === 0,
          }"
        >
          Beranda
        </RouterLink>

        <!-- Produk -->

        <RouterLink
          :ref="(el) => setNavItem(el, 1)"
          to="/katalog"
          :class="{
            'is-liquid-active': activeNavIndex === 1,
          }"
        >
          Produk
        </RouterLink>

        <!-- Produk Unggulan -->

        <a href="/#produk">
          Produk Unggulan
        </a>

        <!-- Tentang Pengrajin -->

        <a href="/#pengrajin">
          Tentang Pengrajin
        </a>
      </nav>

      <!-- ==================================
           HEADER ACTIONS
      =================================== -->

      <div class="header-actions">

        <!-- Notification khusus buyer -->

        <NotificationBell
          v-if="
            authStore.isAuthenticated &&
            authStore.role === 'buyer'
          "
        />

        <!-- Cart -->

        <RouterLink
          to="/keranjang"
          class="cart-link"
          aria-label="Keranjang belanja"
        >
          <ShoppingBag :size="19" />

          <span
            v-if="cartStore.totalItems > 0"
            class="cart-count"
          >
            {{ cartStore.totalItems }}
          </span>
        </RouterLink>

        <!-- Guest -->

        <template v-if="!authStore.isAuthenticated">

          <RouterLink
            to="/login"
            class="btn-login"
          >
            Masuk
          </RouterLink>

          <RouterLink
            to="/register"
            class="btn-register"
          >
            Daftar
          </RouterLink>

        </template>

        <!-- Authenticated User -->

        <template v-else>

          <!-- Buyer: User Icon -->

          <RouterLink
            v-if="authStore.role === 'buyer'"
            :to="dashboardPath"
            class="btn-account"
            aria-label="Akun Saya"
            title="Akun Saya"
          >
            <UserRound :size="22" />
          </RouterLink>

          <!-- Seller & Admin: Dashboard -->

          <RouterLink
            v-else
            :to="dashboardPath"
            class="btn-dashboard"
          >
            Dashboard
          </RouterLink>

        </template>

        <!-- Mobile Menu Button -->

        <button
          class="icon-button mobile-menu-button"
          @click="mobileMenuOpen = !mobileMenuOpen"
          :aria-label="
            mobileMenuOpen
              ? 'Tutup menu'
              : 'Buka menu'
          "
          :aria-expanded="mobileMenuOpen"
        >
          <X
            v-if="mobileMenuOpen"
            :size="23"
          />

          <Menu
            v-else
            :size="23"
          />
        </button>

      </div>
    </div>

    <!-- ==================================
         MOBILE NAVIGATION
    =================================== -->

    <Transition name="mobile-dropdown">
      <div
        v-if="mobileMenuOpen"
        class="mobile-nav"
      >

        <RouterLink
          to="/"
          @click="closeMenu"
        >
          Beranda
        </RouterLink>

        <RouterLink
          to="/katalog"
          @click="closeMenu"
        >
          Produk
        </RouterLink>

        <a
          href="/#produk"
          @click="closeMenu"
        >
          Produk Unggulan
        </a>

        <a
          href="/#pengrajin"
          @click="closeMenu"
        >
          Tentang Pengrajin
        </a>

        <RouterLink
          to="/keranjang"
          @click="closeMenu"
        >
          Keranjang
        </RouterLink>

        <!-- Guest -->

        <template v-if="!authStore.isAuthenticated">

          <RouterLink
            to="/login"
            @click="closeMenu"
          >
            Masuk
          </RouterLink>

          <RouterLink
            to="/register"
            @click="closeMenu"
          >
            Daftar
          </RouterLink>

        </template>

        <!-- Authenticated -->

        <RouterLink
          v-else
          :to="dashboardPath"
          @click="closeMenu"
        >
          {{
            authStore.role === "buyer"
              ? "Akun Saya"
              : "Dashboard"
          }}
        </RouterLink>

        <!-- Mobile Search -->

        <form
          class="mobile-search"
          @submit.prevent="searchProducts"
        >
          <input
            v-model="searchQuery"
            placeholder="Cari produk..."
            type="search"
          />

          <button
            class="btn btn-primary"
            type="submit"
            aria-label="Cari produk"
          >
            <Search :size="17" />
          </button>
        </form>

      </div>
    </Transition>

  </header>
</template>

<style scoped>

/* ========================================
   FLOATING NAVBAR - KRIYALOKA
======================================== */

.site-header {
  position: sticky;
  top: 14px;
  z-index: 1000;

  width: min(1240px, calc(100% - 40px));
  margin: 14px auto 0;

  background: rgba(255, 255, 255, 0.96);

  border: 1px solid rgba(148, 60, 20, 0.1);
  border-radius: 18px;

  box-shadow:
    0 8px 30px rgba(48, 31, 20, 0.07),
    0 2px 8px rgba(48, 31, 20, 0.03);

  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  transition: box-shadow 0.3s ease;
}

.site-header:hover {
  box-shadow:
    0 12px 36px rgba(48, 31, 20, 0.1),
    0 3px 10px rgba(48, 31, 20, 0.04);
}

/* ========================================
   HEADER INNER
======================================== */

.header-inner {
  width: 100%;
  max-width: none;

  min-height: 76px;

  margin: 0;
  padding: 12px 24px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 24px;
}

/* ========================================
   BRAND
======================================== */

.brand {
  display: inline-flex;
  align-items: center;

  gap: 10px;
  flex-shrink: 0;

  text-decoration: none;
}

.brand-symbol {
  display: grid;
  place-items: center;

  width: 40px;
  height: 40px;

  background: #943c14;
  color: white;

  border-radius: 11px;

  font-size: 23px;
  font-weight: 800;
}

.brand-name {
  color: #29221e;

  font-size: 22px;
  font-weight: 800;

  letter-spacing: -1px;
}

.brand-name span {
  color: #943c14;
}

/* ========================================
   SEARCH
======================================== */

.header-search {
  display: flex;
  align-items: center;

  gap: 12px;

  width: 330px;
  height: 46px;

  padding: 0 14px;

  background: #fff;

  border: 1px solid #eaded3;
  border-radius: 11px;

  color: #76665c;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.header-search:focus-within {
  border-color: #943c14;

  box-shadow:
    0 0 0 3px rgba(148, 60, 20, 0.08);
}

.header-search input {
  width: 100%;
  min-width: 0;

  border: none;
  outline: none;

  background: transparent;

  font-size: 13px;
  color: #382b24;
}

.header-search button {
  border: none;

  background: none;
  color: #943c14;

  font-size: 13px;
  font-weight: 700;

  cursor: pointer;
}

/* ========================================
   DESKTOP NAVIGATION
======================================== */

.desktop-nav {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 24px;
  white-space: nowrap;
}

.desktop-nav a {
  position: relative;

  color: #66584f;

  text-decoration: none;

  font-size: 13px;
  font-weight: 600;

  transition: color 0.2s ease;
}

/* ========================================
   LIQUID NAVIGATION
======================================== */

.liquid-nav {
  position: relative;
  isolation: isolate;

  padding: 7px;
  gap: 5px;
}

/* Liquid indicator */

.liquid-indicator {
  position: absolute;
  z-index: -1;

  top: 50%;
  left: 0;

  height: 38px;
  width: 0;

  border-radius: 999px;

  background: #943c14;

  opacity: 0;
  pointer-events: none;

  transition:
    transform 0.65s cubic-bezier(0.22, 1.4, 0.36, 1),
    width 0.65s cubic-bezier(0.22, 1.4, 0.36, 1),
    opacity 0.2s ease;

  will-change: transform, width;
}

.liquid-indicator.ready {
  opacity: 1;
}

/* Light reflection */

.liquid-indicator::before {
  content: "";

  position: absolute;

  top: 3px;
  left: 12%;
  right: 12%;

  height: 8px;

  border-radius: 999px;

  background: rgba(255, 255, 255, 0.17);

  filter: blur(5px);
}

/* Nav links */

.liquid-nav > a {
  position: relative;
  z-index: 1;

  padding: 11px 15px;

  color: #66584f;

  border-radius: 999px;

  text-decoration: none;

  transition:
    color 0.3s ease,
    transform 0.3s ease;

  white-space: nowrap;
}

/* Override RouterLink active background */

.liquid-nav > a.router-link-active {
  color: #66584f;
  background: transparent;
}

/* Active menu */

.liquid-nav > a.is-liquid-active {
  color: #fff;
}

/* Hover */

.liquid-nav > a:not(.is-liquid-active):hover {
  color: #943c14;
  transform: translateY(-1px);
}

/* Press effect */

.liquid-nav > a:active {
  transform: scale(0.96);
}

/* ========================================
   HEADER ACTIONS
======================================== */

.header-actions {
  display: flex;
  align-items: center;

  gap: 16px;
  flex-shrink: 0;
}

/* ========================================
   CART
======================================== */

.cart-link {
  position: relative;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 38px;
  height: 38px;

  color: #30251f;

  text-decoration: none;

  border-radius: 10px;

  transition: background 0.2s ease;
}

.cart-link:hover {
  background: #f8eee6;
}

.cart-count {
  position: absolute;

  top: -3px;
  right: -3px;

  display: grid;
  place-items: center;

  min-width: 18px;
  height: 18px;

  padding: 0 4px;

  color: #fff;
  background: #943c14;

  border-radius: 50px;

  font-size: 10px;
  font-weight: 700;
}

/* ========================================
   ACCOUNT BUTTON - BUYER
======================================== */

.btn-account {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 42px;
  height: 42px;

  background: #f8eee6;
  color: #943c14;

  border: 1px solid #eaded3;
  border-radius: 50%;

  text-decoration: none;

  transition: all 0.25s ease;
}

.btn-account:hover {
  background: #943c14;
  color: white;

  border-color: #943c14;

  box-shadow:
    0 5px 14px rgba(148, 60, 20, 0.18);

  transform: translateY(-2px);
}

.btn-account.router-link-active {
  background: #943c14;
  color: white;
}

/* ========================================
   DASHBOARD & REGISTER BUTTON
======================================== */

.btn-dashboard,
.btn-register {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 12px 23px;

  border: 1px solid #943c14;
  border-radius: 11px;

  background: #943c14;
  color: white;

  font-size: 14px;
  font-weight: 700;

  text-decoration: none;
  white-space: nowrap;

  transition: all 0.25s ease;
}

.btn-dashboard:hover,
.btn-register:hover {
  background: #7d3210;
  border-color: #7d3210;

  box-shadow:
    0 5px 14px rgba(148, 60, 20, 0.18);

  transform: translateY(-2px);
}

/* ========================================
   LOGIN BUTTON
======================================== */

.btn-login {
  color: #943c14;

  font-size: 14px;
  font-weight: 700;

  text-decoration: none;
}

/* ========================================
   MOBILE MENU BUTTON
======================================== */

.mobile-menu-button {
  display: none;
}

/* ========================================
   MOBILE NAVIGATION
======================================== */

.mobile-nav {
  position: absolute;

  top: calc(100% + 10px);
  left: 0;
  right: 0;

  display: flex;
  flex-direction: column;

  gap: 6px;

  padding: 18px;

  background: #fff;

  border: 1px solid #eaded3;
  border-radius: 16px;

  box-shadow:
    0 12px 35px rgba(48, 31, 20, 0.12);
}

.mobile-nav > a {
  padding: 12px 14px;

  border-radius: 9px;

  color: #514239;

  font-size: 14px;
  font-weight: 600;

  text-decoration: none;

  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.mobile-nav > a:hover,
.mobile-nav > a.router-link-active {
  background: #f8eee6;
  color: #943c14;
}

/* ========================================
   MOBILE SEARCH
======================================== */

.mobile-search {
  display: flex;

  gap: 8px;
  margin-top: 8px;
}

.mobile-search input {
  flex: 1;
  min-width: 0;

  padding: 12px;

  border: 1px solid #eaded3;
  border-radius: 9px;

  outline: none;
}

.mobile-search input:focus {
  border-color: #943c14;
}

.mobile-search button {
  display: grid;
  place-items: center;

  width: 44px;

  border: none;
  border-radius: 9px;

  background: #943c14;
  color: white;

  cursor: pointer;
}

/* ========================================
   MOBILE DROPDOWN TRANSITION
======================================== */

.mobile-dropdown-enter-active,
.mobile-dropdown-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.mobile-dropdown-enter-from,
.mobile-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

/* ========================================
   RESPONSIVE - TABLET
======================================== */

@media (max-width: 1100px) {
  .header-inner {
    gap: 16px;
    padding: 12px 18px;
  }

  .header-search {
    width: 250px;
  }

  .desktop-nav {
    gap: 5px;
  }

  .liquid-nav > a {
    padding: 10px 11px;
    font-size: 12px;
  }
}

/* ========================================
   RESPONSIVE - MOBILE
======================================== */

@media (max-width: 900px) {
  .desktop-nav {
    display: none;
  }

  .mobile-menu-button {
    display: grid;
    place-items: center;

    width: 40px;
    height: 40px;

    border: none;
    border-radius: 10px;

    background: #f8eee6;
    color: #943c14;

    cursor: pointer;
  }

  .header-inner {
    justify-content: space-between;
  }
}

/* ========================================
   SMALL MOBILE
======================================== */

@media (max-width: 600px) {
  .site-header {
    width: calc(100% - 24px);

    top: 10px;
    margin-top: 10px;

    border-radius: 15px;
  }

  .header-inner {
    min-height: 64px;

    padding: 10px 13px;
    gap: 10px;
  }

  .brand {
    gap: 7px;
  }

  .brand-symbol {
    width: 35px;
    height: 35px;

    font-size: 20px;
  }

  .brand-name {
    font-size: 19px;
  }

  .header-search {
    display: none;
  }

  .header-actions {
    gap: 8px;
  }

  .btn-dashboard,
  .btn-register {
    padding: 10px 13px;
    font-size: 12px;
  }

  .cart-link {
    width: 34px;
    height: 34px;
  }

  .mobile-menu-button {
    width: 36px;
    height: 36px;
  }

  .btn-account {
    width: 36px;
    height: 36px;
  }
}

/* ========================================
   REDUCED MOTION
======================================== */

@media (prefers-reduced-motion: reduce) {
  .liquid-indicator,
  .liquid-nav > a,
  .mobile-nav,
  .mobile-dropdown-enter-active,
  .mobile-dropdown-leave-active,
  .btn-account,
  .cart-link {
    transition: none !important;
    animation: none !important;
  }
}

</style>
