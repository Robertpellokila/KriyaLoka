<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  Search,
  RefreshCw,
  Package,
  PackageCheck,
  Clock3,
  Archive,
  X,
  Eye,
  Store,
  UserRound,
  MapPin,
  Phone,
  CalendarDays,
  Tag,
  Boxes,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Weight,
} from "lucide-vue-next";

import { useAdminStore } from "../../stores/admin.js";

const adminStore = useAdminStore();

// ==========================================
// STATE
// ==========================================

const searchQuery = ref("");
const selectedStatus = ref("all");
const selectedCategory = ref("all");

const currentPage = ref(1);
const itemsPerPage = 10;

const selectedProduct = ref(null);
const isDetailModalOpen = ref(false);

const toast = ref({
  show: false,
  message: "",
  type: "success",
});

let toastTimer = null;

// ==========================================
// TOAST
// ==========================================

function showToast(message, type = "success") {
  toast.value = {
    show: true,
    message,
    type,
  };

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer = setTimeout(() => {
    toast.value.show = false;
  }, 3500);
}

function closeToast() {
  toast.value.show = false;

  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
}

// ==========================================
// FETCH DATA
// ==========================================

async function fetchProducts() {
  try {
    await adminStore.fetchAllProducts();
  } catch (error) {
    console.error("Gagal mengambil produk:", error);

    showToast(error.message || "Gagal mengambil data produk.", "error");
  }
}

onMounted(() => {
  fetchProducts();
});

onUnmounted(() => {
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
});

// ==========================================
// PRODUCT DATA
// ==========================================

const products = computed(() => adminStore.allProducts ?? []);

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draf" },
  { value: "pending_review", label: "Menunggu Review" },
  { value: "published", label: "Dipublikasikan" },
  { value: "rejected", label: "Ditolak" },
  { value: "archived", label: "Diarsipkan" },
];

const categories = computed(() => {
  const uniqueCategories = [
    ...new Set(
      products.value.map((product) => product.category).filter(Boolean),
    ),
  ];

  return uniqueCategories.sort((a, b) =>
    String(a).localeCompare(String(b), "id"),
  );
});

// ==========================================
// STATISTICS
// ==========================================

const statistics = computed(() => {
  const data = products.value;

  return {
    total: data.length,

    published: data.filter((product) => product.status === "published").length,

    pending: data.filter((product) => product.status === "pending_review")
      .length,

    draft: data.filter((product) => product.status === "draft").length,

    rejected: data.filter((product) => product.status === "rejected").length,

    archived: data.filter((product) => product.status === "archived").length,
  };
});

// ==========================================
// SEARCH AND FILTER
// ==========================================

const filteredProducts = computed(() => {
  let result = [...products.value];

  const keyword = searchQuery.value.trim().toLowerCase();

  if (keyword) {
    result = result.filter((product) => {
      const searchableValues = [
        product.name,
        product.category,
        product.slug,
        product.seller?.full_name,
        product.seller?.email,
        product.store_profile?.store_name,
      ];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword),
      );
    });
  }

  if (selectedStatus.value !== "all") {
    result = result.filter(
      (product) => product.status === selectedStatus.value,
    );
  }

  if (selectedCategory.value !== "all") {
    result = result.filter(
      (product) => product.category === selectedCategory.value,
    );
  }

  return result.sort((a, b) => {
    return (
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
    );
  });
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredProducts.value.length / itemsPerPage));
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;

  return filteredProducts.value.slice(start, start + itemsPerPage);
});

const paginationStart = computed(() => {
  if (filteredProducts.value.length === 0) return 0;

  return (currentPage.value - 1) * itemsPerPage + 1;
});

const paginationEnd = computed(() => {
  return Math.min(
    currentPage.value * itemsPerPage,
    filteredProducts.value.length,
  );
});

watch([searchQuery, selectedStatus, selectedCategory], () => {
  currentPage.value = 1;
});

// ==========================================
// FORMATTERS
// ==========================================

function formatPrice(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatWeight(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const grams = Number(value);

  if (!Number.isFinite(grams)) return "-";

  if (grams >= 1000) {
    return `${(grams / 1000).toLocaleString("id-ID")} kg`;
  }

  return `${grams.toLocaleString("id-ID")} gram`;
}

// ==========================================
// STATUS
// ==========================================

function getStatusLabel(status) {
  const labels = {
    draft: "Draf",
    pending_review: "Menunggu Review",
    published: "Dipublikasikan",
    rejected: "Ditolak",
    archived: "Diarsipkan",
  };

  return labels[status] || status || "Tidak diketahui";
}

function getStatusClass(status) {
  const classes = {
    draft: "status-draft",
    pending_review: "status-pending",
    published: "status-published",
    rejected: "status-rejected",
    archived: "status-archived",
  };

  return classes[status] || "status-default";
}

// ==========================================
// PRODUCT IMAGE
// ==========================================

function getProductImage(product) {
  const images = product?.product_images ?? [];

  if (images.length > 0) {
    return images[0].image_url || null;
  }

  return null;
}

// ==========================================
// DETAIL MODAL
// ==========================================

function openProductDetail(product) {
  selectedProduct.value = product;
  isDetailModalOpen.value = true;
}

function closeProductDetail() {
  isDetailModalOpen.value = false;
  selectedProduct.value = null;
}

// ==========================================
// PAGINATION
// ==========================================

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return;

  currentPage.value = page;
}

