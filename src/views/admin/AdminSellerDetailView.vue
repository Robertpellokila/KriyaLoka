<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  Store,
  UserRound,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Package,
  CheckCircle2,
  Clock3,
  XCircle,
  Archive,
  Search,
  RefreshCw,
  Eye,
  History,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  LoaderCircle,
  ExternalLink,
  ShieldCheck,
  Ban,
  RotateCcw,
} from "lucide-vue-next";

import { supabase } from "../../services/supabase.js";
import { useAdminStore } from "../../stores/admin.js";
import AppToast from "../../components/ui/AppToast.vue";

const route = useRoute();
const router = useRouter();
const adminStore = useAdminStore();

// --------------------------------------------------
// STATE
// --------------------------------------------------

const loading = ref(false);
const loadingProducts = ref(false);
const loadingHistory = ref(false);

const seller = ref(null);
const products = ref([]);
const reviewHistory = ref([]);

const searchQuery = ref("");
const selectedProductStatus = ref("all");

const processingVerification = ref(false);
const showVerificationModal = ref(false);

const sellerHistory = ref([]);
const loadingSellerHistory = ref(false);

const sellerAction = ref(null);
const sellerActionNote = ref("");

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
// SELLER ACCOUNT ACTIONS
// --------------------------------------------------

function openSellerAction(action) {
  if (!seller.value || processingVerification.value) return;

  sellerAction.value = action;
  sellerActionNote.value = "";
  showVerificationModal.value = true;
}

function closeSellerAction() {
  if (processingVerification.value) return;

  showVerificationModal.value = false;
  sellerAction.value = null;
  sellerActionNote.value = "";
}

const sellerActionConfig = {
  approve: {
    title: "Verifikasi dan Aktifkan Seller?",
    description:
      "Pengajuan seller akan disetujui. Akun akan berstatus aktif dan tercatat sebagai terverifikasi.",
    button: "Ya, Verifikasi",
    successTitle: "Verifikasi Berhasil",
    successMessage: "Seller berhasil diverifikasi dan diaktifkan.",
    noteRequired: false,
  },

  reject: {
    title: "Tolak Pengajuan Seller?",
    description:
      "Pengajuan seller akan ditolak. Berikan alasan yang jelas agar seller mengetahui penyebab penolakan.",
    button: "Ya, Tolak Pengajuan",
    successTitle: "Pengajuan Ditolak",
    successMessage: "Pengajuan seller berhasil ditolak.",
    noteRequired: true,
    noteLabel: "Alasan Penolakan",
    notePlaceholder: "Tuliskan alasan penolakan pengajuan seller...",
  },

  suspend: {
    title: "Tangguhkan Akun Seller?",
    description:
      "Seller tidak dapat menggunakan fitur toko selama akun ditangguhkan. Riwayat verifikasi tetap dipertahankan.",
    button: "Ya, Tangguhkan",
    successTitle: "Akun Ditangguhkan",
    successMessage: "Akun seller berhasil ditangguhkan.",
    noteRequired: true,
    noteLabel: "Alasan Penangguhan",
    notePlaceholder: "Tuliskan alasan penangguhan akun seller...",
  },

  reactivate: {
    title: "Aktifkan Kembali Seller?",
    description:
      "Akun seller akan diaktifkan kembali. Status verifikasi sebelumnya tetap dipertahankan.",
    button: "Ya, Aktifkan Kembali",
    successTitle: "Akun Diaktifkan",
    successMessage: "Akun seller berhasil diaktifkan kembali.",
    noteRequired: false,
  },
};

const currentSellerAction = computed(() => {
  return sellerActionConfig[sellerAction.value] || null;
});

async function confirmSellerAction() {
  if (!seller.value || !sellerAction.value || processingVerification.value) {
    return;
  }

  const action = sellerAction.value;
  const config = sellerActionConfig[action];
  const note = sellerActionNote.value.trim();

  if (config.noteRequired && !note) {
    showToast(
      "error",
      "Catatan Wajib Diisi",
      "Silakan isi alasan sebelum melanjutkan.",
    );
    return;
  }

  processingVerification.value = true;

  try {
    if (action === "approve") {
      await adminStore.reviewSeller(seller.value.id, "approved");
    } else if (action === "reject") {
      await adminStore.reviewSeller(seller.value.id, "rejected", note);
    } else if (action === "suspend") {
      await adminStore.updateSellerStatus(seller.value.id, "suspended", note);
    } else if (action === "reactivate") {
      await adminStore.updateSellerStatus(seller.value.id, "active");
    }

    showVerificationModal.value = false;
    sellerAction.value = null;
    sellerActionNote.value = "";

    showToast("success", config.successTitle, config.successMessage);

    await loadDetail();
  } catch (error) {
    console.error("Gagal memproses seller:", error);

    showToast(
      "error",
      "Proses Gagal",
      error.message || "Terjadi kesalahan saat memproses akun seller.",
    );
  } finally {
    processingVerification.value = false;
  }
}
// --------------------------------------------------
// SELLER ID
// --------------------------------------------------

const sellerId = computed(() => route.params.sellerId);

// --------------------------------------------------
// STATUS CONFIGURATION
// --------------------------------------------------

const accountStatusConfig = {
  pending: {
    label: "Menunggu Verifikasi",
    class: "status-pending",
  },
  active: {
    label: "Aktif",
    class: "status-active",
  },
  suspended: {
    label: "Ditangguhkan",
    class: "status-suspended",
  },
  rejected: {
    label: "Ditolak",
    class: "status-rejected",
  },
};

const productStatusConfig = {
  draft: {
    label: "Draft",
    class: "status-draft",
  },
  pending_review: {
    label: "Menunggu Review",
    class: "status-pending",
  },
  approved: {
    label: "Disetujui",
    class: "status-approved",
  },
  published: {
    label: "Dipublikasikan",
    class: "status-approved",
  },
  rejected: {
    label: "Ditolak",
    class: "status-rejected",
  },
  archived: {
    label: "Diarsipkan",
    class: "status-archived",
  },
};

function getAccountStatus(status) {
  return (
    accountStatusConfig[status] || {
      label: status || "Tidak diketahui",
      class: "status-unknown",
    }
  );
}

