<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  Search,
  RefreshCw,
  Store,
  Users,
  UserCheck,
  UserX,
  Package,
  Eye,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  ShieldCheck,
  Ban,
  CheckCircle2,
  X,
  LoaderCircle,
  AlertCircle,
  SlidersHorizontal,
  UserCog2Icon,
} from "lucide-vue-next";

import { useAdminStore } from "../../stores/admin.js";
import AppToast from "../../components/ui/AppToast.vue";

const router = useRouter();
const adminStore = useAdminStore();

// --------------------------------------------------
// STATE
// --------------------------------------------------

const searchQuery = ref("");
const selectedStatus = ref("all");
const currentPage = ref(1);
const itemsPerPage = 8;

const loading = ref(false);
const showStatusModal = ref(false);
const selectedSeller = ref(null);
const nextStatus = ref(null);
const processingSellerId = ref(null);

const toast = ref({
  show: false,
  type: "success",
  title: "",
  message: "",
});

// --------------------------------------------------
// TOAST
// --------------------------------------------------

function showToast(type, title, message) {
  toast.value = {
    show: true,
    type,
    title,
    message,
  };
}

// --------------------------------------------------
// STATUS CONFIGURATION
// --------------------------------------------------

const statusConfig = {
  pending: {
    label: "Menunggu Verifikasi",
    class: "status-pending",
  },
  active: {
    label: "Aktif",
    class: "status-active",
  },
  rejected: {
    label: "Ditolak",
    class: "status-rejected",
  },
  suspended: {
    label: "Ditangguhkan",
    class: "status-suspended",
  },
};

function getStatus(status) {
  return (
    statusConfig[status] ?? {
      label: status || "Tidak diketahui",
      class: "status-unknown",
    }
  );
}

// --------------------------------------------------
// SELLER DATA
// --------------------------------------------------

const sellers = computed(() => adminStore.sellers ?? []);

const statistics = computed(() => {
  const list = sellers.value;

  return {
    total: list.length,
    active: list.filter((seller) => seller.account_status === "active").length,
    pending: list.filter((seller) => seller.account_status === "pending")
      .length,
    suspended: list.filter((seller) => seller.account_status === "suspended")
      .length,
  };
});

// --------------------------------------------------
// SEARCH & FILTER
// --------------------------------------------------

const filteredSellers = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return sellers.value.filter((seller) => {
    const store = seller.store_profile ?? {};

    const searchableText = [
      seller.full_name,
      seller.email,
      seller.phone_number,
      store.store_name,
      store.category,
      store.city,
      store.province,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !keyword || searchableText.includes(keyword);

    const matchesStatus =
      selectedStatus.value === "all" ||
      seller.account_status === selectedStatus.value;

    return matchesSearch && matchesStatus;
  });
});

// --------------------------------------------------
// PAGINATION
// --------------------------------------------------

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSellers.value.length / itemsPerPage)),
);

const paginatedSellers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;

  return filteredSellers.value.slice(start, start + itemsPerPage);
});

const paginationStart = computed(() => {
  if (filteredSellers.value.length === 0) return 0;

  return (currentPage.value - 1) * itemsPerPage + 1;
});

const paginationEnd = computed(() =>
  Math.min(currentPage.value * itemsPerPage, filteredSellers.value.length),
);

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;

  currentPage.value = page;
}

function getPageNumbers() {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);

  if (current <= 2) {
    end = Math.min(total, 5);
  }

  if (current >= total - 1) {
    start = Math.max(1, total - 4);
  }

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  return pages;
}

// --------------------------------------------------
// FORMATTERS
// --------------------------------------------------

