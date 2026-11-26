<script setup>
import {
  computed,
  ref,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";

import { RouterLink, useRouter, useRoute } from "vue-router";

import {
  Search,
  ShoppingBag,
  Menu,
  X,
  UserRound,
  Home,
  Store,
  Sparkles,
  Phone,
  LogOut,
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

const searchOpen = ref(false);
const mobileSearchRef = ref(null);

const desktopNav = ref(null);
const navItems = ref([]);

const indicatorStyle = ref({
  width: "0px",
  transform: "translate3d(0, -50%, 0)",
});

const indicatorReady = ref(false);

const profileOpen = ref(false);

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

const isShopper = computed(
  () => !authStore.isAuthenticated || authStore.role === "buyer",
);

// ==========================================
// LIQUID NAVIGATION
// ==========================================

const activeNavIndex = computed(() => {
  if (route.path === "/") return 0;
  if (route.path === "/katalog") return 1;

  if (route.path === "/produk-unggulan") return 2;

  if (route.path === "/kontak") return 3;

  return -1;
});

const mobileActiveIndex = computed(() =>
  searchOpen.value ? 4 : activeNavIndex.value,
);

function setNavItem(element, index) {
  if (element?.$el) {
    element = element.$el;
  }

  navItems.value[index] = element || null;
}

// ==========================================
// PROFILE
// ==========================================

function toggleProfile() {
  profileOpen.value = !profileOpen.value;

  if (profileOpen.value) {
    searchOpen.value = false;
  }
}

async function handleLogout() {
  profileOpen.value = false;

  await authStore.logout();

  router.push("/");
}

// ==========================================
// LIQUID INDICATOR
// ==========================================

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

  indicatorStyle.value = {
    width: `${itemRect.width}px`,
    transform: `translate3d(${left}px, -50%, 0)`,
  };

  indicatorReady.value = true;
}

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
  searchOpen.value = false;
}

function toggleSearch() {
  searchOpen.value = !searchOpen.value;

  if (searchOpen.value) {
    profileOpen.value = false;

    nextTick(() => {
      mobileSearchRef.value?.focus();
    });
  }
}

// ==========================================
// CLOSE MENU
// ==========================================

function closeMenu() {
  mobileMenuOpen.value = false;
  searchOpen.value = false;
  profileOpen.value = false;
}

function onKeydown(event) {
  if (event.key === "Escape") {
    searchOpen.value = false;
    profileOpen.value = false;
  }
}

// ==========================================
// BODY CLASS
// ==========================================

function syncBodyClass() {
  document.body.classList.toggle("has-bottom-nav", isShopper.value);
}

// ==========================================
// WATCHERS
// ==========================================

watch(
  () => route.fullPath,
  async () => {
    await updateLiquidIndicator();
    closeMenu();
  },
);

watch(isShopper, syncBodyClass);

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(() => {
  updateLiquidIndicator();
  syncBodyClass();

  window.addEventListener("resize", handleResize);
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("keydown", onKeydown);

  document.body.classList.remove("has-bottom-nav");
});
</script>

