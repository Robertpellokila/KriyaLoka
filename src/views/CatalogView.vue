<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  PackageOpen,
} from "lucide-vue-next";

import ProductCard from "../components/product/ProductCard.vue";
import { products, categories } from "../data/products.js";

const route = useRoute();
const router = useRouter();

const searchInput = ref(route.query.q || "");
const selectedCategory = ref(route.query.kategori || "");
const sortBy = ref("popular");
const onlyDiscount = ref(false);

const currentPage = ref(1);
const itemsPerPage = 8;

// Sinkronisasi jika URL berubah dari luar halaman katalog.
watch(
  () => route.query,
  (query) => {
    searchInput.value = query.q || "";
    selectedCategory.value = query.kategori || "";
    currentPage.value = 1;
  },
);

const applySearch = () => {
  router.push({
    path: "/katalog",
    query: {
      ...(searchInput.value.trim() ? { q: searchInput.value.trim() } : {}),
      ...(selectedCategory.value ? { kategori: selectedCategory.value } : {}),
    },
  });

  currentPage.value = 1;
};

const filteredProducts = computed(() => {
  let result = [...products];

  const keyword = String(searchInput.value || "")
    .toLowerCase()
    .trim();

  if (keyword) {
    result = result.filter((product) => {
      return (
        product.name.toLowerCase().includes(keyword) ||
        product.artisan.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.location.toLowerCase().includes(keyword)
      );
    });
  }

  if (selectedCategory.value) {
    const category = categories.find(
      (item) => item.slug === selectedCategory.value,
    );

    if (category) {
      result = result.filter((product) => product.category === category.name);
    }
  }

  if (onlyDiscount.value) {
    result = result.filter(
      (product) =>
        product.originalPrice && product.originalPrice > product.price,
    );
  }

  if (sortBy.value === "price-low") {
    result.sort((a, b) => a.price - b.price);
  } else if (sortBy.value === "price-high") {
    result.sort((a, b) => b.price - a.price);
  } else if (sortBy.value === "rating") {
    result.sort((a, b) => b.rating - a.rating);
  } else if (sortBy.value === "popular") {
    result.sort((a, b) => b.sold - a.sold);
  }

  return result;
});

const totalPages = computed(() =>
  Math.ceil(filteredProducts.value.length / itemsPerPage),
);

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;

  return filteredProducts.value.slice(start, start + itemsPerPage);
});

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const clearFilters = () => {
  searchInput.value = "";
  selectedCategory.value = "";
  sortBy.value = "popular";
  onlyDiscount.value = false;
  currentPage.value = 1;

  router.push("/katalog");
};

const formatCategory = computed(() => {
  const category = categories.find(
    (item) => item.slug === selectedCategory.value,
  );

  return category?.name || "Semua Produk";
});
</script>