function formatDate(date) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name) {
  if (!name) return "S";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function getStoreName(seller) {
  return seller.store_profile?.store_name || "Nama toko belum diisi";
}

function getStoreLocation(seller) {
  const store = seller.store_profile ?? {};

  return (
    [store.city, store.province].filter(Boolean).join(", ") ||
    "Lokasi belum diisi"
  );
}

// --------------------------------------------------
// LOAD DATA
// --------------------------------------------------

async function loadSellers(showMessage = false) {
  loading.value = true;

  try {
    await adminStore.fetchSellers();

    if (showMessage) {
      showToast(
        "success",
        "Data diperbarui",
        "Daftar penjual berhasil diperbarui.",
      );
    }
  } catch (error) {
    showToast(
      "error",
      "Gagal memuat data",
      error.message || "Terjadi kesalahan saat mengambil data penjual.",
    );
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadSellers();
});

// --------------------------------------------------
// SELLER DETAIL
// --------------------------------------------------

function openSellerDetail(seller) {
  router.push({
    name: "AdminSellerDetail",
    params: {
      sellerId: seller.id,
    },
  });
}

// --------------------------------------------------
// ACCOUNT STATUS
// --------------------------------------------------

function openStatusModal(seller) {
  selectedSeller.value = seller;

  if (seller.account_status === "pending") {
    // Penjual pending harus melalui proses verifikasi.
    nextStatus.value = "approved";
  } else if (seller.account_status === "active") {
    nextStatus.value = "suspended";
  } else if (seller.account_status === "suspended") {
    // Penjual suspended dapat diaktifkan kembali.
    nextStatus.value = "active";
  } else {
    return;
  }

  showStatusModal.value = true;
}

function closeStatusModal() {
  if (processingSellerId.value) return;

  showStatusModal.value = false;
  selectedSeller.value = null;
  nextStatus.value = null;
}

const statusActionText = computed(() => {
  if (nextStatus.value === "approved") return "Verifikasi dan Aktifkan Penjual";
  if (nextStatus.value === "suspended") return "Tangguhkan Akun";
  return "Aktifkan Kembali Akun";
});

const statusModalDescription = computed(() => {
  if (nextStatus.value === "approved") {
    return "Anda akan menyetujui pendaftaran penjual ini. Setelah disetujui, akun penjual akan berstatus aktif dan dapat mulai berjualan.";
  }

  if (nextStatus.value === "suspended") {
    return "Penjual ini tidak akan memiliki akses sebagai penjual selama akunnya ditangguhkan. Data produk dan riwayatnya tetap tersimpan.";
  }

  return "Penjual ini akan kembali memiliki status akun aktif dan dapat menggunakan fitur penjual.";
});

async function confirmStatusChange() {
  if (!selectedSeller.value || !nextStatus.value) return;

  const seller = selectedSeller.value;
  const decision = nextStatus.value;

  processingSellerId.value = seller.id;

  try {
    if (decision === "approved") {
      // Persetujuan pendaftaran penjual melalui RPC.
      await adminStore.reviewSeller(seller.id, "approved");
    } else {
      // Aktivasi kembali atau penangguhan akun.
      await adminStore.updateSellerStatus(seller.id, decision);
    }

    showStatusModal.value = false;

    const successMessage =
      decision === "approved"
        ? `Pendaftaran ${seller.full_name} berhasil disetujui. Akun penjual sekarang aktif.`
        : decision === "active"
          ? `Akun ${seller.full_name} berhasil diaktifkan kembali.`
          : `Akun ${seller.full_name} berhasil ditangguhkan.`;

    showToast("success", "Status akun diperbarui", successMessage);

    selectedSeller.value = null;
    nextStatus.value = null;
    currentPage.value = 1;
  } catch (error) {
    showToast(
      "error",
      "Gagal memperbarui status",
      error.message || "Terjadi kesalahan saat memperbarui akun.",
    );
  } finally {
    processingSellerId.value = null;
  }
}

// --------------------------------------------------
// SEARCH RESET
// --------------------------------------------------

function resetFilters() {
  searchQuery.value = "";
  selectedStatus.value = "all";
  currentPage.value = 1;
}
</script>

<template>
  <div class="seller-management-page">
    <!-- PAGE HEADER -->
    <header class="page-header">
      <div class="page-heading">
        <div class="heading-icon">
          <Store :size="24" />
        </div>

        <div>
          <p class="eyebrow">ADMINISTRATION</p>
          <h1>Manajemen Penjual</h1>
          <p class="page-description">
            Kelola seluruh penjual dan pantau aktivitas toko di KriyaLoka.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="refresh-button"
        :disabled="loading"
        @click="loadSellers(true)"
      >
        <RefreshCw :size="17" :class="{ spinning: loading }" />
        <span>Refresh Data</span>
      </button>
    </header>

    <!-- STATISTICS -->
    <section class="statistics-grid">
      <article class="stat-card">
        <div class="stat-icon icon-total">
          <Users :size="21" />
        </div>

        <div class="stat-content">
          <p>Total Penjual</p>
          <h2>{{ statistics.total }}</h2>
          <span>Seluruh akun penjual</span>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon icon-active">
          <UserCheck :size="21" />
        </div>

        <div class="stat-content">
          <p>Penjual Aktif</p>
          <h2>{{ statistics.active }}</h2>
          <span>Akun yang dapat berjualan</span>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon icon-pending">
          <UserCog2Icon :size="21" />
        </div>

        <div class="stat-content">
          <p>Menunggu Verifikasi</p>
          <h2>{{ statistics.pending }}</h2>
          <span>Perlu pemeriksaan akun</span>
        </div>
      </article>

      <article class="stat-card">
        <div class="stat-icon icon-suspended">
          <UserX :size="21" />
        </div>

        <div class="stat-content">
          <p>Ditangguhkan</p>
          <h2>{{ statistics.suspended }}</h2>
          <span>Akun yang sedang dibatasi</span>
        </div>
      </article>
    </section>

    <!-- SELLER LIST -->
    <section class="seller-section">
      <div class="section-heading">
        <div>
          <h2>Daftar Penjual</h2>
          <p>Lihat informasi toko dan statistik produk setiap penjual.</p>
        </div>

        <div class="seller-count">
          {{ filteredSellers.length }} penjual ditemukan
        </div>
      </div>

      <!-- FILTER TOOLBAR -->
      <div class="filter-toolbar">
        <div class="search-box">
          <Search :size="19" />

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama toko, pemilik, email..."
            @input="currentPage = 1"
          />

          <button
            v-if="searchQuery"
            type="button"
            class="clear-search"
            aria-label="Hapus pencarian"
            @click="
              searchQuery = '';
              currentPage = 1;
            "
          >
            <X :size="16" />
          </button>
        </div>

        <div class="filter-control">
          <SlidersHorizontal :size="17" />

          <select v-model="selectedStatus" @change="currentPage = 1">
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="pending">Menunggu Verifikasi</option>
            <option value="rejected">Ditolak</option>
            <option value="suspended">Ditangguhkan</option>
          </select>
        </div>

        <button type="button" class="reset-button" @click="resetFilters">
          Reset Filter
        </button>
      </div>

      <!-- LOADING -->
      <div v-if="loading && sellers.length === 0" class="state-container">
        <LoaderCircle class="spinning" :size="32" />
        <p>Memuat data penjual...</p>
      </div>

      <!-- EMPTY STATE -->
      <div
        v-else-if="filteredSellers.length === 0"
        class="state-container empty-state"
      >
        <div class="empty-icon">
          <Store :size="30" />
        </div>

        <h3>
          {{
            sellers.length === 0
              ? "Belum Ada Penjual"
              : "Penjual Tidak Ditemukan"
          }}
        </h3>

        <p>
          {{
            sellers.length === 0
              ? "Belum ada akun penjual yang terdaftar di KriyaLoka."
              : "Coba gunakan kata kunci atau filter yang berbeda."
          }}
        </p>

        <button
          v-if="sellers.length > 0"
          type="button"
          class="reset-button"
          @click="resetFilters"
        >
          Reset Pencarian
        </button>
      </div>

      <!-- SELLER TABLE -->
      <div v-else class="table-wrapper">
        <table class="seller-table">
          <thead>
            <tr>
              <th>Penjual</th>
              <th>Informasi Toko</th>
              <th>Statistik Produk</th>
              <th>Status Akun</th>
              <th>Bergabung</th>
              <th class="action-column">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="seller in paginatedSellers" :key="seller.id">
              <!-- SELLER -->
              <td>
                <div class="seller-identity">
                  <div class="seller-avatar">
                    <img
                      v-if="seller.store_profile?.logo_url"
                      :src="seller.store_profile.logo_url"
                      :alt="getStoreName(seller)"
                    />

                    <span v-else>
                      {{ getInitials(seller.full_name) }}
                    </span>
                  </div>

                  <div class="seller-info">
                    <strong>
                      {{ seller.full_name || "Nama belum tersedia" }}
                    </strong>

                    <span>
                      <Mail :size="13" />
                      {{ seller.email || "-" }}
                    </span>

                    <span v-if="seller.phone_number">
                      <Phone :size="13" />
                      {{ seller.phone_number }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- STORE -->
              <td>
                <div class="store-info">
                  <strong>{{ getStoreName(seller) }}</strong>

                  <span>
                    <MapPin :size="13" />
                    {{ getStoreLocation(seller) }}
                  </span>

                  <small v-if="seller.store_profile?.category">
                    {{ seller.store_profile.category }}
                  </small>
                </div>
              </td>

              <!-- PRODUCT STATISTICS -->
              <td>
                <div class="product-statistics">
                  <div class="product-total">
                    <Package :size="15" />
                    <strong>{{ seller.total_products ?? 0 }}</strong>
                    <span>Produk</span>
                  </div>

                  <div class="product-status-list">
                    <span class="product-status pending">
                      {{ seller.pending_products ?? 0 }} Pending
                    </span>

                    <span class="product-status approved">
                      {{ seller.approved_products ?? 0 }} Approved
                    </span>

                    <span class="product-status rejected">
                      {{ seller.rejected_products ?? 0 }} Rejected
                    </span>
                  </div>
                </div>
              </td>

              <!-- ACCOUNT STATUS -->
              <td>
                <span
                  class="status-badge"
                  :class="getStatus(seller.account_status).class"
                >
                  <span class="status-dot"></span>
                  {{ getStatus(seller.account_status).label }}
                </span>
              </td>

              <!-- CREATED DATE -->
              <td>
                <div class="date-info">
                  <CalendarDays :size="14" />
                  {{ formatDate(seller.created_at) }}
                </div>
              </td>

              <!-- ACTIONS -->
              <td>
                <div class="table-actions">
                  <button
                    type="button"
                    class="detail-button"
                    title="Lihat detail penjual"
                    @click="openSellerDetail(seller)"
                  >
                    <Eye :size="16" />
                    Detail
                  </button>

                  <button
                    v-if="
                      seller.account_status === 'pending' ||
                      seller.account_status === 'active' ||
                      seller.account_status === 'suspended'
                    "
                    type="button"
                    class="status-action-button"
                    :class="{
                      'activate-action':
                        seller.account_status === 'pending' ||
                        seller.account_status === 'suspended',
                      'suspend-action': seller.account_status === 'active',
                    }"
                    :title="
                      seller.account_status === 'pending'
                        ? 'Verifikasi dan aktifkan penjual'
                        : seller.account_status === 'active'
                          ? 'Tangguhkan akun'
                          : 'Aktifkan kembali akun'
                    "
                    @click="openStatusModal(seller)"
                  >
                    <CheckCircle2
                      v-if="
                        seller.account_status === 'pending' ||
                        seller.account_status === 'suspended'
                      "
                      :size="16"
                    />

                    <Ban v-else :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div v-if="filteredSellers.length > 0" class="pagination-container">
        <p class="pagination-info">
          Menampilkan
          <strong>{{ paginationStart }}–{{ paginationEnd }}</strong>
          dari
          <strong>{{ filteredSellers.length }}</strong>
          penjual
        </p>

        <div class="pagination-controls">
          <button
            type="button"
            class="pagination-arrow"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            <ChevronLeft :size="18" />
          </button>

          <button
            v-for="page in getPageNumbers()"
            :key="page"
            type="button"
            class="pagination-number"
            :class="{ active: currentPage === page }"
            @click="changePage(page)"
          >
            {{ page }}
          </button>

          <button
            type="button"
            class="pagination-arrow"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </section>

    <!-- ACCOUNT STATUS MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showStatusModal"
          class="modal-overlay"
          @click.self="closeStatusModal"
        >
          <div class="confirmation-modal">
            <button
              type="button"
              class="modal-close"
              :disabled="!!processingSellerId"
              @click="closeStatusModal"
            >
              <X :size="20" />
            </button>

            <div
              class="confirmation-icon"
              :class="
                nextStatus === 'suspended' ? 'warning-icon' : 'success-icon'
              "
            >
              <Ban v-if="nextStatus === 'suspended'" :size="27" />

              <CheckCircle2 v-else :size="27" />
            </div>

            <h3>{{ statusActionText }}?</h3>

            <p class="confirmation-description">
              {{ statusModalDescription }}
            </p>

            <div v-if="selectedSeller" class="confirmation-seller">
              <div class="seller-avatar small">
                <img
                  v-if="selectedSeller.store_profile?.logo_url"
                  :src="selectedSeller.store_profile.logo_url"
                  :alt="getStoreName(selectedSeller)"
                />

                <span v-else>
                  {{ getInitials(selectedSeller.full_name) }}
                </span>
              </div>

              <div>
                <strong>{{ selectedSeller.full_name }}</strong>
                <span>{{ getStoreName(selectedSeller) }}</span>
              </div>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="cancel-button"
                :disabled="!!processingSellerId"
                @click="closeStatusModal"
              >
                Batal
              </button>

              <button
                type="button"
                class="confirm-button"
                :class="{
                  'confirm-suspend': nextStatus === 'suspended',
                  'confirm-activate': nextStatus === 'active',
                }"
                :disabled="!!processingSellerId"
                @click="confirmStatusChange"
              >
                <LoaderCircle
                  v-if="processingSellerId"
                  :size="16"
                  class="spinning"
                />

                <span>
                  {{ processingSellerId ? "Memproses..." : "Ya, Lanjutkan" }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- TOAST -->
    <AppToast
      v-model="toast.show"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
    />
  </div>
</template>

<style scoped>
.seller-management-page {
  width: 100%;
  min-width: 0;
  color: #34372b;
  padding-bottom: 32px;
}

/* HEADER */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}

