<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Search,
  Plus,
  Package,
  Eye,
  Pencil,
  Archive,
  RefreshCw,
  Send,
  Clock3,
  AlertCircle,
  CheckCircle2,
} from "lucide-vue-next";

import { useProductStore } from "../stores/product.js";
import AppToast from "../components/ui/AppToast.vue";

const router = useRouter();
const route = useRoute();
const productStore = useProductStore();

const searchQuery = ref("");
const selectedStatus = ref("all");
const submittingProductId = ref(null);
const archivingProductId = ref(null);

const toast = ref({
  visible: false,
  type: "success",
  title: "",
  message: "",
});

let toastResetTimer = null;

function showToast(type, title, message = "") {
  clearTimeout(toastResetTimer);

  toast.value.visible = false;

  toastResetTimer = setTimeout(() => {
    toast.value = {
      visible: true,
      type,
      title,
      message,
    };
  }, 30);
}

onBeforeUnmount(() => {
  clearTimeout(toastResetTimer);
});

const products = computed(() => productStore.products || []);

const filteredProducts = computed(() => {
  let result = [...products.value];

  if (selectedStatus.value !== "all") {
    result = result.filter(
      (product) => product.status === selectedStatus.value,
    );
  }

  if (searchQuery.value.trim()) {
    const keyword = searchQuery.value.toLowerCase().trim();

    result = result.filter((product) => {
      return (
        product.name?.toLowerCase().includes(keyword) ||
        product.category?.toLowerCase().includes(keyword)
      );
    });
  }

  return result;
});

const productStats = computed(() => ({
  total: products.value.length,

  published: products.value.filter((product) => product.status === "published")
    .length,

  pending: products.value.filter(
    (product) => product.status === "pending_review",
  ).length,

  draft: products.value.filter((product) => product.status === "draft").length,

  rejected: products.value.filter((product) => product.status === "rejected")
    .length,

  archived: products.value.filter((product) => product.status === "archived")
    .length,
}));

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusLabel(status) {
  const labels = {
    published: "Dipublikasikan",
    draft: "Draft",
    pending_review: "Menunggu Review",
    rejected: "Ditolak",
    archived: "Diarsipkan",
  };

  return labels[status] || status;
}

function getStatusClass(status) {
  return `status-${status}`;
}

function getProductImage(product) {
  return (
    product.product_images?.[0]?.image_url ||
    product.images?.[0]?.image_url ||
    product.image_url ||
    ""
  );
}

function openCreateForm() {
  router.push({ name: "seller-product-create" });
}

function openEditForm(product) {
  if (!["draft", "rejected"].includes(product.status)) {
    showToast(
      "warning",
      "Produk tidak dapat diedit",
      "Produk yang sedang direview atau sudah dipublikasikan tidak dapat diedit.",
    );
    return;
  }

  router.push({
    name: "seller-product-edit",
    params: { id: product.id },
  });
}

function openProductDetail(product) {
  router.push({
    name: "product-detail",
    params: { id: product.id },
  });
}

async function loadProducts() {
  try {
    await productStore.fetchMyProducts();
  } catch (error) {
    showToast(
      "error",
      "Gagal memuat produk",
      error.message || "Terjadi kesalahan saat mengambil data produk.",
    );
  }
}

/**
 * Seller mengajukan produk untuk ditinjau admin.
 * Tidak ada perubahan status langsung menjadi published.
 */
async function submitForReview(product) {
  if (!["draft", "rejected"].includes(product.status)) {
    showToast(
      "error",
      "Produk tidak dapat diajukan",
      "Hanya produk Draft atau Ditolak yang dapat diajukan.",
    );
    return;
  }

  try {
    submittingProductId.value = product.id;

    await productStore.submitProductForReview(product.id);
    await productStore.fetchMyProducts();

    showToast(
      "success",
      "Pengajuan berhasil",
      `"${product.name}" berhasil dikirim dan sedang menunggu review admin.`,
    );
  } catch (error) {
    showToast(
      "error",
      "Gagal mengajukan produk",
      error.message || "Terjadi kesalahan saat mengajukan produk.",
    );
  } finally {
    submittingProductId.value = null;
  }
}

async function archiveProduct(product) {
  try {
    archivingProductId.value = product.id;

    await productStore.archiveProduct(product.id);
    await productStore.fetchMyProducts();

    showToast(
      "success",
      "Produk berhasil diarsipkan",
      `"${product.name}" sudah dipindahkan ke arsip.`,
    );
  } catch (error) {
    showToast(
      "error",
      "Gagal mengarsipkan produk",
      error.message || "Terjadi kesalahan saat mengarsipkan produk.",
    );
  } finally {
    archivingProductId.value = null;
  }
}

