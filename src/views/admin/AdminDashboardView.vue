<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import {
  Users,
  Store,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  RefreshCw,
  Search,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  AlertCircle,
  LoaderCircle,
  ClipboardCheck,
  LayoutDashboard,
} from "lucide-vue-next";

import { useAdminStore } from "../../stores/admin.js";

const adminStore = useAdminStore();

const activeTab = ref("overview");
const searchQuery = ref("");
const statusFilter = ref("all");

const selectedSeller = ref(null);
const showDetailModal = ref(false);

const rejectionNote = ref("");
const showRejectModal = ref(false);
const rejectTarget = ref(null);

const isRefreshing = ref(false);

const notification = ref({
  show: false,
  type: "success",
  message: "",
});

let notificationTimer = null;

const statistics = computed(() => adminStore.statistics);

const pendingSellers = computed(() =>
  adminStore.sellers.filter((seller) => seller.account_status === "pending"),
);

const filteredSellers = computed(() => {
  let result = [...adminStore.sellers];

  if (statusFilter.value !== "all") {
    result = result.filter(
      (seller) => seller.account_status === statusFilter.value,
    );
  }

  if (activeTab.value === "pending") {
    result = result.filter((seller) => seller.account_status === "pending");
  }

  if (searchQuery.value.trim()) {
    const keyword = searchQuery.value.trim().toLowerCase();

    result = result.filter((seller) => {
      const storeName = seller.store_profile?.store_name?.toLowerCase() || "";

      return (
        seller.full_name?.toLowerCase().includes(keyword) ||
        seller.email?.toLowerCase().includes(keyword) ||
        storeName.includes(keyword)
      );
    });
  }

  return result;
});

function showNotification(message, type = "success") {
  notification.value = {
    show: true,
    type,
    message,
  };

  if (notificationTimer) {
    window.clearTimeout(notificationTimer);
  }

  notificationTimer = window.setTimeout(() => {
    notification.value.show = false;
    notificationTimer = null;
  }, 3500);
}

function formatDate(date) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusLabel(status) {
  const labels = {
    pending: "Menunggu",
    active: "Aktif",
    rejected: "Ditolak",
    suspended: "Ditangguhkan",
  };

  return labels[status] || status;
}

function getStatusClass(status) {
  const classes = {
    pending: "status-pending",
    active: "status-active",
    rejected: "status-rejected",
    suspended: "status-suspended",
  };

  return classes[status] || "";
}

function openSellerDetail(seller) {
  selectedSeller.value = seller;
  showDetailModal.value = true;
}

function closeSellerDetail() {
  showDetailModal.value = false;
  selectedSeller.value = null;
}

async function refreshDashboard() {
  if (isRefreshing.value || adminStore.loading) return;

  isRefreshing.value = true;

  try {
    await adminStore.fetchDashboard();
    showNotification("Data dashboard berhasil diperbarui.");
  } catch (error) {
    showNotification(error.message || "Gagal memperbarui dashboard.", "error");
  } finally {
    isRefreshing.value = false;
  }
}

async function approveSeller(seller) {
  const storeName = seller.store_profile?.store_name || seller.full_name;

  const confirmed = window.confirm(`Setujui pendaftaran toko "${storeName}"?`);

  if (!confirmed) return;

  try {
    await adminStore.reviewSeller(seller.id, "approved");

    showNotification("Seller berhasil disetujui.");
    closeSellerDetail();
  } catch (error) {
    showNotification(error.message || "Gagal menyetujui seller.", "error");
  }
}

function openRejectModal(seller) {
  rejectTarget.value = seller;
  rejectionNote.value = "";
  showRejectModal.value = true;
}

function closeRejectModal() {
  showRejectModal.value = false;
  rejectTarget.value = null;
  rejectionNote.value = "";
}

