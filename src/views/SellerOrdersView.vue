<script setup>
import { ref, computed, onMounted } from "vue";
import {
  ClipboardList,
  Package,
  MapPin,
  Truck,
  Search,
  RefreshCw,
  Eye,
  X,
  LoaderCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShoppingBag,
  CalendarDays,
  Bell,
} from "lucide-vue-next";

import { supabase } from "@/services/supabase.js";
import ShippingProgress from "@/components/shipping/ShippingProgress.vue";

const orders = ref([]);
const loading = ref(true);
const savingShipping = ref(false);

const searchQuery = ref("");
const selectedStatus = ref("all");

const selectedOrder = ref(null);
const showDetail = ref(false);
const showShippingForm = ref(false);

const loadingPaymentProof = ref(false);
const paymentProofImageUrl = ref("");
const showPaymentProofImage = ref(false);

const savingPaymentReview = ref(false);
const showRejectPaymentModal = ref(false);
const rejectionNote = ref("");

const showApprovePaymentModal = ref(false);

const savingProcessing = ref(false);
const showStartProcessingModal = ref(false);

// SHIPPING ORDER
const savingShipment = ref(false);
const showShipOrderModal = ref(false);
const showConfirmShipModal = ref(false);

const shipmentForm = ref({
  courier_name: "",
  courier_service: "",
  courier_tracking_number: "",
});

const shippingForm = ref({
  shipping_cost: "",
  shipping_cost_note: "",
});

const toast = ref({
  show: false,
  message: "",
  type: "success",
});

let toastTimer = null;

const statusOptions = [
  { value: "all", label: "Semua Pesanan" },
  { value: "awaiting_shipping_cost", label: "Menunggu Ongkir" },
  { value: "waiting_payment", label: "Menunggu Pembayaran" },
  { value: "payment_review", label: "Menunggu Verifikasi" },
  { value: "paid", label: "Sudah Dibayar" },
  { value: "processing", label: "Diproses" },
  { value: "shipped", label: "Dikirim" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const filteredOrders = computed(() => {
  let result = [...orders.value];

  if (selectedStatus.value !== "all") {
    result = result.filter((order) => order.status === selectedStatus.value);
  }

  const keyword = searchQuery.value.trim().toLowerCase();

  if (keyword) {
    result = result.filter((order) => {
      const orderNumber = order.seller_order_number || "";
      const parentNumber = order.orders?.order_number || "";

      return (
        orderNumber.toLowerCase().includes(keyword) ||
        parentNumber.toLowerCase().includes(keyword)
      );
    });
  }

  return result;
});

const totalOrders = computed(() => orders.value.length);

const awaitingShippingCount = computed(
  () =>
    orders.value.filter((order) => order.status === "awaiting_shipping_cost")
      .length,
);

const processingCount = computed(
  () =>
    orders.value.filter((order) =>
      ["paid", "processing"].includes(order.status),
    ).length,
);

const completedCount = computed(
  () => orders.value.filter((order) => order.status === "completed").length,
);

function showToast(message, type = "success") {
  toast.value = {
    show: true,
    message,
    type,
  };

  if (toastTimer) clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.value.show = false;
  }, 3500);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

  return labels[status] || status;
}

function getStatusClass(status) {
  if (status === "awaiting_shipping_cost") return "warning";
  if (status === "waiting_payment") return "info";
  if (status === "payment_review") return "purple";
  if (status === "paid" || status === "completed") return "success";
  if (status === "processing" || status === "shipped") return "blue";
  if (status === "cancelled") return "danger";

  return "neutral";
}

// ======================================================
// FETCH SELLER ORDERS
// ======================================================