<template>
  <header class="site-header" :class="{ shopper: isShopper }">
    <div class="header-inner container">
      <!-- BRAND -->

      <RouterLink to="/" class="brand" @click="closeMenu">
        <span class="brand-symbol">K</span>

        <span class="brand-name"> Kriya<span>Loka</span> </span>
      </RouterLink>

      <!-- DESKTOP SEARCH -->

      <form class="header-search" @submit.prevent="searchProducts">
        <Search :size="19" />

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Cari kerajinan perak, anyaman, ukiran..."
        />

        <button type="submit" aria-label="Cari">Cari</button>
      </form>

      <!-- DESKTOP NAVIGATION -->

      <nav ref="desktopNav" class="desktop-nav liquid-nav">
        <span
          class="liquid-indicator"
          :class="{ ready: indicatorReady }"
          :style="indicatorStyle"
        ></span>

        <RouterLink
          :ref="(el) => setNavItem(el, 0)"
          to="/"
          :class="{
            'is-liquid-active': activeNavIndex === 0,
          }"
        >
          Beranda
        </RouterLink>

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

        <RouterLink
          :ref="(el) => setNavItem(el, 2)"
          to="/produk-unggulan"
          :class="{
            'is-liquid-active': activeNavIndex === 2,
          }"
        >
          Produk Unggulan
        </RouterLink>

        <!-- Kontak -->

        <RouterLink
          :ref="(el) => setNavItem(el, 3)"
          to="/kontak"
          :class="{
            'is-liquid-active': activeNavIndex === 3,
          }"
        >
          Kontak
        </RouterLink>
      </nav>

      <!-- HEADER ACTIONS -->

      <div class="header-actions">
        <NotificationBell
          v-if="authStore.isAuthenticated && authStore.role === 'buyer'"
        />

        <RouterLink
          to="/keranjang"
          class="cart-link"
          aria-label="Keranjang belanja"
        >
          <ShoppingBag :size="19" />

          <span v-if="cartStore.totalItems > 0" class="cart-count">
            {{ cartStore.totalItems }}
          </span>
        </RouterLink>

        <!-- GUEST -->

        <template v-if="!authStore.isAuthenticated">
          <RouterLink to="/login" class="btn-login"> Masuk </RouterLink>

          <RouterLink to="/register" class="btn-register"> Daftar </RouterLink>
        </template>

        <!-- AUTHENTICATED -->

        <template v-else>
          <RouterLink
            v-if="authStore.role === 'buyer'"
            :to="dashboardPath"
            class="btn-account"
            aria-label="Akun Saya"
            title="Akun Saya"
          >
            <UserRound :size="22" />
          </RouterLink>

          <RouterLink v-else :to="dashboardPath" class="btn-dashboard">
            Dashboard
          </RouterLink>
        </template>

        <!-- MOBILE MENU BUTTON -->

        <button
          class="icon-button mobile-menu-button"
          @click="mobileMenuOpen = !mobileMenuOpen"
          :aria-label="mobileMenuOpen ? 'Tutup menu' : 'Buka menu'"
          :aria-expanded="mobileMenuOpen"
        >
          <X v-if="mobileMenuOpen" :size="23" />
          <Menu v-else :size="23" />
        </button>
      </div>
    </div>

    <!-- MOBILE NAVIGATION SELLER & ADMIN -->

    <Transition name="mobile-dropdown">
      <div v-if="mobileMenuOpen && !isShopper" class="mobile-nav">
        <RouterLink to="/" @click="closeMenu"> Beranda </RouterLink>

        <RouterLink to="/katalog" @click="closeMenu"> Produk </RouterLink>

        <RouterLink to="/produk-unggulan" @click="closeMenu">
          Produk Unggulan
        </RouterLink>

        <RouterLink to="/kontak" @click="closeMenu"> Kontak </RouterLink>

        <RouterLink to="/keranjang" @click="closeMenu"> Keranjang </RouterLink>

        <RouterLink :to="dashboardPath" @click="closeMenu">
          Dashboard
        </RouterLink>

        <form class="mobile-search" @submit.prevent="searchProducts">
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

  <!-- ==========================================
       MOBILE SHOPPER
       DIPINDAHKAN LANGSUNG KE BODY
  =========================================== -->

  <Teleport to="body">
    <div v-if="isShopper" class="shopper-mobile">
      <!-- FLOATING CART -->

      <RouterLink
        to="/keranjang"
        class="float-btn float-cart"
        aria-label="Keranjang belanja"
      >
        <ShoppingBag :size="21" />

        <span v-if="cartStore.totalItems > 0" class="cart-count">
          {{ cartStore.totalItems }}
        </span>
      </RouterLink>

      <!-- FLOATING BRAND -->

      <RouterLink to="/" class="float-brand" aria-label="KriyaLoka">
        <span class="brand-symbol">K</span>

        <span class="brand-name"> Kriya<span>Loka</span> </span>
      </RouterLink>

      <!-- FLOATING RIGHT -->

      <div class="float-right">
        <div v-if="authStore.isAuthenticated" class="float-bell">
          <NotificationBell />
        </div>

        <!-- GUEST -->

        <RouterLink
          v-if="!authStore.isAuthenticated"
          to="/login"
          class="float-btn"
          aria-label="Masuk"
        >
          <UserRound :size="21" />
        </RouterLink>

        <!-- BUYER PROFILE -->

        <div v-else class="float-profile">
          <button
            type="button"
            class="float-btn"
            :class="{ 'is-open': profileOpen }"
            aria-label="Menu akun"
            aria-haspopup="menu"
            :aria-expanded="profileOpen"
            @click="toggleProfile"
          >
            <UserRound :size="21" />
          </button>

          <Transition name="pop">
            <div v-if="profileOpen" class="profile-menu" role="menu">
              <RouterLink
                :to="dashboardPath"
                class="profile-item"
                role="menuitem"
                @click="closeMenu"
              >
                <UserRound :size="18" />
                <span>Profil Saya</span>
              </RouterLink>

              <button
                type="button"
                class="profile-item danger"
                role="menuitem"
                @click="handleLogout"
              >
                <LogOut :size="18" />
                <span>Keluar</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>

      <!-- SEARCH SCRIM -->

      <Transition name="fade">
        <div
          v-if="searchOpen"
          class="search-scrim"
          @click="searchOpen = false"
        ></div>
      </Transition>

      <!-- PROFILE SCRIM -->

      <Transition name="fade">
        <div
          v-if="profileOpen"
          class="search-scrim"
          @click="profileOpen = false"
        ></div>
      </Transition>

      <!-- SEARCH SHEET -->

      <Transition name="sheet">
        <form
          v-if="searchOpen"
          class="bottom-search"
          @submit.prevent="searchProducts"
        >
          <Search :size="19" />

          <input
            ref="mobileSearchRef"
            v-model="searchQuery"
            type="search"
            placeholder="Cari perak, anyaman, ukiran..."
            aria-label="Cari produk"
          />

          <button type="submit">Cari</button>
        </form>
      </Transition>

      <!-- BOTTOM NAVIGATION -->

      <nav
        class="bottom-nav"
        aria-label="Navigasi utama"
        :style="{
          '--index': Math.max(mobileActiveIndex, 0),
        }"
      >
        <span
          class="bottom-indicator"
          :class="{ ready: mobileActiveIndex >= 0 }"
        ></span>

        <RouterLink
          to="/"
          class="bottom-item"
          :class="{ active: mobileActiveIndex === 0 }"
          @click="closeMenu"
        >
          <Home :size="20" />
          <span>Beranda</span>
        </RouterLink>

        <RouterLink
          to="/katalog"
          class="bottom-item"
          :class="{ active: mobileActiveIndex === 1 }"
          @click="closeMenu"
        >
          <Store :size="20" />
          <span>Produk</span>
        </RouterLink>

        <RouterLink
          to="/produk-unggulan"
          class="bottom-item"
          :class="{ active: mobileActiveIndex === 2 }"
          @click="closeMenu"
        >
          <Sparkles :size="20" />
          <span>Unggulan</span>
        </RouterLink>

        <RouterLink
          to="/kontak"
          class="bottom-item"
          :class="{ active: mobileActiveIndex === 3 }"
          @click="closeMenu"
        >
          <Phone :size="20" />
          <span>Kontak</span>
        </RouterLink>

        <button
          type="button"
          class="bottom-item"
          :class="{ active: mobileActiveIndex === 4 }"
          :aria-expanded="searchOpen"
          @click="toggleSearch"
        >
          <Search :size="20" />
          <span>Cari</span>
        </button>
      </nav>
    </div>
  </Teleport>
