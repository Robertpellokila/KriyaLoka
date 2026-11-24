<script setup>
import { computed, onMounted, ref, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";

import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Package,
  Clock3,
  Store,
  UserRound,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  X,
  LoaderCircle,
  ClipboardCheck,
  Plus,
  Minus,
  History,
} from "lucide-vue-next";

import { useAdminStore } from "../../stores/admin.js";
import AppToast from "../../components/ui/AppToast.vue";

const router = useRouter();
const adminStore = useAdminStore();

// ==========================================
// STATE
// ==========================================

const searchQuery = ref("");
const selectedProduct = ref(null);

const loadingHistory = computed(() => adminStore.loadingProductHistory);

const productHistory = computed(() => adminStore.productReviewHistory || []);

const showDetailModal = ref(false);
const showRejectModal = ref(false);

const rejectionNote = ref("");
const processingProductId = ref(null);

const toast = ref({
  show: false,
  type: "success",
  title: "",
  message: "",
});

let toastTimeout = null;

const showImageViewer = ref(false);
const activeImageIndex = ref(0);
const zoomLevel = ref(1);

// Posisi gambar ketika diperbesar
const imageOffsetX = ref(0);
const imageOffsetY = ref(0);

// Drag / pan
const isDragging = ref(false);
const dragStart = ref({
  x: 0,
  y: 0,
  offsetX: 0,
  offsetY: 0,
});

const activeImage = computed(() => {
  return (
    selectedProduct.value?.product_images?.[activeImageIndex.value] || null
  );
});

function resetImagePosition() {
  imageOffsetX.value = 0;
  imageOffsetY.value = 0;
}

function openImageViewer(index) {
  activeImageIndex.value = index;
  zoomLevel.value = 1;
  resetImagePosition();
  showImageViewer.value = true;
}

// Membuka foto langsung dari gallery card,
// tanpa harus membuka modal Detail Produk.
function openProductImageViewer(product, index = 0) {
  selectedProduct.value = product;
  showDetailModal.value = false;
  showRejectModal.value = false;

  openImageViewer(index);
}

function closeImageViewer() {
  showImageViewer.value = false;
  zoomLevel.value = 1;
  resetImagePosition();
  isDragging.value = false;

  // Jangan menghapus produk jika viewer dibuka dari modal detail.
  if (!showDetailModal.value) {
    selectedProduct.value = null;
  }
}

function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value + 0.25, 3);
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value - 0.25, 1);

  if (zoomLevel.value === 1) {
    resetImagePosition();
  }
}

function resetZoom() {
  zoomLevel.value = 1;
  resetImagePosition();
}

// Mulai drag
function startImageDrag(event) {
  if (zoomLevel.value <= 1) return;
  if (event.button !== 0) return;

  isDragging.value = true;

  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    offsetX: imageOffsetX.value,
    offsetY: imageOffsetY.value,
  };

  event.currentTarget.setPointerCapture(event.pointerId);
}

// Geser gambar
function moveImageDrag(event) {
  if (!isDragging.value) return;

  imageOffsetX.value =
    dragStart.value.offsetX + (event.clientX - dragStart.value.x);

  imageOffsetY.value =
    dragStart.value.offsetY + (event.clientY - dragStart.value.y);
}

// Akhiri drag
function endImageDrag() {
  isDragging.value = false;
}

function previousImage() {
  const images = selectedProduct.value?.product_images || [];

  if (images.length <= 1) return;

  activeImageIndex.value =
    (activeImageIndex.value - 1 + images.length) % images.length;

  resetZoom();
}

function nextImage() {
  const images = selectedProduct.value?.product_images || [];

  if (images.length <= 1) return;

  activeImageIndex.value = (activeImageIndex.value + 1) % images.length;

  resetZoom();
}

// ==========================================
// COMPUTED
// ==========================================

const pendingProducts = computed(() => adminStore.pendingProductsList);

const filteredProducts = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  if (!keyword) return pendingProducts.value;

  return pendingProducts.value.filter((product) => {
    const productName = product.name?.toLowerCase() || "";
    const category = product.category?.toLowerCase() || "";
    const storeName = product.store_profile?.store_name?.toLowerCase() || "";
    const sellerName = product.seller?.full_name?.toLowerCase() || "";

    return (
      productName.includes(keyword) ||
      category.includes(keyword) ||
      storeName.includes(keyword) ||
      sellerName.includes(keyword)
    );
  });
});

// ==========================================
// PAGINATION
// ==========================================

const currentPage = ref(1);
const itemsPerPage = 6;

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

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

// Kembali ke halaman pertama ketika pencarian berubah
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Menjaga halaman tetap valid ketika jumlah produk berubah
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) {
    currentPage.value = newTotal;
  }
});

const isProcessing = computed(() => processingProductId.value !== null);

// ==========================================
// FORMATTERS
// ==========================================

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatWeight(value) {
  if (!value) return "-";

  if (value >= 1000) {
    return `${(value / 1000).toLocaleString("id-ID")} kg`;
  }

  return `${value} gram`;
}

// ==========================================
// PRODUCT REVIEW HISTORY
// ==========================================

const latestResubmission = computed(() => {
  return (
    [...productHistory.value]
      .reverse()
      .find((item) => item.action === "resubmitted") || null
  );
});

const latestRejection = computed(() => {
  const history = productHistory.value;
  const resubmission = latestResubmission.value;

  // Jika sudah pernah diajukan ulang, cari penolakan
  // yang terjadi sebelum pengajuan ulang tersebut.
  if (resubmission) {
    const resubmissionIndex = history.findIndex(
      (item) => item.id === resubmission.id,
    );

    return (
      history
        .slice(0, resubmissionIndex)
        .reverse()
        .find((item) => item.action === "rejected") || null
    );
  }

  return (
    [...history].reverse().find((item) => item.action === "rejected") || null
  );
});

const latestChanges = computed(() => {
  return latestResubmission.value?.changes || {};
});

const fieldChanges = computed(() => {
  const fields = latestChanges.value.fields || {};

  const labels = {
    name: "Nama Produk",
    description: "Deskripsi",
    category: "Kategori",
    price: "Harga",
    stock: "Stok",
    weight_grams: "Berat",
    status: "Status",
  };

  return Object.entries(fields).map(([key, value]) => ({
    key,
    label: labels[key] || key,
    before: value?.before,
    after: value?.after,
  }));
});

const imageChanges = computed(() => {
  return (
    latestChanges.value.images || {
      before_count: null,
      after_count: null,
      added: [],
      removed: [],
    }
  );
});

const hasResubmissionChanges = computed(() => {
  return (
    fieldChanges.value.length > 0 ||
    (imageChanges.value.added || []).length > 0 ||
    (imageChanges.value.removed || []).length > 0
  );
});