<template>
  <main class="catalog-page">
    <!-- PAGE HEADER -->
    <section class="catalog-hero">
      <div class="catalog-container">
        <div class="breadcrumb">
          <RouterLink to="/">Beranda</RouterLink>
          <span>/</span>
          <span>Katalog Produk</span>
        </div>

        <span class="section-eyebrow">KOLEKSI KRIYALOKA</span>

        <h1>Jelajahi Karya Lokal</h1>

        <p>
          Temukan berbagai produk kerajinan unik dari pengrajin kreatif di
          seluruh Bali.
        </p>

        <form class="catalog-search" @submit.prevent="applySearch">
          <Search :size="20" />

          <input
            v-model="searchInput"
            type="search"
            placeholder="Cari produk, kategori, atau pengrajin..."
          />

          <button type="submit">Cari Produk</button>
        </form>
      </div>
    </section>

    <!-- CATALOG CONTENT -->
    <section class="catalog-content">
      <div class="catalog-container">
        <div class="catalog-layout">
          <!-- SIDEBAR FILTER -->
          <aside class="filter-sidebar">
            <div class="filter-heading">
              <div>
                <SlidersHorizontal :size="18" />
                <h2>Filter Produk</h2>
              </div>

              <button class="clear-button" @click="clearFilters">Reset</button>
            </div>

            <div class="filter-group">
              <h3>Kategori</h3>

              <label class="category-option">
                <input
                  v-model="selectedCategory"
                  type="radio"
                  value=""
                  @change="applySearch"
                />
                <span>Semua Produk</span>
              </label>

              <label
                v-for="category in categories"
                :key="category.id"
                class="category-option"
              >
                <input
                  v-model="selectedCategory"
                  type="radio"
                  :value="category.slug"
                  @change="applySearch"
                />

                <span>{{ category.name }}</span>
              </label>
            </div>

            <div class="filter-group">
              <h3>Penawaran</h3>

              <label class="discount-option">
                <input v-model="onlyDiscount" type="checkbox" />
                <span>Produk diskon</span>
              </label>
            </div>

            <button class="reset-filter" @click="clearFilters">
              <X :size="15" />
              Hapus semua filter
            </button>
          </aside>

          <!-- PRODUCT AREA -->
          <div class="catalog-main">
            <div class="catalog-toolbar">
              <div class="catalog-result">
                <h2>{{ formatCategory }}</h2>
                <p>Menampilkan {{ filteredProducts.length }} produk</p>
              </div>

              <div class="sort-control">
                <ArrowUpDown :size="16" />

                <select v-model="sortBy">
                  <option value="popular">Paling Populer</option>
                  <option value="price-low">Harga Terendah</option>
                  <option value="price-high">Harga Tertinggi</option>
                  <option value="rating">Rating Tertinggi</option>
                </select>
              </div>
            </div>

            <!-- ACTIVE FILTERS -->
            <div
              v-if="selectedCategory || onlyDiscount || searchInput"
              class="active-filters"
            >
              <span>Filter aktif:</span>

              <span v-if="selectedCategory" class="filter-chip">
                {{ formatCategory }}
              </span>

              <span v-if="onlyDiscount" class="filter-chip"> Diskon </span>

              <span v-if="searchInput" class="filter-chip">
                "{{ searchInput }}"
              </span>

              <button @click="clearFilters">Hapus semua</button>
            </div>

            <!-- PRODUCTS -->
            <div v-if="paginatedProducts.length" class="product-grid">
              <ProductCard
                v-for="product in paginatedProducts"
                :key="product.id"
                :product="product"
              />
            </div>

            <!-- EMPTY STATE -->
            <div v-else class="empty-state">
              <div class="empty-icon">
                <PackageOpen :size="35" />
              </div>

              <h3>Produk tidak ditemukan</h3>

              <p>Coba gunakan kata kunci lain atau ubah filter pencarianmu.</p>

              <button @click="clearFilters">Lihat Semua Produk</button>
            </div>

            <!-- PAGINATION -->
            <div v-if="totalPages > 1" class="pagination">
              <button
                :disabled="currentPage === 1"
                @click="changePage(currentPage - 1)"
              >
                Sebelumnya
              </button>

              <button
                v-for="page in totalPages"
                :key="page"
                :class="{ active: currentPage === page }"
                @click="changePage(page)"
              >
                {{ page }}
              </button>

              <button
                :disabled="currentPage === totalPages"
                @click="changePage(currentPage + 1)"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.catalog-page {
  color: #3e3028;
  background: #fbf7f2;
}