</template>

<!-- GLOBAL BODY SPACING -->

<style>
@media (max-width: 900px) {
  body.has-bottom-nav {
    padding-top: calc(70px + env(safe-area-inset-top, 0px));
    padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
  }
}
</style>

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

/* HEADER INNER */

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

/* BRAND */

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

/* SEARCH */

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

  box-shadow: 0 0 0 3px rgba(148, 60, 20, 0.08);
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

/* DESKTOP NAVIGATION */

.desktop-nav {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 24px;
  white-space: nowrap;
}

/* LIQUID NAVIGATION */

.liquid-nav {
  position: relative;
  isolation: isolate;

  padding: 7px;
  gap: 5px;
}

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

.liquid-nav > a.router-link-active {
  color: #66584f;
  background: transparent;
}

.liquid-nav > a.is-liquid-active {
  color: #fff;
}

.liquid-nav > a:not(.is-liquid-active):hover {
  color: #943c14;
  transform: translateY(-1px);
}

.liquid-nav > a:active {
  transform: scale(0.96);
}

/* HEADER ACTIONS */

.header-actions {
  display: flex;
  align-items: center;

  gap: 16px;
  flex-shrink: 0;
}

/* CART */

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

/* ACCOUNT */

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

  box-shadow: 0 5px 14px rgba(148, 60, 20, 0.18);

  transform: translateY(-2px);
}