function formatHistoryValue(value, field = "") {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (field === "price") {
    return formatCurrency(value);
  }

  if (field === "weight_grams") {
    return formatWeight(value);
  }

  if (field === "stock") {
    return `${value} unit`;
  }

  if (typeof value === "boolean") {
    return value ? "Ya" : "Tidak";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatHistoryDateTime(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getHistoryActionLabel(action) {
  const labels = {
    submitted: "Produk diajukan",
    updated: "Produk diperbarui",
    resubmitted: "Produk diajukan ulang",
    rejected: "Produk ditolak",
    approved: "Produk disetujui",
    image_added: "Foto ditambahkan",
    image_removed: "Foto dihapus",
  };

  return labels[action] || "Aktivitas produk";
}

function getHistoryActionDescription(item) {
  const descriptions = {
    submitted: "Penjual mengirimkan produk untuk diperiksa administrator.",
    updated: "Penjual melakukan perubahan pada informasi produk.",
    resubmitted:
      "Penjual mengirimkan kembali produk setelah melakukan perbaikan.",
    rejected: "Administrator menolak pengajuan produk.",
    approved: "Administrator menyetujui pengajuan produk.",
    image_added: "Penjual menambahkan foto pada produk.",
    image_removed: "Penjual menghapus foto dari produk.",
  };

  return descriptions[item.action] || "Aktivitas tercatat pada sistem.";
}

function getHistoryImageUrl(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image.startsWith("http") ? image : "";
  }

  return image.image_url || image.url || "";
}

function getHistoryImageLabel(image, index) {
  if (typeof image === "string") {
    return `Foto ${index + 1}`;
  }

  return image?.name || `Foto ${index + 1}`;
}

function getHistoryActionClass(action) {
  const classes = {
    submitted: "history-submitted",
    updated: "history-updated",
    resubmitted: "history-resubmitted",
    rejected: "history-rejected",
    approved: "history-approved",
    image_added: "history-added",
    image_removed: "history-removed",
  };

  return classes[action] || "";
}

// ==========================================
// TOAST
// ==========================================

function showMessage(type, title, message = "") {
  clearTimeout(toastTimeout);

  toast.value = {
    show: true,
    type,
    title,
    message,
  };
}

function closeToast() {
  toast.value.show = false;
  clearTimeout(toastTimeout);
}

// ==========================================
// LOAD DATA
// ==========================================

async function loadProducts() {
  try {
    await adminStore.fetchDashboard();
  } catch (error) {
    console.error("Gagal memuat produk:", error);

    showMessage(
      "error",
      "Gagal memuat data",
      error.message || "Terjadi kesalahan saat mengambil data produk.",
    );
  }
}

// ==========================================
// DETAIL PRODUCT
// ==========================================

async function openDetail(product) {
  selectedProduct.value = product;
  showDetailModal.value = true;
  showRejectModal.value = false;
  rejectionNote.value = "";

  adminStore.clearProductReviewHistory();

  try {
    await adminStore.fetchProductReviewHistory(product.id);
  } catch (error) {
    console.error("Gagal mengambil riwayat produk:", error);

    showMessage(
      "error",
      "Riwayat tidak dapat dimuat",
      error.message || "Terjadi kesalahan saat mengambil riwayat produk.",
    );
  }
}

function closeDetail() {
  if (isProcessing.value) return;

  showDetailModal.value = false;
  showRejectModal.value = false;
  selectedProduct.value = null;
  rejectionNote.value = "";

  adminStore.clearProductReviewHistory();
}

// ==========================================
// APPROVE PRODUCT
// ==========================================

async function approveProduct(product) {
  if (!product || isProcessing.value) return;

  const productId = product.id;

  processingProductId.value = productId;

  try {
    await adminStore.reviewProduct(productId, "approved");

    showDetailModal.value = false;
    showRejectModal.value = false;
    selectedProduct.value = null;

    adminStore.clearProductReviewHistory();

    rejectionNote.value = "";

    // Refresh data dan statistik dashboard
    await adminStore.fetchDashboard();

    showMessage(
      "success",
      "Produk berhasil disetujui",
      `${product.name} sekarang dapat ditampilkan di katalog.`,
    );
  } catch (error) {
    console.error("Gagal menyetujui produk:", error);

    showMessage(
      "error",
      "Gagal menyetujui produk",
      error.message || "Terjadi kesalahan saat menyetujui produk.",
    );
  } finally {
    processingProductId.value = null;
  }
}

// ==========================================
// REJECT PRODUCT
// ==========================================

function openRejectForm() {
  showRejectModal.value = true;
  rejectionNote.value = "";
}

function cancelReject() {
  if (isProcessing.value) return;

  showRejectModal.value = false;
  rejectionNote.value = "";
}

async function rejectProduct() {
  if (!selectedProduct.value || isProcessing.value) return;

  const note = rejectionNote.value.trim();

  if (!note) {
    showMessage(
      "error",
      "Alasan penolakan wajib diisi",
      "Masukkan alasan agar penjual mengetahui bagian yang perlu diperbaiki.",
    );
    return;
  }

  if (note.length < 5) {
    showMessage(
      "error",
      "Alasan terlalu singkat",
      "Masukkan minimal 5 karakter untuk alasan penolakan.",
    );
    return;
  }

  const product = selectedProduct.value;
  const productId = product.id;

  processingProductId.value = productId;

  try {
    await adminStore.reviewProduct(productId, "rejected", note);

    showDetailModal.value = false;
    showRejectModal.value = false;
    selectedProduct.value = null;

    adminStore.clearProductReviewHistory();

    rejectionNote.value = "";

    // Refresh data dan statistik dashboard
    await adminStore.fetchDashboard();

    showMessage(
      "success",
      "Produk berhasil ditolak",
      `Penolakan untuk ${product.name} berhasil disimpan.`,
    );
  } catch (error) {
    console.error("Gagal menolak produk:", error);

    showMessage(
      "error",
      "Gagal menolak produk",
      error.message || "Terjadi kesalahan saat menolak produk.",
    );
  } finally {
    processingProductId.value = null;
  }
}

// ==========================================
// NAVIGATION
// ==========================================

function goBack() {
  router.push({ name: "admin-dashboard" });
}

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(() => {
  loadProducts();
});

onBeforeUnmount(() => {
  clearTimeout(toastTimeout);
});

// Supaya tombol refresh di AdminTopbar dapat memanggil halaman ini
defineExpose({
  refreshData: loadProducts,
});
</script>

<template>
  <div class="product-review-page">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-button" type="button" @click="goBack">
          <ArrowLeft :size="17" />
          <span>Dashboard</span>
        </button>

        <div class="page-heading">
          <div class="heading-icon">
            <ClipboardCheck :size="25" />
          </div>

          <div>
            <h1>Review Produk</h1>
            <p>
              Periksa dan kelola produk yang diajukan oleh penjual sebelum
              ditampilkan di katalog.
            </p>
          </div>
        </div>
      </div>

      <button
        class="refresh-button"
        type="button"
        :disabled="adminStore.loading"
        @click="loadProducts"
      >
        <RefreshCw :size="16" :class="{ spinning: adminStore.loading }" />
        <span>Refresh</span>
      </button>
    </div>

    <!-- TOAST -->
    <AppToast
      v-model="toast.show"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
    />

    <!-- SUMMARY -->
    <div class="summary-card">
      <div class="summary-icon">
        <Clock3 :size="23" />
      </div>

      <div class="summary-content">
        <span>Menunggu Review</span>
        <strong>
          {{ adminStore.statistics.pendingProducts }}
        </strong>
        <p>Produk yang membutuhkan pemeriksaan administrator.</p>
      </div>
    </div>

    <!-- TOOLBAR -->
    <div class="toolbar">
      <div class="search-wrapper">
        <Search :size="18" />

        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama produk, kategori, atau penjual..."
        />

        <button
          v-if="searchQuery"
          class="clear-search"
          type="button"
          aria-label="Hapus pencarian"
          @click="searchQuery = ''"
        >
          <X :size="15" />
        </button>
      </div>

      <div class="result-count">
        {{ filteredProducts.length }} produk ditemukan
      </div>
    </div>

    <!-- LOADING -->
    <div
      v-if="adminStore.loading && pendingProducts.length === 0"
      class="state-card"
    >
      <LoaderCircle :size="30" class="loading-spinner" />
      <h3>Memuat produk...</h3>
      <p>Mohon tunggu sebentar.</p>
    </div>

    <!-- EMPTY STATE -->
    <div v-else-if="filteredProducts.length === 0" class="state-card">
      <div class="empty-icon">
        <Package :size="32" />
      </div>

      <h3>
        {{
          searchQuery
            ? "Produk tidak ditemukan"
            : "Tidak ada produk menunggu review"
        }}
      </h3>

      <p>
        {{
          searchQuery
            ? "Coba gunakan kata kunci pencarian lainnya."
            : "Semua pengajuan produk sudah diperiksa."
        }}
      </p>

      <button
        v-if="searchQuery"
        class="secondary-button"
        type="button"
        @click="searchQuery = ''"
      >
        Reset Pencarian
      </button>
    </div>

    <!-- PRODUCT LIST -->

    <!-- PRODUCT GALLERY -->
    <div
      v-if="!adminStore.loading || pendingProducts.length > 0"
      class="product-gallery"
    >
      <article
        v-for="product in paginatedProducts"
        :key="product.id"
        class="gallery-card"
      >
        <!-- IMAGE -->
        <div
          class="gallery-image"
          role="button"
          tabindex="0"
          @click="openProductImageViewer(product, 0)"
          @keydown.enter="openProductImageViewer(product, 0)"
          @keydown.space.prevent="openProductImageViewer(product, 0)"
          aria-label="Lihat foto produk"
        >
          <img
            v-if="product.product_images?.[0]?.image_url"
            :src="product.product_images[0].image_url"
            :alt="product.name"
          />

          <div v-else class="gallery-image-placeholder">
            <ImageIcon :size="35" />
            <span>Tidak ada gambar</span>
          </div>

          <span class="gallery-status">
            <Clock3 :size="12" />
            Menunggu Review
          </span>

          <span v-if="product.product_images?.length > 1" class="image-count">
            <ImageIcon :size="12" />
            {{ product.product_images.length }} Foto
          </span>
        </div>

        <!-- CARD CONTENT -->
        <div class="gallery-content">
          <div class="gallery-category">
            {{ product.category || "Tanpa Kategori" }}
          </div>

          <h3>{{ product.name }}</h3>

          <div class="gallery-store">
            <Store :size="14" />
            <span>
              {{
                product.store_profile?.store_name || "Nama toko belum tersedia"
              }}
            </span>
          </div>

          <div class="gallery-seller">
            <UserRound :size="13" />
            <span>
              {{ product.seller?.full_name || "Penjual tidak diketahui" }}
            </span>
          </div>

          <div class="gallery-divider"></div>

          <div class="gallery-product-meta">
            <div>
              <span>Harga Produk</span>
              <strong>{{ formatCurrency(product.price) }}</strong>
            </div>

            <div>
              <span>Stok</span>
              <strong>{{ product.stock ?? 0 }} unit</strong>
            </div>
          </div>

          <div class="gallery-footer">
            <span class="gallery-date">
              <Clock3 :size="12" />
              {{ formatDate(product.submitted_at) }}
            </span>

            <button
              class="gallery-detail-button"
              type="button"
              @click="openDetail(product)"
            >
              <Eye :size="15" />
              Periksa
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- PAGINATION SLIDER -->
    <div
      v-if="filteredProducts.length > itemsPerPage"
      class="pagination-container"
    >
      <div class="pagination-info">
        <span>
          Menampilkan
          <strong>{{ paginationStart }}–{{ paginationEnd }}</strong>
          dari
          <strong>{{ filteredProducts.length }}</strong>
          produk
        </span>

        <span class="pagination-page-label">
          Halaman {{ currentPage }} dari {{ totalPages }}
        </span>
      </div>

      <div class="pagination-controls">
        <button
          class="pagination-arrow"
          type="button"
          :disabled="currentPage === 1"
          @click="previousPage"
          aria-label="Halaman sebelumnya"
        >
          <ArrowLeft :size="17" />
        </button>

        <div class="pagination-slider-wrapper">
          <input
            v-model.number="currentPage"
            class="pagination-slider"
            type="range"
            min="1"
            :max="totalPages"
            step="1"
            :style="{
              '--slider-progress':
                totalPages > 1
                  ? `${((currentPage - 1) / (totalPages - 1)) * 100}%`
                  : '0%',
            }"
            aria-label="Pilih halaman produk"
          />

          <div class="pagination-slider-labels">
            <span>1</span>
            <span>{{ totalPages }}</span>
          </div>
        </div>

        <button
          class="pagination-arrow"
          type="button"
          :disabled="currentPage === totalPages"
          @click="nextPage"
          aria-label="Halaman berikutnya"
        >
          <ArrowLeft :size="17" class="next-icon" />
        </button>
      </div>
    </div>

    <!-- DETAIL MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDetailModal && selectedProduct"
          class="modal-overlay"
          @click.self="closeDetail"
        >
          <div class="detail-modal">
            <div class="modal-header">
              <div>
                <span class="modal-eyebrow">PRODUCT REVIEW</span>
                <h2>Detail Produk</h2>
                <p>Periksa informasi produk sebelum mengambil keputusan.</p>
              </div>

              <button
                class="modal-close"
                type="button"
                :disabled="isProcessing"
                @click="closeDetail"
              >
                <X :size="20" />
              </button>
            </div>

            <div class="modal-body">
              <!-- PRODUCT GALLERY -->
              <section class="detail-section">
                <div class="section-heading">
                  <ImageIcon :size="17" />
                  <h3>Foto Produk</h3>
                  <span
                    v-if="selectedProduct.product_images?.length"
                    class="photo-total"
                  >
                    {{ selectedProduct.product_images.length }} Foto
                  </span>
                </div>

                <div
                  v-if="selectedProduct.product_images?.length"
                  class="image-gallery"
                >
                  <button
                    v-for="(image, index) in selectedProduct.product_images"
                    :key="image.id"
                    type="button"
                    class="gallery-image"
                    @click="openImageViewer(index)"
                    :aria-label="`Perbesar foto ${index + 1}`"
                  >
                    <img :src="image.image_url" :alt="selectedProduct.name" />

                    <div class="image-zoom-overlay">
                      <Eye :size="21" />
                      <span>Lihat Foto</span>
                    </div>
                  </button>
                </div>

                <div v-else class="gallery-empty">
                  <ImageIcon :size="28" />
                  <span>Penjual belum mengunggah foto produk.</span>
                </div>
              </section>

              <!-- PRODUCT INFORMATION -->
              <section class="detail-section">
                <div class="section-heading">
                  <Package :size="17" />
                  <h3>Informasi Produk</h3>
                </div>

                <div class="detail-grid">
                  <div class="detail-item full-width">
                    <span>Nama Produk</span>
                    <strong>{{ selectedProduct.name }}</strong>
                  </div>

                  <div class="detail-item">
                    <span>Kategori</span>
                    <strong>{{ selectedProduct.category || "-" }}</strong>
                  </div>

                  <div class="detail-item">
                    <span>Harga</span>
                    <strong class="price-value">
                      {{ formatCurrency(selectedProduct.price) }}
                    </strong>
                  </div>

                  <div class="detail-item">
                    <span>Stok</span>
                    <strong>{{ selectedProduct.stock ?? 0 }} unit</strong>
                  </div>

                  <div class="detail-item">
                    <span>Berat</span>
                    <strong>
                      {{ formatWeight(selectedProduct.weight_grams) }}
                    </strong>
                  </div>

                  <div class="detail-item">
                    <span>Dibuat Pada</span>
                    <strong>
                      {{ formatDate(selectedProduct.created_at) }}
                    </strong>
                  </div>

                  <div class="detail-item">
                    <span>Diajukan Pada</span>
                    <strong>
                      {{ formatDate(selectedProduct.submitted_at) }}
                    </strong>
                  </div>

                  <div class="detail-item full-width">
                    <span>Deskripsi Produk</span>
                    <p class="description-text">
                      {{
                        selectedProduct.description || "Tidak ada deskripsi."
                      }}
                    </p>
                  </div>
                </div>
              </section>

              <!-- SELLER INFORMATION -->
              <section class="detail-section">
                <div class="section-heading">
                  <Store :size="17" />
                  <h3>Informasi Penjual</h3>
                </div>

                <div class="seller-card">
                  <div class="seller-logo">
                    <img
                      v-if="selectedProduct.store_profile?.logo_url"
                      :src="selectedProduct.store_profile.logo_url"
                      :alt="selectedProduct.store_profile.store_name"
                    />

                    <Store v-else :size="24" />
                  </div>

                  <div class="seller-main">
                    <strong>
                      {{
                        selectedProduct.store_profile?.store_name ||
                        "Nama toko belum tersedia"
                      }}
                    </strong>

                    <span>
                      {{ selectedProduct.seller?.full_name || "-" }}
                    </span>
                  </div>
                </div>

                <div class="seller-details">
                  <div class="seller-detail-item">
                    <UserRound :size="15" />
                    <span>
                      {{ selectedProduct.seller?.full_name || "-" }}
                    </span>
                  </div>

                  <div class="seller-detail-item">
                    <AlertCircle :size="15" />
                    <span>
                      {{ selectedProduct.seller?.email || "-" }}
                    </span>
                  </div>

                  <div class="seller-detail-item">
                    <MapPin :size="15" />
                    <span>
                      {{
                        [
                          selectedProduct.store_profile?.city,
                          selectedProduct.store_profile?.province,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Lokasi belum tersedia"
                      }}
                    </span>
                  </div>

                  <div class="seller-detail-item">
                    <Store :size="15" />
                    <span>
                      {{
                        selectedProduct.store_profile?.category ||
                        "Kategori toko belum tersedia"
                      }}
                    </span>
                  </div>
                </div>
              </section>

              <!-- ======================================
     PERUBAHAN SEJAK PENOLAKAN TERAKHIR
====================================== -->

              <section class="detail-section history-section">
                <div class="section-heading">
                  <History :size="17" />
                  <h3>Perubahan Sejak Penolakan Terakhir</h3>
                </div>

                <!-- LOADING -->
                <div v-if="loadingHistory" class="history-loading">
                  <LoaderCircle :size="22" class="spinning" />
                  <span>Memuat riwayat perubahan...</span>
                </div>

                <template v-else>
                  <!-- BELUM PERNAH DITOLAK -->
                  <div v-if="!latestRejection" class="history-empty">
                    <CheckCircle2 :size="23" />
                    <div>
                      <strong>Belum ada riwayat penolakan</strong>
                      <p>
                        Produk ini belum memiliki catatan penolakan sebelumnya.
                      </p>
                    </div>
                  </div>

                  <template v-else>
                    <!-- INFORMASI PENOLAKAN -->
                    <div class="rejection-history-card">
                      <div class="rejection-history-top">
                        <div class="rejection-history-icon">
                          <XCircle :size="17" />
                        </div>

                        <div>
                          <strong>Penolakan Terakhir</strong>
                          <span>
                            {{
                              formatHistoryDateTime(latestRejection.created_at)
                            }}
                          </span>
                        </div>
                      </div>

                      <div class="rejection-history-note">
                        <span>Alasan Penolakan</span>
                        <p>
                          {{
                            latestRejection.note ||
                            "Tidak ada alasan yang dicatat."
                          }}
                        </p>
                      </div>
                    </div>

                    <!-- BELUM DIAJUKAN ULANG -->
                    <div
                      v-if="!latestResubmission"
                      class="history-empty history-empty-warning"
                    >
                      <Clock3 :size="22" />
                      <div>
                        <strong>Belum ada pengajuan ulang</strong>
                        <p>
                          Produk belum tercatat diajukan kembali setelah
                          penolakan terakhir.
                        </p>
                      </div>
                    </div>

                    <!-- PERUBAHAN SETELAH PENOLAKAN -->
                    <template v-else>
                      <div class="resubmission-heading">
                        <div>
                          <strong>Perbaikan dari Penjual</strong>
                          <span>
                            Diajukan ulang pada
                            {{
                              formatHistoryDateTime(
                                latestResubmission.created_at,
                              )
                            }}
                          </span>
                        </div>

                        <span class="resubmission-badge">Diajukan Ulang</span>
                      </div>

                      <!-- FIELD CHANGES -->
                      <div v-if="fieldChanges.length" class="change-list">
                        <div
                          v-for="change in fieldChanges"
                          :key="change.key"
                          class="change-item"
                        >
                          <span class="change-label">{{ change.label }}</span>

                          <div class="change-comparison">
                            <div class="change-before">
                              <span>Sebelumnya</span>
                              <strong>
                                {{
                                  formatHistoryValue(change.before, change.key)
                                }}
                              </strong>
                            </div>

                            <div class="change-arrow">→</div>

                            <div class="change-after">
                              <span>Sesudahnya</span>
                              <strong>
                                {{
                                  formatHistoryValue(change.after, change.key)
                                }}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- IMAGE CHANGES -->
                      <div
                        v-if="
                          (imageChanges.added || []).length ||
                          (imageChanges.removed || []).length
                        "
                        class="image-change-section"
                      >
                        <div class="image-change-summary">
                          <ImageIcon :size="15" />
                          <strong>Perubahan Foto Produk</strong>
                        </div>

                        <div
                          v-if="(imageChanges.added || []).length"
                          class="image-change-group"
                        >
                          <span class="image-change-label added-label">
                            <Plus :size="13" />
                            Foto Ditambahkan
                          </span>

                          <div class="history-image-list">
                            <div
                              v-for="(image, index) in imageChanges.added"
                              :key="`added-${index}`"
                              class="history-image-item"
                            >
                              <img
                                v-if="getHistoryImageUrl(image)"
                                :src="getHistoryImageUrl(image)"
                                :alt="getHistoryImageLabel(image, index)"
                              />

                              <div v-else class="history-image-placeholder">
                                <ImageIcon :size="17" />
                              </div>

                              <span>{{
                                getHistoryImageLabel(image, index)
                              }}</span>
                            </div>
                          </div>
                        </div>

                        <div
                          v-if="(imageChanges.removed || []).length"
                          class="image-change-group"
                        >
                          <span class="image-change-label removed-label">
                            <Minus :size="13" />
                            Foto Dihapus
                          </span>

                          <div class="history-image-list">
                            <div
                              v-for="(image, index) in imageChanges.removed"
                              :key="`removed-${index}`"
                              class="history-image-item removed-image-item"
                            >
                              <img
                                v-if="getHistoryImageUrl(image)"
                                :src="getHistoryImageUrl(image)"
                                :alt="getHistoryImageLabel(image, index)"
                              />

                              <div v-else class="history-image-placeholder">
                                <ImageIcon :size="17" />
                              </div>

                              <span>{{
                                getHistoryImageLabel(image, index)
                              }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-if="!hasResubmissionChanges" class="history-empty">
                        <AlertCircle :size="22" />
                        <div>
                          <strong>Tidak ada detail perubahan</strong>
                          <p>
                            Data pengajuan ulang tersedia, tetapi tidak
                            ditemukan perubahan yang tercatat.
                          </p>
                        </div>
                      </div>
                    </template>
                  </template>
                </template>
              </section>

              <!-- ======================================
     TIMELINE RIWAYAT AKTIVITAS
====================================== -->

              <section class="detail-section history-section">
                <div class="section-heading">
                  <Clock3 :size="17" />
                  <h3>Riwayat Aktivitas Produk</h3>

                  <span class="history-total">
                    {{ productHistory.length }} Aktivitas
                  </span>
                </div>

                <div v-if="loadingHistory" class="history-loading">
                  <LoaderCircle :size="22" class="spinning" />
                  <span>Memuat aktivitas produk...</span>
                </div>

                <div
                  v-else-if="productHistory.length === 0"
                  class="history-empty"
                >
                  <History :size="23" />
                  <div>
                    <strong>Belum ada riwayat aktivitas</strong>
                    <p>Aktivitas produk akan ditampilkan di bagian ini.</p>
                  </div>
                </div>

                <div v-else class="history-timeline">
                  <div
                    v-for="(item, index) in [...productHistory].reverse()"
                    :key="item.id"
                    class="timeline-item"
                  >
                    <div class="timeline-marker">
                      <div
                        class="timeline-dot"
                        :class="getHistoryActionClass(item.action)"
                      ></div>

                      <div
                        v-if="index !== productHistory.length - 1"
                        class="timeline-line"
                      ></div>
                    </div>

                    <div class="timeline-content">
                      <div class="timeline-top">
                        <strong>{{
                          getHistoryActionLabel(item.action)
                        }}</strong>

                        <span>
                          {{ formatHistoryDateTime(item.created_at) }}
                        </span>
                      </div>

                      <p>{{ getHistoryActionDescription(item) }}</p>

                      <div
                        v-if="item.action === 'rejected' && item.note"
                        class="timeline-note"
                      >
                        <span>Alasan Penolakan</span>
                        {{ item.note }}
                      </div>

                      <div
                        v-if="item.action === 'resubmitted' && item.note"
                        class="timeline-note timeline-resubmission-note"
                      >
                        <span>Catatan Pengajuan Ulang</span>
                        {{ item.note }}
                      </div>

                      <div
                        v-if="item.action === 'updated' && item.changes?.fields"
                        class="timeline-change-tags"
                      >
                        <span
                          v-for="key in Object.keys(item.changes.fields)"
                          :key="key"
                        >
                          {{ key }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- REJECTION FORM -->
              <section v-if="showRejectModal" class="reject-section">
                <div class="reject-heading">
                  <div class="reject-icon">
                    <AlertCircle :size="19" />
                  </div>

                  <div>
                    <h3>Tolak Pengajuan Produk</h3>
                    <p>
                      Berikan alasan yang jelas agar penjual dapat memperbaiki
                      produknya.
                    </p>
                  </div>
                </div>

                <textarea
                  v-model="rejectionNote"
                  rows="4"
                  maxlength="1000"
                  placeholder="Contoh: Foto produk kurang jelas. Silakan unggah foto dengan pencahayaan yang lebih baik..."
                  :disabled="isProcessing"
                ></textarea>

                <div class="textarea-footer">
                  <span>Minimal 5 karakter</span>
                  <span>{{ rejectionNote.length }}/1000</span>
                </div>

                <div class="reject-actions">
                  <button
                    class="cancel-button"
                    type="button"
                    :disabled="isProcessing"
                    @click="cancelReject"
                  >
                    Batal
                  </button>

                  <button
                    class="confirm-reject-button"
                    type="button"
                    :disabled="isProcessing"
                    @click="rejectProduct"
                  >
                    <LoaderCircle
                      v-if="processingProductId === selectedProduct.id"
                      :size="16"
                      class="spinning"
                    />

                    <XCircle v-else :size="16" />

                    {{ isProcessing ? "Memproses..." : "Tolak Produk" }}
                  </button>
                </div>
              </section>
            </div>

            <!-- MODAL FOOTER -->
            <div v-if="!showRejectModal" class="modal-footer">
              <button
                class="reject-button"
                type="button"
                :disabled="isProcessing"
                @click="openRejectForm"
              >
                <XCircle :size="17" />
                Tolak Produk
              </button>

              <button
                class="approve-button"
                type="button"
                :disabled="isProcessing"
                @click="approveProduct(selectedProduct)"
              >
                <LoaderCircle
                  v-if="processingProductId === selectedProduct.id"
                  :size="17"
                  class="spinning"
                />

                <CheckCircle2 v-else :size="17" />

                {{ isProcessing ? "Memproses..." : "Setujui Produk" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- IMAGE VIEWER / LIGHTBOX -->
      <Transition name="image-viewer">
        <div
          v-if="showImageViewer && activeImage"
          class="image-viewer-overlay"
          @click.self="closeImageViewer"
        >
          <!-- CLOSE -->
          <button
            class="viewer-close"
            type="button"
            @click="closeImageViewer"
            aria-label="Tutup gambar"
          >
            <X :size="23" />
          </button>

          <!-- COUNTER -->
          <div class="viewer-counter">
            Foto {{ activeImageIndex + 1 }} dari
            {{ selectedProduct.product_images.length }}
          </div>

          <!-- IMAGE STAGE -->
          <div class="viewer-stage">
            <!-- PREVIOUS -->
            <button
              v-if="selectedProduct.product_images.length > 1"
              class="viewer-nav viewer-previous"
              type="button"
              @click="previousImage"
              aria-label="Foto sebelumnya"
            >
              <ArrowLeft :size="23" />
            </button>

            <!-- IMAGE CONTAINER -->
            <div
              class="viewer-image-container"
              :class="{
                'is-zoomed': zoomLevel > 1,
                'is-dragging': isDragging,
              }"
              @pointerdown="startImageDrag"
              @pointermove="moveImageDrag"
              @pointerup="endImageDrag"
              @pointercancel="endImageDrag"
              @lostpointercapture="endImageDrag"
            >
              <img
                :key="activeImage.id"
                :src="activeImage.image_url"
                :alt="selectedProduct.name"
                class="viewer-image"
                :style="{
                  transform: `translate(${imageOffsetX}px, ${imageOffsetY}px) scale(${zoomLevel})`,
                }"
                draggable="false"
              />
            </div>

            <!-- NEXT -->
            <button
              v-if="selectedProduct.product_images.length > 1"
              class="viewer-nav viewer-next"
              type="button"
              @click="nextImage"
              aria-label="Foto berikutnya"
            >
              <ArrowLeft :size="23" />
            </button>
          </div>

          <!-- ZOOM CONTROLS -->
          <div class="viewer-controls">
            <button
              type="button"
              @click="zoomOut"
              :disabled="zoomLevel <= 1"
              aria-label="Zoom out"
            >
              <Minus :size="19" />
            </button>

            <span class="zoom-percentage">
              {{ Math.round(zoomLevel * 100) }}%
            </span>

            <button
              type="button"
              @click="zoomIn"
              :disabled="zoomLevel >= 3"
              aria-label="Zoom in"
            >
              <Plus :size="19" />
            </button>

            <span class="viewer-control-divider"></span>

            <button type="button" class="reset-zoom" @click="resetZoom">
              Reset
            </button>
          </div>

          <p class="viewer-caption">
            {{ selectedProduct.name }}
          </p>

          <p class="viewer-hint">
            Gunakan tombol zoom, lalu klik dan geser gambar untuk melihat
            detail.
          </p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.product-review-page {
  width: 100%;
  color: #40352d;
}

/* HEADER */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 28px;
}

.header-left {
  min-width: 0;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #8a7869;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.back-button:hover {
  color: #943c14;
}

.page-heading {
  display: flex;
  align-items: center;
  gap: 15px;
}

.heading-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 14px;
  background: #f4e6dc;
  color: #943c14;
}

.page-heading h1 {
  margin: 0;
  color: #40352d;
  font-family: Georgia, serif;
  font-size: 25px;
  font-weight: 700;
}

.page-heading p {
  margin: 6px 0 0;
  color: #91847a;
  font-size: 12px;
  line-height: 1.6;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 17px;
  border: 1px solid #e8ddd2;
  border-radius: 9px;
  background: white;
  color: #655448;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.refresh-button:hover:not(:disabled) {
  border-color: #943c14;
  color: #943c14;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* SUMMARY */

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 23px;
  margin-bottom: 23px;
  border: 1px solid #eee2d6;
  border-radius: 13px;
  background: #fff;
}

.summary-icon {
  display: grid;
  place-items: center;
  width: 49px;
  height: 49px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #fff4df;
  color: #b47b25;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.summary-content > span {
  color: #91847a;
  font-size: 11px;
  font-weight: 700;
}

.summary-content strong {
  color: #40352d;
  font-size: 25px;
  font-weight: 800;
}

.summary-content p {
  margin: 0;
  color: #a1968c;
  font-size: 11px;
}

/* TOOLBAR */

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 17px;
}

.search-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(480px, 100%);
  padding: 0 13px;
  border: 1px solid #e9dfd5;
  border-radius: 9px;
  background: white;
  color: #9b8d82;
}