.catalog-container {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

/* HERO */
.catalog-hero {
  padding: 45px 24px 55px;
  background: #f3e9dc;
  text-align: center;
}

.breadcrumb {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 35px;
  color: #968579;
  font-size: 11px;
}

.breadcrumb a {
  color: #943c14;
  text-decoration: none;
}

.section-eyebrow {
  color: #943c14;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.catalog-hero h1 {
  margin: 13px 0;
  font-family: Georgia, serif;
  font-size: clamp(34px, 5vw, 49px);
  font-weight: 600;
}

.catalog-hero p {
  color: #837469;
  font-size: 13px;
  line-height: 1.7;
}

.catalog-search {
  display: flex;
  align-items: center;
  gap: 13px;
  max-width: 650px;
  height: 58px;
  margin: 30px auto 0;
  padding: 7px 8px 7px 18px;
  color: #998b7e;
  background: #fff;
  border: 1px solid #e9ddd0;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(75, 47, 30, 0.06);
}

.catalog-search input {
  flex: 1;
  width: 0;
  height: 100%;
  color: #49382d;
  background: transparent;
  border: none;
  outline: none;
  font: inherit;
  font-size: 12px;
}

.catalog-search button {
  height: 42px;
  padding: 0 19px;
  color: #fff;
  background: #943c14;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

/* MAIN */
.catalog-content {
  padding: 55px 24px 85px;
}

.catalog-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  align-items: start;
  gap: 30px;
}

/* SIDEBAR */
.filter-sidebar {
  padding: 22px;
  background: #fff;
  border: 1px solid #e8dfd6;
  border-radius: 14px;
}

.filter-heading,
.filter-heading > div {
  display: flex;
  align-items: center;
}

.filter-heading {
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 19px;
  border-bottom: 1px solid #eee7e0;
}

.filter-heading > div {
  gap: 9px;
  color: #943c14;
}

.filter-heading h2 {
  margin: 0;
  color: #49382d;
  font-size: 14px;
}

.clear-button,
.active-filters button {
  padding: 0;
  color: #943c14;
  background: none;
  border: none;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.filter-group {
  padding: 22px 0;
  border-bottom: 1px solid #eee7e0;
}

.filter-group h3 {
  margin: 0 0 17px;
  font-size: 12px;
}

.category-option,
.discount-option {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 13px 0;
  color: #786b60;
  font-size: 12px;
  cursor: pointer;
}

.category-option input,
.discount-option input {
  accent-color: #943c14;
}

.reset-filter {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 19px;
  padding: 0;
  color: #9b6c53;
  background: transparent;
  border: none;
  font-size: 11px;
  cursor: pointer;
}

/* TOOLBAR */
.catalog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 25px;
}

.catalog-result h2 {
  margin: 0 0 6px;
  font-family: Georgia, serif;
  font-size: 24px;
}

.catalog-result p {
  margin: 0;
  color: #96887d;
  font-size: 11px;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  color: #88786c;
  background: #fff;
  border: 1px solid #e8dfd6;
  border-radius: 8px;
}

.sort-control select {
  max-width: 150px;
  color: #59483b;
  background: transparent;
  border: none;
  outline: none;
  font-size: 11px;
  cursor: pointer;
}

/* ACTIVE FILTERS */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin-bottom: 20px;
  color: #88786c;
  font-size: 11px;
}

.filter-chip {
  padding: 6px 10px;
  color: #943c14;
  background: #f2e5d8;
  border-radius: 20px;
}

/* PRODUCTS */
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 17px;
}

/* EMPTY */
.empty-state {
  padding: 75px 20px;
  background: #fff;
  border: 1px dashed #d9cabc;
  border-radius: 15px;
  text-align: center;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 65px;
  height: 65px;
  margin: 0 auto 18px;
  color: #943c14;
  background: #f7eee5;
  border-radius: 50%;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-family: Georgia, serif;
  font-size: 22px;
}

.empty-state p {
  color: #928478;
  font-size: 12px;
  line-height: 1.7;
}

.empty-state button {
  margin-top: 12px;
  padding: 12px 18px;
  color: #fff;
  background: #943c14;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

/* PAGINATION */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 38px;
}

.pagination button {
  min-width: 36px;
  height: 36px;
  padding: 0 11px;
  color: #705f52;
  background: #fff;
  border: 1px solid #e8dfd6;
  border-radius: 8px;
  font-size: 11px;
  cursor: pointer;
}

.pagination button.active {
  color: #fff;
  background: #943c14;
  border-color: #943c14;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 1000px) {
  .catalog-layout {
    grid-template-columns: 210px minmax(0, 1fr);
    gap: 20px;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .catalog-hero {
    padding: 35px 20px 45px;
  }

  .catalog-search {
    height: 52px;
  }

  .catalog-search button {
    padding: 0 12px;
    font-size: 11px;
  }

  .catalog-content {
    padding: 35px 18px 60px;
  }

  .catalog-layout {
    grid-template-columns: 1fr;
  }

  .filter-sidebar {
    padding: 17px;
  }

  .filter-group {
    padding: 15px 0;
  }

  .catalog-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .sort-control {
    align-self: flex-end;
  }

  .product-grid {
    gap: 12px;
  }
}
</style>
