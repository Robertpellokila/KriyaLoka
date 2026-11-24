<script setup>
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { RouterLink } from "vue-router";
import {
  Search,
  SlidersHorizontal,
  ShoppingBag,
  ArrowUpDown,
  PackageOpen,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-vue-next";

import { useProductStore } from "@/stores/product.js";
import { useCartStore } from "@/stores/cart.js";
import AppToast from "@/components/ui/AppToast.vue";

const productStore = useProductStore();
const cartStore = useCartStore();

/* ---------------------------------- config --------------------------------- */
const PER_PAGE = 12;

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "price-low", label: "Harga terendah" },
  { value: "price-high", label: "Harga tertinggi" },
  { value: "name", label: "Nama A–Z" },
];

const pricePresets = [
  { label: "Semua harga", min: "", max: "" },
  { label: "Di bawah Rp100rb", min: "", max: "100000" },
  { label: "Rp100rb – 300rb", min: "100000", max: "300000" },
  { label: "Di atas Rp300rb", min: "300000", max: "" },
];

const heroWords = ["Temukan", "karya", "yang", "punya"];

/* ---------------------------------- state ---------------------------------- */
const searchInput = ref("");
const searchQuery = ref("");
const searchFocused = ref(false);
const searchRef = ref(null);

const selectedCategory = ref("Semua");
const sortBy = ref("newest");
const onlyInStock = ref(false);
const minPrice = ref("");
const maxPrice = ref("");

const showFilters = ref(false);
const sortOpen = ref(false);
const sortWrapRef = ref(null);
const listTopRef = ref(null);

const currentPage = ref(1);
const direction = ref("fade"); // next | prev | fade

const loading = ref(false);
const addedId = ref(null);

const toast = ref({
  visible: false,
  type: "success",
  title: "",
  message: "",
});

function showToast(type, title, message) {
  toast.value = { visible: true, type, title, message };
}

/* --------------------------------- products -------------------------------- */
const products = computed(() => productStore.publicProducts || []);

const categories = computed(() => {
  const unique = [
    ...new Set(products.value.map((p) => p.category).filter(Boolean)),
  ];
  return ["Semua", ...unique];
});

const categoryCounts = computed(() => {
  const counts = { Semua: products.value.length };
  products.value.forEach((p) => {
    if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
  });
  return counts;
});

const filteredProducts = computed(() => {
  let result = [...products.value];

  const keyword = searchQuery.value.trim().toLowerCase();
  if (keyword) {
    result = result.filter(
      (p) =>
        p.name?.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword) ||
        p.category?.toLowerCase().includes(keyword),
    );
  }

  if (selectedCategory.value !== "Semua") {
    result = result.filter((p) => p.category === selectedCategory.value);
  }

  const min = minPrice.value === "" ? null : Number(minPrice.value);
  const max = maxPrice.value === "" ? null : Number(maxPrice.value);
  if (min !== null) result = result.filter((p) => Number(p.price) >= min);
  if (max !== null) result = result.filter((p) => Number(p.price) <= max);

  if (onlyInStock.value) {
    result = result.filter((p) => Number(p.stock) > 0);
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

/* -------------------------------- pagination ------------------------------- */
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProducts.value.length / PER_PAGE)),
);

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * PER_PAGE;
  return filteredProducts.value.slice(start, start + PER_PAGE);
});

const rangeFrom = computed(() =>
  filteredProducts.value.length === 0
    ? 0
    : (currentPage.value - 1) * PER_PAGE + 1,
);
const rangeTo = computed(() =>
  Math.min(currentPage.value * PER_PAGE, filteredProducts.value.length),
);

function ratioOf(page) {
  return totalPages.value <= 1 ? 0 : (page - 1) / (totalPages.value - 1);
}

const sliderRatio = computed(() => ratioOf(currentPage.value));

// Kalau halaman banyak, tampilkan tick penting saja agar tidak berdesakan
const ticks = computed(() => {
  const total = totalPages.value;
  if (total <= 10) return Array.from({ length: total }, (_, i) => i + 1);
  return [...new Set([1, currentPage.value, total])].sort((a, b) => a - b);
});

const transitionName = computed(() =>
  direction.value === "next"
    ? "slide-next"
    : direction.value === "prev"
      ? "slide-prev"
      : "grid-fade",
);

const gridKey = computed(
  () =>
    `${currentPage.value}|${selectedCategory.value}|${sortBy.value}|${searchQuery.value}|${onlyInStock.value}|${minPrice.value}|${maxPrice.value}`,
);

function goToPage(page) {
  const target = Math.min(Math.max(Number(page) || 1, 1), totalPages.value);
  if (target === currentPage.value) return;
  direction.value = target > currentPage.value ? "next" : "prev";
  currentPage.value = target;
  scrollToList();
}

function scrollToList() {
  nextTick(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    listTopRef.value?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  });
}

// Setiap filter berubah → kembali ke halaman 1
watch(
  [searchQuery, selectedCategory, sortBy, onlyInStock, minPrice, maxPrice],
  () => {
    direction.value = "fade";
    currentPage.value = 1;
  },
);

// Jaga agar halaman tidak melewati batas
watch(totalPages, (total) => {
  if (currentPage.value > total) currentPage.value = total;
});

/* ----------------------------------- search -------------------------------- */
let searchTimer = null;
watch(searchInput, (value) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery.value = value;
  }, 250);
});

const suggestions = computed(() => {
  const keyword = searchInput.value.trim().toLowerCase();
  if (!keyword) return [];
  return products.value
    .filter((p) => p.name?.toLowerCase().includes(keyword))
    .slice(0, 5);
});