async function rejectSeller() {
  if (!rejectTarget.value) return;

  if (!rejectionNote.value.trim()) {
    showNotification("Alasan penolakan wajib diisi.", "error");
    return;
  }

  try {
    await adminStore.reviewSeller(
      rejectTarget.value.id,
      "rejected",
      rejectionNote.value.trim(),
    );

    showNotification("Pendaftaran seller berhasil ditolak.");

    closeRejectModal();
    closeSellerDetail();
  } catch (error) {
    showNotification(
      error.message || "Gagal menolak pendaftaran seller.",
      "error",
    );
  }
}

async function changeSellerStatus(seller, newStatus) {
  const actionLabel =
    newStatus === "suspended" ? "menangguhkan" : "mengaktifkan kembali";

  const confirmed = window.confirm(
    `Apakah kamu yakin ingin ${actionLabel} akun ${seller.full_name}?`,
  );

  if (!confirmed) return;

  try {
    await adminStore.updateSellerStatus(seller.id, newStatus);

    showNotification(
      `Status akun berhasil diubah menjadi ${getStatusLabel(newStatus)}.`,
    );

    closeSellerDetail();
  } catch (error) {
    showNotification(error.message || "Gagal mengubah status akun.", "error");
  }
}

onMounted(async () => {
  try {
    await adminStore.fetchDashboard();
  } catch (error) {
    showNotification(error.message || "Gagal memuat dashboard.", "error");
  }
});

onBeforeUnmount(() => {
  if (notificationTimer) {
    window.clearTimeout(notificationTimer);
  }
});
</script>

