<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { Search, ShoppingBag, Menu, X, UserRound } from "lucide-vue-next";
import { useCartStore } from "../../stores/cart.js";

const cartStore = useCartStore();
const router = useRouter();
const searchQuery = ref("");
const mobileMenuOpen = ref(false);

function searchProducts() {
  const query = searchQuery.value.trim();

  router.push({
    name: "catalog",
    query: query ? { q: query } : {},
  });

  mobileMenuOpen.value = false;
}

function closeMenu() {
  mobileMenuOpen.value = false;
}
</script>

<template>
  <header class="site-header">
    <div class="header-inner container">
      <RouterLink to="/" class="brand" @click="closeMenu">
        <span class="brand-symbol">K</span>
        <span class="brand-name">Kriya<span>Loka</span></span>
        <!-- <img src="/img/Logo.png" alt=""> -->
      </RouterLink>

      <form class="header-search" @submit.prevent="searchProducts">
        <Search :size="19" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Cari kerajinan perak, anyaman, ukiran..."
        />
        <button type="submit" aria-label="Cari">Cari</button>
      </form>

      <nav class="desktop-nav">
        <RouterLink to="/">Beranda</RouterLink>
        <RouterLink to="/katalog">Kategori</RouterLink>
        <a href="/#produk">Produk Unggulan</a>
        <a href="/#pengrajin">Tentang Pengrajin</a>
      </nav>

      <div class="header-actions">
        <RouterLink to="/keranjang" class="cart-link">
          <ShoppingBag :size="19" />

          <!-- <span>Keranjang</span> -->

          <span v-if="cartStore.totalItems > 0" class="cart-count">
            {{ cartStore.totalItems }}
          </span>
        </RouterLink>

        <RouterLink to="/login" class="login-link"> Masuk </RouterLink>

        <RouterLink to="/register" class="btn btn-primary register-link">
          Daftar
        </RouterLink>

        <button
          class="icon-button mobile-menu-button"
          @click="mobileMenuOpen = !mobileMenuOpen"
          :aria-label="mobileMenuOpen ? 'Tutup menu' : 'Buka menu'"
        >
          <X v-if="mobileMenuOpen" :size="23" />
          <Menu v-else :size="23" />
        </button>
      </div>
    </div>

    <div v-if="mobileMenuOpen" class="mobile-nav">
      <RouterLink to="/" @click="closeMenu">Beranda</RouterLink>
      <RouterLink to="/katalog" @click="closeMenu">Kategori</RouterLink>
      <RouterLink to="/keranjang" @click="closeMenu">Keranjang</RouterLink>
      <RouterLink to="/login" @click="closeMenu">Masuk</RouterLink>
      <RouterLink to="/register" @click="closeMenu">Daftar</RouterLink>

      <form class="mobile-search" @submit.prevent="searchProducts">
        <input
          v-model="searchQuery"
          placeholder="Cari produk..."
          type="search"
        />
        <button class="btn btn-primary" type="submit">
          <Search :size="17" />
        </button>
      </form>
    </div>
  </header>
</template>

<style scoped>
.cart-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: inherit;
  text-decoration: none;
}

.cart-count {
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
</style>