.page-heading {
  display: flex;
  align-items: center;
  gap: 16px;
}

.heading-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: #eee8d9;
  color: #6b7547;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.eyebrow {
  margin: 0 0 5px;
  color: #a66b48;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.page-heading h1 {
  margin: 0;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.7px;
}

.page-description {
  margin: 6px 0 0;
  color: #898777;
  font-size: 13px;
}

.refresh-button {
  height: 42px;
  padding: 0 15px;
  border: 1px solid #e4dfd1;
  border-radius: 10px;
  background: #fffdf8;
  color: #59613c;
  font-size: 12px;
  font-weight: 650;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  cursor: pointer;
  transition: 0.2s;
  flex-shrink: 0;
}

.refresh-button:hover {
  border-color: #9b9f78;
  background: #f6f3e9;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* STATISTICS */

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.stat-card {
  min-width: 0;
  padding: 19px;
  border: 1px solid #e9e4d8;
  border-radius: 15px;
  background: #fffdf8;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.stat-icon {
  width: 43px;
  height: 43px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-total {
  color: #647044;
  background: #eef0e3;
}

.icon-active {
  color: #397b57;
  background: #e8f3e9;
}

.icon-pending {
  color: #ae7a35;
  background: #fbf0dc;
}

.icon-suspended {
  color: #a45e4f;
  background: #f8e9e4;
}

.stat-content {
  min-width: 0;
}

.stat-content p {
  margin: 1px 0 7px;
  color: #858272;
  font-size: 11px;
  font-weight: 600;
}

.stat-content h2 {
  margin: 0;
  color: #383b30;
  font-size: 26px;
  font-weight: 750;
  line-height: 1.15;
}

.stat-content span {
  display: block;
  margin-top: 6px;
  color: #a19c8d;
  font-size: 10px;
}

/* MAIN SECTION */

.seller-section {
  border: 1px solid #e9e4d8;
  border-radius: 16px;
  background: #fffdf8;
  overflow: hidden;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 22px 23px 18px;
}

.section-heading h2 {
  margin: 0;
  color: #383b30;
  font-size: 17px;
  font-weight: 750;
}

.section-heading p {
  margin: 5px 0 0;
  color: #969181;
  font-size: 12px;
}

.seller-count {
  padding: 7px 11px;
  border-radius: 20px;
  background: #f1efe5;
  color: #68704d;
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
}

/* FILTERS */

.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 23px 19px;
}

.search-box {
  height: 42px;
  max-width: 390px;
  flex: 1;
  padding: 0 12px;
  border: 1px solid #e7e2d6;
  border-radius: 10px;
  background: #fff;
  color: #999382;
  display: flex;
  align-items: center;
  gap: 9px;
  transition: 0.2s;
}

.search-box:focus-within {
  border-color: #9c9e7b;
  box-shadow: 0 0 0 3px rgba(111, 120, 78, 0.08);
}

.search-box input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #393b31;
  font-family: inherit;
  font-size: 12px;
}