async function fetchOrders() {
  loading.value = true;

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;

    const seller = authData.user;

    if (!seller) {
      throw new Error("Sesi login tidak ditemukan.");
    }

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
  created_at,

  payment_proofs (
    id,
    image_path,
    transfer_amount,
    transfer_date,
    sender_name,
    sender_bank,
    buyer_note,
    verification_status,
    verification_note,
    created_at,
    reviewed_at
  )
)

  `,
      )
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    orders.value = (data || []).map((order) => {
      const paymentRelation = order.payments;

      const payment = Array.isArray(paymentRelation)
        ? paymentRelation[0] || null
        : paymentRelation || null;

      return {
        ...order,
        order_items: order.order_items || [],
        payment: payment
          ? {
              ...payment,
              payment_proofs: payment.payment_proofs || [],
            }
          : null,
      };
    });
  } catch (error) {
    console.error("Gagal mengambil pesanan:", error);

    showToast(error.message || "Gagal memuat pesanan.", "error");
  } finally {
    loading.value = false;
  }
}

// ======================================================
// ORDER DETAIL
// ======================================================

function openDetail(order) {
  selectedOrder.value = order;
  showDetail.value = true;
}

function closeDetail() {
  showDetail.value = false;
  selectedOrder.value = null;
}

async function viewPaymentProof(proof) {
  if (!proof?.image_path) {
    showToast("Lokasi bukti pembayaran tidak ditemukan.", "error");
    return;
  }

  loadingPaymentProof.value = true;

  try {
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(proof.image_path, 300);

    if (error) throw error;

    paymentProofImageUrl.value = data.signedUrl;
    showPaymentProofImage.value = true;
  } catch (error) {
    console.error("Gagal membuka bukti pembayaran:", error);

    showToast(error.message || "Gagal membuka bukti pembayaran.", "error");
  } finally {
    loadingPaymentProof.value = false;
  }
}

function closePaymentProofImage() {
  showPaymentProofImage.value = false;
  paymentProofImageUrl.value = "";
}

function openRejectPaymentModal() {
  rejectionNote.value = "";
  showRejectPaymentModal.value = true;
}

function openApprovePaymentModal() {
  showApprovePaymentModal.value = true;
}

function closeApprovePaymentModal() {
  if (savingPaymentReview.value) return;

  showApprovePaymentModal.value = false;
}

function openStartProcessingModal() {
  if (!selectedOrder.value || selectedOrder.value.status !== "paid") {
    showToast("Pesanan tidak dapat mulai diproses.", "error");
    return;
  }

  showStartProcessingModal.value = true;
}

function closeStartProcessingModal() {
  if (savingProcessing.value) return;

  showStartProcessingModal.value = false;
}

async function submitStartProcessing() {
  if (savingProcessing.value || !selectedOrder.value) return;

  if (selectedOrder.value.status !== "paid") {
    showToast("Status pesanan tidak valid untuk diproses.", "error");
    return;
  }

  savingProcessing.value = true;

  try {
    const { data, error } = await supabase.rpc(
      "start_seller_order_processing",
      {
        p_seller_order_id: selectedOrder.value.id,
      },
    );

    if (error) throw error;

    if (data && data.success === false) {
      throw new Error(data.message || "Gagal memulai proses pesanan.");
    }

    showStartProcessingModal.value = false;
    showDetail.value = false;
    selectedOrder.value = null;

    await fetchOrders();

    showToast(
      "Pesanan berhasil mulai diproses. Pembeli akan menerima notifikasi.",
    );
  } catch (error) {
    console.error("Gagal memulai proses pesanan:", error);

    showToast(error.message || "Gagal memulai proses pesanan.", "error");
  } finally {
    savingProcessing.value = false;
  }
}

function closeRejectPaymentModal() {
  if (savingPaymentReview.value) return;

  showRejectPaymentModal.value = false;
  rejectionNote.value = "";
}

function getLatestPaymentProof(order) {
  const proofs = order?.payment?.payment_proofs || [];

  if (!proofs.length) return null;

  return [...proofs].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )[0];
}

async function submitPaymentReview(decision) {
  if (savingPaymentReview.value || !selectedOrder.value) return;

  const proof = getLatestPaymentProof(selectedOrder.value);

  if (!proof?.id) {
    showToast("Bukti pembayaran tidak ditemukan.", "error");
    return;
  }

  if (!["approved", "rejected"].includes(decision)) {
    showToast("Keputusan pembayaran tidak valid.", "error");
    return;
  }

  const note = rejectionNote.value.trim();

  if (decision === "rejected" && !note) {
    showToast("Alasan penolakan wajib diisi.", "error");
    return;
  }

  savingPaymentReview.value = true;

  try {
    const { data, error } = await supabase.rpc("review_payment_proof", {
      p_payment_proof_id: proof.id,
      p_decision: decision,
      p_note: decision === "rejected" ? note : null,
    });

    if (error) throw error;

    if (data && data.success === false) {
      throw new Error(data.message || "Gagal memproses verifikasi pembayaran.");
    }

    showRejectPaymentModal.value = false;
    showDetail.value = false;
    showPaymentProofImage.value = false;
    showApprovePaymentModal.value = false;

    selectedOrder.value = null;
    rejectionNote.value = "";
    paymentProofImageUrl.value = "";

    await fetchOrders();

    showToast(
      decision === "approved"
        ? "Pembayaran berhasil disetujui. Pesanan telah diperbarui."
        : "Bukti pembayaran berhasil ditolak. Pembeli akan menerima notifikasi.",
    );
  } catch (error) {
    console.error("Gagal memproses verifikasi pembayaran:", error);

    showToast(
      error.message || "Gagal memproses verifikasi pembayaran.",
      "error",
    );
  } finally {
    savingPaymentReview.value = false;
  }
}

// ======================================================
// SHIPPING COST
// ======================================================

function openShippingForm(order) {
  selectedOrder.value = order;

  shippingForm.value = {
    shipping_cost: "",
    shipping_cost_note: "",
  };

  showShippingForm.value = true;
}

function closeShippingForm() {
  if (savingShipping.value) return;

  showShippingForm.value = false;
}

async function submitShippingCost() {
  if (savingShipping.value || !selectedOrder.value) return;

  const rawCost = String(shippingForm.value.shipping_cost).trim();

  if (!rawCost || !/^\d+$/.test(rawCost)) {
    showToast("Masukkan ongkos kirim berupa angka yang valid.", "error");
    return;
  }

  const cost = Number(rawCost);

  if (!Number.isSafeInteger(cost) || cost < 0) {
    showToast("Ongkos kirim tidak valid.", "error");
    return;
  }

  savingShipping.value = true;

  try {
    const { data, error } = await supabase.rpc(
      "set_seller_order_shipping_cost",
      {
        p_seller_order_id: selectedOrder.value.id,
        p_shipping_cost: cost,
        p_shipping_cost_note:
          shippingForm.value.shipping_cost_note.trim() || null,
      },
    );

    if (error) throw error;

    if (data && data.success === false) {
      throw new Error(data.message || "Gagal mengonfirmasi ongkos kirim.");
    }

    showShippingForm.value = false;
    showDetail.value = false;
    selectedOrder.value = null;

    await fetchOrders();

    showToast("Ongkos kirim berhasil dikonfirmasi. Status pesanan diperbarui.");
  } catch (error) {
    console.error("Gagal mengonfirmasi ongkir:", error);

    showToast(error.message || "Gagal menyimpan ongkos kirim.", "error");
  } finally {
    savingShipping.value = false;
  }
}

// ======================================================
// SHIP SELLER ORDER
// ======================================================

function openShipOrderModal() {
  if (!selectedOrder.value || selectedOrder.value.status !== "processing") {
    showToast("Pesanan belum siap untuk dikirim.", "error");
    return;
  }

  shipmentForm.value = {
    courier_name: "",
    courier_service: "",
    courier_tracking_number: "",
  };

  showShipOrderModal.value = true;
}

function closeShipOrderModal() {
  if (savingShipment.value) return;

  showShipOrderModal.value = false;
}

function continueToShipConfirmation() {
  if (!selectedOrder.value || selectedOrder.value.status !== "processing") {
    showToast("Status pesanan tidak valid untuk dikirim.", "error");
    return;
  }

  const courierName = shipmentForm.value.courier_name.trim();
  const courierService = shipmentForm.value.courier_service.trim();
  const trackingNumber = shipmentForm.value.courier_tracking_number.trim();

  if (!courierName || !courierService || !trackingNumber) {
    showToast("Semua informasi pengiriman wajib diisi.", "error");
    return;
  }

  showShipOrderModal.value = false;
  showConfirmShipModal.value = true;
}

function closeConfirmShipModal() {
  if (savingShipment.value) return;

  showConfirmShipModal.value = false;
}

async function submitShipOrder() {
  if (savingShipment.value || !selectedOrder.value) return;

  if (selectedOrder.value.status !== "processing") {
    showToast("Status pesanan tidak valid untuk dikirim.", "error");
    return;
  }

  const courierName = shipmentForm.value.courier_name.trim();
  const courierService = shipmentForm.value.courier_service.trim();
  const trackingNumber = shipmentForm.value.courier_tracking_number.trim();

  if (!courierName || !courierService || !trackingNumber) {
    showToast("Informasi pengiriman belum lengkap.", "error");
    return;
  }

  savingShipment.value = true;

  try {
    const { data, error } = await supabase.rpc("ship_seller_order", {
      p_seller_order_id: selectedOrder.value.id,
      p_courier_name: courierName,
      p_courier_service: courierService,
      p_courier_tracking_number: trackingNumber,
    });

    if (error) throw error;

    if (data && data.success === false) {
      throw new Error(data.message || "Gagal mengirim pesanan.");
    }

    showConfirmShipModal.value = false;
    showShipOrderModal.value = false;
    showDetail.value = false;
    selectedOrder.value = null;

    await fetchOrders();

    showToast("Pesanan berhasil dikirim. Pembeli akan menerima notifikasi.");
  } catch (error) {
    console.error("Gagal mengirim pesanan:", error);

    showToast(error.message || "Gagal memproses pengiriman pesanan.", "error");
  } finally {
    savingShipment.value = false;
  }
}

onMounted(fetchOrders);
</script>

<template>
  <div class="orders-page">
    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-message" :class="toast.type">
        <CheckCircle2 v-if="toast.type === 'success'" :size="18" />
        <AlertCircle v-else :size="18" />

        <span>{{ toast.message }}</span>

        <button @click="toast.show = false">
          <X :size="15" />
        </button>
      </div>
    </Transition>

    <!-- HEADER -->
    <div class="page-header">
      <div>
        <span class="eyebrow">SELLER CENTER</span>
        <h2>Pesanan Masuk</h2>
        <p>
          Kelola pesanan pembeli dan konfirmasi biaya pengiriman dari toko Anda.
        </p>
      </div>

      <button class="refresh-button" :disabled="loading" @click="fetchOrders">
        <RefreshCw :size="16" :class="{ spinning: loading }" />
        Muat Ulang
      </button>
    </div>

    <!-- SUMMARY -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon">
          <ClipboardList :size="20" />
        </div>
        <div>
          <span>Total Pesanan</span>
          <strong>{{ totalOrders }}</strong>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon orange">
          <Truck :size="20" />
        </div>
        <div>
          <span>Menunggu Ongkir</span>
          <strong>{{ awaitingShippingCount }}</strong>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon blue">
          <Package :size="20" />
        </div>
        <div>
          <span>Dalam Proses</span>
          <strong>{{ processingCount }}</strong>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon green">
          <CheckCircle2 :size="20" />
        </div>
        <div>
          <span>Selesai</span>
          <strong>{{ completedCount }}</strong>
        </div>
      </div>
    </div>

    <!-- FILTER -->
    <div class="filter-panel">
      <div class="search-box">
        <Search :size="17" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari nomor pesanan..."
        />
      </div>

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

    <!-- LOADING -->
    <div v-if="loading" class="state-panel">
      <LoaderCircle :size="30" class="spinning" />
      <p>Memuat pesanan toko...</p>
    </div>

    <!-- EMPTY -->
    <div v-else-if="filteredOrders.length === 0" class="empty-panel">
      <div class="empty-icon">
        <ShoppingBag :size="28" />
      </div>

      <h3>Belum ada pesanan</h3>

      <p>Pesanan yang masuk ke toko Anda akan muncul di halaman ini.</p>
    </div>

    <!-- ORDER LIST -->
    <div v-else class="order-list">
      <article
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
      >
        <div class="order-card-header">
          <div>
            <span class="order-label">NOMOR PESANAN TOKO</span>
            <strong>{{ order.seller_order_number }}</strong>
            <small>
              <CalendarDays :size="13" />
              {{ formatDate(order.created_at) }}
            </small>
          </div>

          <span class="status-badge" :class="getStatusClass(order.status)">
            {{ getStatusLabel(order.status) }}
          </span>
        </div>

        <div class="order-card-body">
          <div class="product-preview">
            <img
              v-if="order.order_items[0]?.product_image_url"
              :src="order.order_items[0].product_image_url"
              alt="Produk"
            />

            <div v-else class="product-placeholder">
              <Package :size="23" />
            </div>

            <div>
              <strong>
                {{ order.order_items[0]?.product_name || "Produk" }}
              </strong>

              <span> {{ order.order_items[0]?.quantity || 0 }} item </span>

              <small v-if="order.order_items.length > 1">
                +{{ order.order_items.length - 1 }} produk lainnya
              </small>
            </div>
          </div>

          <div class="order-total">
            <span>Subtotal Produk</span>
            <strong>{{ formatCurrency(order.subtotal) }}</strong>
          </div>
        </div>

        <div class="order-card-footer">
          <div class="recipient">
            <MapPin :size="15" />
            <span>
              {{ order.orders?.recipient_name || "Penerima" }}
            </span>
          </div>

          <div class="order-actions">
            <button class="detail-button" @click="openDetail(order)">
              <Eye :size="15" />
              Detail
            </button>

            <button
              v-if="order.status === 'awaiting_shipping_cost'"
              class="shipping-button"
              @click="openShippingForm(order)"
            >
              <Truck :size="15" />
              Konfirmasi Ongkir
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- DETAIL MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDetail && selectedOrder"
          class="modal-overlay"
          @click.self="closeDetail"
        >
          <div class="modal-card">
            <div class="modal-header">
              <div>
                <span class="eyebrow">DETAIL PESANAN</span>
                <h3>{{ selectedOrder.seller_order_number }}</h3>
              </div>

              <button class="close-button" @click="closeDetail">
                <X :size="19" />
              </button>
            </div>

            <div class="detail-status">
              <span
                class="status-badge"
                :class="getStatusClass(selectedOrder.status)"
              >
                {{ getStatusLabel(selectedOrder.status) }}
              </span>

              <span>{{ formatDate(selectedOrder.created_at) }}</span>
            </div>
            <!-- SHIPPING PROGRESS -->
            <ShippingProgress
              v-if="
                ['paid', 'processing', 'shipped', 'completed'].includes(
                  selectedOrder.status,
                )
              "
              :status="selectedOrder.status"
              :courier-name="selectedOrder.courier_name"
              :courier-service="selectedOrder.courier_service"
              :tracking-number="selectedOrder.courier_tracking_number"
              :shipped-at="selectedOrder.shipped_at"
              :delivered-at="selectedOrder.delivered_at"
            />

            <h4>Produk Pesanan</h4>

            <div class="detail-products">
              <div
                v-for="item in selectedOrder.order_items"
                :key="item.id"
                class="detail-product"
              >
                <img
                  v-if="item.product_image_url"
                  :src="item.product_image_url"
                  alt="Produk"
                />

                <div v-else class="product-placeholder">
                  <Package :size="20" />
                </div>

                <div class="detail-product-info">
                  <strong>{{ item.product_name }}</strong>
                  <span>
                    {{ item.quantity }} × {{ formatCurrency(item.unit_price) }}
                  </span>
                </div>

                <strong>{{ formatCurrency(item.subtotal) }}</strong>
              </div>
            </div>

            <h4>Alamat Penerima</h4>

            <div class="address-box">
              <strong>{{ selectedOrder.orders?.recipient_name }}</strong>
              <span>{{ selectedOrder.orders?.recipient_phone }}</span>

              <p>
                {{ selectedOrder.orders?.shipping_address_line }},
                {{ selectedOrder.orders?.shipping_district }},
                {{ selectedOrder.orders?.shipping_city }},
                {{ selectedOrder.orders?.shipping_province }}
                {{ selectedOrder.orders?.shipping_postal_code }}
              </p>

              <small v-if="selectedOrder.orders?.shipping_address_notes">
                Catatan: {{ selectedOrder.orders.shipping_address_notes }}
              </small>
            </div>

            <h4>Ringkasan Harga</h4>

            <div class="price-summary">
              <div>
                <span>Subtotal produk</span>
                <strong>{{ formatCurrency(selectedOrder.subtotal) }}</strong>
              </div>

              <div>
                <span>Ongkos kirim</span>
                <strong>
                  {{
                    selectedOrder.shipping_cost_confirmed_at
                      ? formatCurrency(selectedOrder.shipping_cost)
                      : "Belum ditentukan"
                  }}
                </strong>
              </div>

              <div>
                <span>Diskon</span>
                <strong>
                  {{ formatCurrency(selectedOrder.discount_amount) }}
                </strong>
              </div>

              <div class="price-total">
                <span>Total pesanan toko</span>
                <strong>{{
                  formatCurrency(selectedOrder.total_amount)
                }}</strong>
              </div>
            </div>

            <!-- PAYMENT INFORMATION -->
            <div v-if="selectedOrder.payment" class="payment-detail-section">
              <h4>Informasi Pembayaran</h4>

              <div class="payment-info-card">
                <div class="payment-info-row">
                  <span>Metode Pembayaran</span>
                  <strong>
                    {{
                      selectedOrder.payment.payment_method_snapshot
                        ?.display_name ||
                      selectedOrder.payment.payment_method_type
                    }}
                  </strong>
                </div>

                <div class="payment-info-row">
                  <span>Status Pembayaran</span>
                  <strong>
                    {{
                      selectedOrder.payment.status === "proof_submitted"
                        ? "Menunggu Verifikasi"
                        : selectedOrder.payment.status === "verified"
                          ? "Terverifikasi"
                          : selectedOrder.payment.status === "rejected"
                            ? "Ditolak"
                            : "Menunggu Pembayaran"
                    }}
                  </strong>
                </div>

                <div class="payment-info-row">
                  <span>Nominal Pembayaran</span>
                  <strong>{{
                    formatCurrency(selectedOrder.payment.amount)
                  }}</strong>
                </div>
              </div>

              <template v-if="getLatestPaymentProof(selectedOrder)">
                <h4>Bukti Transfer</h4>

                <div class="payment-proof-card">
                  <div class="payment-proof-info">
                    <div>
                      <span>Nama Pengirim</span>
                      <strong>
                        {{
                          getLatestPaymentProof(selectedOrder).sender_name ||
                          "-"
                        }}
                      </strong>
                    </div>

                    <div>
                      <span>Bank Pengirim</span>
                      <strong>
                        {{
                          getLatestPaymentProof(selectedOrder).sender_bank ||
                          "-"
                        }}
                      </strong>
                    </div>

                    <div>
                      <span>Nominal Transfer</span>
                      <strong>
                        {{
                          formatCurrency(
                            getLatestPaymentProof(selectedOrder)
                              .transfer_amount,
                          )
                        }}
                      </strong>
                    </div>

                    <div>
                      <span>Tanggal Transfer</span>
                      <strong>
                        {{
                          getLatestPaymentProof(selectedOrder).transfer_date
                            ? formatDate(
                                getLatestPaymentProof(selectedOrder)
                                  .transfer_date,
                              )
                            : "-"
                        }}
                      </strong>
                    </div>
                  </div>

                  <div v-if="getLatestPaymentProof(selectedOrder).buyer_note">
                    <span class="proof-note-label">Catatan Pembeli</span>
                    <p class="proof-note">
                      {{ getLatestPaymentProof(selectedOrder).buyer_note }}
                    </p>
                  </div>

                  <button
                    type="button"
                    class="view-proof-button"
                    :disabled="loadingPaymentProof"
                    @click="
                      viewPaymentProof(getLatestPaymentProof(selectedOrder))
                    "
                  >
                    <LoaderCircle
                      v-if="loadingPaymentProof"
                      :size="15"
                      class="spinning"
                    />
                    <Eye v-else :size="15" />

                    {{
                      loadingPaymentProof
                        ? "Membuka..."
                        : "Lihat Bukti Transfer"
                    }}
                  </button>
                </div>
              </template>
            </div>

            <div
              v-if="
                selectedOrder.seller_note || selectedOrder.orders?.buyer_note
              "
              class="note-box"
            >
              <strong>Catatan</strong>

              <p v-if="selectedOrder.orders?.buyer_note">
                Pembeli: {{ selectedOrder.orders.buyer_note }}
              </p>

              <p v-if="selectedOrder.seller_note">
                Seller: {{ selectedOrder.seller_note }}
              </p>
            </div>

            <div
              v-if="
                selectedOrder.status === 'payment_review' &&
                selectedOrder.payment?.status === 'proof_submitted' &&
                getLatestPaymentProof(selectedOrder)?.verification_status ===
                  'pending'
              "
              class="payment-review-actions"
            >
              <div class="payment-review-notice">
                <AlertCircle :size="17" />
                <p>
                  Pembeli sudah mengirimkan bukti pembayaran. Periksa bukti
                  transfer sebelum mengambil keputusan.
                </p>
              </div>

              <div class="payment-review-buttons">
                <button
                  class="reject-payment-button"
                  @click="openRejectPaymentModal"
                  :disabled="savingPaymentReview"
                >
                  <X :size="16" />
                  Tolak Pembayaran
                </button>

                <button
                  class="approve-payment-button"
                  @click="openApprovePaymentModal"
                  :disabled="savingPaymentReview"
                >
                  <CheckCircle2 :size="16" />
                  Setujui Pembayaran
                </button>
              </div>
            </div>

            <!-- START PROCESSING ACTION -->
            <div
              v-if="selectedOrder.status === 'paid'"
              class="processing-action"
            >
              <div class="processing-notice">
                <Package :size="18" />
                <div>
                  <strong>Pembayaran Terverifikasi</strong>
                  <p>
                    Pembayaran sudah disetujui. Anda dapat mulai menyiapkan
                    produk pesanan untuk dikirim kepada pembeli.
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="processing-button full-button"
                @click="openStartProcessingModal"
                :disabled="savingProcessing"
              >
                <LoaderCircle
                  v-if="savingProcessing"
                  :size="16"
                  class="spinning"
                />
                <Package v-else :size="16" />

                {{ savingProcessing ? "Memproses..." : "Mulai Proses Pesanan" }}
              </button>
            </div>

            <!-- SHIP ORDER ACTION -->
            <div
              v-if="selectedOrder.status === 'processing'"
              class="processing-action shipping-order-action"
            >
              <div class="shipping-order-notice">
                <Truck :size="19" />

                <div>
                  <strong>Pesanan Siap Dikirim</strong>

                  <p>
                    Pastikan produk sudah dikemas dengan baik. Masukkan
                    informasi kurir dan nomor resi untuk memulai proses
                    pengiriman.
                  </p>
                </div>
              </div>

              <button
                type="button"
                class="shipping-button full-button"
                @click="openShipOrderModal"
                :disabled="savingShipment"
              >
                <Truck :size="16" />
                Kirim Pesanan
              </button>
            </div>

            <button
              v-if="selectedOrder.status === 'awaiting_shipping_cost'"
              class="shipping-button full-button"
              @click="
                openShippingForm(selectedOrder);
                showDetail = false;
              "
            >
              <Truck :size="16" />
              Konfirmasi Ongkos Kirim
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- PAYMENT PROOF IMAGE MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showPaymentProofImage"
          class="modal-overlay"
          @click.self="closePaymentProofImage"
        >
          <div class="modal-card proof-image-modal">
            <div class="modal-header">
              <div>
                <span class="eyebrow">BUKTI PEMBAYARAN</span>
                <h3>Gambar Bukti Transfer</h3>
              </div>

              <button class="close-button" @click="closePaymentProofImage">
                <X :size="19" />
              </button>
            </div>

            <img
              :src="paymentProofImageUrl"
              alt="Bukti transfer pembeli"
              class="proof-full-image"
            />
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showRejectPaymentModal"
          class="modal-overlay"
          @click.self="closeRejectPaymentModal"
        >
          <div class="modal-card reject-payment-modal">
            <div class="modal-header">
              <div>
                <span class="eyebrow">VERIFIKASI PEMBAYARAN</span>
                <h3>Tolak Bukti Pembayaran</h3>
              </div>

              <button
                class="close-button"
                @click="closeRejectPaymentModal"
                :disabled="savingPaymentReview"
              >
                <X :size="19" />
              </button>
            </div>

            <div class="reject-payment-content">
              <div class="reject-payment-warning">
                <AlertCircle :size="20" />
                <p>
                  Pembeli akan menerima notifikasi bahwa bukti pembayaran
                  ditolak dan perlu mengirimkan bukti pembayaran kembali.
                </p>
              </div>

              <div class="form-group">
                <label for="rejection-note">
                  Alasan Penolakan <span>*</span>
                </label>

                <textarea
                  id="rejection-note"
                  v-model="rejectionNote"
                  rows="4"
                  placeholder="Contoh: Nominal transfer tidak sesuai dengan total pembayaran."
                  :disabled="savingPaymentReview"
                ></textarea>
              </div>
            </div>

            <div class="modal-actions">
              <button
                class="cancel-button"
                @click="closeRejectPaymentModal"
                :disabled="savingPaymentReview"
              >
                Batal
              </button>

              <button
                class="reject-payment-submit"
                @click="submitPaymentReview('rejected')"
                :disabled="savingPaymentReview || !rejectionNote.trim()"
              >
                <LoaderCircle
                  v-if="savingPaymentReview"
                  :size="15"
                  class="spin"
                />
                <X v-else :size="15" />

                {{ savingPaymentReview ? "Memproses..." : "Tolak Pembayaran" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showApprovePaymentModal"
          class="modal-overlay"
          @click.self="closeApprovePaymentModal"
        >
          <div class="modal-card approve-payment-modal">
            <div class="modal-header">
              <div>
                <span class="eyebrow">KONFIRMASI PEMBAYARAN</span>
                <h3>Setujui Pembayaran?</h3>
              </div>

              <button
                class="close-button"
                @click="closeApprovePaymentModal"
                :disabled="savingPaymentReview"
              >
                <X :size="19" />
              </button>
            </div>

            <div class="approve-payment-content">
              <div class="approve-payment-icon">
                <CheckCircle2 :size="28" />
              </div>

              <h4>Apakah Anda yakin?</h4>

              <p>
                Pastikan nominal dan bukti transfer pembeli sudah sesuai. Jika
                pembayaran disetujui, status pembayaran akan berubah menjadi
                terverifikasi dan pesanan dapat dilanjutkan ke tahap pemrosesan.
              </p>

              <div class="approve-payment-warning">
                <AlertCircle :size="17" />
                <span>
                  Tindakan ini akan mengonfirmasi pembayaran secara permanen.
                  Pastikan Anda sudah memeriksa bukti transfer.
                </span>
              </div>
            </div>

            <div class="modal-actions">
              <button
                class="cancel-button"
                @click="closeApprovePaymentModal"
                :disabled="savingPaymentReview"
              >
                Periksa Kembali
              </button>

              <button
                class="approve-payment-confirm"
                @click="submitPaymentReview('approved')"
                :disabled="savingPaymentReview"
              >
                <LoaderCircle
                  v-if="savingPaymentReview"
                  :size="15"
                  class="spin"
                />
                <CheckCircle2 v-else :size="15" />

                {{
                  savingPaymentReview
                    ? "Memproses..."
                    : "Ya, Setujui Pembayaran"
                }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- START PROCESSING CONFIRMATION MODAL -->
    <Teleport to="body">
      <div
        v-if="showStartProcessingModal && selectedOrder"
        class="modal-overlay"
        @click.self="closeStartProcessingModal"
      >
        <div class="modal-card processing-confirm-modal">
          <div class="modal-header">
            <div>
              <h3>Mulai Proses Pesanan?</h3>
              <p>Konfirmasi tindakan untuk pesanan ini.</p>
            </div>

            <button
              type="button"
              class="close-button"
              @click="closeStartProcessingModal"
              :disabled="savingProcessing"
            >
              <X :size="20" />
            </button>
          </div>

          <div class="processing-confirm-content">
            <div class="processing-confirm-icon">
              <Package :size="26" />
            </div>

            <div class="processing-confirm-text">
              <strong>
                {{
                  selectedOrder.seller_order_number ||
                  selectedOrder.order_number
                }}
              </strong>

              <p>
                Apakah Anda yakin ingin mulai memproses pesanan ini? Pastikan
                produk siap untuk dipersiapkan sebelum melanjutkan.
              </p>
            </div>
          </div>

          <div class="processing-confirm-info">
            <div>
              <CheckCircle2 :size="17" />
              <span>Status pesanan akan berubah menjadi Diproses.</span>
            </div>

            <div>
              <Bell :size="17" />
              <span>Pembeli akan menerima notifikasi.</span>
            </div>
          </div>

          <div class="modal-actions">
            <button
              type="button"
              class="secondary-button"
              @click="closeStartProcessingModal"
              :disabled="savingProcessing"
            >
              Periksa Kembali
            </button>

            <button
              type="button"
              class="processing-button"
              @click="submitStartProcessing"
              :disabled="savingProcessing"
            >
              <LoaderCircle
                v-if="savingProcessing"
                :size="16"
                class="spinning"
              />

              <Package v-else :size="16" />

              {{ savingProcessing ? "Memproses..." : "Ya, Mulai Proses" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- SHIPPING FORM MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showShippingForm && selectedOrder"
          class="modal-overlay"
          @click.self="closeShippingForm"
        >
          <div class="modal-card shipping-modal">
            <div class="modal-header">
              <div>
                <span class="eyebrow">PENGATURAN PENGIRIMAN</span>
                <h3>Konfirmasi Ongkos Kirim</h3>
                <p>{{ selectedOrder.seller_order_number }}</p>
              </div>

              <button
                class="close-button"
                :disabled="savingShipping"
                @click="closeShippingForm"
              >
                <X :size="19" />
              </button>
            </div>

            <div class="shipping-info">
              <Truck :size="19" />
              <p>
                Masukkan biaya pengiriman yang akan dibebankan kepada pembeli
                untuk pesanan dari toko Anda.
              </p>
            </div>

            <form @submit.prevent="submitShippingCost">
              <div class="form-group">
                <label for="shippingCost">Ongkos Kirim (Rupiah)</label>

                <input
                  id="shippingCost"
                  v-model="shippingForm.shipping_cost"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Contoh: 15000"
                  required
                />
              </div>

              <div class="form-group">
                <label for="shippingNote">Catatan Pengiriman (Opsional)</label>

                <textarea
                  id="shippingNote"
                  v-model="shippingForm.shipping_cost_note"
                  rows="3"
                  maxlength="500"
                  placeholder="Contoh: Pengiriman menggunakan layanan reguler."
                ></textarea>
              </div>

              <div class="shipping-warning">
                <AlertCircle :size="17" />
                <p>
                  Setelah ongkir dikonfirmasi, data ini akan disimpan. Jika
                  seluruh seller dalam pesanan sudah mengonfirmasi ongkir,
                  pesanan akan beralih ke tahap pembayaran.
                </p>
              </div>

              <div class="modal-actions">
                <button
                  type="button"
                  class="cancel-button"
                  :disabled="savingShipping"
                  @click="closeShippingForm"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  class="shipping-button"
                  :disabled="savingShipping"
                >
                  <LoaderCircle
                    v-if="savingShipping"
                    :size="16"
                    class="spinning"
                  />

                  <CheckCircle2 v-else :size="16" />

                  {{ savingShipping ? "Menyimpan..." : "Konfirmasi Ongkir" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- SHIP ORDER FORM MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showShipOrderModal && selectedOrder"
          class="modal-overlay"
          @click.self="closeShipOrderModal"
        >
          <div class="modal-card shipping-modal">
            <div class="modal-header">
              <div>
                <span class="eyebrow">INFORMASI PENGIRIMAN</span>
                <h3>Kirim Pesanan</h3>
                <p>{{ selectedOrder.seller_order_number }}</p>
              </div>

              <button
                class="close-button"
                :disabled="savingShipment"
                @click="closeShipOrderModal"
              >
                <X :size="19" />
              </button>
            </div>

            <div class="shipping-info">
              <Truck :size="19" />

              <p>
                Masukkan informasi jasa pengiriman dan nomor resi agar pembeli
                dapat mengetahui pengiriman pesanannya.
              </p>
            </div>

            <form @submit.prevent="continueToShipConfirmation">
              <div class="form-group">
                <label for="courierName">Nama Kurir</label>

                <input
                  id="courierName"
                  v-model="shipmentForm.courier_name"
                  type="text"
                  maxlength="100"
                  placeholder="Contoh: JNE, J&T, SiCepat"
                  required
                  :disabled="savingShipment"
                />
              </div>

              <div class="form-group">
                <label for="courierService">Layanan Pengiriman</label>

                <input
                  id="courierService"
                  v-model="shipmentForm.courier_service"
                  type="text"
                  maxlength="100"
                  placeholder="Contoh: REG, YES, EZ"
                  required
                  :disabled="savingShipment"
                />
              </div>

              <div class="form-group">
                <label for="courierTrackingNumber">Nomor Resi</label>

                <input
                  id="courierTrackingNumber"
                  v-model="shipmentForm.courier_tracking_number"
                  type="text"
                  maxlength="150"
                  placeholder="Masukkan nomor resi pengiriman"
                  required
                  :disabled="savingShipment"
                />
              </div>

              <div class="shipping-warning">
                <AlertCircle :size="17" />

                <p>
                  Pastikan nomor resi sudah benar. Setelah pengiriman
                  dikonfirmasi, status pesanan akan berubah menjadi Dikirim.
                </p>
              </div>

              <div class="modal-actions">
                <button
                  type="button"
                  class="cancel-button"
                  @click="closeShipOrderModal"
                >
                  Batal
                </button>

                <button type="submit" class="shipping-button">
                  <Truck :size="16" />
                  Lanjutkan
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- CONFIRM SHIP ORDER MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showConfirmShipModal && selectedOrder"
          class="modal-overlay"
          @click.self="closeConfirmShipModal"
        >
          <div class="modal-card shipping-confirm-modal">
            <div class="modal-header">
              <div>
                <span class="eyebrow">KONFIRMASI PENGIRIMAN</span>
                <h3>Kirim Pesanan Sekarang?</h3>
              </div>

              <button
                class="close-button"
                @click="closeConfirmShipModal"
                :disabled="savingShipment"
              >
                <X :size="19" />
              </button>
            </div>

            <div class="shipping-confirm-content">
              <div class="shipping-confirm-icon">
                <Truck :size="27" />
              </div>

              <h4>Periksa kembali informasi pengiriman</h4>

              <p>
                Apakah Anda yakin pesanan ini sudah diserahkan kepada pihak
                kurir?
              </p>

              <div class="shipping-confirm-details">
                <div>
                  <span>Nomor Pesanan</span>
                  <strong>{{ selectedOrder.seller_order_number }}</strong>
                </div>

                <div>
                  <span>Kurir</span>
                  <strong>{{ shipmentForm.courier_name }}</strong>
                </div>

                <div>
                  <span>Layanan</span>
                  <strong>{{ shipmentForm.courier_service }}</strong>
                </div>

                <div>
                  <span>Nomor Resi</span>
                  <strong>{{ shipmentForm.courier_tracking_number }}</strong>
                </div>
              </div>

              <div class="shipping-warning">
                <AlertCircle :size="17" />

                <p>
                  Setelah dikonfirmasi, status pesanan akan berubah menjadi
                  Dikirim dan pembeli akan mendapatkan notifikasi.
                </p>
              </div>
            </div>

            <div class="modal-actions">
              <button
                type="button"
                class="cancel-button"
                @click="closeConfirmShipModal"
                :disabled="savingShipment"
              >
                Periksa Kembali
              </button>

              <button
                type="button"
                class="shipping-button"
                @click="submitShipOrder"
                :disabled="savingShipment"
              >
                <LoaderCircle
                  v-if="savingShipment"
                  :size="16"
                  class="spinning"
                />

                <Truck v-else :size="16" />

                {{ savingShipment ? "Mengirim..." : "Ya, Kirim Pesanan" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.orders-page {
  max-width: 1200px;
  margin: 0 auto;
  color: #332b25;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 23px;
}

.eyebrow,
.order-label {
  color: #a34319;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

.page-header h2 {
  margin: 8px 0 5px;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #938579;
  font-size: 12px;
  line-height: 1.7;
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 13px;
  border: 1px solid #e8ddd3;
  border-radius: 8px;
  background: white;
  color: #725e50;
  font-size: 11px;
  cursor: pointer;
}

.refresh-button:disabled {
  opacity: 0.6;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 19px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #eee5dc;
  border-radius: 11px;
  background: white;
}

.summary-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  background: #f8eee8;
  color: #a34319;
}

.summary-icon.orange {
  background: #fff2e3;
  color: #b47737;
}

.summary-icon.blue {
  background: #edf2fa;
  color: #5577a8;
}

.summary-icon.green {
  background: #edf5ed;
  color: #56845a;
}

.summary-card span,
.summary-card strong {
  display: block;
}

.summary-card span {
  color: #938579;
  font-size: 10px;
}

.summary-card strong {
  margin-top: 5px;
  font-size: 21px;
}

.filter-panel {
  display: flex;
  gap: 12px;
  margin-bottom: 17px;
  padding: 13px;
  border: 1px solid #eee5dc;
  border-radius: 10px;
  background: white;
}

.search-box {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 9px;
  padding: 0 11px;
  border: 1px solid #e9dfd5;
  border-radius: 8px;
  color: #9b8c80;
}

.search-box input {
  width: 100%;
  min-height: 39px;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 11px;
}

.filter-panel select {
  min-width: 190px;
  padding: 0 11px;
  border: 1px solid #e9dfd5;
  border-radius: 8px;
  outline: none;
  background: white;
  color: #67584c;
  font-size: 11px;
}

.order-list {
  display: grid;
  gap: 13px;
}

.order-card {
  overflow: hidden;
  border: 1px solid #ece4dc;
  border-radius: 11px;
  background: white;
}

.order-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
  padding: 16px;
  border-bottom: 1px solid #f0eae4;
}

.order-card-header > div:first-child {
  display: grid;
  gap: 5px;
}

.order-card-header > div > strong {
  font-size: 13px;
}

.order-card-header small {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #9b8c80;
  font-size: 10px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}

.status-badge.warning {
  background: #fff2df;
  color: #aa722d;
}

.status-badge.info {
  background: #edf2fa;
  color: #5577a8;
}

.status-badge.purple {
  background: #f1edfa;
  color: #7861a8;
}

.status-badge.success {
  background: #eaf4e9;
  color: #4d7d4d;
}

.status-badge.blue {
  background: #eaf1fa;
  color: #4c6d9e;
}

.status-badge.danger {
  background: #fff0ed;
  color: #b34c40;
}

.status-badge.neutral {
  background: #f1efec;
  color: #887e75;
}

.order-card-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 17px;
}

.product-preview {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.product-preview img,
.detail-product img,
.product-placeholder {
  width: 55px;
  height: 55px;
  flex-shrink: 0;
  border-radius: 8px;
  object-fit: cover;
}

.product-placeholder {
  display: grid;
  place-items: center;
  background: #f7eee8;
  color: #a34319;
}

.product-preview > div:last-child {
  display: grid;
  gap: 5px;
}

.product-preview strong {
  font-size: 12px;
}

.product-preview span,
.product-preview small {
  color: #938579;
  font-size: 10px;
}

.order-total {
  display: grid;
  gap: 6px;
  text-align: right;
}

.order-total span {
  color: #938579;
  font-size: 10px;
}

.order-total strong {
  font-size: 13px;
}

.order-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid #f0eae4;
  background: #fdfbf9;
}

.recipient {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #827469;
  font-size: 11px;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.detail-button,
.shipping-button,
.cancel-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.detail-button {
  border: 1px solid #e6dcd2;
  background: white;
  color: #74665b;
}

.shipping-button {
  border: 1px solid #943c14;
  background: #943c14;
  color: white;
}

.shipping-button:hover {
  background: #7e3010;
}

.shipping-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.state-panel,
.empty-panel {
  display: grid;
  min-height: 260px;
  align-content: center;
  justify-items: center;
  gap: 12px;
  border: 1px solid #eee5dc;
  border-radius: 12px;
  background: white;
  color: #a34319;
}

.state-panel p,
.empty-panel p {
  margin: 0;
  color: #938579;
  font-size: 11px;
}

.empty-icon {
  display: grid;
  width: 55px;
  height: 55px;
  place-items: center;
  border-radius: 50%;
  background: #f8eee8;
}

.empty-panel h3 {
  margin: 0;
  color: #332b25;
  font-size: 15px;
}

/* MODALS */

.modal-overlay {
  position: fixed;
  z-index: 2500;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 18px;
  background: #21181180;
  backdrop-filter: blur(3px);
}

.modal-card {
  width: 100%;
  max-width: 570px;
  max-height: calc(100vh - 36px);
  overflow-y: auto;
  padding: 23px;
  border-radius: 14px;
  background: white;
  box-shadow: 0 20px 70px #0002;
}

.shipping-modal {
  max-width: 470px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.modal-header h3 {
  margin: 7px 0 0;
  font-size: 17px;
  overflow-wrap: anywhere;
}

.modal-header p {
  margin: 5px 0 0;
  color: #938579;
  font-size: 10px;
}

.close-button {
  display: grid;
  width: 33px;
  height: 33px;
  flex-shrink: 0;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: #f7f3ef;
  color: #786b60;
  cursor: pointer;
}

.detail-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 17px 0;
  color: #938579;
  font-size: 10px;
}

.modal-card h4 {
  margin: 19px 0 10px;
  font-size: 12px;
}

.detail-products {
  display: grid;
  gap: 11px;
}

.detail-product {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-product img,
.detail-product .product-placeholder {
  width: 43px;
  height: 43px;
}

.detail-product-info {
  display: grid;
  flex: 1;
  gap: 5px;
}

.detail-product-info strong,
.detail-product > strong {
  font-size: 11px;
}

.detail-product-info span {
  color: #938579;
  font-size: 10px;
}

.address-box {
  display: grid;
  gap: 6px;
  padding: 13px;
  border-radius: 9px;
  background: #faf7f3;
}

.address-box strong {
  font-size: 11px;
}

.address-box span,
.address-box p,
.address-box small {
  margin: 0;
  color: #817469;
  font-size: 10px;
  line-height: 1.7;
}

.price-summary {
  display: grid;
  gap: 10px;
}

.price-summary > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 11px;
}

.price-summary span {
  color: #938579;
}

.price-total {
  padding-top: 12px;
  border-top: 1px solid #eee5dc;
}

.price-total strong {
  color: #943c14;
  font-size: 14px;
}

.note-box {
  margin-top: 17px;
  padding: 12px;
  border-radius: 8px;
  background: #fffaf2;
  font-size: 10px;
}

.note-box p {
  margin: 7px 0 0;
  color: #817469;
  line-height: 1.6;
}

.full-button {
  width: 100%;
  margin-top: 18px;
}

.shipping-info {
  display: flex;
  gap: 10px;
  margin: 19px 0;
  padding: 12px;
  border-radius: 9px;
  background: #fff8ee;
  color: #aa722d;
}

.shipping-info p {
  margin: 0;
  color: #8e7d6c;
  font-size: 10px;
  line-height: 1.7;
}

.form-group {
  display: grid;
  gap: 7px;
  margin-bottom: 15px;
}

.form-group label {
  font-size: 11px;
  font-weight: 700;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 11px;
  border: 1px solid #e7ddd3;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  font-size: 12px;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #a34319;
}

.form-group textarea {
  resize: vertical;
}

.shipping-warning {
  display: flex;
  gap: 9px;
  padding: 11px;
  border-radius: 8px;
  background: #fffaf2;
  color: #aa722d;
}

.shipping-warning p {
  margin: 0;
  color: #8e7d6c;
  font-size: 10px;
  line-height: 1.7;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.cancel-button {
  border: 1px solid #e6dcd2;
  background: white;
  color: #74665b;
}

.toast-message {
  position: fixed;
  z-index: 3000;
  top: 20px;
  right: 22px;
  display: flex;
  align-items: center;
  gap: 9px;
  max-width: min(420px, calc(100vw - 30px));
  padding: 13px;
  border: 1px solid #dce9d9;
  border-radius: 9px;
  background: white;
  box-shadow: 0 8px 30px #332b2518;
  color: #47764a;
  font-size: 11px;
}

.toast-message.error {
  border-color: #f0d5d0;
  color: #b34c40;
}

.toast-message button {
  display: grid;
  margin-left: auto;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
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
.toast-leave-active,
.modal-enter-active,
.modal-leave-active {
  transition: 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 800px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 580px) {
  .page-header {
    flex-direction: column;
  }

  .filter-panel {
    flex-direction: column;
  }

  .filter-panel select {
    min-height: 40px;
  }

  .order-card-body,
  .order-card-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-total {
    text-align: left;
  }

  .order-actions {
    width: 100%;
  }

  .order-actions button {
    flex: 1;
  }

  .modal-card {
    padding: 17px;
  }
}

.payment-detail-section {
  margin-top: 20px;
}

.payment-info-card,
.payment-proof-card {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid #eee5dc;
  border-radius: 9px;
  background: #fdfbf9;
}

.payment-info-row,
.payment-proof-info > div {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.payment-info-row span,
.payment-proof-info span,
.proof-note-label {
  color: #938579;
  font-size: 10px;
}

.payment-info-row strong,
.payment-proof-info strong {
  font-size: 11px;
  text-align: right;
}

.payment-proof-info {
  display: grid;
  gap: 11px;
}

.proof-note {
  margin: 6px 0 0;
  padding: 10px;
  border-radius: 7px;
  background: white;
  color: #74665b;
  font-size: 11px;
  line-height: 1.6;
}

.view-proof-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #943c14;
  border-radius: 7px;
  background: #943c14;
  color: white;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.view-proof-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.proof-image-modal {
  max-width: 650px;
}

.proof-full-image {
  display: block;
  width: 100%;
  max-height: 70vh;
  margin-top: 18px;
  border-radius: 9px;
  background: #f7f3ef;
  object-fit: contain;
}

.payment-review-actions {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.payment-review-notice,
.reject-payment-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid #ead9bd;
  border-radius: 8px;
  background: #fff8ec;
  color: #95651e;
}

.payment-review-notice p,
.reject-payment-warning p {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
}

.payment-review-notice svg,
.reject-payment-warning svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.payment-review-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.approve-payment-button,
.reject-payment-button,
.reject-payment-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 40px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.approve-payment-button {
  background: #52734b;
  color: white;
}

.reject-payment-button {
  border-color: #e7c7bd;
  background: #fff5f2;
  color: #a3442e;
}

.reject-payment-submit {
  background: #a3442e;
  color: white;
}

.approve-payment-button:disabled,
.reject-payment-button:disabled,
.reject-payment-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.reject-payment-content {
  display: grid;
  gap: 18px;
  margin-top: 18px;
}

.reject-payment-modal .form-group textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #e5dcd3;
  border-radius: 8px;
  outline: none;
  background: #fffdfa;
  color: #493c32;
  font: inherit;
  font-size: 12px;
  line-height: 1.6;
  resize: vertical;
}

.reject-payment-modal .form-group textarea:focus {
  border-color: #943c14;
}

.reject-payment-modal .form-group label span {
  color: #a3442e;
}

.approve-payment-content {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 20px 0;
  text-align: center;
}

.approve-payment-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #edf5e9;
  color: #52734b;
}

.approve-payment-content h4 {
  margin: 4px 0 0;
  color: #493c32;
  font-size: 16px;
}

.approve-payment-content > p {
  max-width: 420px;
  margin: 0;
  color: #817468;
  font-size: 12px;
  line-height: 1.7;
}

.approve-payment-warning {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  width: 100%;
  padding: 12px;
  border: 1px solid #ead9bd;
  border-radius: 8px;
  background: #fff8ec;
  color: #95651e;
  text-align: left;
  font-size: 11px;
  line-height: 1.6;
}

.approve-payment-warning svg {
  flex-shrink: 0;
  margin-top: 1px;
}

.approve-payment-confirm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 40px;
  padding: 0 14px;
  border: none;
  border-radius: 7px;
  background: #52734b;
  color: white;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.approve-payment-confirm:hover:not(:disabled) {
  background: #405d3b;
}

.approve-payment-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ======================================================
   START PROCESSING ACTION - ORDER DETAIL
====================================================== */

.processing-action {
  display: grid;
  gap: 13px;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #eee5dc;
}

.processing-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid #dce8d8;
  border-radius: 9px;
  background: #f3f7f0;
  color: #52734b;
}

.processing-notice > svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.processing-notice > div {
  flex: 1;
  min-width: 0;
}

.processing-notice strong {
  display: block;
  margin-bottom: 5px;
  color: #496642;
  font-size: 12px;
  font-weight: 700;
}

.processing-notice p {
  margin: 0;
  color: #71816b;
  font-size: 11px;
  line-height: 1.7;
}

.processing-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 15px;
  border: 1px solid #52734b;
  border-radius: 8px;
  background: #52734b;
  color: #fff;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.processing-button:hover:not(:disabled) {
  background: #405d3b;
  border-color: #405d3b;
}

.processing-button:active:not(:disabled) {
  transform: translateY(1px);
}

.processing-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.processing-button.full-button {
  width: 100%;
  margin-top: 0;
}

/* ======================================================
   PROCESSING CONFIRMATION MODAL
====================================================== */

.processing-confirm-modal {
  width: 100%;
  max-width: 470px;
  padding: 25px;
  border: 1px solid #eee5dc;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 20px 70px #21181130;
}

.processing-confirm-modal .modal-header {
  align-items: flex-start;
  padding-bottom: 18px;
  border-bottom: 1px solid #f0eae4;
}

.processing-confirm-modal .modal-header h3 {
  margin: 0;
  color: #332b25;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.4;
}

.processing-confirm-modal .modal-header p {
  margin-top: 6px;
  color: #938579;
  font-size: 11px;
}

.processing-confirm-modal .close-button {
  width: 34px;
  height: 34px;
  border: 1px solid #eee5dc;
  border-radius: 9px;
  background: #faf7f3;
  color: #74665b;
  transition: 0.2s ease;
}

.processing-confirm-modal .close-button:hover:not(:disabled) {
  background: #f2e9e1;
  color: #943c14;
}

.processing-confirm-modal .close-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Order information */

.processing-confirm-content {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 20px 0;
}

.processing-confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #f8eee8;
  color: #a34319;
}

.processing-confirm-text {
  flex: 1;
  min-width: 0;
}

.processing-confirm-text strong {
  display: block;
  margin: 2px 0 7px;
  color: #332b25;
  font-size: 13px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.processing-confirm-text p {
  margin: 0;
  color: #817469;
  font-size: 11px;
  line-height: 1.8;
}

/* Status and notification information */

.processing-confirm-info {
  display: grid;
  gap: 12px;
  margin-bottom: 5px;
  padding: 15px;
  border: 1px solid #e6eade;
  border-radius: 10px;
  background: #f6f8f2;
}

.processing-confirm-info > div {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: #52734b;
  font-size: 11px;
  line-height: 1.6;
}

.processing-confirm-info svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* Modal actions */

.processing-confirm-modal .modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 20px;
}

.processing-confirm-modal .secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 39px;
  padding: 0 14px;
  border: 1px solid #e5dcd3;
  border-radius: 7px;
  background: #fff;
  color: #74665b;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.processing-confirm-modal .secondary-button:hover:not(:disabled) {
  border-color: #cbb9a9;
  background: #faf7f3;
}

.processing-confirm-modal .processing-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 39px;
  padding: 0 14px;
  border: 1px solid #52734b;
  border-radius: 7px;
  background: #52734b;
  color: #fff;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.processing-confirm-modal .processing-button:hover:not(:disabled) {
  border-color: #405d3b;
  background: #405d3b;
}

.processing-confirm-modal .processing-button:disabled,
.processing-confirm-modal .secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile */

@media (max-width: 480px) {
  .processing-confirm-modal {
    padding: 19px;
  }

  .processing-confirm-modal .modal-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .processing-confirm-modal .modal-actions button {
    width: 100%;
    min-height: 42px;
  }
}

/* ======================================================
   SHIPPING ORDER ACTION
====================================================== */

.shipping-order-action {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #eee5dc;
}

.shipping-order-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid #ead9bd;
  border-radius: 9px;
  background: #fff8ec;
  color: #aa722d;
}

.shipping-order-notice > svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.shipping-order-notice strong {
  display: block;
  margin-bottom: 5px;
  color: #8e642d;
  font-size: 12px;
}

.shipping-order-notice p {
  margin: 0;
  color: #8e7d6c;
  font-size: 11px;
  line-height: 1.7;
}

/* SHIPPING CONFIRMATION */

.shipping-confirm-modal {
  max-width: 470px;
}

.shipping-confirm-content {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 20px 0 5px;
  text-align: center;
}

.shipping-confirm-icon {
  display: grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 50%;
  background: #f8eee8;
  color: #a34319;
}

.shipping-confirm-content h4 {
  margin: 0;
  font-size: 15px;
}

.shipping-confirm-content > p {
  margin: 0;
  color: #817469;
  font-size: 11px;
  line-height: 1.7;
}

.shipping-confirm-details {
  display: grid;
  width: 100%;
  gap: 12px;
  padding: 14px;
  border: 1px solid #eee5dc;
  border-radius: 9px;
  background: #fdfbf9;
  text-align: left;
}

.shipping-confirm-details > div {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.shipping-confirm-details span {
  color: #938579;
  font-size: 10px;
}

.shipping-confirm-details strong {
  max-width: 65%;
  color: #493c32;
  font-size: 10px;
  text-align: right;
  overflow-wrap: anywhere;
}

.shipping-confirm-modal .modal-actions {
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .shipping-confirm-modal .modal-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .shipping-confirm-modal .modal-actions button {
    width: 100%;
    min-height: 42px;
  }
}
</style>