const showSuggestions = computed(
  () => searchFocused.value && suggestions.value.length > 0,
);

function pickSuggestion(product) {
  searchInput.value = product.name;
  searchQuery.value = product.name;
  searchRef.value?.blur();
}

function clearSearch() {
  searchInput.value = "";
  searchQuery.value = "";
  searchRef.value?.focus();
}

function onGlobalKeydown(event) {
  const tag = event.target?.tagName;
  const typing =
    tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable;

  if (event.key === "/" && !typing) {
    event.preventDefault();
    searchRef.value?.focus();
  }
  if (event.key === "Escape") {
    sortOpen.value = false;
    if (document.activeElement === searchRef.value) searchRef.value.blur();
  }
}

function onDocumentClick(event) {
  if (sortWrapRef.value && !sortWrapRef.value.contains(event.target)) {
    sortOpen.value = false;
  }
}

/* ---------------------------------- filters -------------------------------- */
function applyPreset(preset) {
  minPrice.value = preset.min;
  maxPrice.value = preset.max;
}

function isPresetActive(preset) {
  return minPrice.value === preset.min && maxPrice.value === preset.max;
}

const currentSortLabel = computed(
  () => sortOptions.find((o) => o.value === sortBy.value)?.label,
);

function chooseSort(value) {
  sortBy.value = value;
  sortOpen.value = false;
}

const activeFilterCount = computed(() => {
  let count = 0;
  if (minPrice.value !== "" || maxPrice.value !== "") count++;
  if (onlyInStock.value) count++;
  return count;
});

function shortPrice(value) {
  const n = Number(value);
  if (n >= 1000000) return `${n / 1000000}jt`;
  if (n >= 1000) return `${n / 1000}rb`;
  return `${n}`;
}

const activeTags = computed(() => {
  const tags = [];
  if (searchQuery.value.trim()) {
    tags.push({
      key: "search",
      label: `“${searchQuery.value.trim()}”`,
      clear: () => {
        searchInput.value = "";
        searchQuery.value = "";
      },
    });
  }
  if (selectedCategory.value !== "Semua") {
    tags.push({
      key: "category",
      label: selectedCategory.value,
      clear: () => (selectedCategory.value = "Semua"),
    });
  }
  if (minPrice.value !== "" || maxPrice.value !== "") {
    const from =
      minPrice.value !== "" ? `Rp${shortPrice(minPrice.value)}` : "Rp0";
    const to = maxPrice.value !== "" ? `Rp${shortPrice(maxPrice.value)}` : "∞";
    tags.push({
      key: "price",
      label: `${from} – ${to}`,
      clear: () => {
        minPrice.value = "";
        maxPrice.value = "";
      },
    });
  }
  if (onlyInStock.value) {
    tags.push({
      key: "stock",
      label: "Stok tersedia",
      clear: () => (onlyInStock.value = false),
    });
  }
  return tags;
});

function resetAll() {
  searchInput.value = "";
  searchQuery.value = "";
  selectedCategory.value = "Semua";
  minPrice.value = "";
  maxPrice.value = "";
  onlyInStock.value = false;
  sortBy.value = "newest";
}

/* ---------------------------------- helpers -------------------------------- */
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

  if (result.success) {
    addedId.value = product.id;
    setTimeout(() => {
      if (addedId.value === product.id) addedId.value = null;
    }, 1400);
  }

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