.search-wrapper:focus-within {
  border-color: #bd8060;
}

.search-wrapper input {
  flex: 1;
  min-width: 0;
  padding: 12px 0;
  border: none;
  outline: none;
  background: transparent;
  color: #40352d;
  font-size: 12px;
}

.search-wrapper input::placeholder {
  color: #b2a69d;
}

.clear-search {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  border: none;
  border-radius: 6px;
  background: #f6f1ec;
  color: #8a7869;
  cursor: pointer;
}

.result-count {
  color: #9b8d82;
  font-size: 11px;
}

/* PRODUCT LIST */

.product-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.product-card {
  display: grid;
  grid-template-columns: 155px minmax(0, 1fr) auto;
  gap: 19px;
  align-items: center;
  padding: 16px;
  border: 1px solid #eee5dc;
  border-radius: 12px;
  background: white;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.product-card:hover {
  border-color: #d9bca8;
  box-shadow: 0 5px 18px rgba(70, 47, 30, 0.04);
}

.product-image {
  position: relative;
  height: 135px;
  overflow: hidden;
  border-radius: 9px;
  background: #f6f1ec;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  color: #b5a79b;
  font-size: 10px;
}

.pending-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  border-radius: 5px;
  background: rgba(255, 247, 229, 0.95);
  color: #a77728;
  font-size: 9px;
  font-weight: 800;
}