.btn-account.router-link-active {
  background: #943c14;
  color: white;
}

/* DASHBOARD & REGISTER */

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

  box-shadow: 0 5px 14px rgba(148, 60, 20, 0.18);

  transform: translateY(-2px);
}

/* LOGIN */

.btn-login {
  color: #943c14;

  font-size: 14px;
  font-weight: 700;

  text-decoration: none;
}

/* MOBILE MENU BUTTON */

.mobile-menu-button {
  display: none;
}

/* MOBILE NAVIGATION SELLER & ADMIN */

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

  box-shadow: 0 12px 35px rgba(48, 31, 20, 0.12);
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

/* MOBILE SEARCH SELLER & ADMIN */

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

/* MOBILE DROPDOWN TRANSITION */

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

/* SHOPPER MOBILE */

.shopper-mobile {
  display: none;
}

/* ========================================
   TABLET
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
   MOBILE
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

  /* HEADER SHOPPER DISEMBUNYIKAN */

  .site-header.shopper {
    position: static;

    width: 100%;
    height: 0;

    margin: 0;

    background: transparent;

    border: 0;
    border-radius: 0;

    box-shadow: none;

    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .site-header.shopper:hover {
    box-shadow: none;
  }

  .site-header.shopper .header-inner {
    display: none;
  }

  /* TELEPORTED SHOPPER LAYOUT */

  .shopper-mobile {
    display: block;
  }

  /* FLOAT BUTTON */

  .float-btn {
    position: fixed !important;
    z-index: 1000;

    top: calc(12px + env(safe-area-inset-top, 0px));
    bottom: auto !important;

    display: grid;
    place-items: center;

    width: 46px;
    height: 46px;

    background: rgba(255, 255, 255, 0.94);
    color: #943c14;

    border: 1px solid rgba(148, 60, 20, 0.1);
    border-radius: 50%;

    box-shadow:
      0 8px 22px rgba(48, 31, 20, 0.14),
      0 2px 6px rgba(48, 31, 20, 0.06);

    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);

    text-decoration: none;

    transition:
      transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
      background 0.2s ease,
      color 0.2s ease;
  }

  .float-btn:active {
    transform: scale(0.92);
  }

  .float-btn:hover {
    background: #943c14;
    color: #fff;
  }

  .float-cart {
    left: 14px;
  }

  /* FLOAT RIGHT */

  .float-right {
    position: fixed;
    z-index: 1000;

    top: calc(12px + env(safe-area-inset-top, 0px));
    right: 14px;

    display: flex;
    align-items: center;
    gap: 10px;
  }

  .float-right .float-btn {
    position: relative !important;

    top: auto !important;
    bottom: auto !important;
  }

  /* NOTIFICATION */

  .float-bell {
    display: grid;
    place-items: center;

    width: 46px;
    height: 46px;

    background: rgba(255, 255, 255, 0.94);
    color: #943c14;

    border: 1px solid rgba(148, 60, 20, 0.1);
    border-radius: 50%;

    box-shadow:
      0 8px 22px rgba(48, 31, 20, 0.14),
      0 2px 6px rgba(48, 31, 20, 0.06);
  }

  .float-bell :deep(.notification-wrapper) {
    width: 100%;
    height: 100%;

    display: grid;
    place-items: center;
  }

  .float-bell :deep(.notification-trigger) {
    width: 100%;
    height: 100%;

    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;

    border-radius: 50%;
  }

  /* TOP BACKGROUND */

  .shopper-mobile::before {
    content: "";

    position: fixed;
    z-index: 999;

    top: 0;
    left: 0;
    right: 0;

    height: calc(70px + env(safe-area-inset-top, 0px));

    background: linear-gradient(
      to bottom,
      rgba(253, 250, 247, 0.95) 40%,
      transparent
    );

    pointer-events: none;
  }

  /* FLOAT BRAND */

  .float-brand {
    position: fixed;
    z-index: 1000;

    top: calc(12px + env(safe-area-inset-top, 0px));

    left: 50%;

    transform: translate3d(-50%, 0, 0);

    display: inline-flex;
    align-items: center;
    gap: 7px;

    height: 46px;

    padding: 0 14px 0 7px;

    background: rgba(255, 255, 255, 0.94);

    border: 1px solid rgba(148, 60, 20, 0.1);
    border-radius: 999px;

    box-shadow:
      0 8px 22px rgba(48, 31, 20, 0.14),
      0 2px 6px rgba(48, 31, 20, 0.06);

    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);

    text-decoration: none;
  }

  .float-brand .brand-symbol {
    width: 32px;
    height: 32px;

    border-radius: 50%;
    font-size: 17px;
  }

  .float-brand .brand-name {
    font-size: 16px;
    letter-spacing: -0.5px;
  }

  /* ========================================
     BOTTOM NAVIGATION
     PERBAIKAN UTAMA ANDROID
  ======================================== */

  .bottom-nav {
    position: fixed !important;

    z-index: 1001;

    top: auto !important;

    left: 50% !important;

    right: auto !important;

    bottom: calc(14px + env(safe-area-inset-bottom, 0px)) !important;

    transform: translate3d(-50%, 0, 0) !important;

    width: min(440px, calc(100% - 28px));

    padding: 6px;

    display: grid;
    grid-template-columns: repeat(5, 1fr);

    background: rgba(255, 255, 255, 0.95);

    border: 1px solid rgba(148, 60, 20, 0.1);
    border-radius: 24px;

    box-shadow:
      0 14px 36px rgba(48, 31, 20, 0.18),
      0 3px 10px rgba(48, 31, 20, 0.07);

    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);

    isolation: isolate;
  }

  /* BOTTOM INDICATOR */

  .bottom-indicator {
    position: absolute;
    z-index: -1;

    top: 6px;
    bottom: 6px;
    left: 6px;

    width: calc((100% - 12px) / 5);

    border-radius: 18px;

    background: #943c14;

    opacity: 0;

    transform: translateX(calc(var(--index, 0) * 100%));

    transition:
      transform 0.6s cubic-bezier(0.22, 1.4, 0.36, 1),
      opacity 0.2s ease;

    pointer-events: none;

    will-change: transform;
  }

  .bottom-indicator.ready {
    opacity: 1;
  }

  .bottom-indicator::before {
    content: "";

    position: absolute;

    top: 3px;
    left: 14%;
    right: 14%;

    height: 8px;

    border-radius: 999px;

    background: rgba(255, 255, 255, 0.17);

    filter: blur(5px);
  }

  /* BOTTOM ITEMS */

  .bottom-item {
    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    gap: 4px;

    padding: 10px 0 9px;

    border: 0;

    background: transparent;

    color: #66584f;

    font: inherit;
    font-size: 10.5px;
    font-weight: 600;

    text-decoration: none;

    cursor: pointer;

    -webkit-tap-highlight-color: transparent;

    transition:
      color 0.3s ease,
      transform 0.2s ease;
  }

  .bottom-item svg {
    transition: transform 0.4s cubic-bezier(0.22, 1.4, 0.36, 1);
  }

  .bottom-item:active {
    transform: scale(0.92);
  }

  .bottom-item.active {
    color: #fff;
  }

  .bottom-item.active svg {
    transform: translateY(-1px) scale(1.1);
  }

  .bottom-item:focus-visible,
  .float-btn:focus-visible,
  .float-brand:focus-visible {
    outline: 2px solid #943c14;
    outline-offset: 2px;
  }

  /* SEARCH SCRIM */

  .search-scrim {
    position: fixed;

    inset: 0;

    z-index: 999;

    background: rgba(48, 31, 20, 0.22);
  }

  /* BOTTOM SEARCH */

  .bottom-search {
    position: fixed;

    z-index: 1002;

    left: 50%;

    bottom: calc(14px + 76px + 12px + env(safe-area-inset-bottom, 0px));

    transform: translate3d(-50%, 0, 0);

    width: min(440px, calc(100% - 28px));

    height: 54px;

    padding: 0 8px 0 16px;

    display: flex;
    align-items: center;
    gap: 10px;

    background: #fff;
    color: #76665c;

    border: 1px solid #eaded3;
    border-radius: 18px;

    box-shadow: 0 14px 36px rgba(48, 31, 20, 0.18);

    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  .bottom-search:focus-within {
    border-color: #943c14;

    box-shadow:
      0 0 0 4px rgba(148, 60, 20, 0.1),
      0 14px 36px rgba(48, 31, 20, 0.18);
  }

  .bottom-search input {
    flex: 1;
    min-width: 0;

    border: 0;
    outline: 0;

    background: transparent;
    color: #382b24;

    font: inherit;
    font-size: 16px;
  }

  .bottom-search button {
    height: 38px;

    padding: 0 16px;

    border: 0;
    border-radius: 12px;

    background: #943c14;
    color: #fff;

    font: inherit;
    font-size: 13px;
    font-weight: 700;

    cursor: pointer;
  }

  /* FADE */

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.25s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  /* SHEET */

  .sheet-enter-active,
  .sheet-leave-active {
    transition:
      opacity 0.25s ease,
      transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .sheet-enter-from,
  .sheet-leave-to {
    opacity: 0;

    transform: translate3d(-50%, 18px, 0) scale(0.97);
  }
}

/* SMALL MOBILE */

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

  .site-header.shopper {
    width: 100%;
    margin: 0;
    border-radius: 0;
  }
}