function resetFilters() {
  searchQuery.value = "";
  selectedStatus.value = "all";
  selectedCategory.value = "all";
  currentPage.value = 1;
}

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() !== "" ||
    selectedStatus.value !== "all" ||
    selectedCategory.value !== "all"
  );
});
</script>

<template>
  <div class="product-management-page">
    <!-- HEADER -->
    <header class="page-header">
      <div>
        <div class="eyebrow">MARKETPLACE MANAGEMENT</div>

        <h1>Manajemen Produk</h1>

        <p>Pantau dan periksa seluruh produk yang terdaftar di KriyaLoka.</p>
      </div>

      <button
        type="button"
        class="refresh-button"
        :disabled="adminStore.loadingAllProducts"
        @click="fetchProducts"
      >
        <RefreshCw
          :size="16"
          :class="{ spinning: adminStore.loadingAllProducts }"
        />
        <span>Refresh Data</span>
      </button>
    </header>

    <!-- STATISTICS -->
    <section class="statistics-grid">
      <article class="stat-card">
        <div class="stat-icon icon-total">
          <Package :size="20" />
        </div>

        <div class="stat-content">
          <span>Total Produk</span>
          <strong>{{ statistics.total }}</strong>
          <small>Seluruh produk terdaftar</small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon icon-published">
          <PackageCheck :size="20" />
        </div>

        <div class="stat-content">
          <span>Dipublikasikan</span>
          <strong>{{ statistics.published }}</strong>
          <small>Produk aktif di katalog</small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon icon-pending">
          <Clock3 :size="20" />
        </div>

        <div class="stat-content">
          <span>Menunggu Review</span>
          <strong>{{ statistics.pending }}</strong>
          <small>Menunggu pemeriksaan admin</small>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon icon-archived">
          <Archive :size="20" />
        </div>

        <div class="stat-content">
          <span>Produk Lainnya</span>
          <strong>
            {{ statistics.draft + statistics.rejected + statistics.archived }}
          </strong>
          <small>
            {{ statistics.draft }} draf · {{ statistics.rejected }} ditolak ·
            {{ statistics.archived }} arsip
          </small>
        </div>
      </article>
    </section>

    <!-- STATUS SUMMARY -->
    <section class="status-summary">
      <div class="summary-heading">
        <div>
          <h2>Ringkasan Status Produk</h2>
          <p>Distribusi seluruh produk berdasarkan statusnya.</p>
        </div>
      </div>

      <div class="status-summary-list">
        <div class="summary-item">
          <div class="summary-label">
            <span class="summary-dot dot-published"></span>
            <span>Dipublikasikan</span>
          </div>
          <strong>{{ statistics.published }}</strong>
        </div>

        <div class="summary-item">
          <div class="summary-label">
            <span class="summary-dot dot-pending"></span>
            <span>Menunggu Review</span>
          </div>
          <strong>{{ statistics.pending }}</strong>
        </div>

        <div class="summary-item">
          <div class="summary-label">
            <span class="summary-dot dot-draft"></span>
            <span>Draf</span>
          </div>
          <strong>{{ statistics.draft }}</strong>
        </div>

        <div class="summary-item">
          <div class="summary-label">
            <span class="summary-dot dot-rejected"></span>
            <span>Ditolak</span>
          </div>
          <strong>{{ statistics.rejected }}</strong>
        </div>

        <div class="summary-item">
          <div class="summary-label">
            <span class="summary-dot dot-archived"></span>
            <span>Diarsipkan</span>
          </div>
          <strong>{{ statistics.archived }}</strong>
        </div>
      </div>

      <div class="status-progress">
        <div
          class="progress-segment progress-published"
          :style="{
            width:
              statistics.total > 0
                ? `${(statistics.published / statistics.total) * 100}%`
                : '0%',
          }"
        ></div>

        <div
          class="progress-segment progress-pending"
          :style="{
            width:
              statistics.total > 0
                ? `${(statistics.pending / statistics.total) * 100}%`
                : '0%',
          }"
        ></div>

        <div
          class="progress-segment progress-draft"
          :style="{
            width:
              statistics.total > 0
                ? `${(statistics.draft / statistics.total) * 100}%`
                : '0%',
          }"
        ></div>

        <div
          class="progress-segment progress-rejected"
          :style="{
            width:
              statistics.total > 0
                ? `${(statistics.rejected / statistics.total) * 100}%`
                : '0%',
          }"
        ></div>

        <div
          class="progress-segment progress-archived"
          :style="{
            width:
              statistics.total > 0
                ? `${(statistics.archived / statistics.total) * 100}%`
                : '0%',
          }"
        ></div>
      </div>
    </section>

    <!-- PRODUCT TABLE -->
    <section class="product-section">
      <div class="section-heading">
        <div>
          <h2>Daftar Seluruh Produk</h2>
          <p>Kelola pemantauan produk dari seluruh penjual KriyaLoka.</p>
        </div>

        <span class="total-label">
          {{ filteredProducts.length }} produk ditemukan
        </span>
      </div>

      <!-- FILTERS -->
      <div class="filter-panel">
        <div class="search-wrapper">
          <Search :size="17" />

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari produk, toko, atau nama penjual..."
          />

          <button
            v-if="searchQuery"
            type="button"
            class="clear-search"
            aria-label="Hapus pencarian"
            @click="searchQuery = ''"
          >
            <X :size="15" />
          </button>
        </div>

        <div class="filter-control">
          <Filter :size="16" />

          <select v-model="selectedStatus">
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-control category-control">
          <Tag :size="16" />

          <select v-model="selectedCategory">
            <option value="all">Semua Kategori</option>

            <option
              v-for="category in categories"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="reset-button"
          @click="resetFilters"
        >
          <RotateCcw :size="15" />
          Reset
        </button>
      </div>

      <!-- LOADING -->
      <div
        v-if="adminStore.loadingAllProducts && products.length === 0"
        class="state-container"
      >
        <div class="loading-spinner"></div>
        <h3>Memuat Data Produk</h3>
        <p>Mohon tunggu, kami sedang mengambil data produk.</p>
      </div>

      <!-- ERROR -->
      <div
        v-else-if="adminStore.error && products.length === 0"
        class="state-container"
      >
        <div class="state-icon error-state-icon">
          <Package :size="25" />
        </div>

        <h3>Gagal Memuat Produk</h3>
        <p>{{ adminStore.error }}</p>

        <button type="button" class="primary-button" @click="fetchProducts">
          <RefreshCw :size="15" />
          Coba Lagi
        </button>
      </div>

      <!-- EMPTY -->
      <div v-else-if="filteredProducts.length === 0" class="state-container">
        <div class="state-icon">
          <Package :size="25" />
        </div>

        <h3>
          {{ hasActiveFilters ? "Produk Tidak Ditemukan" : "Belum Ada Produk" }}
        </h3>

        <p>
          {{
            hasActiveFilters
              ? "Coba ubah kata kunci atau filter pencarian."
              : "Belum ada produk yang terdaftar di marketplace."
          }}
        </p>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="secondary-button"
          @click="resetFilters"
        >
          <RotateCcw :size="15" />
          Reset Filter
        </button>
      </div>

      <!-- TABLE -->
      <template v-else>
        <div class="table-wrapper">
          <table class="product-table">
            <thead>
              <tr>
                <th>PRODUK</th>
                <th>PENJUAL / TOKO</th>
                <th>KATEGORI</th>
                <th>HARGA</th>
                <th>STOK</th>
                <th>STATUS</th>
                <th>TANGGAL</th>
                <th class="action-column">AKSI</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="product in paginatedProducts" :key="product.id">
                <!-- PRODUCT -->
                <td>
                  <div class="product-cell">
                    <div class="product-thumbnail">
                      <img
                        v-if="getProductImage(product)"
                        :src="getProductImage(product)"
                        :alt="product.name"
                        loading="lazy"
                      />

                      <ImageIcon v-else :size="21" />
                    </div>

                    <div class="product-info">
                      <strong>{{ product.name }}</strong>
                      <small>
                        {{ product.slug || "Tanpa slug" }}
                      </small>
                    </div>
                  </div>
                </td>

                <!-- SELLER -->
                <td>
                  <div class="seller-cell">
                    <strong>
                      {{
                        product.store_profile?.store_name ||
                        "Toko belum tersedia"
                      }}
                    </strong>

                    <small>
                      {{
                        product.seller?.full_name || "Penjual tidak tersedia"
                      }}
                    </small>
                  </div>
                </td>

                <!-- CATEGORY -->
                <td>
                  <span class="category-label">
                    {{ product.category || "-" }}
                  </span>
                </td>

                <!-- PRICE -->
                <td>
                  <strong class="price-text">
                    {{ formatPrice(product.price) }}
                  </strong>
                </td>

                <!-- STOCK -->
                <td>
                  <span
                    class="stock-label"
                    :class="{
                      'stock-empty': Number(product.stock) <= 0,
                      'stock-low':
                        Number(product.stock) > 0 && Number(product.stock) <= 5,
                    }"
                  >
                    {{ product.stock ?? 0 }}
                  </span>
                </td>

                <!-- STATUS -->
                <td>
                  <span
                    class="status-badge"
                    :class="getStatusClass(product.status)"
                  >
                    <span class="status-indicator"></span>
                    {{ getStatusLabel(product.status) }}
                  </span>
                </td>

                <!-- DATE -->
                <td>
                  <span class="date-text">
                    {{ formatDate(product.created_at) }}
                  </span>
                </td>

                <!-- ACTION -->
                <td>
                  <button
                    type="button"
                    class="detail-button"
                    title="Lihat detail produk"
                    @click="openProductDetail(product)"
                  >
                    <Eye :size="16" />
                    <span>Detail</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div class="pagination">
          <div class="pagination-info">
            Menampilkan
            <strong>{{ paginationStart }}–{{ paginationEnd }}</strong>
            dari
            <strong>{{ filteredProducts.length }}</strong>
            produk
          </div>

          <div class="pagination-actions">
            <button
              type="button"
              :disabled="currentPage === 1"
              aria-label="Halaman sebelumnya"
              @click="goToPage(currentPage - 1)"
            >
              <ChevronLeft :size="17" />
            </button>

            <span class="page-indicator">
              {{ currentPage }} / {{ totalPages }}
            </span>

            <button
              type="button"
              :disabled="currentPage === totalPages"
              aria-label="Halaman berikutnya"
              @click="goToPage(currentPage + 1)"
            >
              <ChevronRight :size="17" />
            </button>
          </div>
        </div>
      </template>
    </section>

    <!-- DETAIL MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="isDetailModalOpen && selectedProduct"
          class="modal-overlay"
          @click.self="closeProductDetail"
          @keydown.esc="closeProductDetail"
        >
          <div
            class="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <!-- MODAL HEADER -->
            <div class="modal-header">
              <div>
                <span class="modal-eyebrow">PRODUCT INFORMATION</span>
                <h2 id="product-modal-title">Detail Produk</h2>
              </div>

              <button
                type="button"
                class="modal-close"
                aria-label="Tutup detail"
                @click="closeProductDetail"
              >
                <X :size="20" />
              </button>
            </div>

            <!-- MODAL CONTENT -->
            <div class="modal-content">
              <!-- PRODUCT IDENTITY -->
              <section class="detail-product-header">
                <div class="detail-main-image">
                  <img
                    v-if="getProductImage(selectedProduct)"
                    :src="getProductImage(selectedProduct)"
                    :alt="selectedProduct.name"
                  />

                  <ImageIcon v-else :size="38" />
                </div>

                <div class="detail-product-identity">
                  <span
                    class="status-badge"
                    :class="getStatusClass(selectedProduct.status)"
                  >
                    <span class="status-indicator"></span>
                    {{ getStatusLabel(selectedProduct.status) }}
                  </span>

                  <h3>{{ selectedProduct.name }}</h3>

                  <p>
                    {{ selectedProduct.category || "Kategori tidak tersedia" }}
                  </p>

                  <strong class="detail-price">
                    {{ formatPrice(selectedProduct.price) }}
                  </strong>
                </div>
              </section>

              <!-- PRODUCT IMAGES -->
              <section class="detail-section">
                <div class="detail-section-title">
                  <h3>Foto Produk</h3>

                  <span>
                    {{ selectedProduct.product_images?.length || 0 }} foto
                  </span>
                </div>

                <div
                  v-if="selectedProduct.product_images?.length"
                  class="detail-image-grid"
                >
                  <div
                    v-for="(image, index) in selectedProduct.product_images"
                    :key="image.id || index"
                    class="detail-image-item"
                  >
                    <img
                      :src="image.image_url"
                      :alt="`${selectedProduct.name} - ${index + 1}`"
                    />
                  </div>
                </div>

                <div v-else class="no-image-message">
                  <ImageIcon :size="18" />
                  Belum ada foto produk.
                </div>
              </section>

              <!-- DESCRIPTION -->
              <section class="detail-section">
                <h3>Deskripsi Produk</h3>

                <p class="description-text">
                  {{
                    selectedProduct.description || "Belum ada deskripsi produk."
                  }}
                </p>
              </section>

              <!-- PRODUCT INFORMATION -->
              <section class="detail-section">
                <h3>Informasi Produk</h3>

                <div class="detail-info-grid">
                  <div class="detail-info-item">
                    <Tag :size="17" />
                    <div>
                      <small>Kategori</small>
                      <strong>
                        {{ selectedProduct.category || "-" }}
                      </strong>
                    </div>
                  </div>

                  <div class="detail-info-item">
                    <Boxes :size="17" />
                    <div>
                      <small>Stok Tersedia</small>
                      <strong> {{ selectedProduct.stock ?? 0 }} unit </strong>
                    </div>
                  </div>

                  <div class="detail-info-item">
                    <Weight :size="17" />
                    <div>
                      <small>Berat Produk</small>
                      <strong>
                        {{ formatWeight(selectedProduct.weight_grams) }}
                      </strong>
                    </div>
                  </div>

                  <div class="detail-info-item">
                    <CalendarDays :size="17" />
                    <div>
                      <small>Tanggal Dibuat</small>
                      <strong>
                        {{ formatDateTime(selectedProduct.created_at) }}
                      </strong>
                    </div>
                  </div>

                  <div class="detail-info-item">
                    <Package :size="17" />
                    <div>
                      <small>ID Produk</small>
                      <strong class="id-value">
                        {{ selectedProduct.id }}
                      </strong>
                    </div>
                  </div>

                  <div class="detail-info-item">
                    <Tag :size="17" />
                    <div>
                      <small>Slug Produk</small>
                      <strong class="id-value">
                        {{ selectedProduct.slug || "-" }}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>

              <!-- SELLER INFORMATION -->
              <section class="detail-section">
                <h3>Informasi Penjual</h3>

                <div class="seller-detail-card">
                  <div class="store-avatar">
                    <img
                      v-if="selectedProduct.store_profile?.logo_url"
                      :src="selectedProduct.store_profile.logo_url"
                      :alt="selectedProduct.store_profile.store_name"
                    />

                    <Store v-else :size="23" />
                  </div>

                  <div class="store-detail-info">
                    <strong>
                      {{
                        selectedProduct.store_profile?.store_name ||
                        "Toko belum tersedia"
                      }}
                    </strong>

                    <span>
                      {{
                        selectedProduct.store_profile?.category ||
                        "Kategori toko belum tersedia"
                      }}
                    </span>
                  </div>
                </div>

                <div class="seller-info-list">
                  <div class="seller-info-row">
                    <UserRound :size="16" />
                    <span>
                      {{
                        selectedProduct.seller?.full_name ||
                        "Nama penjual tidak tersedia"
                      }}
                    </span>
                  </div>

                  <div class="seller-info-row">
                    <Phone :size="16" />
                    <span>
                      {{
                        selectedProduct.seller?.phone_number ||
                        selectedProduct.store_profile?.contact_phone ||
                        "-"
                      }}
                    </span>
                  </div>

                  <div class="seller-info-row">
                    <MapPin :size="16" />
                    <span>
                      {{
                        [
                          selectedProduct.store_profile?.city,
                          selectedProduct.store_profile?.province,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Lokasi tidak tersedia"
                      }}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <!-- MODAL FOOTER -->
            <div class="modal-footer">
              <button
                type="button"
                class="secondary-button"
                @click="closeProductDetail"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- TOAST -->
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="toast-notification"
        :class="`toast-${toast.type}`"
      >
        <div class="toast-message">
          <span class="toast-indicator"></span>
          {{ toast.message }}
        </div>

        <button type="button" aria-label="Tutup notifikasi" @click="closeToast">
          <X :size="16" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ==========================================
   PAGE
========================================== */

.product-management-page {
  width: 100%;
  min-width: 0;
  padding: 30px 32px 45px;
  color: #332b25;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 27px;
}

.eyebrow,
.modal-eyebrow {
  margin-bottom: 8px;
  color: #a17d65;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.page-header h1 {
  margin: 0;
  color: #332b25;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.7px;
}

.page-header p,
.section-heading p,
.summary-heading p {
  margin: 8px 0 0;
  color: #93877c;
  font-size: 13px;
  line-height: 1.6;
}

.refresh-button,
.primary-button,
.secondary-button,
.reset-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.refresh-button {
  flex-shrink: 0;
  border: 1px solid #e8ddd3;
  background: #fff;
  color: #765b49;
}

.refresh-button:hover:not(:disabled) {
  border-color: #943c14;
  color: #943c14;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

/* ==========================================
   STATISTICS
========================================== */

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  min-width: 0;
  padding: 19px 17px;
  border: 1px solid #eee7df;
  border-radius: 12px;
  background: #fff;
}

.stat-icon {
  display: grid;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 11px;
}

.icon-total {
  background: #f5eee8;
  color: #986044;
}

.icon-published {
  background: #eaf4ec;
  color: #4e825b;
}

.icon-pending {
  background: #fff4e3;
  color: #b77a2e;
}

.icon-archived {
  background: #f0eeeb;
  color: #80776f;
}

.stat-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.stat-content > span {
  color: #8d8177;
  font-size: 11px;
  font-weight: 600;
}

.stat-content > strong {
  color: #332b25;
  font-size: 25px;
  line-height: 1.2;
}

.stat-content > small {
  overflow: hidden;
  color: #a3988e;
  font-size: 10px;
  line-height: 1.5;
  text-overflow: ellipsis;
}

/* ==========================================
   STATUS SUMMARY
========================================== */

.status-summary {
  margin-bottom: 25px;
  padding: 21px 22px;
  border: 1px solid #eee7df;
  border-radius: 12px;
  background: #fff;
}

.summary-heading {
  margin-bottom: 20px;
}

.summary-heading h2,
.section-heading h2 {
  margin: 0;
  color: #41362e;
  font-size: 15px;
  font-weight: 800;
}

.summary-heading p {
  margin-top: 5px;
  font-size: 11px;
}

.status-summary-list {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 15px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
}

.summary-label {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #82766c;
  font-size: 11px;
}

.summary-item > strong {
  color: #473b32;
  font-size: 13px;
}

.summary-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
}