.product-info {
  min-width: 0;
}

.product-topline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.product-category {
  color: #a05b39;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.product-date {
  color: #aa9d92;
  font-size: 10px;
}

.product-info h3 {
  margin: 0 0 11px;
  color: #40352d;
  font-size: 15px;
  font-weight: 800;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 6px;
  color: #91847a;
  font-size: 11px;
}

.seller-info svg {
  flex-shrink: 0;
  color: #b39a85;
}

.product-meta {
  display: flex;
  gap: 28px;
  margin-top: 14px;
}

.product-meta div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-meta span {
  color: #a3978d;
  font-size: 9px;
}

.product-meta strong {
  color: #514338;
  font-size: 12px;
}

.product-actions {
  display: flex;
  align-items: center;
}

.detail-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 13px;
  border: 1px solid #ead9cb;
  border-radius: 8px;
  background: #fffaf6;
  color: #943c14;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition: 0.2s;
}

.detail-button:hover {
  border-color: #943c14;
  background: #943c14;
  color: white;
}

/* EMPTY / LOADING */

.state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 30px;
  border: 1px dashed #e7dcd1;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.7);
  text-align: center;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  margin-bottom: 14px;
  border-radius: 50%;
  background: #f4ece4;
  color: #a88a73;
}

.state-card h3 {
  margin: 0 0 7px;
  color: #514338;
  font-size: 14px;
}

