<script setup>
import { computed, onMounted, ref } from "vue";
import {
  Search,
  RefreshCw,
  Users,
  Store,
  Clock3,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  LayoutDashboard,
  LogOut,
  Check,
  X,
  Eye,
  AlertTriangle,
} from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";
import { useAdminStore } from "../stores/admin.js";

const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();

const searchQuery = ref("");
const selectedStatus = ref("all");
const selectedSeller = ref(null);

const statusOptions = [
  { value: "all", label: "Semua Penjual" },
  { value: "pending", label: "Menunggu Verifikasi" },
  { value: "active", label: "Aktif" },
  { value: "rejected", label: "Ditolak" },
  { value: "suspended", label: "Ditangguhkan" },
];
const toast = ref({
  visible: false,
  message: "",
  type: "success",
});

const showRejectModal = ref(false);
const rejectingSeller = ref(null);
const rejectionNote = ref("");

let toastTimer = null;

const showToast = (message, type = "success") => {
  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }

  toast.value = {
    visible: true,
    message,
    type,
  };

  toastTimer = window.setTimeout(() => {
    toast.value.visible = false;
  }, 4000);
};

const closeToast = () => {
  if (toastTimer) {
    window.clearTimeout(toastTimer);
    toastTimer = null;
  }

  toast.value.visible = false;
};

const openRejectModal = (seller) => {
  rejectingSeller.value = seller;
  rejectionNote.value = "";
  showRejectModal.value = true;
};

const closeRejectModal = () => {
  if (adminStore.updating) return;

  showRejectModal.value = false;
  rejectingSeller.value = null;
  rejectionNote.value = "";
};

const filteredSellers = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return adminStore.sellers.filter((seller) => {
    const matchesStatus =
      selectedStatus.value === "all" ||
      seller.account_status === selectedStatus.value;

    const matchesSearch =
      !keyword ||
      seller.full_name?.toLowerCase().includes(keyword) ||
      seller.email?.toLowerCase().includes(keyword) ||
      seller.phone_number?.toLowerCase().includes(keyword);

    return matchesStatus && matchesSearch;
  });
});

const loadDashboard = async () => {
  try {
    await adminStore.fetchDashboard();
  } catch (error) {
    showToast(error.message || "Gagal memuat dashboard.", "error");
  }
};

const approveSeller = async (seller) => {
  try {
    await adminStore.reviewSeller(seller.id, "approved");

    selectedSeller.value = null;

    showToast(
      `Toko ${seller.store_profile?.store_name || seller.full_name} berhasil disetujui.`,
      "success",
    );
  } catch (error) {
    showToast(error.message || "Gagal menyetujui penjual.", "error");
  }
};

const rejectSeller = async () => {
  if (!rejectingSeller.value) return;

  const seller = rejectingSeller.value;
  const note = rejectionNote.value.trim();

  if (!note) {
    showToast("Alasan penolakan wajib diisi.", "error");
    return;
  }

  try {
    await adminStore.reviewSeller(seller.id, "rejected", note);

    showRejectModal.value = false;
    rejectingSeller.value = null;
    rejectionNote.value = "";
    selectedSeller.value = null;

    showToast(`Pendaftaran ${seller.full_name} berhasil ditolak.`, "success");
  } catch (error) {
    showToast(error.message || "Gagal menolak pendaftaran.", "error");
  }
};

const suspendSeller = async (seller) => {
  try {
    await adminStore.updateSellerStatus(seller.id, "suspended");

    selectedSeller.value = null;

    showToast(`Akun ${seller.full_name} berhasil ditangguhkan.`, "success");
  } catch (error) {
    showToast(error.message || "Gagal menangguhkan akun.", "error");
  }
};