onMounted(() => {
  loadProducts();
  window.addEventListener("keydown", onGlobalKeydown);
  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  clearTimeout(searchTimer);
  window.removeEventListener("keydown", onGlobalKeydown);
  document.removeEventListener("click", onDocumentClick);
});
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

    <!-- ================================ HERO ================================ -->
    <section class="catalog-hero">
      <div class="hero-content">
        <span class="eyebrow">Karya lokal, cerita istimewa</span>
        <h1>
          <span
            v-for="(word, i) in heroWords"
            :key="word"
            class="hero-word"
            :style="{ '--d': `${i * 90}ms` }"
          >
            {{ word }}&nbsp;
          </span>
          <span
            class="hero-word"
            :style="{ '--d': `${heroWords.length * 90}ms` }"
          >
            <em>cerita.</em>
          </span>
        </h1>
        <p>
          Jelajahi berbagai produk kerajinan pilihan dari tangan-tangan kreatif
          pengrajin lokal Indonesia.
        </p>
        <a href="#product-list" class="hero-link">
          Jelajahi koleksi
          <span class="hero-link-arrow">↓</span>
        </a>
      </div>

      <div class="hero-decoration" aria-hidden="true">
        <div class="decoration-circle circle-one"></div>
        <div class="decoration-circle circle-two"></div>
        <div class="decoration-chip">
          <strong>{{ products.length }}</strong>
          <span>karya siap dipinang</span>
        </div>
        <div class="decoration-label">Made with<br />heart &amp; craft</div>
      </div>
    </section>

    <!-- ============================== CATALOG =============================== -->
    <section class="catalog-container" id="product-list">
      <div class="catalog-heading">
        <div>
          <h2>Jelajahi Produk</h2>
          <p>Temukan sesuatu yang istimewa untukmu.</p>
        </div>

        <div class="product-count" aria-live="polite">
          <Transition name="count" mode="out-in">
            <strong :key="filteredProducts.length">
              {{ filteredProducts.length }}
            </strong>
          </Transition>
          <span>produk ditemukan</span>
        </div>
      </div>

      <div ref="listTopRef" class="list-anchor"></div>

      <!-- ------------------------------ toolbar ------------------------------ -->
      <div class="catalog-toolbar">
        <div
          class="search-box"
          :class="{ focused: searchFocused, filled: searchInput }"
        >
          <Search :size="19" class="search-icon" />
          <input
            ref="searchRef"
            v-model="searchInput"
            type="text"
            autocomplete="off"
            placeholder="Cari patung, tenun, perak, kopi..."
            aria-label="Cari produk"
            @focus="searchFocused = true"
            @blur="searchFocused = false"
          />

          <kbd class="search-hint" aria-hidden="true">/</kbd>

          <button
            v-if="searchInput"
            type="button"
            class="search-clear"
            aria-label="Hapus pencarian"
            @mousedown.prevent
            @click="clearSearch"
          >
            <X :size="15" />
          </button>

          <Transition name="dropdown">
            <ul v-if="showSuggestions" class="suggestions" role="listbox">
              <li v-for="item in suggestions" :key="item.id">
                <button
                  type="button"
                  role="option"
                  @mousedown.prevent
                  @click="pickSuggestion(item)"
                >
                  <img :src="getProductImage(item)" :alt="item.name" />
                  <span class="suggestion-text">
                    <strong>{{ item.name }}</strong>
                    <small>{{ item.category }}</small>
                  </span>
                  <span class="suggestion-price">
                    {{ formatPrice(item.price) }}
                  </span>
                </button>
              </li>
            </ul>
          </Transition>
        </div>

        <button
          type="button"
          class="tool-button filter-toggle"
          :class="{ active: showFilters || activeFilterCount }"
          :aria-expanded="showFilters"
          aria-controls="filter-panel"
          @click="showFilters = !showFilters"
        >
          <SlidersHorizontal :size="17" />
          <span>Filter</span>
          <Transition name="badge">
            <em v-if="activeFilterCount" class="filter-badge">
              {{ activeFilterCount }}
            </em>
          </Transition>
        </button>

        <div ref="sortWrapRef" class="sort-wrap">
          <button
            type="button"
            class="tool-button"
            :class="{ active: sortOpen }"
            aria-haspopup="listbox"
            :aria-expanded="sortOpen"
            @click.stop="sortOpen = !sortOpen"
          >
            <ArrowUpDown :size="17" />
            <span>{{ currentSortLabel }}</span>
            <ChevronDown
              :size="15"
              class="chevron"
              :class="{ flip: sortOpen }"
            />
          </button>

          <Transition name="dropdown">
            <ul v-if="sortOpen" class="sort-menu" role="listbox">
              <li v-for="option in sortOptions" :key="option.value">
                <button
                  type="button"
                  role="option"
                  :aria-selected="sortBy === option.value"
                  :class="{ selected: sortBy === option.value }"
                  @click="chooseSort(option.value)"
                >
                  {{ option.label }}
                  <Check v-if="sortBy === option.value" :size="15" />
                </button>
              </li>
            </ul>
          </Transition>
        </div>
      </div>

      <!-- ---------------------------- filter panel --------------------------- -->
      <div
        id="filter-panel"
        class="filter-panel"
        :class="{ open: showFilters }"
        :inert="showFilters ? null : ''"
      >
        <div class="filter-panel-inner">
          <div class="filter-grid">
            <div class="filter-group">
              <h3>Rentang harga</h3>
              <div class="preset-list">
                <button
                  v-for="preset in pricePresets"
                  :key="preset.label"
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive(preset) }"
                  @click="applyPreset(preset)"
                >
                  {{ preset.label }}
                </button>
              </div>

              <div class="price-inputs">
                <label>
                  <span>Rp</span>
                  <input
                    v-model="minPrice"
                    type="number"
                    min="0"
                    inputmode="numeric"
                    placeholder="Harga minimum"
                  />
                </label>
                <i></i>
                <label>
                  <span>Rp</span>
                  <input
                    v-model="maxPrice"
                    type="number"
                    min="0"
                    inputmode="numeric"
                    placeholder="Harga maksimum"
                  />
                </label>
              </div>
            </div>

            <div class="filter-group">
              <h3>Ketersediaan</h3>
              <label class="switch">
                <input v-model="onlyInStock" type="checkbox" />
                <span class="switch-track"
                  ><span class="switch-thumb"></span
                ></span>
                <span class="switch-label"
                  >Hanya tampilkan yang masih ada stok</span
                >
              </label>

              <button
                type="button"
                class="reset-link"
                :disabled="!activeTags.length"
                @click="resetAll"
              >
                Atur ulang semua filter
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ------------------------------ categories --------------------------- -->
      <div class="category-scroller">
        <div class="category-list" role="tablist" aria-label="Kategori produk">
          <button
            v-for="category in categories"
            :key="category"
            type="button"
            role="tab"
            class="category-button"
            :class="{ active: selectedCategory === category }"
            :aria-selected="selectedCategory === category"
            @click="selectedCategory = category"
          >
            {{ category }}
            <span class="category-count">{{
              categoryCounts[category] || 0
            }}</span>
          </button>
        </div>
      </div>

      <!-- ----------------------------- active tags --------------------------- -->
      <TransitionGroup name="tag" tag="div" class="active-tags">
        <button
          v-for="tag in activeTags"
          :key="tag.key"
          type="button"
          class="active-tag"
          :aria-label="`Hapus filter ${tag.label}`"
          @click="tag.clear()"
        >
          {{ tag.label }}
          <X :size="13" />
        </button>
      </TransitionGroup>

      <!-- ------------------------------- results ----------------------------- -->
      <div v-if="loading" class="product-grid">
        <div v-for="n in 8" :key="n" class="product-card skeleton">
          <div class="product-image shimmer"></div>
          <div class="product-info">
            <span class="sk-line short shimmer"></span>
            <span class="sk-line shimmer"></span>
            <span class="sk-line mid shimmer"></span>
          </div>
        </div>
      </div>

      <template v-else-if="filteredProducts.length">
        <div class="grid-viewport">
          <Transition :name="transitionName" mode="out-in">
            <div :key="gridKey" class="product-grid">
              <article
                v-for="(product, index) in paginatedProducts"
                :key="product.id"
                class="product-card"
                :class="{ soldout: Number(product.stock) <= 0 }"
                :style="{ '--i': index }"
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

                    <span
                      v-if="Number(product.stock) <= 0"
                      class="stock-flag out"
                    >
                      Stok habis
                    </span>
                    <span
                      v-else-if="Number(product.stock) <= 5"
                      class="stock-flag low"
                    >
                      Sisa {{ product.stock }}
                    </span>
                  </div>
                </RouterLink>

                <div class="product-info">
                  <span class="artisan-name">
                    {{
                      product.artisan || product.store_name || "Pengrajin Lokal"
                    }}
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
                      <span class="stock-info">Stok {{ product.stock }}</span>
                    </div>

                    <button
                      type="button"
                      class="add-cart-button"
                      :class="{ added: addedId === product.id }"
                      title="Tambah ke keranjang"
                      :disabled="Number(product.stock) <= 0"
                      @click="addToCart(product)"
                    >
                      <Check
                        v-if="addedId === product.id"
                        :size="18"
                        class="pop"
                      />
                      <ShoppingBag v-else :size="18" />
                      <span class="add-label">
                        {{ addedId === product.id ? "Masuk" : "Tambah" }}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </Transition>
        </div>

        <!-- ---------------------- slider pagination ------------------------- -->
        <nav v-if="totalPages > 1" class="pager" aria-label="Halaman produk">
          <p class="pager-info">
            Menampilkan <strong>{{ rangeFrom }}–{{ rangeTo }}</strong> dari
            <strong>{{ filteredProducts.length }}</strong> produk
          </p>

          <div class="pager-row">
            <button
              type="button"
              class="pager-arrow"
              :disabled="currentPage === 1"
              aria-label="Halaman sebelumnya"
              @click="goToPage(currentPage - 1)"
            >
              <ChevronLeft :size="20" />
            </button>

            <div class="slider" :style="{ '--ratio': sliderRatio }">
              <div class="slider-bubble" aria-hidden="true">
                <Transition name="bubble" mode="out-in">
                  <span :key="currentPage">{{ currentPage }}</span>
                </Transition>
              </div>

              <input
                class="slider-input"
                type="range"
                min="1"
                :max="totalPages"
                step="1"
                :value="currentPage"
                aria-label="Geser untuk berpindah halaman"
                :aria-valuetext="`Halaman ${currentPage} dari ${totalPages}`"
                @input="goToPage($event.target.value)"
              />

              <div class="slider-ticks">
                <button
                  v-for="page in ticks"
                  :key="page"
                  type="button"
                  class="tick"
                  :class="{ active: page === currentPage }"
                  :style="{ '--r': ratioOf(page) }"
                  :aria-label="`Ke halaman ${page}`"
                  :aria-current="page === currentPage ? 'page' : undefined"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
              </div>
            </div>

            <button
              type="button"
              class="pager-arrow"
              :disabled="currentPage === totalPages"
              aria-label="Halaman berikutnya"
              @click="goToPage(currentPage + 1)"
            >
              <ChevronRight :size="20" />
            </button>
          </div>
        </nav>
      </template>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <PackageOpen :size="34" />
        </div>
        <h3>Produk belum ditemukan</h3>
        <p>
          Coba kata kunci lain, ganti kategori, atau longgarkan filter harga.
        </p>
        <button type="button" @click="resetAll">Atur ulang pencarian</button>
      </div>
    </section>

    <section class="catalog-bottom">
      <div>
        <span class="section-eyebrow">Dukung karya lokal</span>
        <h2>Setiap karya punya cerita. Jadilah bagian darinya.</h2>
      </div>
      <RouterLink to="/" class="bottom-link"> Kembali ke Beranda </RouterLink>
    </section>
  </div>