.dot-published,
.progress-published {
  background: #60916a;
}

.dot-pending,
.progress-pending {
  background: #d9a04d;
}

.dot-draft,
.progress-draft {
  background: #a99b8c;
}

.dot-rejected,
.progress-rejected {
  background: #c87568;
}

.dot-archived,
.progress-archived {
  background: #8d9296;
}

.status-progress {
  display: flex;
  overflow: hidden;
  width: 100%;
  height: 8px;
  border-radius: 20px;
  background: #f1ece7;
}

.progress-segment {
  min-width: 0;
  transition: width 0.3s ease;
}

/* ==========================================
   PRODUCT SECTION
========================================== */

.product-section {
  overflow: hidden;
  border: 1px solid #eee7df;
  border-radius: 12px;
  background: #fff;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 21px 22px 18px;
}

.section-heading p {
  margin-top: 5px;
  font-size: 11px;
}

.total-label {
  flex-shrink: 0;
  padding: 7px 10px;
  border-radius: 20px;
  background: #f8f1eb;
  color: #956247;
  font-size: 10px;
  font-weight: 700;
}

/* ==========================================
   FILTER
========================================== */

.filter-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 22px 18px;
}

.search-wrapper,
.filter-control {
  display: flex;
  align-items: center;
  min-height: 41px;
  border: 1px solid #e9e2db;
  border-radius: 8px;
  background: #fff;
  color: #9a8e83;
}