const reactivateSeller = async (seller) => {
  try {
    await adminStore.updateSellerStatus(seller.id, "active");

    selectedSeller.value = null;

    showToast(
      `Akun ${seller.full_name} berhasil diaktifkan kembali.`,
      "success",
    );
  } catch (error) {
    showToast(error.message || "Gagal mengaktifkan akun.", "error");
  }
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const statusLabel = (status) => {
  const labels = {
    pending: "Menunggu",
    active: "Aktif",
    rejected: "Ditolak",
    suspended: "Ditangguhkan",
  };

  return labels[status] || status;
};

const logout = async () => {
  try {
    await authStore.logout();
    await router.push("/login");
  } catch (error) {
    showToast(error.message || "Gagal logout. Silakan coba kembali.", "error");
  }
};

onMounted(loadDashboard);
</script>

<template>
  <main class="admin-layout">
    <aside class="admin-sidebar">
      <RouterLink to="/" class="admin-brand">
        <span class="brand-symbol">K</span>
        <span>
          <strong>KriyaLoka</strong>
          <small>Admin Console</small>
        </span>
      </RouterLink>

      <div class="sidebar-label">MENU UTAMA</div>

      <nav class="sidebar-nav">
        <a href="#overview" class="nav-item active">
          <LayoutDashboard :size="18" />
          <span>Dashboard</span>
        </a>

        <a href="#sellers" class="nav-item">
          <Store :size="18" />
          <span>Manajemen Penjual</span>
          <span v-if="adminStore.statistics.pendingSellers" class="nav-count">
            {{ adminStore.statistics.pendingSellers }}
          </span>
        </a>
      </nav>

      <div class="sidebar-bottom">
        <div class="admin-account">
          <div class="admin-avatar">
            {{ authStore.profile?.full_name?.charAt(0) || "A" }}
          </div>

          <div class="admin-account-info">
            <strong>{{ authStore.profile?.full_name }}</strong>
            <small>Super Admin</small>
          </div>
        </div>

        <button class="logout-button" @click="logout">
          <LogOut :size="17" />
          Logout
        </button>
      </div>
    </aside>

    <section class="admin-main">
      <header class="admin-topbar">
        <div>
          <span class="breadcrumb">KriyaLoka / Admin</span>
          <h1>Dashboard</h1>
        </div>

        <button
          class="refresh-button"
          :disabled="adminStore.loading"
          @click="loadDashboard"
        >
          <RefreshCw :size="16" :class="{ spinning: adminStore.loading }" />
          <span>Refresh</span>
        </button>
      </header>
      <Transition name="toast">
        <div
          v-if="toast.visible"
          class="toast-container"
          :class="toast.type"
          role="status"
          aria-live="polite"
        >
          <div class="toast-icon">
            <CheckCircle2 v-if="toast.type === 'success'" :size="21" />

            <XCircle v-else-if="toast.type === 'error'" :size="21" />

            <AlertTriangle v-else :size="21" />
          </div>

          <div class="toast-content">
            <strong>
              {{
                toast.type === "success"
                  ? "Berhasil"
                  : toast.type === "error"
                    ? "Terjadi Kesalahan"
                    : "Informasi"
              }}
            </strong>

            <p>{{ toast.message }}</p>
          </div>

          <button
            class="toast-close"
            aria-label="Tutup notifikasi"
            @click="closeToast"
          >
            <X :size="17" />
          </button>

          <span class="toast-progress"></span>
        </div>
      </Transition>

      <section id="overview" class="overview-section">
        <div class="section-heading">
          <div>
            <h2>Ringkasan Platform</h2>
            <p>Pantau aktivitas akun KriyaLoka.</p>
          </div>
        </div>

        <div class="statistics-grid">
          <article class="stat-card">
            <div class="stat-icon purple">
              <Users :size="21" />
            </div>
            <span>Total Pengguna</span>
            <strong>{{ adminStore.statistics.totalUsers }}</strong>
            <small>Semua akun terdaftar</small>
          </article>

          <article class="stat-card">
            <div class="stat-icon green">
              <Users :size="21" />
            </div>
            <span>Pembeli</span>
            <strong>{{ adminStore.statistics.totalBuyers }}</strong>
            <small>Akun pembeli aktif maupun lainnya</small>
          </article>

          <article class="stat-card">
            <div class="stat-icon orange">
              <Store :size="21" />
            </div>
            <span>Total Penjual</span>
            <strong>{{ adminStore.statistics.totalSellers }}</strong>
            <small>UMKM yang mendaftar</small>
          </article>

          <article class="stat-card">
            <div class="stat-icon yellow">
              <Clock3 :size="21" />
            </div>
            <span>Menunggu Verifikasi</span>
            <strong>{{ adminStore.statistics.pendingSellers }}</strong>
            <small>Memerlukan tindakan admin</small>
          </article>
        </div>

        <div class="secondary-stats">
          <div>
            <CheckCircle2 :size="18" />
            <span>Penjual Aktif</span>
            <strong>{{ adminStore.statistics.activeSellers }}</strong>
          </div>

          <div>
            <XCircle :size="18" />
            <span>Ditolak</span>
            <strong>{{ adminStore.statistics.rejectedSellers }}</strong>
          </div>

          <div>
            <ShieldAlert :size="18" />
            <span>Ditangguhkan</span>
            <strong>{{ adminStore.statistics.suspendedSellers }}</strong>
          </div>
        </div>
      </section>

      <Transition name="modal">
        <div
          v-if="showRejectModal"
          class="modal-overlay rejection-overlay"
          @click.self="closeRejectModal"
        >
          <section class="rejection-modal">
            <div class="rejection-icon">
              <AlertTriangle :size="25" />
            </div>

            <button
              class="modal-close rejection-close"
              :disabled="adminStore.updating"
              @click="closeRejectModal"
            >
              <X :size="19" />
            </button>

            <span class="rejection-eyebrow"> VERIFIKASI PENJUAL </span>

            <h2>Tolak Pendaftaran?</h2>

            <p class="rejection-description">
              Pendaftaran
              <strong>{{ rejectingSeller?.full_name }}</strong>
              akan ditolak. Berikan alasan yang jelas agar penjual mengetahui
              hal yang perlu diperbaiki.
            </p>

            <label for="rejection-note">
              Alasan penolakan
              <span>*</span>
            </label>

            <textarea
              id="rejection-note"
              v-model="rejectionNote"
              rows="5"
              maxlength="1000"
              placeholder="Contoh: Informasi alamat usaha belum lengkap. Silakan lengkapi alamat dan unggah foto pendukung yang sesuai..."
              :disabled="adminStore.updating"
            ></textarea>

            <div class="rejection-hint">
              <span
                >Alasan ini akan disimpan dan dapat dilihat oleh penjual.</span
              >
              <span>{{ rejectionNote.length }}/1000</span>
            </div>

            <div class="rejection-actions">
              <button
                class="rejection-cancel"
                :disabled="adminStore.updating"
                @click="closeRejectModal"
              >
                Batal
              </button>

              <button
                class="rejection-submit"
                :disabled="adminStore.updating || !rejectionNote.trim()"
                @click="rejectSeller"
              >
                <span v-if="adminStore.updating"> Memproses... </span>

                <template v-else>
                  <X :size="16" />
                  Tolak Pendaftaran
                </template>
              </button>
            </div>
          </section>
        </div>
      </Transition>

      <section id="sellers" class="sellers-section">
        <div class="section-heading">
          <div>
            <h2>Manajemen Penjual</h2>
            <p>Tinjau dan kelola pendaftaran UMKM KriyaLoka.</p>
          </div>
        </div>

        <div class="seller-toolbar">
          <div class="search-box">
            <Search :size="18" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama, email, atau nomor telepon..."
            />
          </div>

          <select v-model="selectedStatus" class="status-filter">
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div v-if="adminStore.error" class="error-state">
          {{ adminStore.error }}
        </div>

        <div v-if="adminStore.loading" class="loading-state">
          Memuat data penjual...
        </div>

        <div v-else-if="filteredSellers.length === 0" class="empty-state">
          <Store :size="36" />
          <h3>Penjual tidak ditemukan</h3>
          <p>Tidak ada data yang cocok dengan pencarian atau filter.</p>
        </div>

        <div v-else class="table-wrapper">
          <table class="seller-table">
            <thead>
              <tr>
                <th>Informasi Penjual</th>
                <th>Nomor Telepon</th>
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
                      {{ seller.full_name?.charAt(0) || "U" }}
                    </div>

                    <div>
                      <strong>{{ seller.full_name }}</strong>
                      <small>{{ seller.email }}</small>
                    </div>
                  </div>
                </td>

                <td>{{ seller.phone_number || "-" }}</td>

                <td>{{ formatDate(seller.created_at) }}</td>

                <td>
                  <span class="status-badge" :class="seller.account_status">
                    {{ statusLabel(seller.account_status) }}
                  </span>
                </td>

                <td>
                  <div class="action-buttons">
                    <button
                      class="icon-button detail"
                      title="Lihat detail"
                      @click="selectedSeller = seller"
                    >
                      <Eye :size="16" />
                    </button>

                    <template v-if="seller.account_status === 'pending'">
                      <button
                        class="icon-button approve"
                        title="Setujui"
                        :disabled="adminStore.updating"
                        @click="approveSeller(seller)"
                      >
                        <Check :size="16" />
                      </button>

                      <button
                        class="icon-button reject"
                        title="Tolak"
                        :disabled="adminStore.updating"
                        @click="openRejectModal(seller)"
                      >
                        <X :size="16" />
                      </button>
                    </template>

                    <button
                      v-else-if="seller.account_status === 'active'"
                      class="text-action suspend"
                      :disabled="adminStore.updating"
                      @click="suspendSeller(seller)"
                    >
                      Tangguhkan
                    </button>

                    <button
                      v-else
                      class="text-action reactivate"
                      :disabled="adminStore.updating"
                      @click="reactivateSeller(seller)"
                    >
                      Aktifkan
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          Menampilkan {{ filteredSellers.length }} dari
          {{ adminStore.sellers.length }} penjual.
        </div>
      </section>

      <footer class="admin-footer">
        KriyaLoka Admin Console · Pengelolaan platform
      </footer>
    </section>

    <div
      v-if="selectedSeller"
      class="modal-overlay"
      @click.self="selectedSeller = null"
    >
      <section class="seller-modal">
        <div class="modal-heading">
          <div>
            <span>DETAIL PENDAFTARAN</span>
            <h2>Informasi Penjual</h2>
          </div>

          <button class="modal-close" @click="selectedSeller = null">
            <X :size="20" />
          </button>
        </div>

        <div class="modal-avatar">
          {{ selectedSeller.full_name?.charAt(0) || "U" }}
        </div>

        <h3>{{ selectedSeller.full_name }}</h3>
        <p class="modal-email">{{ selectedSeller.email }}</p>

        <div v-if="selectedSeller.store_profile" class="seller-visual-preview">
          <div class="seller-banner">
            <img
              v-if="selectedSeller.store_profile.banner_url"
              :src="selectedSeller.store_profile.banner_url"
              alt="Banner toko"
            />

            <span v-else>Banner belum diunggah</span>
          </div>

          <div class="seller-identity">
            <div class="seller-logo">
              <img
                v-if="selectedSeller.store_profile.logo_url"
                :src="selectedSeller.store_profile.logo_url"
                alt="Logo toko"
              />

              <Store v-else :size="26" />
            </div>

            <div>
              <h3>{{ selectedSeller.store_profile.store_name }}</h3>
              <span>{{ selectedSeller.store_profile.category }}</span>
            </div>
          </div>
        </div>

        <div v-else class="no-store-profile">
          Penjual belum melengkapi profil toko.
        </div>

        <div class="detail-list">
          <div>
            <span>Nama pemilik</span>
            <strong>{{ selectedSeller.full_name }}</strong>
          </div>

          <div>
            <span>Email akun</span>
            <strong>{{ selectedSeller.email }}</strong>
          </div>

          <div>
            <span>Nomor telepon akun</span>
            <strong>{{ selectedSeller.phone_number || "-" }}</strong>
          </div>

          <div>
            <span>Nama toko</span>
            <strong>
              {{ selectedSeller.store_profile?.store_name || "Belum diisi" }}
            </strong>
          </div>

          <div>
            <span>Kategori usaha</span>
            <strong>
              {{ selectedSeller.store_profile?.category || "-" }}
            </strong>
          </div>

          <div>
            <span>Telepon toko</span>
            <strong>
              {{ selectedSeller.store_profile?.contact_phone || "-" }}
            </strong>
          </div>

          <div>
            <span>Deskripsi usaha</span>
            <strong>
              {{ selectedSeller.store_profile?.description || "Belum diisi" }}
            </strong>
          </div>

          <div>
            <span>Provinsi</span>
            <strong>{{ selectedSeller.store_profile?.province || "-" }}</strong>
          </div>

          <div>
            <span>Kabupaten / Kota</span>
            <strong>{{ selectedSeller.store_profile?.city || "-" }}</strong>
          </div>

          <div>
            <span>Kecamatan</span>
            <strong>{{ selectedSeller.store_profile?.district || "-" }}</strong>
          </div>

          <div>
            <span>Alamat usaha</span>
            <strong>{{ selectedSeller.store_profile?.address || "-" }}</strong>
          </div>

          <div>
            <span>Kode pos</span>
            <strong>{{
              selectedSeller.store_profile?.postal_code || "-"
            }}</strong>
          </div>

          <div>
            <span>Tanggal pendaftaran akun</span>
            <strong>{{ formatDate(selectedSeller.created_at) }}</strong>
          </div>

          <div>
            <span>Status akun</span>
            <strong>{{ statusLabel(selectedSeller.account_status) }}</strong>
          </div>

          <div>
            <span>ID pengguna</span>
            <strong class="user-id">{{ selectedSeller.id }}</strong>
          </div>
        </div>

        <div
          v-if="selectedSeller.account_status === 'pending'"
          class="modal-actions"
        >
          <button
            class="modal-reject"
            :disabled="adminStore.updating"
            @click="openRejectModal(selectedSeller)"
          >
            Tolak Pendaftaran
          </button>

          <button
            class="modal-approve"
            :disabled="adminStore.updating"
            @click="approveSeller(selectedSeller)"
          >
            <Check :size="16" />
            Setujui Penjual
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  background: #f8f6f2;
  color: #332b25;
}