.state-card p {
  margin: 0;
  color: #a1968c;
  font-size: 11px;
}

.secondary-button {
  margin-top: 16px;
  padding: 9px 15px;
  border: 1px solid #e7d7c9;
  border-radius: 7px;
  background: white;
  color: #943c14;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

/* MODAL */

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
  background: rgba(42, 32, 25, 0.58);
  backdrop-filter: blur(3px);
}

.detail-modal {
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
  max-height: calc(100vh - 48px);
  overflow: hidden;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 20px 70px rgba(30, 20, 12, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
  padding: 22px 25px;
  border-bottom: 1px solid #eee7df;
}

.modal-eyebrow {
  color: #a05b39;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1.2px;
}

.modal-header h2 {
  margin: 6px 0;
  color: #40352d;
  font-family: Georgia, serif;
  font-size: 21px;
}

.modal-header p {
  margin: 0;
  color: #a1968c;
  font-size: 11px;
}

.modal-close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: none;
  border-radius: 8px;
  background: #f5f0eb;
  color: #75665b;
  cursor: pointer;
}

.modal-close:hover {
  background: #eee4da;
}

.modal-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-body {
  padding: 22px 25px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 25px;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 14px;
  color: #a05b39;
}

.section-heading h3 {
  margin: 0;
  color: #514338;
  font-size: 12px;
  font-weight: 800;
}