.search-wrapper {
  flex: 1;
  gap: 9px;
  min-width: 150px;
  padding: 0 12px;
}

.search-wrapper input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #40362f;
  font-family: inherit;
  font-size: 11px;
}

.search-wrapper input::placeholder {
  color: #afa49a;
}

.clear-search {
  display: grid;
  flex-shrink: 0;
  width: 23px;
  height: 23px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #f4eee8;
  color: #806e5f;
  cursor: pointer;
}

.filter-control {
  gap: 8px;
  padding: 0 10px;
}

.filter-control select {
  max-width: 150px;
  border: 0;
  outline: 0;
  background: transparent;
  color: #6e6258;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.category-control select {
  max-width: 135px;
}

.reset-button {
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid #eee0d7;
  background: #fff9f5;
  color: #985333;
  font-size: 11px;
}

/* ==========================================
   TABLE
========================================== */

.table-wrapper {
  overflow-x: auto;
  width: 100%;
  border-top: 1px solid #f0ebe6;
}

.product-table {
  width: 100%;
  min-width: 1050px;
  border-collapse: collapse;
  text-align: left;
}

.product-table thead {
  background: #fbf9f6;
}

.product-table th {
  padding: 13px 14px;
  color: #a1968c;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.6px;
  white-space: nowrap;
}