.admin-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex: 0 0 250px;
  flex-direction: column;
  height: 100vh;
  padding: 27px 18px 20px;
  border-right: 1px solid #e9e3db;
  background: #fff;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 7px 35px;
  color: #332b25;
  text-decoration: none;
}

.brand-symbol {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  background: #943c14;
  color: #fff;
  font-family: Georgia, serif;
  font-size: 24px;
  font-weight: 700;
}

.admin-brand strong,
.admin-brand small {
  display: block;
}

.admin-brand strong {
  font-size: 16px;
}

.admin-brand small {
  margin-top: 3px;
  color: #998c81;
  font-size: 11px;
}

.sidebar-label {
  padding: 0 10px;
  color: #a69b91;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.sidebar-nav {
  display: grid;
  gap: 7px;
  margin-top: 14px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 11px;
  border-radius: 9px;
  color: #766b61;
  font-size: 13px;
  text-decoration: none;
}

.nav-item.active {
  background: #f9eee8;
  color: #943c14;
  font-weight: 700;
}

.nav-count {
  margin-left: auto;
  padding: 3px 7px;
  border-radius: 20px;
  background: #943c14;
  color: white;
  font-size: 10px;
}

.sidebar-bottom {
  margin-top: auto;
}

.admin-account {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 5px;
  border-top: 1px solid #eee8e1;
}