<template>
  <div class="admin-dashboard">
    <!-- Dashboard heading -->
    <section class="page-heading">
      <div>
        <span class="eyebrow">OVERVIEW</span>
        <h2>Selamat datang, Admin</h2>
        <p>
          Pantau aktivitas marketplace dan kelola verifikasi penjual KriyaLoka.
        </p>
      </div>

      <div class="heading-actions">
        <div class="today-date">
          <CalendarDays :size="17" />
          {{ formatDate(new Date()) }}
        </div>

        <button
          class="refresh-button"
          :disabled="isRefreshing || adminStore.loading"
          @click="refreshDashboard"
        >
          <RefreshCw :size="16" :class="{ spinning: isRefreshing }" />
          <span>Refresh</span>
        </button>
      </div>
    </section>

    <!-- Error -->
    <div v-if="adminStore.error" class="error-banner">
      <AlertCircle :size="19" />

      <span>{{ adminStore.error }}</span>

      <button @click="adminStore.error = null">
        <X :size="16" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="adminStore.loading" class="loading-state">
      <LoaderCircle :size="30" class="spinning" />

      <p>Memuat data dashboard...</p>
    </div>

    <template v-else>
      <!-- Statistics -->
      <section class="statistics-grid">
        <article class="stat-card">
          <div class="stat-icon icon-brown">
            <Users :size="22" />
          </div>

          <div class="stat-info">
            <p>Total Pengguna</p>
            <h3>{{ statistics.totalUsers ?? 0 }}</h3>
            <span>Semua akun terdaftar</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-green">
            <Store :size="22" />
          </div>

          <div class="stat-info">
            <p>Total Penjual</p>
            <h3>{{ statistics.totalSellers ?? 0 }}</h3>
            <span> {{ statistics.activeSellers ?? 0 }} seller aktif </span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-orange">
            <Clock :size="22" />
          </div>

          <div class="stat-info">
            <p>Menunggu Verifikasi</p>
            <h3>{{ statistics.pendingSellers ?? 0 }}</h3>
            <span>Pengajuan toko baru</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-purple">
            <Package :size="22" />
          </div>

          <div class="stat-info">
            <p>Produk Menunggu Review</p>
            <h3>{{ statistics.pendingProducts ?? 0 }}</h3>
            <span>Pengajuan produk baru</span>
          </div>
        </article>
      </section>

      <!-- Seller status summary -->
      <section class="status-summary">
        <div class="section-heading">
          <div>
            <h3>Status Penjual</h3>
            <p>Ringkasan kondisi akun seller</p>
          </div>
        </div>

        <div class="status-summary-grid">
          <div class="status-summary-item">
            <span class="summary-dot dot-green"></span>

            <div>
              <strong>{{ statistics.activeSellers ?? 0 }}</strong>
              <span>Aktif</span>
            </div>
          </div>

          <div class="status-summary-item">
            <span class="summary-dot dot-orange"></span>

            <div>
              <strong>{{ statistics.pendingSellers ?? 0 }}</strong>
              <span>Menunggu</span>
            </div>
          </div>

          <div class="status-summary-item">
            <span class="summary-dot dot-red"></span>

            <div>
              <strong>{{ statistics.rejectedSellers ?? 0 }}</strong>
              <span>Ditolak</span>
            </div>
          </div>

          <div class="status-summary-item">
            <span class="summary-dot dot-gray"></span>

            <div>
              <strong>{{ statistics.suspendedSellers ?? 0 }}</strong>
              <span>Ditangguhkan</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Seller management -->
      <section class="management-section">
        <div class="section-heading management-heading">
          <div>
            <h3>Manajemen Penjual</h3>
            <p>Kelola pendaftaran dan status akun penjual.</p>
          </div>

          <div class="pending-counter">
            <Clock :size="15" />
            {{ pendingSellers.length }} menunggu
          </div>
        </div>

        <!-- Tabs -->
        <div class="management-tabs">
          <button
            :class="{ active: activeTab === 'overview' }"
            @click="activeTab = 'overview'"
          >
            <LayoutDashboard :size="16" />
            Semua Penjual
          </button>

          <button
            :class="{ active: activeTab === 'pending' }"
            @click="activeTab = 'pending'"
          >
            <ClipboardCheck :size="16" />
            Perlu Verifikasi

            <span v-if="pendingSellers.length" class="tab-count">
              {{ pendingSellers.length }}
            </span>
          </button>
        </div>

        <!-- Filters -->
        <div class="table-toolbar">
          <div class="search-field">
            <Search :size="17" />

            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama, email, atau nama toko..."
            />
          </div>

          <select v-model="statusFilter" class="status-filter">
            <option value="all">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="active">Aktif</option>
            <option value="rejected">Ditolak</option>
            <option value="suspended">Ditangguhkan</option>
          </select>
        </div>

        <!-- Table -->
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Penjual</th>
                <th>Nama Toko</th>
                <th>Lokasi</th>
                <th>Tanggal Daftar</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="seller in filteredSellers" :key="seller.id">
                <td>
                  <div class="seller-identity">
                    <div class="seller-avatar">
                      {{ seller.full_name?.charAt(0)?.toUpperCase() || "S" }}
                    </div>

                    <div>
                      <strong>{{ seller.full_name }}</strong>
                      <span>{{ seller.email }}</span>
                    </div>
                  </div>
                </td>

                <td>
                  <strong class="store-name">
                    {{
                      seller.store_profile?.store_name ||
                      "Belum melengkapi toko"
                    }}
                  </strong>
                </td>

                <td>
                  <span class="location-text">
                    {{
                      seller.store_profile?.city ||
                      seller.store_profile?.province ||
                      "-"
                    }}
                  </span>
                </td>

                <td>{{ formatDate(seller.created_at) }}</td>

                <td>
                  <span
                    class="status-badge"
                    :class="getStatusClass(seller.account_status)"
                  >
                    {{ getStatusLabel(seller.account_status) }}
                  </span>
                </td>

                <td>
                  <button
                    class="detail-button"
                    @click="openSellerDetail(seller)"
                  >
                    <Eye :size="15" />
                    Detail
                  </button>
                </td>
              </tr>

              <tr v-if="filteredSellers.length === 0">
                <td colspan="6">
                  <div class="empty-state">
                    <Store :size="32" />

                    <strong>Belum ada data penjual</strong>

                    <span> Data penjual akan muncul di sini. </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <!-- Seller detail modal -->
    <Teleport to="body">
      <div
        v-if="showDetailModal && selectedSeller"
        class="modal-backdrop"
        @click.self="closeSellerDetail"
      >
        <div class="detail-modal">
          <div class="modal-header">
            <div>
              <h3>Detail Penjual</h3>
              <p>Informasi akun dan toko</p>
            </div>

            <button class="close-button" @click="closeSellerDetail">
              <X :size="20" />
            </button>
          </div>

          <div class="modal-body">
            <div class="store-profile-header">
              <img
                v-if="selectedSeller.store_profile?.logo_url"
                :src="selectedSeller.store_profile.logo_url"
                alt="Logo toko"
                class="store-logo"
              />

              <div v-else class="store-logo-placeholder">
                <Store :size="27" />
              </div>

              <div>
                <h4>
                  {{
                    selectedSeller.store_profile?.store_name ||
                    "Nama toko belum tersedia"
                  }}
                </h4>

                <span
                  class="status-badge"
                  :class="getStatusClass(selectedSeller.account_status)"
                >
                  {{ getStatusLabel(selectedSeller.account_status) }}
                </span>
              </div>
            </div>

            <div class="detail-group">
              <h5>Informasi Pemilik</h5>

              <div class="detail-row">
                <Users :size="17" />

                <div>
                  <span>Nama lengkap</span>
                  <strong>{{ selectedSeller.full_name }}</strong>
                </div>
              </div>

              <div class="detail-row">
                <Mail :size="17" />

                <div>
                  <span>Email</span>
                  <strong>{{ selectedSeller.email }}</strong>
                </div>
              </div>

              <div class="detail-row">
                <Phone :size="17" />

                <div>
                  <span>Nomor telepon</span>
                  <strong>
                    {{ selectedSeller.phone_number || "-" }}
                  </strong>
                </div>
              </div>
            </div>

            <div class="detail-group">
              <h5>Informasi Toko</h5>

              <div class="detail-row">
                <Store :size="17" />

                <div>
                  <span>Nama toko</span>
                  <strong>
                    {{ selectedSeller.store_profile?.store_name || "-" }}
                  </strong>
                </div>
              </div>

              <div class="detail-row">
                <Package :size="17" />

                <div>
                  <span>Kategori</span>
                  <strong>
                    {{ selectedSeller.store_profile?.category || "-" }}
                  </strong>
                </div>
              </div>

              <div class="detail-row">
                <MapPin :size="17" />

                <div>
                  <span>Alamat</span>
                  <strong>
                    {{ selectedSeller.store_profile?.address || "-" }}
                  </strong>
                </div>
              </div>

              <div class="detail-row">
                <MapPin :size="17" />

                <div>
                  <span>Kota / Provinsi</span>
                  <strong>
                    {{
                      [
                        selectedSeller.store_profile?.city,
                        selectedSeller.store_profile?.province,
                      ]
                        .filter(Boolean)
                        .join(", ") || "-"
                    }}
                  </strong>
                </div>
              </div>

              <div class="detail-row">
                <CalendarDays :size="17" />

                <div>
                  <span>Tanggal pendaftaran</span>
                  <strong>
                    {{ formatDateTime(selectedSeller.created_at) }}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <template v-if="selectedSeller.account_status === 'pending'">
              <button
                class="reject-button"
                :disabled="adminStore.updating"
                @click="openRejectModal(selectedSeller)"
              >
                <XCircle :size="17" />
                Tolak
              </button>

              <button
                class="approve-button"
                :disabled="adminStore.updating"
                @click="approveSeller(selectedSeller)"
              >
                <CheckCircle2 :size="17" />
                Setujui Penjual
              </button>
            </template>

            <template v-else-if="selectedSeller.account_status === 'active'">
              <button
                class="suspend-button"
                :disabled="adminStore.updating"
                @click="changeSellerStatus(selectedSeller, 'suspended')"
              >
                <Ban :size="17" />
                Tangguhkan
              </button>
            </template>

            <template v-else-if="selectedSeller.account_status === 'suspended'">
              <button
                class="approve-button"
                :disabled="adminStore.updating"
                @click="changeSellerStatus(selectedSeller, 'active')"
              >
                <CheckCircle2 :size="17" />
                Aktifkan Kembali
              </button>
            </template>

            <button class="cancel-button" @click="closeSellerDetail">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reject seller modal -->
    <Teleport to="body">
      <div
        v-if="showRejectModal"
        class="modal-backdrop reject-backdrop"
        @click.self="closeRejectModal"
      >
        <div class="reject-modal">
          <div class="modal-header">
            <div>
              <h3>Tolak Pendaftaran</h3>
              <p>Berikan alasan penolakan kepada seller.</p>
            </div>

            <button class="close-button" @click="closeRejectModal">
              <X :size="20" />
            </button>
          </div>

          <div class="reject-content">
            <label for="rejection-note">
              Alasan Penolakan <span>*</span>
            </label>

            <textarea
              id="rejection-note"
              v-model="rejectionNote"
              rows="5"
              placeholder="Jelaskan alasan penolakan secara jelas..."
            />

            <p>
              Seller dapat memperbaiki informasi toko dan mengajukan verifikasi
              ulang.
            </p>
          </div>

          <div class="modal-footer">
            <button class="cancel-button" @click="closeRejectModal">
              Batal
            </button>

            <button
              class="reject-button"
              :disabled="adminStore.updating || !rejectionNote.trim()"
              @click="rejectSeller"
            >
              <LoaderCircle
                v-if="adminStore.updating"
                :size="16"
                class="spinning"
              />

              <XCircle v-else :size="16" />

              Konfirmasi Penolakan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Notification -->
    <Transition name="toast">
      <div
        v-if="notification.show"
        class="toast-notification"
        :class="`toast-${notification.type}`"
      >
        <CheckCircle2 v-if="notification.type === 'success'" :size="19" />

        <AlertCircle v-else :size="19" />

        {{ notification.message }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.admin-dashboard {
  width: 100%;
  color: #352b25;
  font-family: "Plus Jakarta Sans", sans-serif;
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  color: #a36a4b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.page-heading h2 {
  font-size: clamp(23px, 3vw, 31px);
  margin: 0;
  letter-spacing: -1px;
}

.page-heading p {
  font-size: 13px;
  color: #8d8077;
  margin: 9px 0 0;
  line-height: 1.6;
}

.heading-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.today-date {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #77675c;
  font-size: 12px;
  white-space: nowrap;
}

.refresh-button {
  border: 1px solid #e8ddd2;
  border-radius: 9px;
  padding: 10px 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  color: #59473b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.refresh-button:hover {
  border-color: #943c14;
  color: #943c14;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 17px;
  margin-bottom: 22px;
}

.stat-card {
  min-width: 0;
  padding: 22px;
  background: #fff;
  border: 1px solid #ece4dc;
  border-radius: 15px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 13px;
}

.icon-brown {
  background: #f5e9df;
  color: #943c14;
}

.icon-green {
  background: #e7f1e9;
  color: #34734f;
}

.icon-orange {
  background: #fff0dd;
  color: #bd7928;
}

.icon-purple {
  background: #eeeafa;
  color: #7460ad;
}

.stat-info {
  min-width: 0;
}

.stat-card p {
  margin: 0;
  font-size: 11px;
  color: #95877d;
}

.stat-card h3 {
  margin: 5px 0;
  font-size: 26px;
  font-weight: 800;
}

.stat-card span {
  font-size: 10px;
  color: #a39890;
}

.status-summary,
.management-section {
  background: #fff;
  border: 1px solid #ece4dc;
  border-radius: 15px;
  margin-bottom: 22px;
  overflow: hidden;
}

.status-summary {
  padding: 23px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.section-heading h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.section-heading p {
  margin: 5px 0 0;
  font-size: 12px;
  color: #988b81;
}

.status-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-top: 22px;
}

.status-summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #faf8f5;
  border-radius: 10px;
}