</template>

<style scoped>
.catalog-page {
  --cream: #faf7f0;
  --sand: #efe5d4;
  --sand-deep: #e6ddcf;
  --line: #eee6da;
  --paper: #fffdf9;
  --ink: #30291f;
  --muted: #857b6d;
  --clay: #943c14;
  --clay-soft: #c47b54;
  --olive: #64704c;
  --olive-deep: #485438;
  --sage: #b7b995;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);

  background: var(--cream);
  color: var(--ink);
  min-height: 100vh;
  padding-bottom: 70px;
}

/* ---------------------------------- hero ---------------------------------- */
.catalog-hero {
  min-height: 390px;
  padding: 75px max(7%, calc((100% - 1200px) / 2));
  background: var(--sand);
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
  color: var(--clay);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.hero-content h1 {
  font-family: Georgia, serif;
  font-size: clamp(40px, 5vw, 65px);
  line-height: 1.08;
  font-weight: 500;
  margin: 18px 0 20px;
  letter-spacing: -2px;
}

.hero-word {
  display: inline-block;
  opacity: 0;
  transform: translateY(0.6em);
  animation: wordUp 0.8s var(--ease) forwards;
  animation-delay: var(--d);
}

.hero-content h1 em {
  color: var(--clay);
}

@keyframes wordUp {
  to {
    opacity: 1;
    transform: none;
  }
}

.hero-content p {
  max-width: 470px;
  color: #716657;
  line-height: 1.8;
  font-size: 15px;
  opacity: 0;
  animation: wordUp 0.8s var(--ease) 0.55s forwards;
}

.hero-link {
  display: inline-flex;
  align-items: center;
  gap: 15px;
  margin-top: 22px;
  padding: 13px 20px;
  background: var(--clay);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  opacity: 0;
  animation: wordUp 0.8s var(--ease) 0.7s forwards;
  transition:
    transform 0.25s var(--ease),
    box-shadow 0.25s;
}

.hero-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px #943c1440;
}