.admin-avatar,
.seller-avatar,
.modal-avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: #eee3d8;
  color: #943c14;
  font-weight: 800;
}

.admin-avatar {
  width: 37px;
  height: 37px;
  font-size: 14px;
}

.admin-account-info {
  min-width: 0;
}

.admin-account-info strong,
.admin-account-info small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-account-info strong {
  font-size: 12px;
}

.admin-account-info small {
  margin-top: 4px;
  color: #998c81;
  font-size: 11px;
}

.logout-button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #8b4935;
  font-size: 13px;
  cursor: pointer;
}

.logout-button:hover {
  background: #fff2ee;
}

.admin-main {
  min-width: 0;
  flex: 1;
  padding: 32px 38px;
}

.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 34px;
}

.breadcrumb {
  color: #a09388;
  font-size: 12px;
}

.admin-topbar h1 {
  margin: 7px 0 0;
  font-size: 28px;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid #e5ddd4;
  border-radius: 8px;
  background: #fff;
  color: #55473d;
  font-size: 12px;
  cursor: pointer;
}

.refresh-button:disabled {
  opacity: 0.6;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 19px;
}

.section-heading h2 {
  margin: 0;
  font-size: 18px;
}

.section-heading p {
  margin: 6px 0 0;
  color: #94877d;
  font-size: 12px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 15px;
}