.search-box input::placeholder {
  color: #b0ab9e;
}

.clear-search {
  border: 0;
  background: transparent;
  color: #999382;
  cursor: pointer;
  display: flex;
}

.filter-control {
  height: 42px;
  padding: 0 11px;
  border: 1px solid #e7e2d6;
  border-radius: 10px;
  background: #fff;
  color: #81806f;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-control select {
  max-width: 190px;
  border: 0;
  outline: none;
  background: transparent;
  color: #555746;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.reset-button {
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: 9px;
  background: #f1efe5;
  color: #69704f;
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
  transition: 0.2s;
  white-space: nowrap;
}

.reset-button:hover {
  background: #e8e6d8;
}

/* TABLE */

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.seller-table {
  width: 100%;
  min-width: 1050px;
  border-collapse: collapse;
  text-align: left;
}

.seller-table thead {
  background: #f5f2e9;
}

.seller-table th {
  padding: 13px 15px;
  color: #85816f;
  font-size: 10px;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.45px;
  white-space: nowrap;
}

.seller-table th:first-child,
.seller-table td:first-child {
  padding-left: 23px;
}

.seller-table th:last-child,
.seller-table td:last-child {
  padding-right: 23px;
}

.seller-table td {
  padding: 15px;
  border-bottom: 1px solid #f0ede5;
  vertical-align: middle;
}