.hero-link-arrow {
  display: inline-block;
  animation: nudge 1.8s ease-in-out infinite;
}

@keyframes nudge {
  0%,
  100% {
    transform: translateY(-1px);
  }
  50% {
    transform: translateY(3px);
  }
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
  background: var(--sage);
  animation: float 9s ease-in-out infinite;
}

.circle-two {
  width: 145px;
  height: 145px;
  right: 110px;
  top: 95px;
  background: var(--clay-soft);
  border: 12px solid var(--sand);
  animation: float 7s ease-in-out -3s infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-8px, -14px);
  }
}

.decoration-chip {
  position: absolute;
  left: 0;
  top: 14px;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  background: var(--paper);
  border-radius: 12px;
  box-shadow: 0 10px 28px #4b382015;
  animation: float 8s ease-in-out -1s infinite;
}

.decoration-chip strong {
  font-family: Georgia, serif;
  font-size: 26px;
  font-weight: 500;
  color: var(--clay);
  line-height: 1;
}

.decoration-chip span {
  font-size: 11px;
  color: var(--muted);
  margin-top: 4px;
}

.decoration-label {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 15px 20px;
  background: var(--cream);
  color: var(--clay);
  font-family: Georgia, serif;
  font-style: italic;
  font-size: 17px;
  line-height: 1.3;
  transform: rotate(-5deg);
}

/* -------------------------------- container ------------------------------- */
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
  margin: 0 0 5px;
}

.catalog-heading p {
  color: var(--muted);
  font-size: 14px;
  margin: 0;
}

.product-count {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
}

.product-count strong {
  display: inline-block;
  color: var(--clay);
  font-size: 23px;
  min-width: 1ch;
  text-align: right;
}

.list-anchor {
  scroll-margin-top: 24px;
  height: 0;
}

.count-enter-active,
.count-leave-active {
  transition:
    opacity 0.15s,
    transform 0.2s var(--ease);
}
.count-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.count-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* -------------------------------- toolbar --------------------------------- */
.catalog-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  position: relative;
  z-index: 20;
}

.search-box {
  position: relative;
  flex: 1;
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px 0 18px;
  background: var(--paper);
  border: 1px solid var(--sand-deep);
  border-radius: 14px;
  color: #8b806f;
  transition:
    border-color 0.25s,
    box-shadow 0.35s var(--ease),
    transform 0.35s var(--ease);
}

.search-box:hover {
  border-color: #d9ccb6;
}

.search-box.focused {
  border-color: var(--clay);
  box-shadow:
    0 0 0 4px #943c1417,
    0 12px 28px #4b382014;
  transform: translateY(-1px);
}

.search-icon {
  flex-shrink: 0;
  transition:
    color 0.25s,
    transform 0.4s var(--ease);
}

.search-box.focused .search-icon {
  color: var(--clay);
  transform: scale(1.12) rotate(-8deg);
}

.search-box input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  padding: 16px 0;
}

.search-box input::placeholder {
  color: #aca08d;
}

.search-hint {
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  color: #9a8f7e;
  border: 1px solid var(--sand-deep);
  border-bottom-width: 2px;
  border-radius: 6px;
  padding: 2px 8px;
  background: var(--cream);
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.search-box.focused .search-hint,
.search-box.filled .search-hint {
  opacity: 0;
  transform: scale(0.8);
  pointer-events: none;
  position: absolute;
  right: 14px;
}

.search-clear {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--sand);
  color: var(--clay);
  cursor: pointer;
  animation: pop 0.3s var(--ease);
  transition:
    background 0.2s,
    transform 0.2s;
}

.search-clear:hover {
  background: var(--clay);
  color: white;
  transform: rotate(90deg);
}

.suggestions,
.sort-menu {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  margin: 0;
  padding: 6px;
  list-style: none;
  background: var(--paper);
  border: 1px solid var(--sand-deep);
  border-radius: 14px;
  box-shadow: 0 20px 40px #4b38201f;
  transform-origin: top center;
}

.suggestions button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.suggestions button:hover {
  background: var(--sand);
}

.suggestions img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--sand);
}

.suggestion-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.suggestion-text strong {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-text small {
  font-size: 11px;
  color: var(--muted);
}

.suggestion-price {
  font-size: 12px;
  font-weight: 700;
  color: var(--clay);
  white-space: nowrap;
}

.tool-button {
  position: relative;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0 18px;
  background: var(--paper);
  border: 1px solid var(--sand-deep);
  border-radius: 14px;
  color: #514738;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.25s,
    color 0.25s,
    border-color 0.25s,
    transform 0.2s var(--ease);
}

.tool-button:hover {
  border-color: #d3c4aa;
  transform: translateY(-1px);
}

.tool-button:active {
  transform: scale(0.97);
}

.tool-button.active {
  background: var(--clay);
  border-color: var(--clay);
  color: white;
}

.filter-badge {
  min-width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  padding: 0 6px;
  border-radius: 10px;
  background: white;
  color: var(--clay);
  font-style: normal;
  font-size: 11px;
  font-weight: 800;
}

.badge-enter-active,
.badge-leave-active {
  transition:
    transform 0.3s var(--ease),
    opacity 0.2s;
}
.badge-enter-from,
.badge-leave-to {
  transform: scale(0);
  opacity: 0;
}

.sort-wrap {
  position: relative;
}

.sort-menu {
  left: auto;
  right: 0;
  min-width: 100%;
  width: max-content;
}

.sort-menu button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 10px 12px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #514738;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.sort-menu button:hover {
  background: var(--sand);
}

