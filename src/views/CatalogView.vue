<script setup>
import { ref, computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  ArrowUpDown,
  PackageOpen,
} from "lucide-vue-next";

import { useProductStore } from "@/stores/product.js";
import { useCartStore } from "@/stores/cart.js";
import AppToast from "@/components/ui/AppToast.vue";

const productStore = useProductStore();
const cartStore = useCartStore();

const searchQuery = ref("");
const selectedCategory = ref("Semua");
const sortBy = ref("newest");
const loading = ref(false);

const toast = ref({
  visible: false,
  type: "success",
  title: "",
  message: "",
});

function showToast(type, title, message) {
  toast.value = {
    visible: true,
    type,
    title,
    message,
  };
}

const products = computed(() => productStore.publicProducts || []);

const categories = computed(() => {
  const uniqueCategories = [
    ...new Set(
      products.value.map((product) => product.category).filter(Boolean),
    ),
  ];

  return ["Semua", ...uniqueCategories];
});

const filteredProducts = computed(() => {
  let result = [...products.value];

  const keyword = searchQuery.value.trim().toLowerCase();

  if (keyword) {
    result = result.filter((product) => {
      return (
        product.name?.toLowerCase().includes(keyword) ||
        product.description?.toLowerCase().includes(keyword) ||
        product.category?.toLowerCase().includes(keyword)
      );
    });
  }

  if (selectedCategory.value !== "Semua") {
    result = result.filter(
      (product) => product.category === selectedCategory.value,
    );
  }

  if (sortBy.value === "price-low") {
    result.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy.value === "price-high") {
    result.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortBy.value === "name") {
    result.sort((a, b) => (a.name || "").localeCompare(b.name || "", "id"));
  } else {
    result.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );
  }

  return result;
});

function getProductImage(product) {
  return (
    product.product_images?.[0]?.image_url ||
    "https://placehold.co/600x600/F3EBDD/943C14?text=KriyaLoka"
  );
}

function formatPrice(price) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(price || 0));
}

async function addToCart(product) {
  if (!product || product.status !== "published") {
    showToast(
      "error",
      "Produk tidak tersedia",
      "Produk ini belum tersedia untuk dibeli.",
    );
    return;
  }

  if (Number(product.stock) <= 0) {
    showToast("error", "Stok habis", "Maaf, produk ini sedang kehabisan stok.");
    return;
  }

  const result = await cartStore.addItem(
    {
      id: product.id,
      name: product.name,
      artisan: product.artisan || product.store_name || "Pengrajin KriyaLoka",
      image: getProductImage(product),
      price: Number(product.price),
      stock: Number(product.stock),
    },
    1,
  );

  showToast(
    result.success ? "success" : "error",
    result.success ? "Berhasil ditambahkan" : "Gagal menambahkan produk",
    result.message,
  );
}

async function loadProducts() {
  loading.value = true;

  try {
    await productStore.fetchPublicProducts({ limit: 100 });
  } catch (error) {
    console.error("Gagal memuat katalog:", error);
    showToast(
      "error",
      "Gagal memuat katalog",
      error.message || "Silakan coba beberapa saat lagi.",
    );
  } finally {
    loading.value = false;
  }
}

onMounted(loadProducts);
</script>