.summary-dot {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-radius: 50%;
}

.dot-green {
  background: #3c9a67;
}

.dot-orange {
  background: #df9a3c;
}

.dot-red {
  background: #cf5d4f;
}

.dot-gray {
  background: #939393;
}

.status-summary-item div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.status-summary-item strong {
  font-size: 17px;
}

.status-summary-item span:last-child {
  font-size: 11px;
  color: #95877d;
}

.management-section {
  padding-bottom: 8px;
}

.management-heading {
  padding: 23px 23px 18px;
}

.pending-counter {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border-radius: 20px;
  background: #fff3e3;
  color: #ad7029;
  font-size: 11px;
  font-weight: 700;
}

.management-tabs {
  display: flex;
  gap: 23px;
  padding: 0 23px;
  border-bottom: 1px solid #eee8e2;
}

.management-tabs button {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: none;
  padding: 14px 0;
  border-bottom: 2px solid transparent;
  color: #95877d;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.management-tabs button.active {
  color: #943c14;
  border-bottom-color: #943c14;
}

.tab-count {
  padding: 3px 7px;
  background: #f8e9dc;
  color: #943c14;
  border-radius: 20px;
  font-size: 10px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 23px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 13px;
  width: min(430px, 100%);
  background: #faf8f5;
  border: 1px solid #eee7df;
  border-radius: 9px;
  color: #998b81;
}