.stat-card {
  padding: 20px;
  border: 1px solid #ece5dd;
  border-radius: 12px;
  background: #fff;
}

.stat-icon {
  display: grid;
  width: 38px;
  height: 38px;
  margin-bottom: 16px;
  place-items: center;
  border-radius: 10px;
}

.stat-icon.purple {
  background: #f0eafb;
  color: #7555a8;
}

.stat-icon.green {
  background: #eaf4ec;
  color: #397d4e;
}

.stat-icon.orange {
  background: #fff0e6;
  color: #b45c29;
}

.stat-icon.yellow {
  background: #fff5dc;
  color: #a57a20;
}

.stat-card > span,
.stat-card > strong,
.stat-card > small {
  display: block;
}

.stat-card > span {
  color: #82776d;
  font-size: 12px;
}

.stat-card > strong {
  margin: 8px 0 5px;
  font-size: 27px;
}

.stat-card > small {
  color: #a69a90;
  font-size: 10px;
}

.secondary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  margin: 17px 0 42px;
  padding: 17px 20px;
  border: 1px solid #ece5dd;
  border-radius: 10px;
  background: #fff;
}

.secondary-stats div {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #71665c;
  font-size: 12px;
}

.secondary-stats strong {
  margin-left: 3px;
  color: #332b25;
}