/* GALLERY */

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
  gap: 10px;
}

.gallery-image {
  height: 120px;
  overflow: hidden;
  border: 1px solid #eee5dc;
  border-radius: 9px;
  background: #f6f1ec;
}

.gallery-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 90px;
  border: 1px dashed #e5d9ce;
  border-radius: 9px;
  color: #a99b90;
  font-size: 11px;
}

/* PRODUCT DETAILS */

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  border-radius: 8px;
  background: #faf7f3;
  min-width: 0;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item span {
  color: #a1968c;
  font-size: 10px;
}

.detail-item strong {
  color: #514338;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.detail-item .price-value {
  color: #943c14;
}

.description-text {
  margin: 0;
  color: #66584d;
  font-size: 11px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* SELLER */

.seller-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px;
  border: 1px solid #eee5dc;
  border-radius: 9px;
  background: #fffdfb;
}

.seller-logo {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 10px;
  background: #f4ece4;
  color: #a17b60;
}

.seller-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.seller-main {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.seller-main strong {
  color: #514338;
  font-size: 13px;
}

.seller-main span {
  color: #9c8e82;
  font-size: 11px;
}

.seller-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
  margin-top: 13px;
}

.seller-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #8d7e72;
  font-size: 10px;
}

.seller-detail-item svg {
  flex-shrink: 0;
  color: #b08c70;
}

.seller-detail-item span {
  overflow-wrap: anywhere;
}

/* REJECT FORM */

.reject-section {
  padding: 17px;
  border: 1px solid #f0d5ce;
  border-radius: 10px;
  background: #fff9f7;
}

.reject-heading {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-bottom: 14px;
}

.reject-icon {
  display: grid;
  place-items: center;
  width: 35px;
  height: 35px;
  flex-shrink: 0;
  border-radius: 9px;
  background: #fde9e5;
  color: #b54736;
}

.reject-heading h3 {
  margin: 0 0 5px;
  color: #9e4235;
  font-size: 12px;
}

.reject-heading p {
  margin: 0;
  color: #a1847d;
  font-size: 10px;
  line-height: 1.6;
}

.reject-section textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  resize: vertical;
  border: 1px solid #ead7d1;
  border-radius: 8px;
  outline: none;
  background: white;
  color: #514338;
  font-family: inherit;
  font-size: 11px;
  line-height: 1.7;
}

.reject-section textarea:focus {
  border-color: #c77b6c;
}

.reject-section textarea::placeholder {
  color: #b8a8a1;
}

.reject-section textarea:disabled {
  opacity: 0.6;
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 7px;
  color: #a78f87;
  font-size: 9px;
}

.reject-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 15px;
}

/* FOOTER BUTTONS */

.modal-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 17px 25px;
  border-top: 1px solid #eee7df;
  background: #fffdfb;
}

.reject-button,
.approve-button,
.cancel-button,
.confirm-reject-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
}

.reject-button {
  border: 1px solid #efd4ce;
  background: #fff8f6;
  color: #b54736;
}

.reject-button:hover:not(:disabled) {
  background: #b54736;
  color: white;
}

.approve-button {
  border: 1px solid #34734e;
  background: #34734e;
  color: white;
}

.approve-button:hover:not(:disabled) {
  background: #285d3e;
}

.cancel-button {
  border: 1px solid #e7ddd4;
  background: white;
  color: #75665b;
}

.confirm-reject-button {
  border: 1px solid #b54736;
  background: #b54736;
  color: white;
}

.confirm-reject-button:hover:not(:disabled) {
  background: #963b2e;
}

.reject-button:disabled,
.approve-button:disabled,
.cancel-button:disabled,
.confirm-reject-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ANIMATIONS */

.spinning,
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

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
  transform: translateY(15px);
}

/* RESPONSIVE */

@media (max-width: 850px) {
  .product-card {
    grid-template-columns: 125px minmax(0, 1fr);
  }

  .product-image {
    height: 125px;
  }

  .product-actions {
    grid-column: 2;
  }

  .detail-button {
    width: 100%;
  }
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
  }

  .refresh-button {
    align-self: flex-end;
  }

  .page-heading h1 {
    font-size: 21px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    width: 100%;
  }

  .result-count {
    text-align: right;
  }

  .product-card {
    grid-template-columns: 95px minmax(0, 1fr);
    gap: 12px;
    padding: 12px;
  }

  .product-image {
    height: 110px;
  }

  .product-date {
    display: none;
  }

  .product-info h3 {
    font-size: 13px;
  }

  .product-meta {
    gap: 17px;
  }

  .product-actions {
    grid-column: 1 / -1;
  }

  .detail-button {
    min-height: 38px;
  }

  .modal-overlay {
    align-items: flex-start;
    padding: 12px;
  }

  .detail-modal {
    max-height: calc(100vh - 24px);
    margin: auto 0;
  }

  .modal-header,
  .modal-body {
    padding: 17px;
  }

  .detail-grid,
  .seller-details {
    grid-template-columns: 1fr;
  }

  .modal-footer {
    padding: 13px 17px;
  }

  .modal-footer button {
    flex: 1;
    padding: 0 9px;
    font-size: 10px;
  }
}