function handleImageError(event) {
  event.target.style.display = "none";
}

onMounted(async () => {
  await loadProducts();

  const notice = route.query.toast;

  if (notice === "created") {
    showToast(
      "success",
      "Produk berhasil ditambahkan",
      "Produk berhasil disimpan sebagai draft.",
    );
  } else if (notice === "updated") {
    showToast(
      "success",
      "Produk berhasil diperbarui",
      "Perubahan informasi produk berhasil disimpan.",
    );
  }

  if (notice) {
    const newQuery = { ...route.query };
    delete newQuery.toast;

    router.replace({ query: newQuery });
  }
});
</script>

<template>
  <div class="products-page">
    <AppToast
      v-model="toast.visible"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
    />

    <!-- Page Heading -->
    <div class="page-heading">
      <div>
        <span class="eyebrow">MANAJEMEN TOKO</span>
        <h1>Produk Saya</h1>
        <p>Kelola produk kerajinan dan pantau proses pemeriksaan admin.</p>
      </div>

      <button class="primary-button" @click="openCreateForm">
        <Plus :size="18" />
        Tambah Produk
      </button>
    </div>

    <!-- Statistics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon total-icon">
          <Package :size="20" />
        </div>
        <div>
          <span>Total Produk</span>
          <strong>{{ productStats.total }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon published-icon">
          <CheckCircle2 :size="20" />
        </div>
        <div>
          <span>Dipublikasikan</span>
          <strong>{{ productStats.published }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon pending-icon">
          <Clock3 :size="20" />
        </div>
        <div>
          <span>Menunggu Review</span>
          <strong>{{ productStats.pending }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon draft-icon">
          <Pencil :size="20" />
        </div>
        <div>
          <span>Draft</span>
          <strong>{{ productStats.draft }}</strong>
        </div>
      </div>
    </div>

    <!-- Rejected Notice -->
    <div v-if="productStats.rejected > 0" class="rejected-notice">
      <AlertCircle :size="19" />

      <div>
        <strong>{{ productStats.rejected }} produk ditolak admin</strong>
        <p>
          Periksa alasan penolakan, perbaiki produk, kemudian ajukan kembali.
        </p>
      </div>

      <button @click="selectedStatus = 'rejected'">Lihat Produk</button>
    </div>

    <!-- Product Table -->
    <div class="products-panel">
      <div class="panel-heading">
        <div>
          <h2>Daftar Produk</h2>
          <p>Atur dan pantau seluruh produk tokomu.</p>
        </div>

        <button
          class="refresh-button"
          :disabled="productStore.loading"
          @click="loadProducts"
        >
          <RefreshCw :size="16" :class="{ spinning: productStore.loading }" />
          Refresh
        </button>
      </div>

      <!-- Filters -->
      <div class="filter-toolbar">
        <div class="search-box">
          <Search :size="18" />

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama atau kategori produk..."
          />
        </div>

        <select v-model="selectedStatus">
          <option value="all">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="pending_review">Menunggu Review</option>
          <option value="published">Dipublikasikan</option>
          <option value="rejected">Ditolak</option>
          <option value="archived">Diarsipkan</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="productStore.loading" class="loading-state">
        <RefreshCw :size="24" class="spinning" />
        <p>Memuat produk...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredProducts.length === 0" class="empty-state">
        <div class="empty-icon">
          <Package :size="30" />
        </div>

        <h3>
          {{
            searchQuery || selectedStatus !== "all"
              ? "Produk tidak ditemukan"
              : "Belum Ada Produk"
          }}
        </h3>

        <p>
          {{
            searchQuery || selectedStatus !== "all"
              ? "Coba ubah kata kunci atau filter pencarian."
              : "Mulai tambahkan produk kerajinan untuk ditampilkan di tokomu."
          }}
        </p>

        <button
          v-if="!searchQuery && selectedStatus === 'all'"
          class="primary-button"
          @click="openCreateForm"
        >
          <Plus :size="18" />
          Tambah Produk Pertama
        </button>
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper">
        <table class="products-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Stok</th>
              <th>Status</th>
              <th>Tanggal</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="product in filteredProducts" :key="product.id">
              <td>
                <div class="product-cell">
                  <div class="product-thumbnail">
                    <img
                      v-if="getProductImage(product)"
                      :src="getProductImage(product)"
                      :alt="product.name"
                      @error="handleImageError"
                    />

                    <Package v-else :size="21" />
                  </div>

                  <div class="product-info">
                    <strong>{{ product.name }}</strong>
                    <span>{{ product.slug || product.id }}</span>
                  </div>
                </div>
              </td>

              <td>{{ product.category }}</td>

              <td class="price-cell">
                {{ formatCurrency(product.price) }}
              </td>

              <td>
                <span
                  :class="[
                    'stock-value',
                    { 'low-stock': Number(product.stock) <= 5 },
                  ]"
                >
                  {{ product.stock }}
                </span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="getStatusClass(product.status)"
                >
                  {{ getStatusLabel(product.status) }}
                </span>
              </td>

              <td>{{ formatDate(product.created_at) }}</td>

              <td>
                <div class="action-buttons">
                  <!-- View published product -->
                  <button
                    v-if="product.status === 'published'"
                    class="icon-button view-action"
                    title="Lihat produk"
                    @click="openProductDetail(product)"
                  >
                    <Eye :size="16" />
                  </button>

                  <!-- Edit draft or rejected product -->
                  <button
                    v-if="['draft', 'rejected'].includes(product.status)"
                    class="icon-button edit-action"
                    title="Edit produk"
                    @click="openEditForm(product)"
                  >
                    <Pencil :size="16" />
                  </button>

                  <!-- Submit for admin review -->
                  <button
                    v-if="['draft', 'rejected'].includes(product.status)"
                    class="icon-button submit-action"
                    title="Ajukan review ke admin"
                    :disabled="submittingProductId === product.id"
                    @click="submitForReview(product)"
                  >
                    <RefreshCw
                      v-if="submittingProductId === product.id"
                      :size="16"
                      class="spinning"
                    />

                    <Send v-else :size="16" />
                  </button>

                  <!-- Pending review indicator -->
                  <span
                    v-if="product.status === 'pending_review'"
                    class="pending-indicator"
                    title="Menunggu pemeriksaan admin"
                  >
                    <Clock3 :size="16" />
                  </span>

                  <!-- Archive -->
                  <button
                    v-if="product.status !== 'archived'"
                    class="icon-button archive-action"
                    title="Arsipkan produk"
                    :disabled="archivingProductId === product.id"
                    @click="archiveProduct(product)"
                  >
                    <RefreshCw
                      v-if="archivingProductId === product.id"
                      :size="16"
                      class="spinning"
                    />

                    <Archive v-else :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="filteredProducts.length > 0 && !productStore.loading"
        class="table-footer"
      >
        Menampilkan {{ filteredProducts.length }} dari
        {{ products.length }} produk
      </div>
    </div>

    <!-- Rejection Details -->
    <div v-if="selectedStatus === 'rejected'" class="rejection-information">
      <h3>Informasi Penolakan</h3>
      <p>
        Untuk mengetahui alasan penolakan, buka produk yang ditolak melalui
        halaman edit produk. Pastikan informasi produk sudah diperbaiki sebelum
        mengajukan ulang.
      </p>
    </div>
  </div>
</template>

<style scoped>
.products-page {
  width: 100%;
  color: #40352d;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.eyebrow {
  color: #a65a37;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.page-heading h1 {
  margin: 7px 0;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.8px;
}

.page-heading p,
.panel-heading p {
  margin: 0;
  color: #92867c;
  font-size: 12px;
  line-height: 1.6;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 17px;
  border: none;
  border-radius: 9px;
  background: #943c14;
  color: white;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

.primary-button:hover {
  background: #77300f;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 18px;
  border: 1px solid #e9e1d8;
  border-radius: 12px;
  background: #fff;
}

.stat-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 10px;
}

.total-icon {
  color: #9b5835;
  background: #f8eee7;
}

.published-icon {
  color: #34734e;
  background: #eaf5ed;
}

.pending-icon {
  color: #987335;
  background: #faf3e4;
}

.draft-icon {
  color: #9b7735;
  background: #faf3e4;
}

.stat-card span {
  display: block;
  margin-bottom: 5px;
  color: #93877d;
  font-size: 10px;
}

.stat-card strong {
  color: #44382f;
  font-size: 22px;
  font-weight: 800;
}

.rejected-notice {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 22px;
  padding: 15px 18px;
  border: 1px solid #efd8cc;
  border-radius: 10px;
  background: #fff8f4;
  color: #a34c30;
}

.rejected-notice div {
  flex: 1;
}

.rejected-notice strong {
  font-size: 12px;
}

.rejected-notice p {
  margin: 4px 0 0;
  color: #92776a;
  font-size: 10px;
}

.rejected-notice button {
  border: none;
  background: transparent;
  color: #943c14;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.products-panel {
  overflow: hidden;
  border: 1px solid #e9e1d8;
  border-radius: 13px;
  background: #fff;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 21px 22px;
  border-bottom: 1px solid #eee8e1;
}

.panel-heading h2 {
  margin: 0 0 5px;
  font-size: 15px;
  font-weight: 800;
}

.refresh-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border: 1px solid #e7ded5;
  border-radius: 8px;
  background: white;
  color: #69594d;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filter-toolbar {
  display: flex;
  gap: 12px;
  padding: 17px 22px;
  border-bottom: 1px solid #eee8e1;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  padding: 0 12px;
  border: 1px solid #e7ded5;
  border-radius: 8px;
  color: #9b8e83;
}

.search-box input {
  width: 100%;
  height: 39px;
  border: 0;
  outline: none;
  background: transparent;
  color: #44382f;
  font: inherit;
  font-size: 11px;
}

.filter-toolbar select {
  min-width: 165px;
  padding: 0 12px;
  border: 1px solid #e7ded5;
  border-radius: 8px;
  outline: none;
  background: white;
  color: #69594d;
  font: inherit;
  font-size: 11px;
}

.table-wrapper {
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  text-align: left;
}

.products-table th {
  padding: 14px 16px;
  background: #fcfaf8;
  color: #96897e;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.products-table td {
  padding: 14px 16px;
  border-top: 1px solid #f1ece7;
  color: #72655b;
  font-size: 11px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 190px;
}

.product-thumbnail {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 43px;
  height: 43px;
  overflow: hidden;
  border-radius: 8px;
  background: #f5eee7;
  color: #a65a37;
}

.product-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info strong {
  display: block;
  max-width: 180px;
  overflow: hidden;
  color: #44382f;
  font-size: 11px;
  text-overflow: ellipsis;
}

.product-info span {
  display: block;
  margin-top: 4px;
  color: #aa9d92;
  font-size: 9px;
}

.price-cell {
  color: #493b31 !important;
  font-weight: 700;
}

.stock-value {
  font-weight: 700;
  color: #34734e;
}

.low-stock {
  color: #bd693d;
}

.status-badge {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
}

.status-published {
  color: #34734e;
  background: #eaf5ed;
}

.status-draft {
  color: #987335;
  background: #faf3e4;
}

.status-pending_review {
  color: #916b24;
  background: #fff4d9;
}

.status-rejected {
  color: #a34c30;
  background: #fff0e9;
}

.status-archived {
  color: #777;
  background: #f0f0f0;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 29px;
  height: 29px;
  border: none;
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s;
}

.icon-button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.view-action {
  color: #47728e;
}

.view-action:hover {
  background: #edf3f8;
}

.edit-action {
  color: #a65a37;
}

.edit-action:hover {
  background: #f8eee7;
}

.submit-action {
  color: #34734e;
}

.submit-action:hover {
  background: #eaf5ed;
}

.archive-action {
  color: #a65a37;
}

.archive-action:hover {
  background: #fff0ed;
}

.pending-indicator {
  display: grid;
  place-items: center;
  width: 29px;
  height: 29px;
  color: #987335;
}

.table-footer {
  padding: 13px 22px;
  border-top: 1px solid #eee8e1;
  color: #9a8d82;
  font-size: 10px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 55px 20px;
  text-align: center;
}

.loading-state {
  color: #a65a37;
}

.loading-state p {
  color: #92867c;
  font-size: 12px;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  margin-bottom: 15px;
  border-radius: 16px;
  background: #f8eee7;
  color: #a65a37;
}

.empty-state h3 {
  margin: 0 0 8px;
  color: #44382f;
  font-size: 15px;
}

.empty-state p {
  max-width: 340px;
  margin: 0 0 20px;
  color: #92867c;
  font-size: 11px;
  line-height: 1.7;
}

.rejection-information {
  margin-top: 20px;
  padding: 18px;
  border: 1px solid #e9e1d8;
  border-radius: 10px;
  background: #fff;
}

.rejection-information h3 {
  margin: 0 0 8px;
  font-size: 13px;
}

.rejection-information p {
  margin: 0;
  color: #92867c;
  font-size: 11px;
  line-height: 1.7;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-heading h1 {
    font-size: 23px;
  }

  .filter-toolbar {
    flex-direction: column;
  }

  .filter-toolbar select {
    height: 40px;
  }

  .panel-heading {
    padding: 17px;
  }

  .products-table th,
  .products-table td {
    padding: 12px;
  }

  .rejected-notice {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .rejected-notice button {
    margin-left: 30px;
  }
}
</style>