.search-field input {
  border: 0;
  outline: 0;
  background: transparent;
  width: 100%;
  font-size: 12px;
  color: #352b25;
}

.status-filter {
  padding: 10px 13px;
  border: 1px solid #eee7df;
  border-radius: 9px;
  background: #fff;
  font-size: 12px;
  color: #59473b;
  outline: none;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

thead {
  background: #faf8f5;
}

th {
  padding: 13px 18px;
  color: #988b81;
  font-size: 10px;
  font-weight: 700;
  text-align: left;
}

td {
  padding: 15px 18px;
  border-top: 1px solid #f0ebe6;
  font-size: 11px;
  color: #75675e;
}

.seller-identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seller-avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 11px;
  background: #f3e7dd;
  color: #943c14;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 800;
}

.seller-identity div:last-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.seller-identity strong,
.store-name {
  font-size: 11px;
  color: #47372d;
}

.seller-identity span {
  font-size: 10px;
  color: #9d9188;
}

.location-text {
  color: #786a60;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 700;
}

.status-pending {
  background: #fff1dc;
  color: #a66a20;
}

.status-active {
  background: #e7f3e9;
  color: #34764c;
}

.status-rejected {
  background: #fceae7;
  color: #bb5144;
}

.status-suspended {
  background: #efefef;
  color: #777;
}