.seller-table tbody tr {
  transition: background 0.15s;
}

.seller-table tbody tr:hover {
  background: #fbfaf5;
}

.seller-table tbody tr:last-child td {
  border-bottom: 0;
}

/* SELLER IDENTITY */

.seller-identity {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 190px;
}

.seller-avatar {
  width: 43px;
  height: 43px;
  border-radius: 13px;
  background: #eeebdf;
  color: #72784e;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 750;
}

.seller-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.seller-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.seller-info strong,
.store-info strong {
  color: #414337;
  font-size: 12px;
  font-weight: 700;
}

.seller-info span,
.store-info span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #999585;
  font-size: 10px;
}

/* STORE */

.store-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
}

.store-info small {
  width: fit-content;
  padding: 4px 7px;
  border-radius: 5px;
  background: #f1efe5;
  color: #7d795f;
  font-size: 9px;
}

/* PRODUCT STATS */

.product-statistics {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 165px;
}

.product-total {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6e7650;
}

.product-total strong {
  color: #414337;
  font-size: 14px;
}

.product-total span {
  color: #989382;
  font-size: 10px;
}

.product-status-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.product-status {
  padding: 4px 6px;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 650;
  white-space: nowrap;
}

.product-status.pending {
  background: #fbf0dc;
  color: #a87936;
}

