<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  ClipboardList,
  Clock,
  Truck,
  CheckCircle2,
  Search,
  RefreshCw,
  Eye,
  X,
  Package,
  MapPin,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CreditCard,
  FileText,
  User,
  Phone,
  Hash,
  ShoppingBag,
  AlertCircle,
  Check,
} from "lucide-vue-next";

import { supabase } from "@/services/supabase.js";

// ==========================================
// 1. REACTIVE STATE & CONFIGURATION
// ==========================================

const orders = ref([]);
const loading = ref(false);
const isRefreshing = ref(false);
const errorMessage = ref("");

const searchQuery = ref("");
const selectedStatus = ref("all");
const sortOrder = ref("newest");

const currentPage = ref(1);
const itemsPerPage = 10;

const selectedOrder = ref(null);
const showDetailModal = ref(false);

const toast = ref({
  show: false,
  message: "",
  type: "success",
});

let toastTimer = null;

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "awaiting_shipping_cost", label: "Menunggu Ongkir" },
  { value: "waiting_payment", label: "Menunggu Pembayaran" },
  { value: "payment_review", label: "Verifikasi Pembayaran" },
  { value: "paid", label: "Sudah Dibayar" },
  { value: "processing", label: "Diproses" },
  { value: "shipped", label: "Dikirim" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
  { value: "highest", label: "Total Tertinggi" },
  { value: "lowest", label: "Total Terendah" },
];

// ==========================================
// 2. TOAST NOTIFICATION HELPERS
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
// 3. DATA FETCHING FROM SUPABASE
// ==========================================