.sort-menu button.selected {
  color: var(--clay);
  font-weight: 700;
}

.chevron {
  transition: transform 0.3s var(--ease);
}
.chevron.flip {
  transform: rotate(180deg);
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.2s,
    transform 0.28s var(--ease);
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

/* ------------------------------ filter panel ------------------------------ */
.filter-panel {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition:
    grid-template-rows 0.45s var(--ease),
    opacity 0.3s,
    margin 0.45s var(--ease);
}

.filter-panel.open {
  grid-template-rows: 1fr;
  opacity: 1;
  margin-bottom: 14px;
}

.filter-panel-inner {
  overflow: hidden;
  min-height: 0;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 32px;
  padding: 22px 24px;
  background: var(--paper);
  border: 1px solid var(--sand-deep);
  border-radius: 14px;
}

.filter-group h3 {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.preset-chip {
  padding: 8px 14px;
  border: 1px solid var(--sand-deep);
  border-radius: 30px;
  background: transparent;
  color: #716657;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.25s var(--ease);
}

.preset-chip:hover {
  border-color: var(--clay);
  color: var(--clay);
}

.preset-chip.active {
  background: var(--olive);
  border-color: var(--olive);
  color: white;
}

.price-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price-inputs i {
  width: 12px;
  height: 2px;
  background: var(--sand-deep);
  flex-shrink: 0;
}

.price-inputs label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--sand-deep);
  border-radius: 10px;
  background: var(--cream);
  color: #9a8f7e;
  font-size: 12px;
  font-weight: 700;
  transition:
    border-color 0.2s,
    box-shadow 0.25s;
}

.price-inputs label:focus-within {
  border-color: var(--clay);
  box-shadow: 0 0 0 3px #943c1417;
}

.price-inputs input {
  width: 100%;
  min-width: 0;
  padding: 11px 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  -moz-appearance: textfield;
  appearance: textfield;
}

.price-inputs input::-webkit-outer-spin-button,
.price-inputs input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.switch {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.switch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch-track {
  position: relative;
  width: 44px;
  height: 25px;
  flex-shrink: 0;
  border-radius: 20px;
  background: var(--sand-deep);
  transition: background 0.3s;
}

.switch-thumb {
  position: absolute;
  left: 3px;
  top: 3px;
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 2px 6px #0003;
  transition: transform 0.35s var(--ease);
}

.switch input:checked + .switch-track {
  background: var(--olive);
}

.switch input:checked + .switch-track .switch-thumb {
  transform: translateX(19px);
}

.switch input:focus-visible + .switch-track {
  outline: 2px solid var(--clay);
  outline-offset: 2px;
}

.switch-label {
  font-size: 13px;
  color: #514738;
  line-height: 1.4;
}

.reset-link {
  margin-top: 18px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--clay);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.reset-link:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* -------------------------------- categories ------------------------------ */
.category-scroller {
  position: relative;
  margin-bottom: 14px;
}

.category-list {
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
}

.category-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e5dac9;
  border-radius: 30px;
  padding: 9px 10px 9px 17px;
  color: #716657;
  background: transparent;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition:
    background 0.3s var(--ease),
    border-color 0.3s,
    color 0.3s,
    transform 0.25s var(--ease);
}

.category-button:hover {
  border-color: var(--clay);
  color: var(--clay);
  transform: translateY(-2px);
}

.category-button.active {
  background: var(--clay);
  border-color: var(--clay);
  color: white;
  transform: none;
}

.category-count {
  min-width: 22px;
  padding: 2px 7px;
  border-radius: 12px;
  background: var(--sand);
  color: var(--clay);
  font-size: 10.5px;
  font-weight: 700;
  text-align: center;
  transition:
    background 0.3s,
    color 0.3s;
}

.category-button.active .category-count {
  background: #ffffff2e;
  color: white;
}

/* ------------------------------- active tags ------------------------------ */
.active-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 0;
  margin-bottom: 22px;
}

.active-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px 6px 12px;
  border: 0;
  border-radius: 8px;
  background: #e8eadf;
  color: var(--olive-deep);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}

.active-tag:hover {
  background: var(--clay);
  color: white;
}

.tag-enter-active,
.tag-leave-active {
  transition:
    opacity 0.25s,
    transform 0.35s var(--ease);
}
.tag-leave-active {
  position: absolute;
}
.tag-enter-from,
.tag-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.tag-move {
  transition: transform 0.3s var(--ease);
}

/* ----------------------------------- grid --------------------------------- */
.grid-viewport {
  overflow: hidden;
  margin: -10px;
  padding: 10px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 25px 20px;
}