.product-status.approved {
  background: #e9f2e7;
  color: #54805b;
}

.product-status.rejected {
  background: #f7e9e4;
  color: #aa6856;
}

/* ACCOUNT STATUS */

.status-badge {
  width: fit-content;
  padding: 6px 9px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 650;
  white-space: nowrap;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-active {
  background: #e9f2e7;
  color: #54805b;
}

.status-pending {
  background: #fbf0dc;
  color: #a87936;
}

.status-rejected {
  background: #f7e9e4;
  color: #aa6856;
}

.status-suspended {
  background: #eeeae8;
  color: #81716b;
}

.status-unknown {
  background: #efeee9;
  color: #777;
}

/* DATE */

.date-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #858171;
  font-size: 10px;
  white-space: nowrap;
}

/* ACTIONS */

.table-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.detail-button,
.status-action-button {
  height: 33px;
  border: 1px solid #e5e0d4;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: 0.2s;
}

.detail-button {
  padding: 0 9px;
  background: #f2f0e6;
  color: #68704c;
  font-size: 10px;
  font-weight: 700;
}

.detail-button:hover {
  background: #e9e7d9;
}

.status-action-button {
  width: 33px;
  background: #fff;
}

.suspend-action {
  color: #a56855;
}

.suspend-action:hover {
  background: #f9ece7;
  border-color: #e5c9bd;
}

.activate-action {
  color: #54805b;
}

.activate-action:hover {
  background: #eaf3e9;
  border-color: #c6ddc6;
}

/* EMPTY / LOADING */

.state-container {
  min-height: 300px;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #7d815d;
}