@media (max-width: 380px) {
  .product-card {
    grid-template-columns: 1fr;
  }

  .product-image {
    height: 180px;
  }

  .product-actions {
    grid-column: 1;
  }

  .modal-footer {
    flex-direction: column;
  }
}

/* ==========================================
   PRODUCT GALLERY
========================================== */

.product-gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-top: 5px;
}

.gallery-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #eee3d8;
  border-radius: 13px;
  background: #ffffff;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.gallery-card:hover {
  transform: translateY(-4px);
  border-color: #d9b39d;
  box-shadow: 0 10px 28px rgba(70, 47, 30, 0.09);
}

/* IMAGE */

.gallery-image {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f5eee7;
}

.gallery-image > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.gallery-card:hover .gallery-image > img {
  transform: scale(1.04);
}

.gallery-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  height: 100%;
  color: #b5a79b;
  font-size: 11px;
}

.gallery-status {
  position: absolute;
  left: 11px;
  bottom: 11px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 10px;
  border: 1px solid rgba(232, 196, 135, 0.5);
  border-radius: 6px;
  background: rgba(255, 249, 235, 0.96);
  color: #a77728;
  font-size: 10px;
  font-weight: 800;
}

.image-count {
  position: absolute;
  top: 11px;
  right: 11px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border-radius: 6px;
  background: rgba(48, 38, 30, 0.75);
  color: white;
  font-size: 10px;
  font-weight: 700;
}

/* CONTENT */

.gallery-content {
  padding: 16px;
}

.gallery-category {
  margin-bottom: 7px;
  color: #a05b39;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.gallery-content h3 {
  margin: 0 0 12px;
  color: #40352d;
  font-size: 16px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.gallery-store,
.gallery-seller {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 7px;
  color: #8e8075;
  font-size: 11px;
  min-width: 0;
}

.gallery-store svg,
.gallery-seller svg {
  flex-shrink: 0;
  color: #b59a83;
}

.gallery-store span,
.gallery-seller span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-divider {
  height: 1px;
  margin: 15px 0 13px;
  background: #f0e9e2;
}

/* PRICE & STOCK */

.gallery-product-meta {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.gallery-product-meta div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.gallery-product-meta span {
  color: #a3978d;
  font-size: 10px;
}

.gallery-product-meta strong {
  color: #514338;
  font-size: 13px;
  font-weight: 800;
}

/* FOOTER */

.gallery-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 17px;
  padding-top: 12px;
  border-top: 1px solid #f0e9e2;
}

.gallery-date {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #a3978d;
  font-size: 10px;
}

.gallery-date svg {
  flex-shrink: 0;
}

.gallery-detail-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border: 1px solid #ead9cb;
  border-radius: 7px;
  background: #fffaf6;
  color: #943c14;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition: 0.2s;
}

.gallery-detail-button:hover {
  border-color: #943c14;
  background: #943c14;
  color: white;
}

/* ==========================================
   PAGINATION SLIDER
========================================== */

.pagination-container {
  margin-top: 28px;
  padding: 18px 20px;
  border: 1px solid #eee3d8;
  border-radius: 11px;
  background: #ffffff;
}

.pagination-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 17px;
  color: #998a7e;
  font-size: 11px;
}

.pagination-info strong {
  color: #514338;
}

.pagination-page-label {
  color: #943c14;
  font-weight: 800;
}

.pagination-controls {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.pagination-arrow {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1px solid #eadfd5;
  border-radius: 8px;
  background: white;
  color: #943c14;
  cursor: pointer;
  transition: 0.2s;
}

.pagination-arrow:hover:not(:disabled) {
  border-color: #943c14;
  background: #fff7f1;
}

.pagination-arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.next-icon {
  transform: rotate(180deg);
}

.pagination-slider-wrapper {
  flex: 1;
  min-width: 0;
  padding-top: 11px;
}

.pagination-slider {
  display: block;
  width: 100%;
  height: 6px;
  margin: 0;
  border-radius: 10px;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background: linear-gradient(
    to right,
    #943c14 0%,
    #943c14 var(--slider-progress),
    #eee5dc var(--slider-progress),
    #eee5dc 100%
  );
  cursor: pointer;
}

.pagination-slider::-webkit-slider-thumb {
  width: 17px;
  height: 17px;
  border: 3px solid #ffffff;
  border-radius: 50%;
  appearance: none;
  -webkit-appearance: none;
  background: #943c14;
  box-shadow: 0 0 0 1px #943c14;
}

.pagination-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border: 3px solid #ffffff;
  border-radius: 50%;
  background: #943c14;
  box-shadow: 0 0 0 1px #943c14;
}

.pagination-slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  color: #a3978d;
  font-size: 10px;
}

/* ==========================================
   RESPONSIVE
========================================== */