async function fetchOrders(options = {}) {
  const { silent = false } = options;

  if (silent) {
    isRefreshing.value = true;
  } else {
    loading.value = true;
  }

  errorMessage.value = "";

  try {
    const { data, error } = await supabase
      .from("seller_orders")
      .select(
        `
        id,
        order_id,
        seller_id,
        seller_order_number,
        status,
        subtotal,
        shipping_cost,
        discount_amount,
        total_amount,
        seller_note,
        internal_tracking_number,
        courier_name,
        courier_service,
        courier_tracking_number,
        shipped_at,
        delivered_at,
        shipping_cost_confirmed_at,
        shipping_cost_note,
        created_at,
        updated_at,

        orders!seller_orders_order_id_fkey (
          id,
          order_number,
          buyer_id,
          status,
          recipient_name,
          recipient_phone,
          shipping_province,
          shipping_city,
          shipping_district,
          shipping_postal_code,
          shipping_address_line,
          shipping_address_notes,
          subtotal,
          shipping_cost,
          grand_total,
          buyer_note,
          created_at
        ),

        order_items!order_items_seller_order_id_fkey (
          id,
          product_id,
          product_name,
          product_slug,
          product_category,
          product_image_url,
          unit_price,
          quantity,
          weight_grams,
          subtotal
        ),

        payments (
          id,
          seller_order_id,
          seller_payment_method_id,
          payment_method_type,
          payment_method_snapshot,
          amount,
          status,
          rejection_note,
          paid_at,
          verified_at,
          created_at
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const normalizedOrders = (data || []).map((order) => {
      const paymentRelation = order.payments;
      const payment = Array.isArray(paymentRelation)
        ? paymentRelation[0] || null
        : paymentRelation || null;

      const parentOrder = Array.isArray(order.orders)
        ? order.orders[0] || null
        : order.orders || null;

      return {
        ...order,
        orders: parentOrder,
        order_items: Array.isArray(order.order_items) ? order.order_items : [],
        payment,
      };
    });

    orders.value = normalizedOrders;
  } catch (error) {
    console.error("Gagal mengambil data pesanan admin:", error);
    errorMessage.value =
      error?.message ||
      "Gagal memuat data pesanan. Periksa hak akses RLS admin pada tabel pesanan.";
    showToast(errorMessage.value, "error");
  } finally {
    loading.value = false;
    isRefreshing.value = false;
  }
}

function handleManualRefresh() {
  fetchOrders({ silent: orders.value.length > 0 });
}

function handleKeydown(event) {
  if (event.key === "Escape" && showDetailModal.value) {
    closeDetailModal();
  }
}

onMounted(() => {
  fetchOrders();
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);

  if (toastTimer) {
    clearTimeout(toastTimer);
  }
});

// ==========================================
// 4. SUMMARY STATISTICS & FILTERING
// ==========================================

const summaryStats = computed(() => {
  const list = orders.value;

  const total = list.length;

  const waitingAction = list.filter((order) =>
    ["awaiting_shipping_cost", "waiting_payment", "payment_review"].includes(
      order.status,
    ),
  ).length;

  const inProgress = list.filter((order) =>
    ["paid", "processing", "shipped"].includes(order.status),
  ).length;

  const completedOrCancelled = list.filter((order) =>
    ["completed", "cancelled"].includes(order.status),
  ).length;

  return {
    total,
    waitingAction,
    inProgress,
    completedOrCancelled,
  };
});

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() !== "" ||
    selectedStatus.value !== "all" ||
    sortOrder.value !== "newest"
  );
});

const filteredOrders = computed(() => {
  let result = [...orders.value];

  if (selectedStatus.value !== "all") {
    result = result.filter((order) => order.status === selectedStatus.value);
  }

  const keyword = searchQuery.value.trim().toLowerCase();

  if (keyword) {
    result = result.filter((order) => {
      const sellerOrderNo = order.seller_order_number || "";
      const parentOrderNo = order.orders?.order_number || "";
      const recipientName = order.orders?.recipient_name || "";
      const recipientPhone = order.orders?.recipient_phone || "";
      const shippingCity = order.orders?.shipping_city || "";
      const courierName = order.courier_name || "";
      const trackingNumber = order.courier_tracking_number || "";
      const productNames = (order.order_items || [])
        .map((item) => item.product_name || "")
        .join(" ");

      return [
        sellerOrderNo,
        parentOrderNo,
        recipientName,
        recipientPhone,
        shippingCity,
        courierName,
        trackingNumber,
        productNames,
      ].some((field) => String(field).toLowerCase().includes(keyword));
    });
  }

  result.sort((a, b) => {
    if (sortOrder.value === "oldest") {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    }

    if (sortOrder.value === "highest") {
      return Number(b.total_amount || 0) - Number(a.total_amount || 0);
    }

    if (sortOrder.value === "lowest") {
      return Number(a.total_amount || 0) - Number(b.total_amount || 0);
    }

    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  return result;
});

// ==========================================
// 5. PAGINATION LOGIC
// ==========================================

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredOrders.value.length / itemsPerPage));
});

const paginatedOrders = computed(() => {
  const safePage = Math.min(currentPage.value, totalPages.value);
  const start = (safePage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredOrders.value.slice(start, end);
});

const paginationStart = computed(() => {
  if (filteredOrders.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage + 1;
});

const paginationEnd = computed(() => {
  return Math.min(currentPage.value * itemsPerPage, filteredOrders.value.length);
});

const visiblePageNumbers = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i += 1) {
      pages.push(i);
    }
    return pages;
  }

  const start = Math.max(1, current - 1);
  const end = Math.min(total, current + 1);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push("...");
  }

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  if (end < total) {
    if (end < total - 1) pages.push("...");
    pages.push(total);
  }

  return pages;
});

watch([searchQuery, selectedStatus, sortOrder], () => {
  currentPage.value = 1;
});

watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) {
    currentPage.value = newTotal;
  }
});

function resetFilters() {
  searchQuery.value = "";
  selectedStatus.value = "all";
  sortOrder.value = "newest";
  currentPage.value = 1;
}

function goToPage(page) {
  if (typeof page !== "number") return;
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

// ==========================================
// 6. DETAIL MODAL ACTIONS
// ==========================================

function openDetailModal(order) {
  selectedOrder.value = order;
  showDetailModal.value = true;
}

function closeDetailModal() {
  showDetailModal.value = false;
  selectedOrder.value = null;
}

// ==========================================
// 7. FORMATTERS & STATUS MAPPERS
// ==========================================

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

function getStatusLabel(status) {
  const labels = {
    awaiting_shipping_cost: "Menunggu Ongkir",
    waiting_payment: "Menunggu Pembayaran",
    payment_review: "Verifikasi Pembayaran",
    paid: "Sudah Dibayar",
    processing: "Diproses",
    shipped: "Dikirim",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  return labels[status] || status || "Tidak diketahui";
}

function getStatusClass(status) {
  if (status === "awaiting_shipping_cost") return "badge-warning";
  if (status === "waiting_payment") return "badge-info";
  if (status === "payment_review") return "badge-purple";
  if (status === "paid" || status === "completed") return "badge-success";
  if (status === "processing" || status === "shipped") return "badge-blue";
  if (status === "cancelled") return "badge-danger";

  return "badge-neutral";
}

function getPaymentStatusLabel(status) {
  const labels = {
    pending: "Menunggu Pembayaran",
    proof_submitted: "Menunggu Verifikasi",
    verified: "Terverifikasi",
    rejected: "Ditolak",
  };

  return labels[status] || status || "-";
}

function getTotalItemsCount(order) {
  return (order?.order_items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
}

function getTotalWeightGrams(order) {
  return (order?.order_items || []).reduce(
    (sum, item) =>
      sum + Number(item.weight_grams || 0) * Number(item.quantity || 1),
    0,
  );
}

function formatShippingAddress(parentOrder) {
  if (!parentOrder) return "-";

  const parts = [
    parentOrder.shipping_address_line,
    parentOrder.shipping_district,
    parentOrder.shipping_city,
    parentOrder.shipping_province,
    parentOrder.shipping_postal_code,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : "-";
}
</script>

<template>
  <div class="order-management-page">
    <!-- PAGE HEADER -->
    <header class="page-header">
      <div class="header-copy">
        <span class="eyebrow">MARKETPLACE TRANSACTIONS</span>
        <h1>Manajemen Pesanan</h1>
        <p>
          Pantau seluruh transaksi pesanan, status pembayaran, dan pengiriman di KriyaLoka.
        </p>
      </div>

      <div class="header-actions">
        <button
          type="button"
          class="refresh-button"
          :disabled="loading || isRefreshing"
          @click="handleManualRefresh"
        >
          <RefreshCw
            :size="16"
            :class="{ spinning: loading || isRefreshing }"
          />
          <span>{{ isRefreshing ? "Menyegarkan..." : "Refresh" }}</span>
        </button>
      </div>
    </header>

    <!-- SUMMARY CARDS -->
    <section class="summary-grid" aria-label="Ringkasan status pesanan">
      <article class="summary-card">
        <div class="summary-icon icon-brown" aria-hidden="true">
          <ClipboardList :size="20" :stroke-width="2" />
        </div>
        <div class="summary-content">
          <span class="summary-label">Total Pesanan</span>
          <strong class="summary-value">{{ summaryStats.total }}</strong>
          <small class="summary-hint">Seluruh subpesanan toko</small>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon icon-orange" aria-hidden="true">
          <Clock :size="20" :stroke-width="2" />
        </div>
        <div class="summary-content">
          <span class="summary-label">Menunggu & Verifikasi</span>
          <strong class="summary-value">{{ summaryStats.waitingAction }}</strong>
          <small class="summary-hint">Ongkir, bayar, atau verifikasi</small>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon icon-blue" aria-hidden="true">
          <Truck :size="20" :stroke-width="2" />
        </div>
        <div class="summary-content">
          <span class="summary-label">Diproses & Dikirim</span>
          <strong class="summary-value">{{ summaryStats.inProgress }}</strong>
          <small class="summary-hint">Sedang berjalan ke pembeli</small>
        </div>
      </article>

      <article class="summary-card">
        <div class="summary-icon icon-green" aria-hidden="true">
          <CheckCircle2 :size="20" :stroke-width="2" />
        </div>
        <div class="summary-content">
          <span class="summary-label">Selesai / Dibatalkan</span>
          <strong class="summary-value">{{
            summaryStats.completedOrCancelled
          }}</strong>
          <small class="summary-hint">Transaksi berakhir</small>
        </div>
      </article>
    </section>

    <!-- TABLE SECTION -->
    <section class="table-section" aria-label="Daftar pesanan">
      <div class="section-top">
        <div>
          <h2>Daftar Pesanan</h2>
          <p>
            Klik tombol Detail untuk melihat rincian produk, alamat, dan pembayaran.
          </p>
        </div>

        <span class="count-pill">{{ filteredOrders.length }} pesanan</span>
      </div>

      <!-- FILTER TOOLBAR -->
      <div class="filter-toolbar">
        <div class="search-box">
          <Search :size="17" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nomor pesanan, penerima, kota, atau produk..."
          />
          <button
            v-if="searchQuery"
            type="button"
            class="clear-btn"
            aria-label="Hapus pencarian"
            @click="searchQuery = ''"
          >
            <X :size="14" />
          </button>
        </div>

        <select
          v-model="selectedStatus"
          class="status-select"
          aria-label="Filter status pesanan"
        >
          <option
            v-for="option in statusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <select
          v-model="sortOrder"
          class="status-select"
          aria-label="Urutkan pesanan"
        >
          <option
            v-for="option in sortOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="reset-button"
          @click="resetFilters"
        >
          <RotateCcw :size="15" />
          <span>Reset</span>
        </button>
      </div>

      <!-- LOADING STATE -->
      <div v-if="loading && orders.length === 0" class="state-box">
        <RefreshCw :size="26" class="spinning" />
        <h3>Memuat Data Pesanan</h3>
        <p>Mohon tunggu sebentar, sedang mengambil data transaksi...</p>
      </div>

      <!-- ERROR STATE -->
      <div v-else-if="errorMessage && orders.length === 0" class="state-box">
        <AlertCircle :size="26" class="error-icon" />
        <h3>Gagal Memuat Pesanan</h3>
        <p>{{ errorMessage }}</p>
        <button type="button" class="retry-button" @click="fetchOrders()">
          <RefreshCw :size="15" />
          <span>Coba Lagi</span>
        </button>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="filteredOrders.length === 0" class="state-box">
        <ShoppingBag :size="26" />
        <h3>
          {{
            hasActiveFilters ? "Pesanan Tidak Ditemukan" : "Belum Ada Pesanan"
          }}
        </h3>
        <p>
          {{
            hasActiveFilters
              ? "Tidak ada pesanan yang cocok dengan kata kunci atau filter saat ini."
              : "Data transaksi pesanan akan tampil di sini setelah ada pesanan masuk."
          }}
        </p>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="reset-button"
          @click="resetFilters"
        >
          <RotateCcw :size="15" />
          <span>Reset Filter</span>
        </button>
      </div>

      <!-- DATA TABLE -->
      <template v-else>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>PESANAN</th>
                <th>PENERIMA</th>
                <th>PRODUK</th>
                <th>TOTAL</th>
                <th>STATUS</th>
                <th>TANGGAL</th>
                <th class="text-right">AKSI</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="order in paginatedOrders" :key="order.id">
                <td>
                  <div class="order-code">
                    <strong>{{ order.seller_order_number || order.id }}</strong>
                    <small v-if="order.orders?.order_number">
                      Induk: {{ order.orders.order_number }}
                    </small>
                  </div>
                </td>

                <td>
                  <div class="recipient-cell">
                    <strong>{{ order.orders?.recipient_name || "-" }}</strong>
                    <small>
                      {{
                        [
                          order.orders?.shipping_city,
                          order.orders?.shipping_province,
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"
                      }}
                    </small>
                  </div>
                </td>

                <td>
                  <div class="product-cell">
                    <img
                      v-if="order.order_items?.[0]?.product_image_url"
                      :src="order.order_items[0].product_image_url"
                      :alt="order.order_items[0].product_name"
                      class="thumb-img"
                    />
                    <div v-else class="thumb-placeholder">
                      <Package :size="16" />
                    </div>
                    <div class="product-meta">
                      <strong>
                        {{ order.order_items?.[0]?.product_name || "Produk" }}
                      </strong>
                      <small>
                        {{ getTotalItemsCount(order) }} item
                        <template v-if="order.order_items?.length > 1">
                          · +{{ order.order_items.length - 1 }} produk lain
                        </template>
                      </small>
                    </div>
                  </div>
                </td>

                <td>
                  <strong class="amount-text">
                    {{ formatCurrency(order.total_amount) }}
                  </strong>
                </td>

                <td>
                  <span class="status-badge" :class="getStatusClass(order.status)">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </td>

                <td>
                  <span class="date-cell">
                    <CalendarDays :size="13" />
                    {{ formatDate(order.created_at) }}
                  </span>
                </td>

                <td class="text-right">
                  <button
                    type="button"
                    class="detail-button"
                    @click="openDetailModal(order)"
                  >
                    <Eye :size="15" />
                    <span>Detail</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION FOOTER -->
        <div class="pagination">
          <span>
            Menampilkan <strong>{{ paginationStart }}–{{ paginationEnd }}</strong>
            dari <strong>{{ filteredOrders.length }}</strong> pesanan
          </span>

          <div class="pagination-controls">
            <button
              type="button"
              :disabled="currentPage === 1"
              aria-label="Halaman sebelumnya"
              @click="goToPage(currentPage - 1)"
            >
              <ChevronLeft :size="16" />
            </button>

            <template v-for="(page, idx) in visiblePageNumbers" :key="`${page}-${idx}`">
              <span v-if="page === '...'" class="page-ellipsis">...</span>
              <button
                v-else
                type="button"
                class="page-num-btn"
                :class="{ active: page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
            </template>

            <button
              type="button"
              :disabled="currentPage === totalPages"
              aria-label="Halaman berikutnya"
              @click="goToPage(currentPage + 1)"
            >
              <ChevronRight :size="16" />
            </button>
          </div>
        </div>
      </template>
    </section>

    <!-- DETAIL MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDetailModal && selectedOrder"
          class="modal-backdrop"
          @click.self="closeDetailModal"
        >
          <div
            class="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-modal-title"
          >
            <div class="modal-header">
              <div>
                <span class="eyebrow">DETAIL TRANSAKSI</span>
                <h3 id="detail-modal-title">
                  {{ selectedOrder.seller_order_number || selectedOrder.id }}
                </h3>
                <small v-if="selectedOrder.orders?.order_number" class="sub-code">
                  Pesanan Induk: {{ selectedOrder.orders.order_number }}
                </small>
              </div>

              <button
                type="button"
                class="close-button"
                aria-label="Tutup modal"
                @click="closeDetailModal"
              >
                <X :size="18" />
              </button>
            </div>

            <div class="modal-body">
              <div class="modal-meta">
                <span
                  class="status-badge"
                  :class="getStatusClass(selectedOrder.status)"
                >
                  {{ getStatusLabel(selectedOrder.status) }}
                </span>
                <small>{{ formatDateTime(selectedOrder.created_at) }}</small>
              </div>

              <!-- ORDER ITEMS -->
              <div class="modal-section">
                <h4>
                  <Package :size="15" />
                  <span>Item Pesanan ({{ getTotalItemsCount(selectedOrder) }} item)</span>
                </h4>

                <div class="item-list">
                  <div
                    v-for="item in selectedOrder.order_items"
                    :key="item.id"
                    class="item-row"
                  >
                    <img
                      v-if="item.product_image_url"
                      :src="item.product_image_url"
                      :alt="item.product_name"
                      class="thumb-img"
                    />
                    <div v-else class="thumb-placeholder">
                      <Package :size="16" />
                    </div>

                    <div class="item-info">
                      <strong>{{ item.product_name }}</strong>
                      <small>
                        {{ item.quantity }} × {{ formatCurrency(item.unit_price) }}
                        <template v-if="item.product_category">
                          · {{ item.product_category }}
                        </template>
                      </small>
                    </div>

                    <strong>{{ formatCurrency(item.subtotal) }}</strong>
                  </div>

                  <div v-if="getTotalWeightGrams(selectedOrder) > 0" class="weight-note">
                    Estimasi berat total: {{ getTotalWeightGrams(selectedOrder) }} gram
                  </div>
                </div>
              </div>

              <!-- RECIPIENT & SHIPPING ADDRESS -->
              <div class="modal-section">
                <h4>
                  <MapPin :size="15" />
                  <span>Alamat Penerima</span>
                </h4>

                <div class="info-box">
                  <div class="recipient-line">
                    <User :size="13" />
                    <strong>{{ selectedOrder.orders?.recipient_name || "-" }}</strong>
                  </div>
                  <div class="recipient-line">
                    <Phone :size="13" />
                    <span>{{ selectedOrder.orders?.recipient_phone || "-" }}</span>
                  </div>
                  <p>{{ formatShippingAddress(selectedOrder.orders) }}</p>
                  <small v-if="selectedOrder.orders?.shipping_address_notes">
                    Patokan: {{ selectedOrder.orders.shipping_address_notes }}
                  </small>
                </div>
              </div>

              <!-- COST SUMMARY -->
              <div class="modal-section">
                <h4>
                  <Hash :size="15" />
                  <span>Rincian Biaya</span>
                </h4>

                <div class="summary-box">
                  <div>
                    <span>Subtotal Produk</span>
                    <strong>{{ formatCurrency(selectedOrder.subtotal) }}</strong>
                  </div>
                  <div>
                    <span>Ongkos Kirim</span>
                    <strong>
                      {{
                        selectedOrder.shipping_cost_confirmed_at ||
                        Number(selectedOrder.shipping_cost) > 0
                          ? formatCurrency(selectedOrder.shipping_cost)
                          : "Belum ditentukan"
                      }}
                    </strong>
                  </div>
                  <div>
                    <span>Diskon</span>
                    <strong>{{ formatCurrency(selectedOrder.discount_amount) }}</strong>
                  </div>
                  <div class="total-row">
                    <span>Total Pesanan</span>
                    <strong>{{ formatCurrency(selectedOrder.total_amount) }}</strong>
                  </div>
                </div>
              </div>

              <!-- PAYMENT INFORMATION -->
              <div v-if="selectedOrder.payment" class="modal-section">
                <h4>
                  <CreditCard :size="15" />
                  <span>Informasi Pembayaran</span>
                </h4>

                <div class="info-box">
                  <div class="inline-pair">
                    <span>Metode</span>
                    <strong>
                      {{
                        selectedOrder.payment.payment_method_snapshot
                          ?.display_name ||
                        selectedOrder.payment.payment_method_type ||
                        "-"
                      }}
                    </strong>
                  </div>
                  <div class="inline-pair">
                    <span>Status Pembayaran</span>
                    <strong>
                      {{ getPaymentStatusLabel(selectedOrder.payment.status) }}
                    </strong>
                  </div>
                  <div class="inline-pair">
                    <span>Nominal</span>
                    <strong>{{ formatCurrency(selectedOrder.payment.amount) }}</strong>
                  </div>
                  <div v-if="selectedOrder.payment.paid_at" class="inline-pair">
                    <span>Waktu Bayar</span>
                    <strong>{{ formatDateTime(selectedOrder.payment.paid_at) }}</strong>
                  </div>
                  <div v-if="selectedOrder.payment.verified_at" class="inline-pair">
                    <span>Waktu Verifikasi</span>
                    <strong>
                      {{ formatDateTime(selectedOrder.payment.verified_at) }}
                    </strong>
                  </div>
                  <p v-if="selectedOrder.payment.rejection_note" class="rejection-text">
                    Catatan Penolakan: {{ selectedOrder.payment.rejection_note }}
                  </p>
                </div>
              </div>

              <!-- SHIPPING & TRACKING INFORMATION -->
              <div
                v-if="
                  selectedOrder.courier_name ||
                  selectedOrder.courier_tracking_number ||
                  selectedOrder.internal_tracking_number ||
                  selectedOrder.shipped_at ||
                  selectedOrder.delivered_at
                "
                class="modal-section"
              >
                <h4>
                  <Truck :size="15" />
                  <span>Informasi Pengiriman</span>
                </h4>

                <div class="info-box">
                  <div v-if="selectedOrder.courier_name" class="inline-pair">
                    <span>Kurir</span>
                    <strong>
                      {{
                        [
                          selectedOrder.courier_name,
                          selectedOrder.courier_service,
                        ]
                          .filter(Boolean)
                          .join(" - ")
                      }}
                    </strong>
                  </div>
                  <div
                    v-if="selectedOrder.courier_tracking_number"
                    class="inline-pair"
                  >
                    <span>Nomor Resi</span>
                    <strong>{{ selectedOrder.courier_tracking_number }}</strong>
                  </div>
                  <div
                    v-if="selectedOrder.internal_tracking_number"
                    class="inline-pair"
                  >
                    <span>Kode Pelacakan Internal</span>
                    <strong>{{ selectedOrder.internal_tracking_number }}</strong>
                  </div>
                  <div v-if="selectedOrder.shipped_at" class="inline-pair">
                    <span>Tanggal Dikirim</span>
                    <strong>{{ formatDateTime(selectedOrder.shipped_at) }}</strong>
                  </div>
                  <div v-if="selectedOrder.delivered_at" class="inline-pair">
                    <span>Tanggal Diterima</span>
                    <strong>{{ formatDateTime(selectedOrder.delivered_at) }}</strong>
                  </div>
                </div>
              </div>

              <!-- ORDER NOTES -->
              <div
                v-if="
                  selectedOrder.orders?.buyer_note ||
                  selectedOrder.seller_note ||
                  selectedOrder.shipping_cost_note
                "
                class="modal-section"
              >
                <h4>
                  <FileText :size="15" />
                  <span>Catatan Transaksi</span>
                </h4>

                <div class="info-box">
                  <p v-if="selectedOrder.orders?.buyer_note">
                    <strong>Pembeli:</strong> {{ selectedOrder.orders.buyer_note }}
                  </p>
                  <p v-if="selectedOrder.seller_note">
                    <strong>Penjual:</strong> {{ selectedOrder.seller_note }}
                  </p>
                  <p v-if="selectedOrder.shipping_cost_note">
                    <strong>Catatan Ongkir:</strong>
                    {{ selectedOrder.shipping_cost_note }}
                  </p>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="close-modal-btn"
                @click="closeDetailModal"
              >
                <Check :size="15" />
                <span>Tutup</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- TOAST FEEDBACK -->
    <Transition name="toast">
      <div
        v-if="toast.show"
        class="toast-box"
        :class="`toast-${toast.type}`"
        role="status"
      >
        <span>{{ toast.message }}</span>
        <button type="button" aria-label="Tutup notifikasi" @click="closeToast">
          <X :size="15" />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ==========================================
   BASE CONTAINER & HEADER
   ========================================== */

.order-management-page {
  width: 100%;
  color: #352b25;
  font-family: "Plus Jakarta Sans", sans-serif;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.header-copy {
  min-width: 0;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 8px;
  color: #943c14;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 800;
  letter-spacing: -0.6px;
  color: #352b25;
}

.page-header p {
  margin: 6px 0 0;
  color: #8d8077;
  font-size: 13px;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.refresh-button,
.reset-button,
.retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 14px;
  border-radius: 9px;
  border: 1px solid #e6dcd1;
  background: #ffffff;
  color: #59473b;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.18s ease, color 0.18s ease, background 0.18s ease;
}

.refresh-button:hover:not(:disabled),
.reset-button:hover,
.retry-button:hover {
  border-color: #943c14;
  color: #943c14;
  background: #fcf9f6;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ==========================================
   SUMMARY CARDS & ICON ALIGNMENT FIX
   ========================================== */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 12px;
  border: 1px solid #ece4dc;
  background: #ffffff;
  min-width: 0;
}

.summary-icon {
  width: 44px;
  min-width: 44px;
  height: 44px;
  min-height: 44px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
  position: relative;
}

.summary-icon :deep(svg) {
  width: 20px;
  height: 20px;
  min-width: 20px;
  min-height: 20px;
  flex-shrink: 0;
  display: block;
  transform: none;
}

.icon-brown {
  background: #f5e9df;
  color: #943c14;
}

.icon-orange {
  background: #fff0dd;
  color: #bd7928;
}

.icon-blue {
  background: #e7f0fa;
  color: #2c649e;
}

.icon-green {
  background: #e7f1e9;
  color: #34734f;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.summary-label {
  font-size: 11px;
  font-weight: 600;
  color: #95877d;
}

.summary-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.2;
  color: #352b25;
}

.summary-hint {
  font-size: 10px;
  color: #a39890;
}

/* ==========================================
   TABLE SECTION & FILTER TOOLBAR
   ========================================== */

.table-section {
  background: #ffffff;
  border: 1px solid #ece4dc;
  border-radius: 12px;
  overflow: hidden;
}

.section-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 0;
}

.section-top h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #352b25;
}

.section-top p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #95877d;
}

.count-pill {
  padding: 6px 11px;
  border-radius: 20px;
  background: #faf6f2;
  border: 1px solid #ece4dc;
  font-size: 11px;
  font-weight: 700;
  color: #6b5b50;
  white-space: nowrap;
}

.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 22px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 13px;
  border-radius: 9px;
  border: 1px solid #ece4dc;
  background: #faf8f5;
  color: #95877d;
}

.search-box:focus-within {
  border-color: #943c14;
  background: #ffffff;
}

.search-icon {
  flex-shrink: 0;
}

.search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  color: #352b25;
}

.search-box input::placeholder {
  color: #a39890;
}

.clear-btn {
  border: 0;
  background: none;
  color: #95877d;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

.clear-btn:hover {
  color: #352b25;
}

.status-select {
  padding: 9px 12px;
  border-radius: 9px;
  border: 1px solid #ece4dc;
  background: #ffffff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #59473b;
  cursor: pointer;
}

.status-select:focus {
  outline: none;
  border-color: #943c14;
}

/* ==========================================
   DATA TABLE & CELLS
   ========================================== */

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
  padding: 12px 18px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.6px;
  color: #95877d;
  text-transform: uppercase;
}

td {
  padding: 14px 18px;
  border-top: 1px solid #f0ebe6;
  font-size: 12px;
  color: #6b5b50;
  vertical-align: middle;
}

tbody tr:hover td {
  background: #fcfaf8;
}

.text-right {
  text-align: right;
}

.order-code,
.recipient-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.order-code strong,
.recipient-cell strong,
.product-meta strong {
  color: #352b25;
  font-size: 12px;
  font-weight: 700;
}

.order-code small,
.recipient-cell small,
.product-meta small {
  color: #95877d;
  font-size: 11px;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.thumb-img,
.thumb-placeholder {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  flex-shrink: 0;
}

.thumb-img {
  object-fit: cover;
  border: 1px solid #ece4dc;
}

.thumb-placeholder {
  background: #f5efe9;
  color: #943c14;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.amount-text {
  color: #352b25;
  font-weight: 800;
}

.date-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #7d6f65;
  font-size: 11px;
}

/* ==========================================
   STATUS BADGES & ACTION BUTTONS
   ========================================== */

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
}

.badge-warning {
  background: #fff1dc;
  color: #a66a20;
}

.badge-info {
  background: #eef2ff;
  color: #4355a8;
}

.badge-purple {
  background: #f3e8ff;
  color: #7938b2;
}

.badge-success {
  background: #e7f3e9;
  color: #34764c;
}

.badge-blue {
  background: #e6f0fa;
  color: #2b639c;
}

.badge-danger {
  background: #fceae7;
  color: #bb5144;
}

.badge-neutral {
  background: #f1eeeb;
  color: #6b5b50;
}

.detail-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 11px;
  border-radius: 8px;
  border: 1px solid #e8ddd2;
  background: #ffffff;
  color: #943c14;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.detail-button:hover {
  background: #faf3ed;
  border-color: #d6c3b2;
}

/* ==========================================
   EMPTY / LOADING / ERROR STATES
   ========================================== */

.state-box {
  padding: 48px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #8d8077;
}

.state-box h3 {
  margin: 4px 0 0;
  font-size: 15px;
  font-weight: 800;
  color: #352b25;
}

.state-box p {
  margin: 0 0 8px;
  max-width: 420px;
  font-size: 12px;
  line-height: 1.5;
}

.error-icon {
  color: #bb5144;
}

/* ==========================================
   PAGINATION
   ========================================== */

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 22px;
  border-top: 1px solid #f0ebe6;
  font-size: 12px;
  color: #7d6f65;
  flex-wrap: wrap;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-controls button,
.page-num-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid #e6dcd1;
  background: #ffffff;
  color: #59473b;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.page-num-btn.active {
  background: #943c14;
  border-color: #943c14;
  color: #ffffff;
}

.pagination-controls button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.page-ellipsis {
  padding: 0 4px;
  color: #95877d;
}

/* ==========================================
   DETAIL MODAL
   ========================================== */

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(37, 28, 22, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  font-family: "Plus Jakarta Sans", sans-serif;
}

.modal-card {
  width: min(640px, 100%);
  max-height: 88vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #ece4dc;
  color: #352b25;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid #eee8e2;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.sub-code {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: #8d8077;
}

.close-button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 0;
  background: #f5f1ed;
  color: #59473b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.close-button:hover {
  background: #ebe4dd;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.modal-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.modal-meta small {
  color: #8d8077;
  font-size: 12px;
}

.modal-section h4 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #352b25;
}

.item-list,
.info-box,
.summary-box {
  border: 1px solid #eee8e2;
  border-radius: 10px;
  background: #faf8f5;
  padding: 12px 14px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-info strong {
  font-size: 12px;
  color: #352b25;
}

.item-info small {
  font-size: 11px;
  color: #8d8077;
}

.weight-note {
  padding-top: 8px;
  border-top: 1px dashed #e5ddd4;
  font-size: 11px;
  color: #7d6f65;
}

.recipient-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #352b25;
  margin-bottom: 4px;
}

.info-box p {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #59473b;
}

.info-box small {
  display: block;
  color: #8d8077;
  font-size: 11px;
  margin-top: 4px;
}

.rejection-text {
  color: #bb5144 !important;
  font-weight: 600;
}

.inline-pair {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  font-size: 12px;
}

.inline-pair span {
  color: #8d8077;
}

.inline-pair strong {
  color: #352b25;
  text-align: right;
}

.summary-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-box > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.summary-box > div span {
  color: #8d8077;
}

.total-row {
  padding-top: 8px;
  border-top: 1px solid #e6ddd2;
  font-size: 13px;
  font-weight: 800;
  color: #352b25;
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid #eee8e2;
  display: flex;
  justify-content: flex-end;
}

.close-modal-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 9px;
  border: 0;
  background: #943c14;
  color: #ffffff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.close-modal-btn:hover {
  background: #7c310f;
}

/* ==========================================
   TOAST & ANIMATIONS
   ========================================== */

.toast-box {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 120;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  border-radius: 10px;
  background: #352b25;
  color: #ffffff;
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
}

.toast-error {
  background: #a83c30;
}

.toast-box button {
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-enter-active,
.modal-leave-active,
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.18s ease;
}

.modal-enter-from,
.modal-leave-to,
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}

/* ==========================================
   RESPONSIVE BREAKPOINTS
   ========================================== */

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>