.detail-button {
  border: 1px solid #e9ded3;
  background: white;
  color: #943c14;
  border-radius: 8px;
  padding: 8px 11px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.detail-button:hover {
  background: #f9f1eb;
}

.empty-state {
  min-height: 190px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #b2a69c;
}

.empty-state strong {
  color: #59473b;
  font-size: 13px;
}

.empty-state span {
  font-size: 11px;
}

.loading-state {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 13px;
  color: #943c14;
}

.loading-state p {
  font-size: 12px;
  color: #8d8077;
}

.error-banner {
  padding: 13px 16px;
  background: #fff0ed;
  color: #b54d40;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  margin-bottom: 18px;
}

.error-banner span {
  overflow-wrap: anywhere;
}

.error-banner button {
  margin-left: auto;
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(37, 28, 22, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.detail-modal,
.reject-modal {
  width: min(570px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
}

.reject-modal {
  width: min(470px, 100%);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 22px;
  border-bottom: 1px solid #eee8e2;
}

.modal-header h3 {
  font-size: 17px;
  margin: 0;
}

.modal-header p {
  font-size: 11px;
  color: #998b81;
  margin: 6px 0 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: #f5f1ed;
  color: #6b5b50;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.modal-body {
  padding: 22px;
}

.store-profile-header {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 25px;
}

.store-logo,
.store-logo-placeholder {
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  border-radius: 13px;
  object-fit: cover;
  background: #f3e7dd;
  color: #943c14;
  display: grid;
  place-items: center;
}

.store-profile-header h4 {
  margin: 0 0 8px;
  font-size: 15px;
}

.detail-group {
  border-top: 1px solid #eee8e2;
  padding-top: 17px;
  margin-top: 17px;
}

.detail-group h5 {
  margin: 0 0 14px;
  font-size: 12px;
  color: #943c14;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 13px 0;
  color: #a08f83;
}

.detail-row > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.detail-row span {
  font-size: 10px;
  color: #a0948a;
}

.detail-row strong {
  font-size: 11px;
  color: #493a31;
  overflow-wrap: anywhere;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 9px;
  padding: 17px 22px;
  border-top: 1px solid #eee8e2;
}

.approve-button,
.reject-button,
.suspend-button,
.cancel-button {
  border: 0;
  border-radius: 9px;
  padding: 11px 14px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.approve-button {
  background: #34734f;
  color: white;
}

.reject-button {
  background: #b84f42;
  color: white;
}

.suspend-button {
  background: #5f5f5f;
  color: white;
}

.cancel-button {
  background: #f3efeb;
  color: #6e6057;
}

.reject-content {
  padding: 22px;
}

.reject-content label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 9px;
}

.reject-content label span {
  color: #bd5145;
}

.reject-content textarea {
  width: 100%;
  resize: vertical;
  box-sizing: border-box;
  border: 1px solid #e7ddd3;
  border-radius: 9px;
  padding: 12px;
  font: inherit;
  font-size: 12px;
  outline: none;
}

.reject-content textarea:focus {
  border-color: #943c14;
}

.reject-content p {
  font-size: 10px;
  color: #9b8e84;
  line-height: 1.6;
}

.toast-notification {
  position: fixed;
  right: 25px;
  bottom: 25px;
  z-index: 200;
  max-width: min(400px, calc(100vw - 40px));
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.14);
  font-size: 12px;
  font-weight: 600;
}

.toast-success {
  color: #34734f;
}

.toast-error {
  color: #b84f42;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 1100px) {
  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .status-summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .heading-actions {
    width: 100%;
    justify-content: space-between;
  }

  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .stat-card {
    padding: 14px 11px;
    gap: 10px;
  }

  .stat-icon {
    width: 38px;
    height: 38px;
  }

  .stat-card h3 {
    font-size: 21px;
  }

  .stat-card p {
    font-size: 10px;
  }

  .stat-card span {
    font-size: 9px;
  }

  .status-summary-grid {
    gap: 8px;
  }

  .status-summary-item {
    padding: 12px 9px;
  }

  .management-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .table-toolbar {
    flex-direction: column;
  }

  .search-field {
    width: 100%;
    box-sizing: border-box;
  }

  .status-filter {
    width: 100%;
  }

  .management-tabs {
    gap: 15px;
    overflow-x: auto;
  }

  .modal-footer {
    align-items: stretch;
  }

  .modal-footer button {
    justify-content: center;
    flex: 1;
  }
}

@media (max-width: 420px) {
  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .today-date {
    font-size: 11px;
  }

  .refresh-button {
    padding: 9px 11px;
  }
}
</style>