.state-container p {
  margin: 0;
  color: #969181;
  font-size: 12px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: #f0eee4;
  color: #818565;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h3 {
  margin: 4px 0 0;
  color: #414337;
  font-size: 16px;
}

/* PAGINATION */

.pagination-container {
  padding: 16px 23px;
  border-top: 1px solid #f0ede5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.pagination-info {
  margin: 0;
  color: #999585;
  font-size: 11px;
}

.pagination-info strong {
  color: #555746;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 5px;
}

.pagination-arrow,
.pagination-number {
  width: 32px;
  height: 32px;
  border: 1px solid #e8e4d9;
  border-radius: 8px;
  background: #fffdf8;
  color: #777763;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 11px;
  transition: 0.2s;
}

.pagination-arrow:hover:not(:disabled),
.pagination-number:hover {
  background: #f1efe5;
}

.pagination-number.active {
  border-color: #737c50;
  background: #737c50;
  color: #fff;
}

.pagination-arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* CONFIRMATION MODAL */

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  padding: 20px;
  background: rgba(35, 37, 29, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
}

.confirmation-modal {
  position: relative;
  width: 100%;
  max-width: 430px;
  padding: 30px;
  border: 1px solid #eee8db;
  border-radius: 19px;
  background: #fffdf8;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 9px;
  background: #f2f0e7;
  color: #797765;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.confirmation-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 16px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-icon {
  background: #f8eae3;
  color: #ae6b56;
}

.success-icon {
  background: #e9f2e7;
  color: #54805b;
}

.confirmation-modal h3 {
  margin: 0;
  color: #3f4135;
  font-size: 19px;
}

.confirmation-description {
  margin: 10px 0 20px;
  color: #898676;
  font-size: 12px;
  line-height: 1.7;
}

.confirmation-seller {
  padding: 12px;
  border: 1px solid #eee9dd;
  border-radius: 12px;
  background: #faf8f1;
  display: flex;
  align-items: center;
  gap: 11px;
  text-align: left;
}

.seller-avatar.small {
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

.confirmation-seller div:last-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.confirmation-seller strong {
  color: #414337;
  font-size: 12px;
}

.confirmation-seller span {
  color: #999585;
  font-size: 10px;
}

.modal-actions {
  display: flex;
  gap: 9px;
  margin-top: 22px;
}

.cancel-button,
.confirm-button {
  height: 42px;
  flex: 1;
  border: 0;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.cancel-button {
  background: #f0eee6;
  color: #777562;
}

.cancel-button:hover {
  background: #e8e5da;
}

.confirm-suspend {
  background: #a96855;
  color: #fff;
}

.confirm-suspend:hover {
  background: #945943;
}

.confirm-activate {
  background: #68764c;
  color: #fff;
}

.confirm-activate:hover {
  background: #56643d;
}

.cancel-button:disabled,
.confirm-button:disabled,
.modal-close:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* TRANSITIONS */

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .confirmation-modal,
.modal-leave-active .confirmation-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirmation-modal,
.modal-leave-to .confirmation-modal {
  transform: translateY(10px) scale(0.98);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* RESPONSIVE */

@media (max-width: 1100px) {
  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .refresh-button {
    align-self: flex-end;
  }

  .page-heading h1 {
    font-size: 21px;
  }

  .statistics-grid {
    gap: 10px;
  }

  .stat-card {
    padding: 13px;
    gap: 10px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
  }

  .stat-content h2 {
    font-size: 22px;
  }

  .stat-content span {
    line-height: 1.4;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    padding: 18px 15px;
  }

  .filter-toolbar {
    padding: 0 15px 16px;
    flex-wrap: wrap;
  }

  .search-box {
    max-width: none;
    flex-basis: 100%;
  }

  .filter-control {
    flex: 1;
  }

  .filter-control select {
    width: 100%;
    max-width: none;
  }

  .reset-button {
    flex-shrink: 0;
  }

  .pagination-container {
    align-items: flex-start;
    flex-direction: column;
    padding: 15px;
  }

  .pagination-controls {
    align-self: flex-end;
  }

  .confirmation-modal {
    padding: 25px 20px;
  }
}

@media (max-width: 400px) {
  .statistics-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-card {
    flex-direction: column;
  }

  .filter-toolbar {
    gap: 8px;
  }

  .filter-control {
    min-width: 0;
  }
}
</style>