.product-table th:first-child,
.product-table td:first-child {
  padding-left: 22px;
}

.product-table td {
  padding: 13px 14px;
  border-top: 1px solid #f1ece7;
  color: #5d5046;
  font-size: 11px;
  vertical-align: middle;
}

.product-table tbody tr {
  transition: background 0.15s ease;
}

.product-table tbody tr:hover {
  background: #fdfbf9;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 190px;
}

.product-thumbnail {
  display: grid;
  overflow: hidden;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid #eee7df;
  border-radius: 8px;
  background: #f8f4ef;
  color: #b4a79a;
}

.product-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info,
.seller-cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 5px;
}

.product-info strong,
.seller-cell strong {
  max-width: 180px;
  overflow: hidden;
  color: #44372e;
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-info small,
.seller-cell small {
  max-width: 180px;
  overflow: hidden;
  color: #a3988d;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-label {
  display: inline-block;
  padding: 5px 8px;
  border-radius: 5px;
  background: #f6f1eb;
  color: #856b56;
  font-size: 10px;
  white-space: nowrap;
}

.price-text {
  color: #5e4938;
  font-size: 11px;
  white-space: nowrap;
}

.stock-label {
  color: #62564b;
  font-weight: 700;
}

.stock-low {
  color: #c18a37;
}

.stock-empty {
  color: #c45f52;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
}

.status-indicator {
  width: 6px;
  height: 6px;
  flex-shrink: 0;
  border-radius: 50%;
  background: currentColor;
}

.status-published {
  background: #edf5ee;
  color: #54805b;
}

.status-pending {
  background: #fff5e6;
  color: #ae782f;
}

.status-draft {
  background: #f1efec;
  color: #81776e;
}

.status-rejected {
  background: #fff0ed;
  color: #bd6658;
}

.status-archived {
  background: #eef0f1;
  color: #707b82;
}

.status-default {
  background: #f1efec;
  color: #81776e;
}

.date-text {
  color: #877b71;
  font-size: 10px;
  white-space: nowrap;
}

.action-column {
  text-align: center;
}

.detail-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid #eee0d6;
  border-radius: 7px;
  background: #fff;
  color: #92502e;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.detail-button:hover {
  border-color: #943c14;
  background: #fbf3ee;
}