function getProductStatus(status) {
  return (
    productStatusConfig[status] || {
      label: status || "Tidak diketahui",
      class: "status-unknown",
    }
  );
}

// --------------------------------------------------
// FORMATTERS
// --------------------------------------------------

function formatDate(date) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function formatDateTime(date) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
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

function getStoreName() {
  return seller.value?.store_profile?.store_name || "Nama toko belum diisi";
}

function getStoreLocation() {
  const store = seller.value?.store_profile || {};

  return (
    [store.city, store.province].filter(Boolean).join(", ") ||
    "Lokasi belum diisi"
  );
}

function getStoreAddress() {
  return seller.value?.store_profile?.address || "Alamat belum diisi";
}

function getProductImage(product) {
  const images = product.product_images || [];

  if (!images.length) return null;

  const sortedImages = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return sortedImages[0]?.image_url || null;
}

// --------------------------------------------------
// SELLER INFORMATION
// --------------------------------------------------

async function fetchSeller() {
  await adminStore.fetchSellers();

  const foundSeller = (adminStore.sellers || []).find(
    (item) => item.id === sellerId.value,
  );

  if (!foundSeller) {
    throw new Error(
      "Data penjual tidak ditemukan atau kamu tidak memiliki akses.",
    );
  }

  seller.value = foundSeller;
}

// --------------------------------------------------
// FETCH PRODUCTS
// --------------------------------------------------