@media (max-width: 1150px) {
  .product-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .product-gallery {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .gallery-image {
    aspect-ratio: 16 / 10;
  }

  .gallery-content {
    padding: 15px;
  }

  .pagination-container {
    padding: 15px;
  }

  .pagination-info {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .pagination-controls {
    gap: 10px;
  }
}

/* ==========================================
   CLICKABLE PRODUCT IMAGE
========================================== */

.gallery-image {
  cursor: zoom-in;
}

.gallery-image:focus-visible {
  outline: 3px solid #943c14;
  outline-offset: 3px;
}

/* ==========================================
   IMAGE VIEWER OVERLAY
========================================== */

.image-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 65px 75px 30px;
  overflow: hidden;

  background: rgba(22, 18, 15, 0.97);
}

.viewer-close {
  position: absolute;
  top: 22px;
  right: 25px;
  z-index: 5;

  display: grid;
  place-items: center;

  width: 43px;
  height: 43px;

  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;

  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
}

.viewer-close:hover {
  background: #943c14;
}

.viewer-counter {
  position: absolute;
  top: 34px;
  left: 50%;
  z-index: 3;

  transform: translateX(-50%);

  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 700;
}

/* ==========================================
   IMAGE STAGE
========================================== */

.viewer-stage {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: min(68vh, 680px);
  min-height: 250px;

  overflow: hidden;
}

.viewer-image-container {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;

  overflow: hidden;
  touch-action: none;
  user-select: none;
  cursor: default;
}

.viewer-image-container.is-zoomed {
  cursor: grab;
}

.viewer-image-container.is-dragging {
  cursor: grabbing;
}

.viewer-image {
  display: block;

  max-width: 100%;
  max-height: 100%;

  width: auto;
  height: auto;

  object-fit: contain;
  object-position: center;

  transform-origin: center center;
  transition: transform 0.12s ease-out;

  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

/* ==========================================
   IMAGE NAVIGATION
========================================== */

.viewer-nav {
  position: absolute;
  top: 50%;
  z-index: 4;

  display: grid;
  place-items: center;

  width: 43px;
  height: 43px;

  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 50%;

  background: rgba(255, 255, 255, 0.12);
  color: white;

  cursor: pointer;
  transform: translateY(-50%);
  transition: 0.2s;
}

.viewer-nav:hover {
  background: #943c14;
  border-color: #943c14;
}

.viewer-previous {
  left: 8px;
}

.viewer-next {
  right: 8px;
}

.viewer-next svg {
  transform: rotate(180deg);
}

/* ==========================================
   ZOOM CONTROLS
========================================== */

.viewer-controls {
  position: relative;
  z-index: 5;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  margin-top: 20px;
  padding: 9px 13px;

  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 11px;

  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
}

.viewer-controls > button {
  display: grid;
  place-items: center;

  width: 36px;
  height: 36px;

  border: none;
  border-radius: 8px;

  background: rgba(255, 255, 255, 0.12);
  color: white;

  cursor: pointer;
  transition: 0.2s;
}

.viewer-controls > button:hover:not(:disabled) {
  background: #943c14;
}

.viewer-controls > button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.zoom-percentage {
  min-width: 48px;

  color: white;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}

.viewer-control-divider {
  width: 1px;
  height: 23px;
  background: rgba(255, 255, 255, 0.2);
}

.viewer-controls > .reset-zoom {
  width: auto;
  padding: 0 10px;

  background: transparent;
  font-size: 11px;
  font-weight: 700;
}

.viewer-caption {
  margin: 13px 0 0;

  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.viewer-hint {
  margin: 6px 0 0;

  color: rgba(255, 255, 255, 0.45);
  font-size: 10px;
  text-align: center;
}

/* ==========================================
   TRANSITION
========================================== */

.image-viewer-enter-active,
.image-viewer-leave-active {
  transition: opacity 0.2s ease;
}

.image-viewer-enter-from,
.image-viewer-leave-to {
  opacity: 0;
}

/* ==========================================
   RESPONSIVE
========================================== */

@media (max-width: 600px) {
  .image-viewer-overlay {
    padding: 70px 12px 25px;
  }

  .viewer-stage {
    height: 60vh;
  }

  .viewer-close {
    top: 15px;
    right: 15px;
  }

  .viewer-counter {
    top: 30px;
    left: 15px;
    transform: none;
  }

  .viewer-nav {
    width: 35px;
    height: 35px;
  }

  .viewer-previous {
    left: 3px;
  }

  .viewer-next {
    right: 3px;
  }

  .viewer-controls {
    gap: 8px;
    padding: 8px;
  }
}

/* ==========================================
   PRODUCT REVIEW HISTORY
========================================== */

.history-section {
  padding-top: 4px;
}

.history-total {
  margin-left: auto;
  padding: 5px 9px;
  border-radius: 6px;
  background: #f5eee7;
  color: #94735c;
  font-size: 9px;
  font-weight: 800;
}

/* LOADING & EMPTY */

.history-loading,
.history-empty {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #eee5dc;
  border-radius: 9px;
  background: #faf7f3;
  color: #a17b60;
}

.history-loading {
  justify-content: center;
  min-height: 65px;
  font-size: 11px;
}

.history-empty strong {
  display: block;
  margin-bottom: 4px;
  color: #514338;
  font-size: 11px;
}

.history-empty p {
  margin: 0;
  color: #9b8d82;
  font-size: 10px;
  line-height: 1.6;
}

.history-empty-warning {
  margin-top: 12px;
  border-color: #eee0c9;
  background: #fffbf2;
  color: #b1843d;
}

/* LAST REJECTION */

.rejection-history-card {
  padding: 15px;
  border: 1px solid #f0d9d3;
  border-radius: 10px;
  background: #fff9f7;
}

.rejection-history-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rejection-history-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 8px;
  background: #fde9e5;
  color: #b54736;
}

.rejection-history-top > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rejection-history-top strong {
  color: #9e4235;
  font-size: 11px;
}

.rejection-history-top span {
  color: #a1847d;
  font-size: 9px;
}

.rejection-history-note {
  margin-top: 13px;
  padding-top: 12px;
  border-top: 1px solid #f0e0dc;
}

.rejection-history-note > span,
.timeline-note > span {
  display: block;
  margin-bottom: 5px;
  color: #a1847d;
  font-size: 9px;
  font-weight: 800;
}

.rejection-history-note p {
  margin: 0;
  color: #72554d;
  font-size: 11px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* RESUBMISSION */

.resubmission-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin: 18px 0 12px;
}

.resubmission-heading > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.resubmission-heading strong {
  color: #514338;
  font-size: 11px;
}

.resubmission-heading span:not(.resubmission-badge) {
  color: #9b8d82;
  font-size: 9px;
}

.resubmission-badge {
  padding: 6px 9px;
  border-radius: 6px;
  background: #eaf4ed;
  color: #34734e;
  font-size: 9px;
  font-weight: 800;
  white-space: nowrap;
}

/* FIELD CHANGES */

.change-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.change-item {
  padding: 12px;
  border: 1px solid #eee5dc;
  border-radius: 9px;
  background: #fffdfb;
}

.change-label {
  display: block;
  margin-bottom: 10px;
  color: #806b5a;
  font-size: 10px;
  font-weight: 800;
}

.change-comparison {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 25px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.change-before,
.change-after {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 10px;
  border-radius: 7px;
}

.change-before {
  background: #fff0ed;
}

.change-after {
  background: #edf6ef;
}

.change-before span,
.change-after span {
  color: #9b8d82;
  font-size: 9px;
}

.change-before strong,
.change-after strong {
  font-size: 11px;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.change-before strong {
  color: #a54d3f;
  text-decoration: line-through;
  text-decoration-color: #d9a69d;
}

.change-after strong {
  color: #34734e;
}

.change-arrow {
  color: #a89585;
  font-size: 17px;
  text-align: center;
}

/* IMAGE CHANGES */

.image-change-section {
  margin-top: 13px;
  padding: 13px;
  border: 1px solid #eee5dc;
  border-radius: 9px;
  background: #fffdfb;
}

.image-change-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 13px;
  color: #806b5a;
  font-size: 10px;
}

.image-change-group + .image-change-group {
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid #eee5dc;
}

.image-change-label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 9px;
  font-size: 10px;
  font-weight: 800;
}

.added-label {
  color: #34734e;
}

.removed-label {
  color: #b54736;
}

.history-image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
  gap: 9px;
}

.history-image-item {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e9e1d8;
  border-radius: 8px;
  background: white;
}

.history-image-item img,
.history-image-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 85px;
  object-fit: cover;
  background: #f5eee7;
}

.history-image-placeholder {
  color: #b5a79b;
}

.history-image-item > span {
  display: block;
  padding: 7px;
  color: #76675c;
  font-size: 9px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.removed-image-item {
  opacity: 0.7;
}

.removed-image-item img {
  filter: grayscale(0.7);
}

/* TIMELINE */

.history-timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 11px;
  min-height: 76px;
}

.timeline-marker {
  position: relative;
  display: flex;
  justify-content: center;
}

.timeline-dot {
  position: relative;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin-top: 3px;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #b6a99e;
  box-shadow: 0 0 0 1px #e8ddd2;
}

.timeline-line {
  position: absolute;
  top: 14px;
  bottom: 0;
  width: 1px;
  background: #e8ddd2;
}

.history-submitted {
  background: #b58b53;
}

.history-updated {
  background: #688ba8;
}

.history-resubmitted {
  background: #42865c;
}

.history-rejected {
  background: #c45a49;
}

.history-approved {
  background: #34734e;
}

.history-added {
  background: #42865c;
}

.history-removed {
  background: #c45a49;
}

.timeline-content {
  min-width: 0;
  padding-bottom: 19px;
}

.timeline-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.timeline-top strong {
  color: #514338;
  font-size: 11px;
}

.timeline-top span {
  color: #a3978d;
  font-size: 9px;
  text-align: right;
}

.timeline-content > p {
  margin: 6px 0 0;
  color: #91847a;
  font-size: 10px;
  line-height: 1.6;
}

.timeline-note {
  margin-top: 9px;
  padding: 10px;
  border-radius: 7px;
  background: #fff3ef;
  color: #925044;
  font-size: 10px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.timeline-resubmission-note {
  background: #edf6ef;
  color: #34734e;
}

.timeline-change-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
}

.timeline-change-tags span {
  padding: 4px 7px;
  border-radius: 5px;
  background: #f4eee8;
  color: #826b58;
  font-size: 9px;
  font-weight: 700;
}

/* HISTORY RESPONSIVE */

@media (max-width: 500px) {
  .resubmission-heading {
    flex-direction: column;
  }

  .change-comparison {
    grid-template-columns: minmax(0, 1fr);
  }

  .change-arrow {
    transform: rotate(90deg);
  }

  .timeline-top {
    flex-direction: column;
    gap: 4px;
  }

  .timeline-top span {
    text-align: left;
  }
}
</style>