/* DESKTOP: SHOPPER MOBILE DISEMBUNYIKAN */

@media (min-width: 901px) {
  .shopper-mobile {
    display: none;
  }
}

/* REDUCED MOTION */

@media (prefers-reduced-motion: reduce) {
  .liquid-indicator,
  .liquid-nav > a,
  .mobile-nav,
  .mobile-dropdown-enter-active,
  .mobile-dropdown-leave-active,
  .btn-account,
  .cart-link,
  .bottom-indicator,
  .bottom-item,
  .bottom-item svg,
  .float-btn,
  .sheet-enter-active,
  .sheet-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none !important;
    animation: none !important;
  }
}

/* ========================================
   PROFILE POPUP
======================================== */

.float-profile {
  position: relative;
}

.float-right button.float-btn {
  padding: 0;
  cursor: pointer;
}

.float-btn.is-open {
  background: #943c14;
  color: #fff;
}

.profile-menu {
  position: absolute;

  top: calc(100% + 10px);
  right: 0;

  width: 190px;

  padding: 6px;

  display: flex;
  flex-direction: column;
  gap: 2px;

  background: #fff;

  border: 1px solid #eaded3;
  border-radius: 16px;

  box-shadow:
    0 14px 36px rgba(48, 31, 20, 0.18),
    0 3px 10px rgba(48, 31, 20, 0.07);

  transform-origin: top right;
}

.profile-item {
  display: flex;
  align-items: center;

  gap: 10px;

  width: 100%;

  padding: 12px;

  border: 0;
  border-radius: 11px;

  background: transparent;
  color: #514239;

  font: inherit;
  font-size: 14px;
  font-weight: 600;

  text-align: left;
  text-decoration: none;

  cursor: pointer;

  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.profile-item:hover,
.profile-item:active {
  background: #f8eee6;
  color: #943c14;
}

.profile-item.danger {
  color: #b42318;
}

.profile-item.danger:hover,
.profile-item.danger:active {
  background: #fef3f2;
  color: #b42318;
}

/* PROFILE POPUP TRANSITION */

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>