/* ==========================================
   PAGINATION
========================================== */

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 16px 22px;
  border-top: 1px solid #f0ebe6;
}

.pagination-info {
  color: #978b80;
  font-size: 10px;
}

.pagination-info strong {
  color: #594b40;
}

.pagination-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-actions button {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border: 1px solid #e9e2db;
  border-radius: 7px;
  background: #fff;
  color: #78675a;
  cursor: pointer;
}

.pagination-actions button:hover:not(:disabled) {
  border-color: #943c14;
  color: #943c14;
}

.pagination-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-indicator {
  color: #76695f;
  font-size: 11px;
  font-weight: 700;
}

/* ==========================================
   EMPTY AND LOADING STATES
========================================== */

.state-container {
  display: flex;
  min-height: 290px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  border-top: 1px solid #f0ebe6;
  text-align: center;
}

.state-icon {
  display: grid;
  width: 55px;
  height: 55px;
  place-items: center;
  border-radius: 15px;
  background: #f6f0e9;
  color: #a27c5f;
}

.error-state-icon {
  background: #fff0ed;
  color: #bc695a;
}

.state-container h3 {
  margin: 16px 0 0;
  color: #514338;
  font-size: 14px;
}

.state-container p {
  max-width: 350px;
  margin: 8px 0 17px;
  color: #a0958a;
  font-size: 11px;
  line-height: 1.6;
}