async function fetchProducts() {
  loadingProducts.value = true;

  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        product_images (
          id,
          image_url,
          image_path,
          sort_order
        )
      `,
      )
      .eq("seller_id", sellerId.value)
      .order("created_at", { ascending: false });

    if (error) throw error;

    products.value = data || [];
  } finally {
    loadingProducts.value = false;
  }
}

// --------------------------------------------------
// FETCH REVIEW HISTORY
// --------------------------------------------------

async function fetchReviewHistory() {
  loadingHistory.value = true;

  try {
    const productIds = products.value.map((product) => product.id);

    if (!productIds.length) {
      reviewHistory.value = [];
      return;
    }

    const { data, error } = await supabase
      .from("product_review_history")
      .select(
        `
        id,
        product_id,
        actor_id,
        action,
        note,
        changes,
        product_snapshot,
        created_at
      `,
      )
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const history = data || [];

    // Ambil nama produk dari data produk yang sudah dimuat.
    const productMap = new Map(
      products.value.map((product) => [product.id, product]),
    );

    // Ambil identitas aktor agar riwayat lebih mudah dibaca.
    const actorIds = [
      ...new Set(history.map((item) => item.actor_id).filter(Boolean)),
    ];

    let actorMap = new Map();

    if (actorIds.length) {
      const { data: actors, error: actorError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", actorIds);

      if (actorError) throw actorError;

      actorMap = new Map(
        (actors || []).map((actor) => [actor.id, actor.full_name]),
      );
    }

    reviewHistory.value = history.map((item) => ({
      ...item,
      product_name:
        productMap.get(item.product_id)?.name ||
        item.product_snapshot?.name ||
        "Produk tidak diketahui",
      actor_name: actorMap.get(item.actor_id) || "Pengguna",
    }));
  } finally {
    loadingHistory.value = false;
  }
}

// --------------------------------------------------
// FETCH SELLER ACCOUNT HISTORY
// --------------------------------------------------

async function fetchSellerHistory() {
  loadingSellerHistory.value = true;

  try {
    const [verificationResult, statusResult] = await Promise.all([
      supabase
        .from("seller_verification_reviews")
        .select(
          `
          id,
          seller_id,
          admin_id,
          decision,
          note,
          created_at
        `,
        )
        .eq("seller_id", sellerId.value)
        .order("created_at", { ascending: false }),

      supabase
        .from("seller_account_status_reviews")
        .select(
          `
          id,
          seller_id,
          admin_id,
          old_status,
          new_status,
          note,
          created_at
        `,
        )
        .eq("seller_id", sellerId.value)
        .order("created_at", { ascending: false }),
    ]);

    if (verificationResult.error) throw verificationResult.error;
    if (statusResult.error) throw statusResult.error;

    const verificationHistory = (verificationResult.data || []).map((item) => ({
      ...item,
      history_type: "verification",
      action: item.decision,
    }));

    const statusHistory = (statusResult.data || []).map((item) => ({
      ...item,
      history_type: "status",
      action: item.new_status,
    }));

    const combinedHistory = [...verificationHistory, ...statusHistory].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const actorIds = [
      ...new Set(combinedHistory.map((item) => item.admin_id).filter(Boolean)),
    ];

    let actorMap = new Map();

    if (actorIds.length) {
      const { data: actors, error: actorError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", actorIds);

      if (actorError) throw actorError;

      actorMap = new Map(
        (actors || []).map((actor) => [actor.id, actor.full_name]),
      );
    }

    sellerHistory.value = combinedHistory.map((item) => ({
      ...item,
      actor_name: actorMap.get(item.admin_id) || "Administrator",
    }));

    return sellerHistory.value;
  } catch (error) {
    sellerHistory.value = [];
    throw error;
  } finally {
    loadingSellerHistory.value = false;
  }
}

// --------------------------------------------------
// LOAD ALL DATA
// --------------------------------------------------

async function loadDetail(showMessage = false) {
  loading.value = true;

  try {
    await fetchSeller();
    await fetchProducts();

    await Promise.all([fetchReviewHistory(), fetchSellerHistory()]);

    if (showMessage) {
      showToast(
        "success",
        "Data Diperbarui",
        "Informasi penjual berhasil diperbarui.",
      );
    }
  } catch (error) {
    console.error("Gagal memuat detail penjual:", error);

    showToast(
      "error",
      "Gagal Memuat Data",
      error.message || "Terjadi kesalahan saat mengambil detail penjual.",
    );
  } finally {
    loading.value = false;
  }
}

// --------------------------------------------------
// PRODUCT STATISTICS
// --------------------------------------------------

const productStatistics = computed(() => {
  const list = products.value;

  return {
    total: list.length,
    pending: list.filter((item) => item.status === "pending_review").length,
    approved: list.filter((item) =>
      ["approved", "published"].includes(item.status),
    ).length,
    rejected: list.filter((item) => item.status === "rejected").length,
    draft: list.filter((item) => item.status === "draft").length,
    archived: list.filter((item) => item.status === "archived").length,
  };
});

// --------------------------------------------------
// PRODUCT FILTERING
// --------------------------------------------------

const filteredProducts = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return products.value.filter((product) => {
    const matchesSearch =
      !keyword ||
      [product.name, product.category, product.description, product.slug]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);

    const matchesStatus =
      selectedProductStatus.value === "all" ||
      product.status === selectedProductStatus.value;

    return matchesSearch && matchesStatus;
  });
});

// --------------------------------------------------
// HISTORY LABELS
// --------------------------------------------------

const historyActionConfig = {
  submitted: {
    label: "Produk Diajukan",
    class: "history-submitted",
  },
  resubmitted: {
    label: "Produk Diajukan Ulang",
    class: "history-resubmitted",
  },
  updated: {
    label: "Produk Diperbarui",
    class: "history-updated",
  },
  approved: {
    label: "Produk Disetujui",
    class: "history-approved",
  },
  rejected: {
    label: "Produk Ditolak",
    class: "history-rejected",
  },
  image_added: {
    label: "Foto Ditambahkan",
    class: "history-updated",
  },
  image_removed: {
    label: "Foto Dihapus",
    class: "history-updated",
  },
};

function getHistoryAction(action) {
  return (
    historyActionConfig[action] || {
      label: action || "Aktivitas",
      class: "history-default",
    }
  );
}

function getHistoryDescription(item) {
  if (item.note) return item.note;

  const descriptions = {
    submitted: "Penjual mengajukan produk untuk ditinjau.",
    resubmitted: "Penjual mengirimkan ulang produk setelah perbaikan.",
    updated: "Informasi produk mengalami perubahan.",
    approved: "Produk telah disetujui oleh administrator.",
    rejected: "Produk ditolak oleh administrator.",
    image_added: "Penjual menambahkan foto produk.",
    image_removed: "Penjual menghapus foto produk.",
  };

  return descriptions[item.action] || "Aktivitas produk tercatat.";
}

// --------------------------------------------------
// NAVIGATION
// --------------------------------------------------

function goBack() {
  router.push({ name: "AdminSellerManagement" });
}

function openProductReview(product) {
  router.push({
    name: "AdminProductReview",
    query: {
      product: product.id,
    },
  });
}

// --------------------------------------------------
// WATCH ROUTE
// --------------------------------------------------

watch(sellerId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    seller.value = null;
    products.value = [];
    reviewHistory.value = [];
    sellerHistory.value = [];

    searchQuery.value = "";
    selectedProductStatus.value = "all";

    loadDetail();
  }
});

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <div class="seller-detail-page">
    <!-- HEADER -->
    <header class="page-header">
      <div class="header-left">
        <button type="button" class="back-button" @click="goBack">
          <ArrowLeft :size="18" />
          <span>Kembali</span>
        </button>

        <div>
          <p class="eyebrow">SELLER MANAGEMENT</p>
          <h1>Detail Penjual</h1>
          <p class="page-description">
            Informasi lengkap dan aktivitas penjual KriyaLoka.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="refresh-button"
        :disabled="loading"
        @click="loadDetail(true)"
      >
        <RefreshCw :size="16" :class="{ spinning: loading }" />
        Refresh Data
      </button>
    </header>

    <!-- LOADING -->
    <div v-if="loading && !seller" class="state-container">
      <LoaderCircle :size="34" class="spinning" />
      <p>Memuat detail penjual...</p>
    </div>

    <!-- SELLER NOT FOUND -->
    <div v-else-if="!seller" class="state-container error-state">
      <AlertCircle :size="38" />
      <h3>Data Penjual Tidak Ditemukan</h3>
      <p>Penjual mungkin sudah tidak tersedia atau akses ditolak.</p>

      <button type="button" class="back-button primary-back" @click="goBack">
        <ArrowLeft :size="17" />
        Kembali ke Manajemen Penjual
      </button>
    </div>

    <template v-else>
      <!-- SELLER PROFILE -->
      <section class="profile-card">
        <div class="profile-main">
          <div class="store-avatar">
            <img
              v-if="seller.store_profile?.logo_url"
              :src="seller.store_profile.logo_url"
              :alt="getStoreName()"
            />

            <span v-else>
              {{ getInitials(getStoreName()) }}
            </span>
          </div>

          <div class="profile-info">
            <div class="profile-title">
              <div>
                <p class="profile-label">INFORMASI TOKO</p>
                <h2>{{ getStoreName() }}</h2>
              </div>

              <span
                class="status-badge"
                :class="getAccountStatus(seller.account_status).class"
              >
                <span class="status-dot"></span>
                {{ getAccountStatus(seller.account_status).label }}
              </span>
            </div>

            <p class="profile-owner">
              <UserRound :size="15" />
              {{ seller.full_name || "Nama pemilik belum tersedia" }}
            </p>

            <div class="profile-meta">
              <span>
                <MapPin :size="14" />
                {{ getStoreLocation() }}
              </span>

              <span v-if="seller.store_profile?.category">
                <Store :size="14" />
                {{ seller.store_profile.category }}
              </span>
            </div>
          </div>
        </div>

        <div class="profile-footer">
          <div>
            <Mail :size="15" />
            <span>{{ seller.email || "-" }}</span>
          </div>

          <div>
            <Phone :size="15" />
            <span>
              {{
                seller.phone_number ||
                seller.store_profile?.contact_phone ||
                "-"
              }}
            </span>
          </div>

          <div>
            <CalendarDays :size="15" />
            <span>Bergabung {{ formatDate(seller.created_at) }}</span>
          </div>
        </div>
      </section>

      <!-- SELLER VERIFICATION -->
      <!-- SELLER VERIFICATION AND ACCOUNT STATUS -->

      <!-- PENDING -->
      <section
        v-if="seller.account_status === 'pending'"
        class="verification-card"
      >
        <div class="verification-information">
          <div class="verification-icon">
            <Clock3 :size="22" />
          </div>

          <div>
            <h3>Akun Menunggu Verifikasi</h3>
            <p>
              Periksa informasi pemilik dan toko sebelum menyetujui atau menolak
              pengajuan seller.
            </p>
          </div>
        </div>

        <div class="verification-actions">
          <button
            type="button"
            class="action-button reject-action"
            :disabled="processingVerification"
            @click="openSellerAction('reject')"
          >
            <XCircle :size="16" />
            Tolak
          </button>

          <button
            type="button"
            class="action-button approve-action"
            :disabled="processingVerification"
            @click="openSellerAction('approve')"
          >
            <CheckCircle2 :size="16" />
            Setujui & Aktifkan
          </button>
        </div>
      </section>

      <!-- ACTIVE BUT NOT VERIFIED -->
      <section
        v-else-if="seller.account_status === 'active' && !seller.is_verified"
        class="verification-card"
      >
        <div class="verification-information">
          <div class="verification-icon warning-verification-icon">
            <AlertCircle :size="22" />
          </div>

          <div>
            <h3>Akun Aktif, Belum Terverifikasi</h3>
            <p>
              Akun ini sudah berstatus aktif, tetapi belum memiliki catatan
              verifikasi. Lakukan verifikasi untuk menyelesaikan proses
              administrasi seller.
            </p>
          </div>
        </div>

        <button
          type="button"
          class="action-button approve-action"
          :disabled="processingVerification"
          @click="openSellerAction('approve')"
        >
          <ShieldCheck :size="16" />
          Verifikasi Seller
        </button>
      </section>

      <!-- ACTIVE AND VERIFIED -->
      <section
        v-else-if="seller.account_status === 'active' && seller.is_verified"
        class="verification-status-card verified"
      >
        <ShieldCheck :size="21" />

        <div class="verification-status-content">
          <strong>Seller Terverifikasi dan Aktif</strong>

          <p>Terverifikasi pada {{ formatDateTime(seller.verified_at) }}.</p>
        </div>

        <button
          type="button"
          class="action-button suspend-action"
          :disabled="processingVerification"
          @click="openSellerAction('suspend')"
        >
          <Ban :size="16" />
          Tangguhkan Akun
        </button>
      </section>

      <!-- REJECTED -->
      <section
        v-else-if="seller.account_status === 'rejected'"
        class="verification-status-card rejected"
      >
        <XCircle :size="21" />

        <div>
          <strong>Pengajuan Seller Ditolak</strong>

          <p>
            {{
              seller.verification_note ||
              "Pengajuan akun seller ini telah ditolak."
            }}
          </p>
        </div>
      </section>

      <!-- SUSPENDED -->
      <section
        v-else-if="seller.account_status === 'suspended'"
        class="verification-status-card suspended"
      >
        <AlertCircle :size="21" />

        <div class="verification-status-content">
          <strong>Akun Seller Ditangguhkan</strong>

          <p>Seller ini sudah terverifikasi, tetapi saat ini tidak aktif.</p>
        </div>

        <button
          v-if="seller.is_verified"
          type="button"
          class="action-button reactivate-action"
          :disabled="processingVerification"
          @click="openSellerAction('reactivate')"
        >
          <RotateCcw :size="16" />
          Aktifkan Kembali
        </button>
      </section>

      <!-- SELLER ACCOUNT HISTORY -->

      <section class="seller-history-card">
        <div class="section-heading">
          <div class="section-title-icon">
            <ShieldCheck :size="19" />
          </div>

          <div>
            <h2>Riwayat Verifikasi & Status Akun</h2>
            <p>
              Riwayat persetujuan, penolakan, penangguhan, dan aktivasi kembali
              seller.
            </p>
          </div>

          <span class="result-count">
            {{ sellerHistory.length }} aktivitas
          </span>
        </div>

        <div v-if="loadingSellerHistory" class="section-state">
          <LoaderCircle :size="25" class="spinning" />
          <span>Memuat riwayat akun...</span>
        </div>

        <div v-else-if="sellerHistory.length === 0" class="section-state">
          <History :size="32" />
          <strong>Belum Ada Riwayat Akun</strong>
          <span>
            Aktivitas verifikasi dan perubahan status seller akan ditampilkan di
            sini.
          </span>
        </div>

        <div v-else class="seller-history-list">
          <article
            v-for="item in sellerHistory"
            :key="`${item.history_type}-${item.id}`"
            class="seller-history-item"
          >
            <div
              class="seller-history-marker"
              :class="[
                item.history_type === 'verification'
                  ? `seller-history-${item.action}`
                  : `seller-history-${item.new_status}`,
              ]"
            >
              <CheckCircle2
                v-if="item.action === 'approved' || item.action === 'active'"
                :size="17"
              />

              <XCircle v-else-if="item.action === 'rejected'" :size="17" />

              <Ban v-else-if="item.action === 'suspended'" :size="17" />

              <History v-else :size="17" />
            </div>

            <div class="seller-history-content">
              <div class="seller-history-title">
                <strong>
                  {{
                    item.history_type === "verification"
                      ? item.action === "approved"
                        ? "Seller Disetujui dan Diverifikasi"
                        : "Pengajuan Seller Ditolak"
                      : item.new_status === "suspended"
                        ? "Akun Seller Ditangguhkan"
                        : "Akun Seller Diaktifkan Kembali"
                  }}
                </strong>

                <time>{{ formatDateTime(item.created_at) }}</time>
              </div>

              <p>
                {{
                  item.note ||
                  (item.history_type === "verification"
                    ? "Keputusan verifikasi berhasil dicatat."
                    : "Perubahan status akun berhasil dicatat.")
                }}
              </p>

              <span> Oleh: {{ item.actor_name }} </span>
            </div>
          </article>
        </div>
      </section>

      <!-- STATISTICS -->
      <section class="statistics-grid">
        <article class="stat-card">
          <div class="stat-icon icon-total">
            <Package :size="21" />
          </div>
          <div>
            <p>Total Produk</p>
            <h2>{{ productStatistics.total }}</h2>
            <span>Seluruh produk penjual</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-pending">
            <Clock3 :size="21" />
          </div>
          <div>
            <p>Menunggu Review</p>
            <h2>{{ productStatistics.pending }}</h2>
            <span>Produk perlu diperiksa</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-approved">
            <CheckCircle2 :size="21" />
          </div>
          <div>
            <p>Disetujui</p>
            <h2>{{ productStatistics.approved }}</h2>
            <span>Produk yang diterima</span>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon icon-rejected">
            <XCircle :size="21" />
          </div>
          <div>
            <p>Ditolak</p>
            <h2>{{ productStatistics.rejected }}</h2>
            <span>Produk yang ditolak</span>
          </div>
        </article>
      </section>

      <!-- STORE INFORMATION -->
      <section class="information-card">
        <div class="section-heading">
          <div class="section-title-icon">
            <Store :size="19" />
          </div>

          <div>
            <h2>Informasi Toko</h2>
            <p>Informasi tambahan mengenai toko penjual.</p>
          </div>
        </div>

        <div class="information-grid">
          <div class="information-item">
            <span>Nama Toko</span>
            <strong>{{ getStoreName() }}</strong>
          </div>

          <div class="information-item">
            <span>Kategori</span>
            <strong>{{ seller.store_profile?.category || "-" }}</strong>
          </div>

          <div class="information-item">
            <span>Nomor Telepon Toko</span>
            <strong>
              {{
                seller.store_profile?.contact_phone ||
                seller.phone_number ||
                "-"
              }}
            </strong>
          </div>

          <div class="information-item">
            <span>Kota / Kabupaten</span>
            <strong>{{ seller.store_profile?.city || "-" }}</strong>
          </div>

          <div class="information-item">
            <span>Provinsi</span>
            <strong>{{ seller.store_profile?.province || "-" }}</strong>
          </div>

          <div class="information-item full-width">
            <span>Alamat Toko</span>
            <strong>{{ getStoreAddress() }}</strong>
          </div>
        </div>
      </section>

      <!-- PRODUCTS -->
      <section class="products-card">
        <div class="section-heading products-heading">
          <div class="section-title-group">
            <div class="section-title-icon">
              <Package :size="19" />
            </div>

            <div>
              <h2>Produk Penjual</h2>
              <p>Seluruh produk yang terdaftar oleh toko ini.</p>
            </div>
          </div>

          <span class="result-count">
            {{ filteredProducts.length }} produk
          </span>
        </div>

        <!-- PRODUCT FILTER -->
        <div class="product-toolbar">
          <div class="search-box">
            <Search :size="18" />

            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama atau kategori produk..."
            />
          </div>

          <select v-model="selectedProductStatus" class="status-filter">
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Menunggu Review</option>
            <option value="published">Dipublikasikan</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
            <option value="archived">Diarsipkan</option>
          </select>
        </div>

        <div v-if="loadingProducts" class="section-state">
          <LoaderCircle :size="25" class="spinning" />
          <span>Memuat produk...</span>
        </div>

        <div
          v-else-if="filteredProducts.length === 0"
          class="section-state empty-products"
        >
          <Package :size="32" />
          <strong>Produk tidak ditemukan</strong>
          <span>
            {{
              products.length
                ? "Coba ubah kata kunci atau filter."
                : "Penjual ini belum memiliki produk."
            }}
          </span>
        </div>

        <div v-else class="products-list">
          <article
            v-for="product in filteredProducts"
            :key="product.id"
            class="product-item"
          >
            <div class="product-image">
              <img
                v-if="getProductImage(product)"
                :src="getProductImage(product)"
                :alt="product.name"
                loading="lazy"
              />

              <div v-else class="no-product-image">
                <ImageIcon :size="25" />
              </div>
            </div>

            <div class="product-content">
              <div class="product-title-row">
                <div>
                  <h3>{{ product.name }}</h3>
                  <span class="product-category">
                    {{ product.category || "Tanpa kategori" }}
                  </span>
                </div>

                <span
                  class="status-badge"
                  :class="getProductStatus(product.status).class"
                >
                  {{ getProductStatus(product.status).label }}
                </span>
              </div>

              <p class="product-description">
                {{ product.description || "Tidak ada deskripsi produk." }}
              </p>

              <div class="product-meta">
                <strong>{{ formatCurrency(product.price) }}</strong>

                <span>Stok: {{ product.stock ?? 0 }}</span>

                <span> Dibuat {{ formatDate(product.created_at) }} </span>
              </div>

              <p v-if="product.rejection_note" class="rejection-note">
                <AlertCircle :size="14" />
                Alasan penolakan: {{ product.rejection_note }}
              </p>
            </div>

            <button
              v-if="product.status === 'pending_review'"
              type="button"
              class="review-button"
              @click="openProductReview(product)"
            >
              <Eye :size="15" />
              Review
            </button>
          </article>
        </div>
      </section>

      <!-- REVIEW HISTORY -->
      <section class="history-card">
        <div class="section-heading">
          <div class="section-title-icon">
            <History :size="19" />
          </div>

          <div>
            <h2>Riwayat Aktivitas Produk</h2>
            <p>Catatan pengajuan, perubahan, dan keputusan review.</p>
          </div>

          <span class="result-count">
            {{ reviewHistory.length }} aktivitas
          </span>
        </div>

        <div v-if="loadingHistory" class="section-state">
          <LoaderCircle :size="25" class="spinning" />
          <span>Memuat riwayat...</span>
        </div>

        <div v-else-if="reviewHistory.length === 0" class="section-state">
          <History :size="32" />
          <strong>Belum Ada Riwayat</strong>
          <span>Aktivitas produk penjual akan ditampilkan di sini.</span>
        </div>

        <div v-else class="history-list">
          <article
            v-for="item in reviewHistory"
            :key="item.id"
            class="history-item"
          >
            <div
              class="history-marker"
              :class="getHistoryAction(item.action).class"
            >
              <CheckCircle2 v-if="item.action === 'approved'" :size="17" />

              <XCircle v-else-if="item.action === 'rejected'" :size="17" />

              <FileText v-else :size="17" />
            </div>

            <div class="history-content">
              <div class="history-title-row">
                <div>
                  <strong>
                    {{ getHistoryAction(item.action).label }}
                  </strong>

                  <span class="history-product-name">
                    {{ item.product_name }}
                  </span>
                </div>

                <time>{{ formatDateTime(item.created_at) }}</time>
              </div>

              <p>{{ getHistoryDescription(item) }}</p>

              <span class="history-actor"> Oleh: {{ item.actor_name }} </span>
            </div>
          </article>
        </div>
      </section>
    </template>

    <!-- VERIFICATION MODAL -->
    <!-- SELLER ACTION MODAL -->

    <div
      v-if="showVerificationModal && currentSellerAction"
      class="modal-overlay"
      @click.self="closeSellerAction"
    >
      <div class="verification-modal">
        <div
          class="modal-icon"
          :class="{
            'modal-warning': sellerAction === 'suspend',
            'modal-danger': sellerAction === 'reject',
          }"
        >
          <ShieldCheck
            v-if="sellerAction === 'approve' || sellerAction === 'reactivate'"
            :size="28"
          />

          <Ban v-else-if="sellerAction === 'suspend'" :size="28" />

          <XCircle v-else :size="28" />
        </div>

        <h3>{{ currentSellerAction.title }}</h3>

        <p>
          {{ currentSellerAction.description }}
        </p>

        <div v-if="currentSellerAction.noteRequired" class="modal-note-field">
          <label>
            {{ currentSellerAction.noteLabel }}
          </label>

          <textarea
            v-model="sellerActionNote"
            :placeholder="currentSellerAction.notePlaceholder"
            rows="4"
            :disabled="processingVerification"
          ></textarea>

          <span>
            Catatan ini akan disimpan dalam riwayat aktivitas seller.
          </span>
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="modal-cancel"
            :disabled="processingVerification"
            @click="closeSellerAction"
          >
            Batal
          </button>

          <button
            type="button"
            class="modal-confirm"
            :class="{
              'confirm-danger':
                sellerAction === 'reject' || sellerAction === 'suspend',
            }"
            :disabled="
              processingVerification ||
              (currentSellerAction.noteRequired && !sellerActionNote.trim())
            "
            @click="confirmSellerAction"
          >
            <LoaderCircle
              v-if="processingVerification"
              :size="16"
              class="spinning"
            />

            <CheckCircle2 v-else :size="16" />

            {{
              processingVerification
                ? "Memproses..."
                : currentSellerAction.button
            }}
          </button>
        </div>
      </div>
    </div>

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
.seller-detail-page {
  width: 100%;
  min-width: 0;
  padding-bottom: 35px;
  color: #383b30;
}

/* HEADER */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  margin-bottom: 25px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.back-button {
  width: fit-content;
  min-height: 35px;
  padding: 0 11px;
  border: 1px solid #e5e0d4;
  border-radius: 9px;
  background: #fffdf8;
  color: #69704f;
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
  transition: 0.2s;
}

.back-button:hover {
  background: #f1efe5;
}

.eyebrow {
  margin: 0 0 5px;
  color: #a66b48;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.page-header h1 {
  margin: 0;
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.6px;
}

.page-description {
  margin: 6px 0 0;
  color: #969181;
  font-size: 12px;
}

.refresh-button {
  height: 40px;
  padding: 0 13px;
  border: 1px solid #e5e0d4;
  border-radius: 9px;
  background: #fffdf8;
  color: #68704c;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 650;
  cursor: pointer;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* PROFILE */

.profile-card,
.information-card,
.products-card,
.history-card {
  border: 1px solid #e9e4d8;
  border-radius: 15px;
  background: #fffdf8;
  overflow: hidden;
  margin-bottom: 20px;
}

.profile-card {
  padding: 23px;
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 18px;
}

.store-avatar {
  width: 83px;
  height: 83px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 19px;
  background: #eeebdf;
  color: #71794e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 750;
}

.store-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.profile-label {
  margin: 0 0 5px;
  color: #a66b48;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

.profile-title h2 {
  margin: 0;
  color: #383b30;
  font-size: 21px;
  font-weight: 750;
}

.profile-owner {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 10px 0 8px;
  color: #777663;
  font-size: 12px;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.profile-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #999585;
  font-size: 11px;
}

.profile-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  margin-top: 22px;
  padding-top: 17px;
  border-top: 1px solid #f0ede5;
}

.profile-footer div {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #858171;
  font-size: 11px;
}

/* STATUS */

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
  flex-shrink: 0;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-active,
.status-approved {
  background: #e9f2e7;
  color: #54805b;
}

.status-pending {
  background: #fbf0dc;
  color: #a87936;
}

.status-suspended,
.status-archived {
  background: #eeeae8;
  color: #81716b;
}

.status-rejected {
  background: #f7e9e4;
  color: #aa6856;
}

.status-draft {
  background: #efeee9;
  color: #777765;
}

.status-unknown {
  background: #efeee9;
  color: #777;
}

/* STATISTICS */

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
  margin-bottom: 20px;
}

.stat-card {
  min-width: 0;
  padding: 17px;
  border: 1px solid #e9e4d8;
  border-radius: 14px;
  background: #fffdf8;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-total {
  color: #647044;
  background: #eef0e3;
}

.icon-pending {
  color: #ae7a35;
  background: #fbf0dc;
}

.icon-approved {
  color: #397b57;
  background: #e8f3e9;
}

.icon-rejected {
  color: #a45e4f;
  background: #f8e9e4;
}

.stat-card p {
  margin: 1px 0 6px;
  color: #898676;
  font-size: 10px;
  font-weight: 650;
}

.stat-card h2 {
  margin: 0;
  color: #383b30;
  font-size: 24px;
  font-weight: 750;
}

.stat-card span {
  display: block;
  margin-top: 5px;
  color: #a19c8d;
  font-size: 9px;
}

/* SECTION HEADING */

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 19px 21px;
}

.section-title-icon {
  width: 39px;
  height: 39px;
  border-radius: 11px;
  flex-shrink: 0;
  background: #eeeede;
  color: #69744d;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-heading h2 {
  margin: 0;
  color: #383b30;
  font-size: 15px;
  font-weight: 750;
}

.section-heading p {
  margin: 5px 0 0;
  color: #969181;
  font-size: 11px;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.result-count {
  margin-left: auto;
  padding: 6px 10px;
  border-radius: 20px;
  background: #f1efe5;
  color: #68704d;
  font-size: 10px;
  font-weight: 650;
  white-space: nowrap;
}

/* STORE INFORMATION */

.information-grid {
  padding: 4px 22px 22px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 19px 25px;
}

.information-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.information-item span {
  color: #999585;
  font-size: 10px;
}

.information-item strong {
  color: #4a4b3d;
  font-size: 12px;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.full-width {
  grid-column: 1 / -1;
}

/* PRODUCT TOOLBAR */

.product-toolbar {
  padding: 0 21px 17px;
  display: flex;
  gap: 10px;
}

.search-box {
  height: 40px;
  max-width: 390px;
  flex: 1;
  padding: 0 11px;
  border: 1px solid #e7e2d6;
  border-radius: 9px;
  background: #fff;
  color: #999382;
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 11px;
}

.status-filter {
  min-width: 175px;
  padding: 0 11px;
  border: 1px solid #e7e2d6;
  border-radius: 9px;
  outline: none;
  background: #fff;
  color: #555746;
  font-family: inherit;
  font-size: 11px;
}

/* PRODUCTS */

.products-list {
  border-top: 1px solid #f0ede5;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 21px;
  border-bottom: 1px solid #f0ede5;
}

.product-item:last-child {
  border-bottom: 0;
}

.product-image {
  width: 76px;
  height: 76px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 11px;
  background: #f0eee6;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-product-image {
  width: 100%;
  height: 100%;
  color: #999783;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-content {
  flex: 1;
  min-width: 0;
}

.product-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.product-title-row h3 {
  margin: 0 0 5px;
  color: #414337;
  font-size: 13px;
  font-weight: 750;
}

.product-category {
  color: #969181;
  font-size: 10px;
}

.product-description {
  margin: 8px 0;
  color: #898676;
  font-size: 10px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.product-meta strong {
  color: #68764c;
  font-size: 12px;
}

.product-meta span {
  color: #999585;
  font-size: 10px;
}

.rejection-note {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 7px;
  background: #f8eae4;
  color: #a45e4f;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 10px;
  line-height: 1.5;
}

.rejection-note svg {
  flex-shrink: 0;
}

.review-button {
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid #e5dfd1;
  border-radius: 8px;
  background: #f1efe5;
  color: #69704d;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.review-button:hover {
  background: #e8e6d8;
}

/* HISTORY */

.history-list {
  padding: 4px 22px 20px;
}

.history-item {
  position: relative;
  display: flex;
  gap: 13px;
  padding: 13px 0;
}

.history-item:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 43px;
  bottom: -13px;
  left: 16px;
  width: 1px;
  background: #e9e5d9;
}

.history-marker {
  position: relative;
  z-index: 1;
  width: 33px;
  height: 33px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0eee6;
  color: #7b8060;
}

.history-approved {
  background: #e9f2e7;
  color: #54805b;
}

.history-rejected {
  background: #f7e9e4;
  color: #aa6856;
}

.history-submitted,
.history-resubmitted {
  background: #fbf0dc;
  color: #a87936;
}

.history-updated {
  background: #eeeede;
  color: #69744d;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.history-title-row > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.history-title-row strong {
  color: #444638;
  font-size: 11px;
}

.history-product-name {
  color: #8c8978;
  font-size: 10px;
}

.history-title-row time {
  color: #a19c8d;
  font-size: 9px;
  white-space: nowrap;
}

.history-content p {
  margin: 8px 0 5px;
  color: #898676;
  font-size: 10px;
  line-height: 1.6;
}

.history-actor {
  color: #a19c8d;
  font-size: 9px;
}

/* STATES */

.state-container,
.section-state {
  min-height: 160px;
  padding: 30px 20px;
  color: #818565;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
}

.state-container p,
.section-state span {
  margin: 0;
  color: #969181;
  font-size: 11px;
}

.section-state strong {
  color: #555746;
  font-size: 12px;
}

.error-state h3 {
  margin: 0;
  color: #414337;
  font-size: 16px;
}

.primary-back {
  margin-top: 10px;
  background: #68764c;
  color: #fff;
  border-color: #68764c;
}

.primary-back:hover {
  background: #56643d;
}

.empty-products {
  border-top: 1px solid #f0ede5;
}

/* ANIMATION */

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* RESPONSIVE */

@media (max-width: 1000px) {
  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .refresh-button {
    align-self: flex-end;
  }

  .profile-card {
    padding: 16px;
  }

  .profile-main {
    align-items: flex-start;
    gap: 12px;
  }

  .store-avatar {
    width: 61px;
    height: 61px;
    border-radius: 14px;
    font-size: 19px;
  }

  .profile-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-title h2 {
    font-size: 17px;
  }

  .profile-footer {
    flex-direction: column;
    gap: 10px;
  }

  .statistics-grid {
    gap: 9px;
  }

  .stat-card {
    padding: 12px;
    gap: 9px;
  }

  .stat-icon {
    width: 34px;
    height: 34px;
  }

  .stat-card h2 {
    font-size: 21px;
  }

  .section-heading {
    padding: 16px;
  }

  .information-grid {
    padding: 3px 16px 18px;
    gap: 15px;
  }

  .product-toolbar {
    padding: 0 15px 14px;
    flex-direction: column;
  }

  .search-box,
  .status-filter {
    width: 100%;
    max-width: none;
    min-height: 40px;
  }

  .product-item {
    align-items: flex-start;
    padding: 13px 15px;
    gap: 10px;
  }

  .product-image {
    width: 57px;
    height: 57px;
  }

  .product-title-row {
    flex-direction: column;
  }

  .product-title-row .status-badge {
    align-self: flex-start;
  }

  .review-button {
    align-self: flex-start;
  }

  .history-list {
    padding: 4px 15px 15px;
  }

  .history-title-row {
    flex-direction: column;
    gap: 5px;
  }
}

@media (max-width: 390px) {
  .statistics-grid {
    grid-template-columns: 1fr 1fr;
  }

  .stat-card {
    flex-direction: column;
  }

  .information-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .product-meta {
    gap: 7px;
  }
}

/* SELLER VERIFICATION */

.verification-card {
  margin-bottom: 20px;
  padding: 19px 21px;
  border: 1px solid #ead9b9;
  border-radius: 14px;
  background: #fffaf0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.verification-information {
  display: flex;
  align-items: center;
  gap: 13px;
}

.verification-icon {
  width: 43px;
  height: 43px;
  border-radius: 12px;
  background: #fbefd9;
  color: #ad7b37;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.verification-information h3 {
  margin: 0 0 5px;
  color: #554832;
  font-size: 13px;
}

.verification-information p {
  max-width: 520px;
  margin: 0;
  color: #92836b;
  font-size: 11px;
  line-height: 1.6;
}

.verification-button {
  min-height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 9px;
  background: #68764c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.verification-button:hover {
  background: #56643d;
}

.verification-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.verification-status-card {
  margin-bottom: 20px;
  padding: 16px 19px;
  border: 1px solid;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.verification-status-card strong {
  font-size: 12px;
}

.verification-status-card p {
  margin: 5px 0 0;
  font-size: 11px;
  opacity: 0.8;
}

.verification-status-card.verified {
  border-color: #d6e6d4;
  background: #f0f6ed;
  color: #54805b;
}

.verification-status-card.rejected {
  border-color: #eed8d0;
  background: #fbefeb;
  color: #aa6856;
}

.verification-status-card.suspended {
  border-color: #e5dfd5;
  background: #f2f0e9;
  color: #81716b;
}

/* VERIFICATION MODAL */

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  padding: 20px;
  background: rgba(39, 39, 31, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
}

.verification-modal {
  width: 100%;
  max-width: 420px;
  padding: 26px;
  border-radius: 17px;
  background: #fffdf8;
  text-align: center;
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.16);
}

.modal-icon {
  width: 55px;
  height: 55px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: #e9f2e7;
  color: #54805b;
  display: flex;
  align-items: center;
  justify-content: center;
}

.verification-modal h3 {
  margin: 0 0 10px;
  color: #383b30;
  font-size: 17px;
}

.verification-modal > p {
  margin: 0;
  color: #898676;
  font-size: 12px;
  line-height: 1.7;
}

.verification-modal > p strong {
  color: #555746;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 23px;
}

.modal-actions button {
  min-height: 39px;
  padding: 0 14px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.modal-cancel {
  border: 1px solid #e5e0d4;
  background: white;
  color: #777663;
}

.modal-confirm {
  border: 1px solid #68764c;
  background: #68764c;
  color: white;
}

.modal-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 650px) {
  .verification-card {
    align-items: stretch;
    flex-direction: column;
  }

  .verification-button {
    width: 100%;
  }
}

/* SELLER ACCOUNT ACTIONS */

.verification-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.action-button {
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.2s;
}

.action-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.approve-action,
.reactivate-action {
  background: #68764c;
  color: #fff;
}

.approve-action:hover,
.reactivate-action:hover {
  background: #56643d;
}

.reject-action,
.suspend-action {
  border-color: #ead5ce;
  background: #fbefeb;
  color: #a45e4f;
}

.reject-action:hover,
.suspend-action:hover {
  background: #f5e3dc;
}

.warning-verification-icon {
  background: #f8e9df;
  color: #a66b48;
}

/* VERIFICATION STATUS */

.verification-status-content {
  flex: 1;
  min-width: 0;
}

/* SELLER HISTORY */

.seller-history-card {
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid #e9e4d8;
  border-radius: 15px;
  background: #fffdf8;
}

.seller-history-list {
  padding: 4px 22px 20px;
}

.seller-history-item {
  position: relative;
  display: flex;
  gap: 13px;
  padding: 13px 0;
}

.seller-history-item:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 43px;
  bottom: -13px;
  left: 16px;
  width: 1px;
  background: #e9e5d9;
}

.seller-history-marker {
  position: relative;
  z-index: 1;
  width: 33px;
  height: 33px;
  flex-shrink: 0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0eee6;
  color: #7b8060;
}

.seller-history-approved,
.seller-history-active {
  background: #e9f2e7;
  color: #54805b;
}

.seller-history-rejected {
  background: #f7e9e4;
  color: #aa6856;
}

.seller-history-suspended {
  background: #eeeae8;
  color: #81716b;
}

.seller-history-content {
  flex: 1;
  min-width: 0;
}

.seller-history-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.seller-history-title strong {
  color: #444638;
  font-size: 11px;
}

.seller-history-title time {
  color: #a19c8d;
  font-size: 9px;
  white-space: nowrap;
}

.seller-history-content p {
  margin: 8px 0 5px;
  color: #898676;
  font-size: 10px;
  line-height: 1.6;
}

.seller-history-content > span {
  color: #a19c8d;
  font-size: 9px;
}

/* MODAL NOTES */

.modal-note-field {
  margin-top: 20px;
  text-align: left;
}

.modal-note-field label {
  display: block;
  margin-bottom: 8px;
  color: #555746;
  font-size: 11px;
  font-weight: 700;
}

.modal-note-field textarea {
  width: 100%;
  min-height: 95px;
  padding: 11px;
  border: 1px solid #e5e0d4;
  border-radius: 9px;
  outline: none;
  resize: vertical;
  background: #fff;
  color: #383b30;
  font-family: inherit;
  font-size: 11px;
  line-height: 1.6;
  box-sizing: border-box;
}

.modal-note-field textarea:focus {
  border-color: #929b70;
  box-shadow: 0 0 0 3px rgba(111, 120, 78, 0.08);
}

.modal-note-field textarea:disabled {
  opacity: 0.6;
}

.modal-note-field > span {
  display: block;
  margin-top: 6px;
  color: #a19c8d;
  font-size: 9px;
}

.modal-icon.modal-warning {
  background: #f1eee4;
  color: #81716b;
}

.modal-icon.modal-danger {
  background: #f7e9e4;
  color: #aa6856;
}

.modal-confirm.confirm-danger {
  border-color: #a45e4f;
  background: #a45e4f;
}

.modal-confirm.confirm-danger:hover {
  background: #914e40;
}

.modal-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* RESPONSIVE */

@media (max-width: 650px) {
  .verification-actions {
    width: 100%;
  }

  .verification-actions .action-button {
    flex: 1;
  }

  .verification-status-card {
    flex-wrap: wrap;
  }

  .verification-status-card .action-button {
    width: 100%;
  }

  .seller-history-list {
    padding: 4px 15px 15px;
  }

  .seller-history-title {
    flex-direction: column;
    gap: 5px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}
</style>