<template>
  <div class="catalog-page">
    <AppToast
      v-model="toast.visible"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="3500"
    />

    <section class="catalog-hero">
      <div class="hero-content">
        <span class="eyebrow">KARYA LOKAL, CERITA ISTIMEWA</span>
        <h1>Temukan karya yang punya <em>cerita.</em></h1>
        <p>
          Jelajahi berbagai produk kerajinan pilihan dari tangan-tangan kreatif
          pengrajin lokal Indonesia.
        </p>
        <a href="#product-list" class="hero-link">
          Jelajahi koleksi
          <span>↓</span>
        </a>
      </div>

      <div class="hero-decoration">
        <div class="decoration-circle circle-one"></div>
        <div class="decoration-circle circle-two"></div>
        <div class="decoration-label">Made with<br />heart & craft</div>
      </div>
    </section>

    <section class="catalog-container" id="product-list">
      <div class="catalog-heading">
        <div>
          <span class="section-eyebrow">KOLEKSI KRIYALOKA</span>
          <h2>Jelajahi Produk</h2>
          <p>Temukan sesuatu yang istimewa untukmu.</p>
        </div>

        <div class="product-count">
          <strong>{{ filteredProducts.length }}</strong>
          <span>produk ditemukan</span>
        </div>
      </div>

      <div class="catalog-toolbar">
        <div class="search-box">
          <Search :size="19" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari produk atau kerajinan..."
          />
        </div>

        <div class="sort-box">
          <ArrowUpDown :size="17" />
          <select v-model="sortBy">
            <option value="newest">Terbaru</option>
            <option value="price-low">Harga terendah</option>
            <option value="price-high">Harga tertinggi</option>
            <option value="name">Nama produk</option>
          </select>
        </div>
      </div>

      <div class="category-list">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          class="category-button"
          :class="{ active: selectedCategory === category }"
          @click="selectedCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Sedang menyiapkan koleksi terbaik...</p>
      </div>

      <div v-else-if="filteredProducts.length" class="product-grid">
        <article
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-card"
        >
          <RouterLink
            :to="{ name: 'product-detail', params: { id: product.id } }"
            class="product-image-link"
          >
            <div class="product-image">
              <img
                :src="getProductImage(product)"
                :alt="product.name"
                loading="lazy"
              />

              <span class="product-category">
                {{ product.category || "Kerajinan" }}
              </span>
            </div>
          </RouterLink>

          <div class="product-info">
            <span class="artisan-name">
              {{ product.artisan || product.store_name || "Pengrajin Lokal" }}
            </span>

            <RouterLink
              :to="{ name: 'product-detail', params: { id: product.id } }"
              class="product-name"
            >
              {{ product.name }}
            </RouterLink>

            <div class="product-bottom">
              <div>
                <strong class="product-price">
                  {{ formatPrice(product.price) }}
                </strong>
                <span class="stock-info"> Stok {{ product.stock }} </span>
              </div>

              <button
                type="button"
                class="add-cart-button"
                title="Tambah ke keranjang"
                :disabled="Number(product.stock) <= 0"
                @click="addToCart(product)"
              >
                <ShoppingBag :size="18" />
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <PackageOpen :size="34" />
        </div>
        <h3>Produk belum ditemukan</h3>
        <p>Coba gunakan kata kunci lain atau pilih kategori yang berbeda.</p>
        <button
          type="button"
          @click="
            searchQuery = '';
            selectedCategory = 'Semua';
          "
        >
          Reset pencarian
        </button>
      </div>
    </section>

    <section class="catalog-bottom">
      <div>
        <span class="section-eyebrow">DUKUNG KARYA LOKAL</span>
        <h2>Setiap karya punya cerita. Jadilah bagian darinya.</h2>
      </div>
      <RouterLink to="/" class="bottom-link"> Kembali ke Beranda </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.catalog-page {
  background: #faf7f0;
  color: #30291f;
  min-height: 100vh;
  padding-bottom: 70px;
}

.catalog-hero {
  min-height: 390px;
  padding: 75px max(7%, calc((100% - 1200px) / 2));
  background: #efe5d4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 590px;
  position: relative;
  z-index: 2;
}

.eyebrow,
.section-eyebrow {
  color: #943c14;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.hero-content h1 {
  font-family: Georgia, serif;
  font-size: clamp(40px, 5vw, 65px);
  line-height: 1.08;
  font-weight: 500;
  margin: 20px 0;
  letter-spacing: -2px;
}

.hero-content h1 em {
  color: #943c14;
}

.hero-content p {
  max-width: 470px;
  color: #716657;
  line-height: 1.8;
  font-size: 15px;
}

.hero-link {
  display: inline-flex;
  align-items: center;
  gap: 15px;
  margin-top: 22px;
  padding: 13px 20px;
  background: #943c14;
  color: white;
  border-radius: 5px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
}

.hero-decoration {
  width: 300px;
  height: 260px;
  position: relative;
  flex-shrink: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
}

.circle-one {
  width: 220px;
  height: 220px;
  right: 10px;
  top: 10px;
  background: #b7b995;
}

.circle-two {
  width: 145px;
  height: 145px;
  right: 110px;
  top: 95px;
  background: #c47b54;
  border: 12px solid #efe5d4;
}

.decoration-label {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 15px 20px;
  background: #faf7f0;
  color: #943c14;
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 17px;
  line-height: 1.3;
  transform: rotate(-5deg);
}

.catalog-container {
  max-width: 1200px;
  padding: 70px 28px 35px;
  margin: auto;
}

.catalog-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.catalog-heading h2 {
  font-family: Georgia, serif;
  font-size: 36px;
  font-weight: 500;
  margin: 10px 0 5px;
}

.catalog-heading p {
  color: #857b6d;
  font-size: 14px;
  margin: 0;
}

.product-count {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #857b6d;
  font-size: 13px;
}

.product-count strong {
  color: #943c14;
  font-size: 23px;
}

.catalog-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
}