.loading-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid #f0e6dc;
  border-top-color: #943c14;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.primary-button {
  border: 0;
  background: #943c14;
  color: #fff;
}

.primary-button:hover {
  background: #79300f;
}

.secondary-button {
  border: 1px solid #e9dfd5;
  background: #fff;
  color: #765b49;
}

.secondary-button:hover {
  border-color: #943c14;
  color: #943c14;
}

/* ==========================================
   MODAL
========================================== */

.modal-overlay {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px;
  background: rgb(38 30 24 / 55%);
  backdrop-filter: blur(3px);
}

.detail-modal {
  display: flex;
  overflow: hidden;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  flex-direction: column;
  border: 1px solid #eee5dc;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 20px 70px rgb(0 0 0 / 15%);
}

.modal-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 21px 25px;
  border-bottom: 1px solid #f0eae4;
}

.modal-header h2 {
  margin: 0;
  color: #3f332b;
  font-size: 18px;
  font-weight: 800;
}

.modal-eyebrow {
  display: block;
  margin-bottom: 5px;
  font-size: 9px;
}

.modal-close {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border: 1px solid #eee7df;
  border-radius: 8px;
  background: #fff;
  color: #786c62;
  cursor: pointer;
}

.modal-close:hover {
  background: #fff3ee;
  color: #943c14;
}

.modal-content {
  overflow-y: auto;
  padding: 24px 25px;
}

.detail-product-header {
  display: flex;
  align-items: center;
  gap: 19px;
  padding-bottom: 23px;
  border-bottom: 1px solid #f0eae4;
}

.detail-main-image {
  display: grid;
  overflow: hidden;
  flex-shrink: 0;
  width: 125px;
  height: 125px;
  place-items: center;
  border: 1px solid #eee5dc;
  border-radius: 11px;
  background: #f8f4ef;
  color: #b3a394;
}

.detail-main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail-product-identity {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.detail-product-identity h3 {
  margin: 0;
  color: #40352d;
  font-size: 19px;
  font-weight: 800;
}

.detail-product-identity p {
  margin: 0;
  color: #9a8d82;
  font-size: 11px;
}

.detail-price {
  color: #98502d;
  font-size: 17px;
}

/* ==========================================
   MODAL SECTIONS
========================================== */

.detail-section {
  padding: 22px 0;
  border-bottom: 1px solid #f0eae4;
}

.detail-section:last-child {
  border-bottom: 0;
}

.detail-section h3 {
  margin: 0 0 15px;
  color: #514338;
  font-size: 12px;
  font-weight: 800;
}

.detail-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.detail-section-title h3 {
  margin: 0;
}

.detail-section-title span {
  color: #a3978d;
  font-size: 10px;
}

.detail-image-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.detail-image-item {
  overflow: hidden;
  aspect-ratio: 1;
  border: 1px solid #eee5dc;
  border-radius: 8px;
  background: #f8f4ef;
}

.detail-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 17px;
  border: 1px dashed #e7ddd3;
  border-radius: 8px;
  color: #a09489;
  font-size: 11px;
}