.slide-next-enter-active,
.slide-prev-enter-active,
.grid-fade-enter-active {
  transition:
    opacity 0.38s var(--ease),
    transform 0.45s var(--ease);
}
.slide-next-leave-active,
.slide-prev-leave-active,
.grid-fade-leave-active {
  transition:
    opacity 0.18s ease-in,
    transform 0.22s ease-in;
}
.slide-next-enter-from {
  opacity: 0;
  transform: translateX(60px);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-60px);
}
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-60px);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(60px);
}
.grid-fade-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.grid-fade-leave-to {
  opacity: 0;
}

.product-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  opacity: 0;
  animation: cardIn 0.55s var(--ease) forwards;
  animation-delay: calc(var(--i, 0) * 40ms + 120ms);
  transition:
    transform 0.35s var(--ease),
    box-shadow 0.35s,
    border-color 0.35s;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.product-card:hover {
  transform: translateY(-6px);
  border-color: #e3d7c4;
  box-shadow: 0 18px 38px #4b382017;
}

.product-image-link {
  display: block;
  text-decoration: none;
}

.product-image {
  height: 235px;
  background: var(--line);
  position: relative;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s var(--ease);
}

.product-card:hover .product-image img {
  transform: scale(1.07);
}

.product-card.soldout .product-image img {
  filter: grayscale(0.7);
  opacity: 0.8;
}

.product-category {
  position: absolute;
  left: 12px;
  top: 12px;
  background: #faf7f0ef;
  backdrop-filter: blur(6px);
  color: var(--clay);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
}

.stock-flag {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: white;
}
.stock-flag.low {
  background: var(--clay);
}
.stock-flag.out {
  background: #4a4338;
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 46px;
  color: var(--ink);
  font-family: Georgia, serif;
  font-size: 17px;
  text-decoration: none;
  line-height: 1.35;
  transition: color 0.2s;
}

.product-name:hover {
  color: var(--clay);
}

.product-bottom {
  border-top: 1px solid var(--line);
  margin-top: 15px;
  padding-top: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.product-price {
  display: block;
  color: var(--clay);
  font-size: 14px;
}

.stock-info {
  display: block;
  color: #948a7c;
  font-size: 10.5px;
  margin-top: 4px;
}

.add-cart-button {
  height: 39px;
  min-width: 39px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  color: white;
  background: var(--olive);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  overflow: hidden;
  transition:
    background 0.25s,
    transform 0.2s var(--ease);
}

.add-label {
  max-width: 0;
  opacity: 0;
  white-space: nowrap;
  transition:
    max-width 0.35s var(--ease),
    margin 0.35s var(--ease),
    opacity 0.25s;
}

.add-cart-button:hover:not(:disabled) .add-label,
.add-cart-button:focus-visible .add-label,
.add-cart-button.added .add-label {
  max-width: 60px;
  margin-left: 8px;
  opacity: 1;
}

.add-cart-button:hover:not(:disabled) {
  background: var(--olive-deep);
}

.add-cart-button:active:not(:disabled) {
  transform: scale(0.93);
}

.add-cart-button.added {
  background: var(--clay);
}

.add-cart-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pop {
  animation: pop 0.4s var(--ease);
}

@keyframes pop {
  0% {
    transform: scale(0);
  }
  70% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}

/* -------------------------------- skeleton -------------------------------- */
.product-card.skeleton {
  animation: none;
  opacity: 1;
  pointer-events: none;
}

.shimmer {
  background: linear-gradient(
    100deg,
    var(--line) 30%,
    #f8f2e8 50%,
    var(--line) 70%
  );
  background-size: 250% 100%;
  animation: shimmer 1.4s linear infinite;
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}

.sk-line {
  display: block;
  height: 13px;
  border-radius: 6px;
  margin-bottom: 11px;
}
.sk-line.short {
  width: 40%;
}
.sk-line.mid {
  width: 65%;
  margin-bottom: 0;
}

/* --------------------------- slider pagination ---------------------------- */
.pager {
  max-width: 640px;
  margin: 46px auto 0;
  text-align: center;
}

.pager-info {
  margin: 0 0 22px;
  color: var(--muted);
  font-size: 13px;
}

.pager-info strong {
  color: var(--ink);
}

.pager-row {
  display: flex;
  align-items: center;
  gap: 18px;
}

.pager-arrow {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--sand-deep);
  border-radius: 50%;
  background: var(--paper);
  color: var(--clay);
  cursor: pointer;
  transition:
    background 0.25s,
    color 0.25s,
    transform 0.25s var(--ease),
    border-color 0.25s;
}

.pager-arrow:hover:not(:disabled) {
  background: var(--clay);
  border-color: var(--clay);
  color: white;
  transform: scale(1.08);
}

.pager-arrow:active:not(:disabled) {
  transform: scale(0.94);
}

.pager-arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.slider {
  --thumb: 24px;
  position: relative;
  flex: 1;
  padding-top: 38px;
}

.slider-bubble {
  position: absolute;
  top: 0;
  left: calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--ratio));
  transform: translateX(-50%);
  min-width: 34px;
  height: 28px;
  display: grid;
  place-items: center;
  padding: 0 9px;
  border-radius: 8px;
  background: var(--clay);
  color: white;
  font-size: 12px;
  font-weight: 700;
  pointer-events: none;
  transition: left 0.35s var(--ease);
}

.slider-bubble::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -4px;
  width: 8px;
  height: 8px;
  background: var(--clay);
  transform: translateX(-50%) rotate(45deg);
  border-radius: 1px;
}

.bubble-enter-active,
.bubble-leave-active {
  transition:
    opacity 0.12s,
    transform 0.18s var(--ease);
}
.bubble-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.bubble-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.slider-input {
  -webkit-appearance: none;
  appearance: none;
  display: block;
  width: 100%;
  height: var(--thumb);
  margin: 0;
  background: transparent;
  cursor: grab;
  outline: none;
}