.secondary-stats div:first-child svg {
  color: #397d4e;
}

.secondary-stats div:nth-child(2) svg {
  color: #b44a3a;
}

.secondary-stats div:nth-child(3) svg {
  color: #b27b26;
}

.sellers-section {
  scroll-margin-top: 25px;
}

.seller-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-box {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  border: 1px solid #e7dfd6;
  border-radius: 9px;
  background: #fff;
  color: #a09388;
}

.search-box input {
  width: 100%;
  min-height: 43px;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 12px;
}

.status-filter {
  min-width: 190px;
  padding: 0 12px;
  border: 1px solid #e7dfd6;
  border-radius: 9px;
  background: #fff;
  color: #55473d;
  font: inherit;
  font-size: 12px;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #ece5dd;
  border-radius: 12px;
  background: #fff;
}

.seller-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  white-space: nowrap;
}

.seller-table th {
  padding: 15px 16px;
  background: #fcfaf8;
  color: #92867b;
  font-size: 10px;
  font-weight: 700;
}

.seller-table td {
  padding: 15px 16px;
  border-top: 1px solid #f0ebe5;
  color: #6f645a;
  font-size: 11px;
}

.seller-identity {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seller-avatar {
  width: 36px;
  height: 36px;
  font-size: 13px;
}

.seller-identity strong,
.seller-identity small {
  display: block;
}

.seller-identity strong {
  color: #3c3028;
  font-size: 12px;
}

.seller-identity small {
  margin-top: 4px;
  color: #9c9086;
  font-size: 10px;
}

.status-badge {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}

.status-badge.pending {
  background: #fff4dc;
  color: #986d1c;
}

.status-badge.active {
  background: #e9f5ec;
  color: #34754a;
}

.status-badge.rejected {
  background: #fff0ed;
  color: #ad4938;
}

.status-badge.suspended {
  background: #f0ece8;
  color: #76665b;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-button {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 7px;
  cursor: pointer;
}

.icon-button:disabled,
.text-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-button.detail {
  background: #f0ede9;
  color: #76675c;
}

.icon-button.approve {
  background: #e9f5ec;
  color: #34754a;
}

.icon-button.reject {
  background: #fff0ed;
  color: #ad4938;
}

.text-action {
  padding: 7px 9px;
  border: 0;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.text-action.suspend {
  background: #fff0ed;
  color: #ad4938;
}

.text-action.reactivate {
  background: #e9f5ec;
  color: #34754a;
}

.table-footer {
  padding: 13px 3px;
  color: #a09388;
  font-size: 11px;
}

.empty-state,
.loading-state,
.error-state {
  padding: 48px 20px;
  border: 1px solid #ece5dd;
  border-radius: 12px;
  background: #fff;
  text-align: center;
}

.empty-state svg {
  color: #b8a99b;
}

.empty-state h3 {
  margin: 13px 0 6px;
  font-size: 15px;
}

.empty-state p {
  color: #998d82;
  font-size: 12px;
}

.loading-state {
  color: #82776d;
  font-size: 13px;
}

.error-state {
  color: #ad4938;
  font-size: 13px;
}

.admin-footer {
  margin-top: 35px;
  padding-top: 18px;
  border-top: 1px solid #e9e3db;
  color: #a09388;
  font-size: 11px;
}

.notification {
  position: sticky;
  top: 15px;
  z-index: 20;
  margin-bottom: 20px;
  padding: 13px 16px;
  border-radius: 9px;
  font-size: 12px;
}

.notification.success {
  background: #e9f5ec;
  color: #34754a;
}

.notification.error {
  background: #fff0ed;
  color: #ad4938;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  overflow-y: auto;
  padding: 20px;
  place-items: center;
  background: rgba(36, 27, 21, 0.48);
}

.seller-modal {
  width: 100%;
  max-width: 470px;
  padding: 27px;
  border-radius: 16px;
  background: #fff;
  text-align: center;
}

.modal-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  text-align: left;
}

.modal-heading span {
  color: #a09388;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
}

.modal-heading h2 {
  margin: 7px 0 0;
  font-size: 19px;
}

.modal-close {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: #f4f0ec;
  color: #65584d;
  cursor: pointer;
}

.modal-avatar {
  width: 62px;
  height: 62px;
  margin: 28px auto 12px;
  font-size: 23px;
}

.seller-modal > h3 {
  margin: 0;
  font-size: 18px;
}

.modal-email {
  margin: 7px 0 22px;
  color: #95887e;
  font-size: 12px;
}

.detail-list {
  border-top: 1px solid #eee8e1;
  text-align: left;
}

.detail-list div {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 13px 0;
  border-bottom: 1px solid #eee8e1;
}

.detail-list span {
  color: #94877d;
  font-size: 11px;
}

.detail-list strong {
  max-width: 65%;
  overflow-wrap: anywhere;
  color: #44372e;
  font-size: 11px;
  text-align: right;
}

.user-id {
  font-size: 9px !important;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.modal-actions button {
  display: flex;
  flex: 1;
  min-height: 42px;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.modal-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-reject {
  background: #fff0ed;
  color: #ad4938;
}

.modal-approve {
  background: #2d694d;
  color: white;
}

@media (max-width: 1050px) {
  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-main {
    padding: 28px 22px;
  }
}

@media (max-width: 720px) {
  .admin-layout {
    display: block;
  }

  .admin-sidebar {
    position: static;
    width: 100%;
    height: auto;
    padding: 15px 18px;
  }

  .admin-brand {
    padding-bottom: 15px;
  }

  .sidebar-label,
  .sidebar-bottom {
    display: none;
  }

  .sidebar-nav {
    display: flex;
    margin-top: 0;
  }

  .nav-item {
    flex: 1;
    justify-content: center;
    font-size: 11px;
  }

  .admin-main {
    padding: 25px 16px;
  }

  .admin-topbar h1 {
    font-size: 23px;
  }

  .seller-toolbar {
    flex-direction: column;
  }

  .status-filter {
    min-height: 43px;
  }

  .secondary-stats {
    gap: 15px;
  }
}

@media (max-width: 430px) {
  .statistics-grid {
    grid-template-columns: 1fr 1fr;
    gap: 9px;
  }

  .stat-card {
    padding: 14px;
  }

  .stat-card > strong {
    font-size: 23px;
  }

  .refresh-button span {
    display: none;
  }
}

.seller-visual-preview {
  margin-bottom: 22px;
  overflow: hidden;
  border: 1px solid #ece5dd;
  border-radius: 12px;
  background: white;
}

.seller-banner {
  display: grid;
  height: 135px;
  place-items: center;
  overflow: hidden;
  background: #f3e7dc;
  color: #a58b76;
  font-size: 11px;
}

.seller-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.seller-identity {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 15px;
}

.seller-logo {
  display: grid;
  width: 58px;
  height: 58px;
  flex-shrink: 0;
  place-items: center;
  overflow: hidden;
  border: 1px solid #ece5dd;
  border-radius: 12px;
  background: #f8f3ed;
  color: #943c14;
}

.seller-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.seller-identity h3 {
  margin: 0 0 6px;
  color: #332b25;
  font-size: 15px;
}

.seller-identity span {
  color: #93867b;
  font-size: 11px;
}

.no-store-profile {
  margin-bottom: 18px;
  padding: 15px;
  border-radius: 9px;
  background: #fff7e5;
  color: #8b671d;
  font-size: 12px;
}
/* =========================
   TOAST NOTIFICATION
========================= */

.toast-container {
  position: fixed;
  top: 24px;
  right: 26px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 13px;
  width: min(420px, calc(100vw - 32px));
  min-height: 82px;
  padding: 16px 43px 16px 16px;
  overflow: hidden;
  border: 1px solid #e9e3db;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 14px 45px rgba(50, 35, 25, 0.13);
}

.toast-icon {
  display: grid;
  width: 43px;
  height: 43px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 12px;
}

.toast-content {
  min-width: 0;
}

.toast-content strong {
  display: block;
  margin-bottom: 5px;
  color: #332b25;
  font-size: 13px;
}

.toast-content p {
  margin: 0;
  color: #83766b;
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.toast-close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #9a8e84;
  cursor: pointer;
}

.toast-close:hover {
  background: #f5f1ed;
  color: #493b31;
}

.toast-container.success .toast-icon {
  background: #eaf5ed;
  color: #34754a;
}

.toast-container.error .toast-icon {
  background: #fff0ed;
  color: #ad4938;
}

.toast-container.info .toast-icon {
  background: #fff5df;
  color: #a57a20;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: #2d694d;
  transform-origin: left;
  animation: toast-progress 4s linear forwards;
}

.toast-container.error .toast-progress {
  background: #ad4938;
}

.toast-container.info .toast-progress {
  background: #b8892d;
}

@keyframes toast-progress {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(25px);
}

/* =========================
   REJECTION MODAL
========================= */

.rejection-overlay {
  z-index: 100;
  backdrop-filter: blur(4px);
}

.rejection-modal {
  position: relative;
  width: 100%;
  max-width: 460px;
  padding: 30px;
  border: 1px solid #eee5dc;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(36, 27, 21, 0.18);
  text-align: left;
}

.rejection-icon {
  display: grid;
  width: 48px;
  height: 48px;
  margin-bottom: 22px;
  place-items: center;
  border-radius: 14px;
  background: #fff0ed;
  color: #ad4938;
}

.rejection-close {
  position: absolute;
  top: 20px;
  right: 20px;
}

.rejection-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.rejection-eyebrow {
  color: #a09388;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.3px;
}

.rejection-modal h2 {
  margin: 9px 0;
  color: #332b25;
  font-size: 23px;
}

.rejection-description {
  margin: 0 0 24px;
  color: #84776c;
  font-size: 12px;
  line-height: 1.8;
}

.rejection-description strong {
  color: #49382e;
}

.rejection-modal label {
  display: block;
  margin-bottom: 9px;
  color: #4b3c32;
  font-size: 12px;
  font-weight: 700;
}

.rejection-modal label span {
  color: #b44a3a;
}

.rejection-modal textarea {
  display: block;
  width: 100%;
  min-height: 125px;
  padding: 13px;
  resize: vertical;
  border: 1px solid #e7ddd3;
  border-radius: 10px;
  outline: none;
  background: #fdfbf9;
  color: #44372e;
  font-family: inherit;
  font-size: 12px;
  line-height: 1.7;
  transition: border-color 0.2s;
}

.rejection-modal textarea:focus {
  border-color: #b4532a;
}

.rejection-modal textarea::placeholder {
  color: #b3a69b;
}

.rejection-hint {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  color: #a09388;
  font-size: 10px;
  line-height: 1.5;
}

.rejection-actions {
  display: flex;
  gap: 10px;
  margin-top: 25px;
}

.rejection-actions button {
  display: flex;
  flex: 1;
  min-height: 43px;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 9px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.rejection-actions button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.rejection-cancel {
  background: #f3efeb;
  color: #6f6258;
}

.rejection-submit {
  background: #ad4938;
  color: white;
}

.rejection-submit:not(:disabled):hover {
  background: #963b2c;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .rejection-modal,
.modal-leave-active .rejection-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .rejection-modal,
.modal-leave-to .rejection-modal {
  transform: translateY(15px) scale(0.98);
}

@media (max-width: 480px) {
  .toast-container {
    top: 12px;
    right: 12px;
    width: calc(100vw - 24px);
  }

  .rejection-modal {
    padding: 23px 19px;
  }

  .rejection-actions {
    flex-direction: column-reverse;
  }
}
</style>