.description-text {
  margin: 0;
  color: #786c61;
  font-size: 12px;
  line-height: 1.8;
  white-space: pre-line;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.detail-info-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #a1846c;
}

.detail-info-item > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.detail-info-item small {
  color: #a1958a;
  font-size: 10px;
}

.detail-info-item strong {
  overflow-wrap: anywhere;
  color: #55483e;
  font-size: 11px;
  font-weight: 700;
}

.id-value {
  font-size: 10px !important;
  font-weight: 500 !important;
}

/* ==========================================
   SELLER DETAIL
========================================== */

.seller-detail-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px;
  border: 1px solid #eee7df;
  border-radius: 9px;
  background: #fcfaf8;
}

.store-avatar {
  display: grid;
  overflow: hidden;
  flex-shrink: 0;
  width: 43px;
  height: 43px;
  place-items: center;
  border-radius: 9px;
  background: #f0e6dc;
  color: #956247;
}

.store-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-detail-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.store-detail-info strong {
  color: #514237;
  font-size: 12px;
}

.store-detail-info span {
  color: #9b8e83;
  font-size: 10px;
}

.seller-info-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.seller-info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9b8069;
}

.seller-info-row span {
  color: #776a60;
  font-size: 11px;
}

/* ==========================================
   MODAL FOOTER
========================================== */

.modal-footer {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding: 15px 25px;
  border-top: 1px solid #f0eae4;
  background: #fdfbf9;
}

/* ==========================================
   TOAST
========================================== */

.toast-notification {
  position: fixed;
  z-index: 1200;
  top: 22px;
  right: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-width: 280px;
  max-width: min(420px, calc(100vw - 35px));
  padding: 14px 16px;
  border: 1px solid #e7e0d8;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 30px rgb(45 35 27 / 12%);
}

.toast-message {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #5c5046;
  font-size: 12px;
  line-height: 1.5;
}

.toast-indicator {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #5e9a68;
}

.toast-error .toast-indicator {
  background: #c65e50;
}

.toast-notification button {
  display: grid;
  flex-shrink: 0;
  width: 25px;
  height: 25px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #92857a;
  cursor: pointer;
}

.toast-notification button:hover {
  background: #f5f0eb;
}

/* ==========================================
   TRANSITIONS
========================================== */

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .detail-modal,
.modal-leave-active .detail-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .detail-modal,
.modal-leave-to .detail-modal {
  transform: translateY(12px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==========================================
   RESPONSIVE
========================================== */

@media (max-width: 1100px) {
  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .status-summary-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .product-management-page {
    padding: 23px 17px 35px;
  }

  .page-header {
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .page-header p {
    font-size: 11px;
  }

  .refresh-button {
    min-width: 40px;
    padding: 0 10px;
  }

  .refresh-button span {
    display: none;
  }

  .filter-panel {
    flex-wrap: wrap;
    padding: 0 15px 15px;
  }

  .search-wrapper {
    flex-basis: 100%;
  }

  .filter-control {
    flex: 1;
    min-width: 0;
  }

  .filter-control select {
    width: 100%;
    max-width: none;
  }

  .reset-button {
    flex: 0 0 auto;
  }

  .section-heading {
    padding: 18px 15px;
  }

  .section-heading h2 {
    font-size: 13px;
  }

  .total-label {
    font-size: 9px;
  }

  .status-summary {
    padding: 18px 15px;
  }

  .status-summary-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pagination {
    padding: 14px 15px;
  }
}

@media (max-width: 480px) {
  .statistics-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stat-card {
    padding: 14px;
  }

  .stat-content > strong {
    font-size: 21px;
  }

  .status-summary-list {
    grid-template-columns: 1fr 1fr;
  }

  .summary-item {
    justify-content: space-between;
  }

  .pagination {
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-product-header {
    align-items: flex-start;
    gap: 13px;
  }

  .detail-main-image {
    width: 95px;
    height: 95px;
  }

  .detail-product-identity h3 {
    font-size: 15px;
  }

  .detail-image-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .detail-info-grid {
    grid-template-columns: 1fr;
  }

  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }

  .detail-modal {
    max-height: 93vh;
    border-radius: 15px 15px 0 0;
  }

  .modal-header,
  .modal-content {
    padding-right: 17px;
    padding-left: 17px;
  }

  .modal-footer {
    padding: 13px 17px;
  }

  .toast-notification {
    top: 12px;
    right: 12px;
    left: 12px;
    min-width: 0;
    max-width: none;
  }
}
</style>