.slider-input:active {
  cursor: grabbing;
}

.slider-input::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 8px;
  background:
    linear-gradient(90deg, var(--clay-soft), var(--clay)) 0 /
      calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--ratio)) 100%
      no-repeat,
    var(--sand-deep);
}

.slider-input::-moz-range-track {
  height: 8px;
  border-radius: 8px;
  background: var(--sand-deep);
}

.slider-input::-moz-range-progress {
  height: 8px;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--clay-soft), var(--clay));
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: var(--thumb);
  height: var(--thumb);
  margin-top: -8px;
  border-radius: 50%;
  background: var(--paper);
  border: 5px solid var(--clay);
  box-shadow: 0 4px 12px #943c1445;
  transition:
    transform 0.2s var(--ease),
    box-shadow 0.2s;
}

.slider-input::-moz-range-thumb {
  width: calc(var(--thumb) - 10px);
  height: calc(var(--thumb) - 10px);
  border-radius: 50%;
  background: var(--paper);
  border: 5px solid var(--clay);
  box-shadow: 0 4px 12px #943c1445;
  transition:
    transform 0.2s var(--ease),
    box-shadow 0.2s;
}

.slider-input:hover::-webkit-slider-thumb,
.slider-input:active::-webkit-slider-thumb {
  transform: scale(1.18);
  box-shadow: 0 0 0 8px #943c1418;
}

.slider-input:hover::-moz-range-thumb,
.slider-input:active::-moz-range-thumb {
  transform: scale(1.18);
  box-shadow: 0 0 0 8px #943c1418;
}

.slider-input:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 4px #943c1440;
}

.slider-input:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 4px #943c1440;
}

.slider-ticks {
  position: relative;
  height: 30px;
  margin-top: 4px;
}

.tick {
  position: absolute;
  top: 0;
  left: calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--r));
  transform: translateX(-50%);
  min-width: 28px;
  height: 28px;
  padding: 0 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #9a8f7e;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    color 0.2s,
    background 0.2s;
}

.tick:hover {
  color: var(--clay);
  background: var(--sand);
}

.tick.active {
  color: var(--clay);
  font-weight: 800;
}

/* ------------------------------- empty state ------------------------------ */
.loading-state,
.empty-state {
  text-align: center;
  padding: 70px 20px;
  color: #827768;
}

.empty-state {
  animation: cardIn 0.5s var(--ease);
}

.empty-icon {
  width: 65px;
  height: 65px;
  margin: auto auto 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--line);
  color: var(--clay);
  animation: float 5s ease-in-out infinite;
}

.empty-state h3 {
  font-family: Georgia, serif;
  color: var(--ink);
  font-size: 24px;
  font-weight: 500;
}

.empty-state p {
  font-size: 13px;
}

.empty-state button {
  margin-top: 12px;
  border: 0;
  border-radius: 8px;
  background: var(--clay);
  color: white;
  padding: 11px 18px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s var(--ease);
}

.empty-state button:hover {
  transform: translateY(-2px);
}

/* --------------------------------- bottom --------------------------------- */
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
  background: var(--olive);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
  transition:
    background 0.25s,
    transform 0.25s var(--ease);
}

.bottom-link:hover {
  background: var(--olive-deep);
  transform: translateY(-2px);
}

/* ------------------------------- focus states ------------------------------ */
.tool-button:focus-visible,
.category-button:focus-visible,
.preset-chip:focus-visible,
.pager-arrow:focus-visible,
.tick:focus-visible,
.add-cart-button:focus-visible,
.active-tag:focus-visible,
.hero-link:focus-visible,
.bottom-link:focus-visible,
.sort-menu button:focus-visible,
.suggestions button:focus-visible {
  outline: 2px solid var(--clay);
  outline-offset: 2px;
}

/* ------------------------------- responsive -------------------------------- */
@media (max-width: 950px) {
  .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .hero-decoration {
    transform: scale(0.8);
    transform-origin: right center;
  }

  .filter-grid {
    grid-template-columns: 1fr;
    gap: 24px;
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
    flex-wrap: wrap;
  }

  .search-box {
    flex-basis: 100%;
  }

  .search-hint {
    display: none;
  }

  .tool-button {
    flex: 1;
    justify-content: center;
  }

  .sort-wrap {
    flex: 1;
  }

  .sort-wrap .tool-button {
    width: 100%;
  }

  .sort-menu {
    left: 0;
    right: 0;
    width: auto;
  }

  .category-scroller {
    margin-inline: -18px;
  }

  .category-list {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding: 2px 18px 8px;
    scrollbar-width: none;
  }

  .category-list::-webkit-scrollbar {
    display: none;
  }

  .category-button {
    flex-shrink: 0;
  }

  .price-inputs {
    flex-direction: column;
    align-items: stretch;
  }

  .price-inputs i {
    display: none;
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
    min-height: 40px;
  }

  .product-price {
    font-size: 12px;
  }

  .add-cart-button {
    height: 34px;
    min-width: 34px;
  }

  .pager {
    margin-top: 34px;
  }

  .pager-row {
    gap: 10px;
  }

  .pager-arrow {
    width: 40px;
    height: 40px;
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

/* ---------------------------- reduced motion ------------------------------ */
@media (prefers-reduced-motion: reduce) {
  .catalog-page *,
  .catalog-page *::before,
  .catalog-page *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .hero-word,
  .hero-content p,
  .hero-link,
  .product-card {
    opacity: 1;
    transform: none;
  }
}
</style>