.search-box,
.sort-box {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e6ddcf;
  border-radius: 5px;
  background: #fffdf9;
  color: #8b806f;
  padding: 0 15px;
}

.search-box {
  flex: 1;
}

.search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #30291f;
  font: inherit;
  font-size: 13px;
}

.sort-box select {
  border: 0;
  outline: 0;
  background: transparent;
  color: #514738;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.category-list {
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.category-button {
  border: 1px solid #e5dac9;
  border-radius: 30px;
  padding: 9px 17px;
  color: #716657;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.category-button:hover,
.category-button.active {
  background: #943c14;
  border-color: #943c14;
  color: white;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 25px 20px;
}

.product-card {
  background: #fffdf9;
  border: 1px solid #eee6da;
  border-radius: 7px;
  overflow: hidden;
  transition:
    transform 0.25s,
    box-shadow 0.25s;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px #4b382012;
}

.product-image-link {
  display: block;
  text-decoration: none;
}

.product-image {
  height: 235px;
  background: #eee6da;
  position: relative;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-category {
  position: absolute;
  left: 12px;
  top: 12px;
  background: #faf7f0ef;
  color: #943c14;
  padding: 6px 10px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
}

.product-info {
  padding: 17px;
}

.artisan-name {
  display: block;
  color: #8c806f;
  font-size: 11px;
  margin-bottom: 7px;
}

.product-name {
  display: block;
  min-height: 42px;
  color: #30291f;
  font-family: Georgia, serif;
  font-size: 17px;
  text-decoration: none;
  line-height: 1.35;
}

.product-name:hover {
  color: #943c14;
}

.product-bottom {
  border-top: 1px solid #eee6da;
  margin-top: 15px;
  padding-top: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.product-price {
  display: block;
  color: #943c14;
  font-size: 14px;
}

.stock-info {
  display: block;
  color: #948a7c;
  font-size: 10px;
  margin-top: 4px;
}

.add-cart-button {
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 5px;
  color: white;
  background: #64704c;
  cursor: pointer;
  transition: 0.2s;
}

.add-cart-button:hover {
  background: #485438;
}

.add-cart-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 70px 20px;
  color: #827768;
}

.loading-spinner {
  width: 35px;
  height: 35px;
  margin: 0 auto 15px;
  border: 3px solid #e7ddcf;
  border-top-color: #943c14;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  width: 65px;
  height: 65px;
  margin: auto auto 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #eee6da;
  color: #943c14;
}

.empty-state h3 {
  font-family: Georgia, serif;
  color: #30291f;
  font-size: 24px;
  font-weight: 500;
}

.empty-state p {
  font-size: 13px;
}

.empty-state button {
  margin-top: 12px;
  border: 0;
  border-radius: 4px;
  background: #943c14;
  color: white;
  padding: 11px 18px;
  cursor: pointer;
}

.catalog-bottom {
  max-width: 1200px;
  margin: 35px auto 0;
  padding: 35px 28px;
  background: #e8eadf;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
}

.catalog-bottom h2 {
  max-width: 580px;
  font-family: Georgia, serif;
  font-size: 27px;
  font-weight: 500;
  line-height: 1.3;
}

.bottom-link {
  flex-shrink: 0;
  padding: 13px 18px;
  background: #64704c;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 950px) {
  .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .hero-decoration {
    transform: scale(0.8);
    transform-origin: right center;
  }
}

@media (max-width: 680px) {
  .catalog-hero {
    min-height: 340px;
    padding: 55px 25px;
  }

  .hero-decoration {
    display: none;
  }

  .hero-content h1 {
    font-size: 43px;
  }

  .catalog-container {
    padding: 45px 18px 25px;
  }

  .catalog-heading {
    align-items: start;
  }

  .catalog-heading h2 {
    font-size: 29px;
  }

  .product-count {
    flex-direction: column;
    align-items: end;
    gap: 0;
    white-space: nowrap;
  }

  .catalog-toolbar {
    flex-direction: column;
  }

  .sort-box {
    justify-content: space-between;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 13px;
  }

  .product-image {
    height: 175px;
  }

  .product-info {
    padding: 12px;
  }

  .product-name {
    font-size: 15px;
  }

  .product-price {
    font-size: 12px;
  }

  .add-cart-button {
    width: 34px;
    height: 34px;
  }

  .catalog-bottom {
    margin: 20px 18px 0;
    padding: 25px 20px;
    flex-direction: column;
    align-items: start;
  }

  .catalog-bottom h2 {
    font-size: 23px;
  }
}

@media (max-width: 360px) {
  .product-grid {
    grid-template-columns: 1fr;
  }

  .product-image {
    height: 230px;
  }
}
</style>
