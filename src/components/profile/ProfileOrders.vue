<script setup>
import { ref, computed, watch } from "vue";

import {
  Package,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Upload,
  CheckCircle2,
  ShoppingBag,
  PackageCheck,
  Star,
  Send,
} from "lucide-vue-next";

import { supabase } from "@/services/supabase.js";
import ShippingProgress from "@/components/shipping/ShippingProgress.vue";
import AppModal from "@/components/ui/AppModal.vue";
import AppToast from "@/components/ui/AppToast.vue";

const props = defineProps({
  orders: {
    type: Array,
    default: () => [],
  },
  loadingOrders: {
    type: Boolean,
    default: false,
  },
  selectedPaymentMethods: {
    type: Object,
    default: () => ({}),
  },
  selectingPayment: {
    type: Boolean,
    default: false,
  },

  formatCurrency: {
    type: Function,
    required: true,
  },
  formatDate: {
    type: Function,
    required: true,
  },
  getOrderStatusLabel: {
    type: Function,
    required: true,
  },
  getOrderStatusClass: {
    type: Function,
    required: true,
  },
  getSellerPayment: {
    type: Function,
    required: true,
  },
  getPaymentStatusLabel: {
    type: Function,
    required: true,
  },
  getPaymentStatusClass: {
    type: Function,
    required: true,
  },
  canSelectPaymentMethod: {
    type: Function,
    required: true,
  },
  getSelectedPaymentMethodId: {
    type: Function,
    required: true,
  },
  getPaymentMethodSnapshot: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits([
  "refresh",
  "select-payment",
  "download-qris",
  "copy-account-number",
  "open-payment-proof",
  "go-catalog",
]);

// ==========================================
// EXPAND / COLLAPSE
// ==========================================

const expandedOrders = ref({});

function toggleOrderDetails(orderId) {
  expandedOrders.value = {
    ...expandedOrders.value,
    [orderId]: !expandedOrders.value[orderId],
  };
}

function isOrderExpanded(orderId) {
  return !!expandedOrders.value[orderId];
}

// ==========================================
// TOAST
// ==========================================

const toast = ref({
  visible: false,
  type: "success",
  title: "",
  message: "",
});

function showMessage(message, type = "success") {
  const titles = {
    success: "Berhasil",
    error: "Terjadi Kesalahan",
    info: "Informasi",
  };

  toast.value = {
    visible: true,
    type,
    title: titles[type] || "Informasi",
    message,
  };
}

// ==========================================
// BUYER CONFIRM RECEIVED
// ==========================================

const showConfirmReceivedModal = ref(false);
const selectedSellerOrder = ref(null);
const confirmingReceived = ref(false);

const confirmReceivedDescription = computed(() => {
  if (!selectedSellerOrder.value) {
    return "Pastikan paket sudah kamu terima sebelum menyelesaikan pesanan.";
  }

  return `Apakah kamu yakin sudah menerima pesanan ${selectedSellerOrder.value.seller_order_number}? Setelah dikonfirmasi, pesanan ini akan ditandai selesai.`;
});

function openConfirmReceivedModal(sellerOrder) {
  if (sellerOrder.status !== "shipped" || confirmingReceived.value) {
    return;
  }

  selectedSellerOrder.value = sellerOrder;
  showConfirmReceivedModal.value = true;
}

function closeConfirmReceivedModal() {
  if (confirmingReceived.value) return;

  showConfirmReceivedModal.value = false;
  selectedSellerOrder.value = null;
}

async function confirmSellerOrderReceived() {
  const sellerOrder = selectedSellerOrder.value;

  if (!sellerOrder || confirmingReceived.value) return;

  if (sellerOrder.status !== "shipped") {
    showMessage(
      "Pesanan hanya dapat dikonfirmasi setelah dikirim oleh seller.",
      "error",
    );
    closeConfirmReceivedModal();
    return;
  }

  confirmingReceived.value = true;

  try {
    const { data, error } = await supabase.rpc(
      "confirm_seller_order_received",
      {
        p_seller_order_id: sellerOrder.id,
      },
    );

    if (error) throw error;

    if (!data?.success) {
      throw new Error(data?.message || "Konfirmasi penerimaan pesanan gagal.");
    }

    showConfirmReceivedModal.value = false;
    selectedSellerOrder.value = null;

    showMessage(
      data.message || "Penerimaan pesanan berhasil dikonfirmasi.",
      "success",
    );

    emit("refresh");
  } catch (error) {
    console.error("Confirm received error:", error);

    showMessage(
      error.message || "Terjadi kesalahan saat mengonfirmasi pesanan.",
      "error",
    );
  } finally {
    confirmingReceived.value = false;
  }
}

// ==========================================
// PAYMENT HELPERS
// ==========================================

const completedStatuses = [
  "paid",
  "processing",
  "shipped",
  "delivered",
  "completed",
];

function isPaymentSectionVisible(sellerOrder) {
  return (
    sellerOrder.status !== "awaiting_shipping_cost" &&
    !completedStatuses.includes(sellerOrder.status)
  );
}

function isPaymentVerified(sellerOrder) {
  return (
    completedStatuses.includes(sellerOrder.status) &&
    props.getSellerPayment(sellerOrder)?.status === "verified"
  );
}

function isCompleted(sellerOrder) {
  return sellerOrder.status === "completed";
}

// ==========================================
// PRODUCT REVIEWS
// ==========================================

// Menyimpan ulasan berdasarkan order_item_id.
const reviewsByItem = ref({});

const showReviewModal = ref(false);
const selectedReviewItem = ref(null);
const selectedReviewRating = ref(0);
const reviewText = ref("");
const submittingReview = ref(false);

const reviewModalDescription = computed(() => {
  if (!selectedReviewItem.value) {
    return "Bagikan pengalamanmu setelah menerima produk.";
  }

  return `Berikan penilaian untuk ${selectedReviewItem.value.item.product_name}.`;
});

// Mengambil ulasan dari RPC yang sudah tersedia.
async function loadOrderReviews(orderId = null) {
  const targetOrders = orderId
    ? props.orders.filter((order) => order.id === orderId)
    : props.orders;

  const completedOrders = targetOrders.filter((order) =>
    (order.seller_orders || []).some(
      (sellerOrder) => sellerOrder.status === "completed",
    ),
  );

  if (!completedOrders.length) {
    if (!orderId) {
      reviewsByItem.value = {};
    }

    return;
  }

  try {
    const results = await Promise.all(
      completedOrders.map(async (order) => {
        const { data, error } = await supabase.rpc(
          "get_buyer_order_item_reviews",
          {
            p_order_id: order.id,
          },
        );

        if (error) throw error;

        return {
          orderId: order.id,
          reviews: data || [],
        };
      }),
    );

    const updatedReviews = orderId ? { ...reviewsByItem.value } : {};

    results.forEach(({ reviews }) => {
      reviews.forEach((review) => {
        updatedReviews[review.order_item_id] = review;
      });
    });

    // Jika order tertentu dimuat ulang, hapus review lama
    // untuk item pada order tersebut sebelum mengganti datanya.
    if (orderId) {
      const selectedOrder = props.orders.find((order) => order.id === orderId);

      (selectedOrder?.seller_orders || []).forEach((sellerOrder) => {
        (sellerOrder.order_items || []).forEach((item) => {
          delete updatedReviews[item.id];
        });
      });

      results.forEach(({ reviews }) => {
        reviews.forEach((review) => {
          updatedReviews[review.order_item_id] = review;
        });
      });
    }

    reviewsByItem.value = updatedReviews;
  } catch (error) {
    console.error("Load product reviews error:", error);
  }
}

// Muat ulang ulasan ketika data pesanan berubah.
watch(
  () => props.orders,
  () => {
    loadOrderReviews();
  },
  {
    deep: true,
    immediate: true,
  },
);

function getReviewForItem(item) {
  return reviewsByItem.value[item.id] || null;
}

function openReviewModal(order, sellerOrder, item) {
  if (sellerOrder.status !== "completed") {
    showMessage(
      "Kamu hanya dapat memberikan ulasan setelah pesanan selesai.",
      "error",
    );
    return;
  }

  if (getReviewForItem(item)) {
    showMessage("Produk ini sudah pernah kamu ulas.", "info");
    return;
  }

  selectedReviewItem.value = {
    order,
    sellerOrder,
    item,
  };

  selectedReviewRating.value = 0;
  reviewText.value = "";
  showReviewModal.value = true;
}

function closeReviewModal() {
  if (submittingReview.value) return;

  showReviewModal.value = false;
  selectedReviewItem.value = null;
  selectedReviewRating.value = 0;
  reviewText.value = "";
}

function selectReviewRating(rating) {
  if (submittingReview.value) return;

  selectedReviewRating.value = rating;
}

async function submitProductReview() {
  const selected = selectedReviewItem.value;

  if (!selected || submittingReview.value) return;

  if (
    !Number.isInteger(selectedReviewRating.value) ||
    selectedReviewRating.value < 1 ||
    selectedReviewRating.value > 5
  ) {
    showMessage("Silakan pilih rating 1 sampai 5 bintang.", "error");
    return;
  }

  if (selected.sellerOrder.status !== "completed") {
    showMessage("Pesanan belum selesai. Ulasan belum dapat dikirim.", "error");
    return;
  }

  submittingReview.value = true;

  try {
    const { data, error } = await supabase.rpc("submit_product_review", {
      p_order_item_id: selected.item.id,
      p_rating: selectedReviewRating.value,
      p_review_text: reviewText.value.trim() || null,
    });

    if (error) throw error;

    if (data?.success === false) {
      throw new Error(data.message || "Ulasan gagal dikirim.");
    }

    const orderId = selected.order.id;

    showReviewModal.value = false;
    selectedReviewItem.value = null;
    selectedReviewRating.value = 0;
    reviewText.value = "";

    await loadOrderReviews(orderId);

    showMessage("Terima kasih! Ulasan produk berhasil dikirim.", "success");
  } catch (error) {
    console.error("Submit product review error:", error);

    showMessage(
      error.message || "Terjadi kesalahan saat mengirim ulasan.",
      "error",
    );
  } finally {
    submittingReview.value = false;
  }
}
</script>

<template>
  <section class="section-content">
    <!-- TOOLBAR -->
    <div class="section-toolbar">
      <div>
        <h3>Riwayat Pesanan</h3>
        <p>Semua transaksi belanjamu di KriyaLoka.</p>
      </div>

      <button
        class="secondary-button"
        :disabled="loadingOrders"
        @click="emit('refresh')"
      >
        <RefreshCw :size="16" :class="{ spin: loadingOrders }" />
        Refresh
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="loadingOrders" class="loading-inline">
      <RefreshCw class="spin" :size="22" />
      Memuat pesanan...
    </div>

    <!-- ORDER LIST -->
    <div v-else-if="orders.length" class="order-list">
      <article v-for="order in orders" :key="order.id" class="order-card">
        <!-- ORDER HEADER -->
        <div class="order-card-top">
          <div class="order-number">
            <span>Nomor Pesanan</span>
            <strong>{{ order.order_number }}</strong>
            <small>{{ formatDate(order.created_at) }}</small>
          </div>

          <div class="order-header-actions">
            <span
              class="status-badge"
              :class="getOrderStatusClass(order.status)"
            >
              {{ getOrderStatusLabel(order.status) }}
            </span>

            <button
              type="button"
              class="order-expand-button"
              :aria-expanded="isOrderExpanded(order.id)"
              @click="toggleOrderDetails(order.id)"
            >
              <template v-if="isOrderExpanded(order.id)">
                <ChevronUp :size="16" />
                Tutup Detail
              </template>

              <template v-else>
                <ChevronDown :size="16" />
                Lihat Detail
              </template>
            </button>
          </div>
        </div>

        <!-- ORDER SUMMARY -->
        <div class="order-quick-summary">
          <div>
            <span>Total Pembayaran</span>
            <strong class="order-total">
              {{ formatCurrency(order.grand_total) }}
            </strong>
          </div>

          <span class="order-detail-hint">
            {{ (order.seller_orders || []).length }} Penjual
          </span>
        </div>

        <!-- EXPANDABLE DETAILS -->
        <Transition name="order-expand">
          <div v-show="isOrderExpanded(order.id)" class="order-card-details">
            <!-- SELLER ORDERS -->
            <div
              v-for="sellerOrder in order.seller_orders || []"
              :key="sellerOrder.id"
              class="seller-order-group"
            >
              <!-- SELLER ORDER HEADER -->
              <div class="seller-order-heading">
                <strong>{{ sellerOrder.seller_order_number }}</strong>

                <span
                  class="status-badge"
                  :class="getOrderStatusClass(sellerOrder.status)"
                >
                  {{ getOrderStatusLabel(sellerOrder.status) }}
                </span>
              </div>

              <!-- SHIPPING PROGRESS -->
              <ShippingProgress
                v-if="
                  [
                    'paid',
                    'processing',
                    'shipped',
                    'delivered',
                    'completed',
                  ].includes(sellerOrder.status)
                "
                :status="sellerOrder.status"
                :courier-name="sellerOrder.courier_name"
                :courier-service="sellerOrder.courier_service"
                :tracking-number="sellerOrder.courier_tracking_number"
                :shipped-at="sellerOrder.shipped_at"
                :delivered-at="sellerOrder.delivered_at"
              />

              <!-- BUYER CONFIRM RECEIVED -->
              <div
                v-if="sellerOrder.status === 'shipped'"
                class="confirm-received-card"
              >
                <div class="confirm-received-icon">
                  <PackageCheck :size="22" />
                </div>

                <div class="confirm-received-content">
                  <strong>Apakah pesanan sudah sampai?</strong>
                  <p>
                    Jika paket sudah kamu terima, konfirmasikan agar pesanan
                    dapat diselesaikan.
                  </p>
                </div>

                <button
                  type="button"
                  class="confirm-received-button"
                  :disabled="confirmingReceived"
                  @click="openConfirmReceivedModal(sellerOrder)"
                >
                  <CheckCircle2 :size="17" />
                  Pesanan Diterima
                </button>
              </div>

              <!-- COMPLETED MESSAGE -->
              <div
                v-if="isCompleted(sellerOrder)"
                class="completed-order-message"
              >
                <div class="completed-icon">
                  <CheckCircle2 :size="21" />
                </div>

                <div class="completed-message-content">
                  <strong>Pesanan Telah Selesai</strong>
                  <p>
                    Terima kasih! Pesanan dari penjual ini telah selesai. Semoga
                    kamu puas dengan produk pengrajin KriyaLoka.
                  </p>
                </div>
              </div>

              <!-- PRODUCTS -->
              <div
                v-for="item in sellerOrder.order_items || []"
                :key="item.id"
                class="order-product"
              >
                <img
                  v-if="item.product_image_url"
                  :src="item.product_image_url"
                  :alt="item.product_name"
                  class="order-product-image"
                />

                <div v-else class="order-product-placeholder">
                  <Package :size="22" />
                </div>

                <div class="order-product-details">
                  <strong>{{ item.product_name }}</strong>

                  <span>
                    {{ item.product_category || "Produk KriyaLoka" }}
                  </span>

                  <small>
                    {{ formatCurrency(item.unit_price) }}
                    × {{ item.quantity }}
                  </small>

                  <!-- REVIEW ACTION -->
                  <div
                    v-if="isCompleted(sellerOrder)"
                    class="product-review-inline"
                  >
                    <!-- BELUM DIULAS -->
                    <button
                      v-if="!getReviewForItem(item)"
                      type="button"
                      class="review-action-button"
                      @click="openReviewModal(order, sellerOrder, item)"
                    >
                      <Star :size="15" />
                      Beri Ulasan
                    </button>

                    <!-- SUDAH DIULAS -->
                    <div v-else class="review-already-submitted">
                      <div class="review-submitted-heading">
                        <CheckCircle2 :size="14" />
                        <span>Sudah Diulas</span>
                      </div>

                      <div class="review-stars-display">
                        <Star
                          v-for="star in 5"
                          :key="star"
                          :size="14"
                          :class="{
                            'review-star-filled':
                              star <= Number(getReviewForItem(item)?.rating),
                          }"
                          :fill="
                            star <= Number(getReviewForItem(item)?.rating)
                              ? 'currentColor'
                              : 'none'
                          "
                        />
                      </div>

                      <p
                        v-if="getReviewForItem(item)?.review_text"
                        class="review-submitted-text"
                      >
                        "{{ getReviewForItem(item).review_text }}"
                      </p>
                    </div>
                  </div>
                </div>

                <strong class="order-product-subtotal">
                  {{ formatCurrency(item.subtotal) }}
                </strong>
              </div>

              <!-- SELLER SUBTOTAL -->
              <div class="seller-order-total">
                <span>Subtotal Penjual</span>
                <strong>{{ formatCurrency(sellerOrder.subtotal) }}</strong>
              </div>

              <!-- PAYMENT SECTION -->
              <div
                v-if="isPaymentSectionVisible(sellerOrder)"
                class="seller-payment-section"
              >
                <div class="seller-payment-header">
                  <h4>Pembayaran Seller</h4>

                  <span
                    class="payment-status-badge"
                    :class="
                      getPaymentStatusClass(
                        getSellerPayment(sellerOrder)?.status,
                      )
                    "
                  >
                    {{
                      getPaymentStatusLabel(
                        getSellerPayment(sellerOrder)?.status,
                      )
                    }}
                  </span>
                </div>

                <!-- PAYMENT SUMMARY -->
                <div class="seller-payment-summary">
                  <div class="payment-summary-row">
                    <span>Subtotal Produk</span>
                    <strong>
                      {{ formatCurrency(sellerOrder.subtotal) }}
                    </strong>
                  </div>

                  <div class="payment-summary-row">
                    <span>Ongkos Kirim</span>
                    <strong>
                      {{ formatCurrency(sellerOrder.shipping_cost) }}
                    </strong>
                  </div>

                  <div class="payment-summary-row payment-total-row">
                    <span>Total Pembayaran</span>
                    <strong>
                      {{ formatCurrency(sellerOrder.total_amount) }}
                    </strong>
                  </div>
                </div>

                <!-- PAYMENT METHOD SELECTOR -->
                <div
                  v-if="canSelectPaymentMethod(sellerOrder)"
                  class="payment-method-selector"
                >
                  <label :for="`payment-method-${sellerOrder.id}`">
                    Pilih Metode Pembayaran
                  </label>

                  <select
                    :id="`payment-method-${sellerOrder.id}`"
                    v-model="selectedPaymentMethods[sellerOrder.id]"
                    class="payment-method-select"
                  >
                    <option value="" disabled>Pilih metode pembayaran</option>

                    <option
                      v-for="method in sellerOrder.paymentMethods || []"
                      :key="method.id"
                      :value="method.id"
                    >
                      {{ method.display_name }}
                    </option>
                  </select>

                  <p
                    v-if="!sellerOrder.paymentMethods?.length"
                    class="payment-empty-message"
                  >
                    Seller belum menyediakan metode pembayaran aktif.
                  </p>

                  <button
                    v-else
                    type="button"
                    class="payment-action-button"
                    :disabled="
                      !getSelectedPaymentMethodId(sellerOrder) ||
                      selectingPayment
                    "
                    @click="
                      emit(
                        'select-payment',
                        sellerOrder,
                        getSelectedPaymentMethodId(sellerOrder),
                      )
                    "
                  >
                    {{
                      selectingPayment
                        ? "Memproses..."
                        : getSellerPayment(sellerOrder)
                          ? "Perbarui Metode Pembayaran"
                          : "Pilih Metode Pembayaran"
                    }}
                  </button>
                </div>

                <!-- PAYMENT METHOD DETAIL -->
                <div
                  v-if="getSellerPayment(sellerOrder)"
                  class="payment-method-detail"
                >
                  <h5>Instruksi Pembayaran</h5>

                  <!-- QRIS -->
                  <template
                    v-if="
                      getPaymentMethodSnapshot(sellerOrder).method_type ===
                      'qris'
                    "
                  >
                    <p>Silakan scan QRIS berikut untuk melakukan pembayaran.</p>

                    <div
                      v-if="
                        getPaymentMethodSnapshot(sellerOrder).qris_image_url
                      "
                      class="payment-qris-wrapper"
                    >
                      <img
                        :src="
                          getPaymentMethodSnapshot(sellerOrder).qris_image_url
                        "
                        alt="QRIS Seller"
                        class="payment-qris-image"
                      />

                      <button
                        type="button"
                        class="payment-secondary-button"
                        @click="emit('download-qris', sellerOrder)"
                      >
                        <Download :size="16" />
                        Unduh QRIS
                      </button>
                    </div>
                  </template>

                  <!-- BANK TRANSFER -->
                  <template
                    v-else-if="
                      getPaymentMethodSnapshot(sellerOrder).method_type ===
                      'bank_transfer'
                    "
                  >
                    <div class="payment-bank-info">
                      <div>
                        <span>Bank</span>
                        <strong>
                          {{ getPaymentMethodSnapshot(sellerOrder).bank_name }}
                        </strong>
                      </div>

                      <div class="payment-account-number">
                        <span>Nomor Rekening</span>

                        <div class="payment-copy-row">
                          <strong>
                            {{
                              getPaymentMethodSnapshot(sellerOrder)
                                .account_number
                            }}
                          </strong>

                          <button
                            type="button"
                            class="payment-copy-button"
                            title="Salin nomor rekening"
                            aria-label="Salin nomor rekening"
                            @click="emit('copy-account-number', sellerOrder)"
                          >
                            <Copy :size="16" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span>Nama Pemilik Rekening</span>
                        <strong>
                          {{
                            getPaymentMethodSnapshot(sellerOrder).account_holder
                          }}
                        </strong>
                      </div>
                    </div>
                  </template>

                  <p class="payment-instruction-note">
                    Pastikan nominal transfer sesuai dengan total pembayaran
                    pesanan ini.
                  </p>

                  <!-- UPLOAD PAYMENT PROOF -->
                  <div
                    v-if="
                      ['pending', 'rejected'].includes(
                        getSellerPayment(sellerOrder)?.status,
                      )
                    "
                    class="payment-proof-action"
                  >
                    <button
                      type="button"
                      class="payment-proof-button"
                      @click="emit('open-payment-proof', sellerOrder)"
                    >
                      <Upload :size="17" />
                      Upload Bukti Pembayaran
                    </button>
                  </div>
                </div>

                <!-- WAITING VERIFICATION -->
                <div
                  v-if="
                    getSellerPayment(sellerOrder)?.status === 'proof_submitted'
                  "
                  class="payment-info-message"
                >
                  Bukti pembayaran sudah dikirim. Silakan tunggu seller
                  melakukan verifikasi.
                </div>

                <!-- PAYMENT REJECTED -->
                <div
                  v-if="getSellerPayment(sellerOrder)?.status === 'rejected'"
                  class="payment-rejected-message"
                >
                  <strong>Bukti pembayaran ditolak.</strong>
                  <p>
                    {{
                      getSellerPayment(sellerOrder)?.rejection_note ||
                      "Silakan periksa kembali bukti pembayaran Anda."
                    }}
                  </p>
                </div>
              </div>

              <!-- PAYMENT VERIFIED - COMPACT -->
              <div
                v-if="isPaymentVerified(sellerOrder)"
                class="payment-success-compact"
              >
                <CheckCircle2 :size="17" />
                <span>Pembayaran berhasil diverifikasi oleh seller.</span>
              </div>
            </div>

            <!-- ORDER TOTAL -->
            <div class="order-card-info">
              <div>
                <span>Subtotal</span>
                <strong>{{ formatCurrency(order.subtotal) }}</strong>
              </div>

              <div>
                <span>Ongkos Kirim</span>
                <strong>{{ formatCurrency(order.shipping_cost) }}</strong>
              </div>

              <div>
                <span>Total Pembayaran</span>
                <strong class="order-total">
                  {{ formatCurrency(order.grand_total) }}
                </strong>
              </div>
            </div>

            <!-- MAIN ORDER COMPLETED -->
            <div
              v-if="order.status === 'completed'"
              class="order-completed-footer"
            >
              <ShoppingBag :size="18" />

              <div>
                <strong>Seluruh pesanan telah selesai</strong>
                <p>Terima kasih telah berbelanja di KriyaLoka!</p>
              </div>
            </div>
          </div>
        </Transition>
      </article>
    </div>

    <!-- EMPTY STATE -->
    <div v-else class="empty-state">
      <Package :size="42" />
      <h3>Belum Ada Pesanan</h3>
      <p>Pesanan yang kamu buat akan muncul di halaman ini.</p>

      <button class="primary-button" @click="emit('go-catalog')">
        Mulai Belanja
        <ChevronRight :size="17" />
      </button>
    </div>
  </section>

  <!-- CONFIRMATION MODAL -->
  <AppModal
    v-model="showConfirmReceivedModal"
    title="Konfirmasi Pesanan Diterima?"
    :description="confirmReceivedDescription"
    confirm-text="Ya, Pesanan Diterima"
    cancel-text="Belum"
    variant="success"
    :loading="confirmingReceived"
    @confirm="confirmSellerOrderReceived"
    @cancel="closeConfirmReceivedModal"
  />

  <!-- PRODUCT REVIEW MODAL -->
  <AppModal
    v-model="showReviewModal"
    title="Ulasan Produk"
    :description="reviewModalDescription"
    confirm-text="Kirim Ulasan"
    cancel-text="Nanti"
    variant="info"
    size="lg"
    :loading="submittingReview"
    @confirm="submitProductReview"
    @cancel="closeReviewModal"
  >
    <div v-if="selectedReviewItem" class="review-modal-content">
      <div class="review-product-preview">
        <img
          v-if="selectedReviewItem.item.product_image_url"
          :src="selectedReviewItem.item.product_image_url"
          :alt="selectedReviewItem.item.product_name"
        />

        <div v-else class="review-product-placeholder">
          <Package :size="22" />
        </div>

        <div>
          <strong>{{ selectedReviewItem.item.product_name }}</strong>
          <span>
            {{ selectedReviewItem.item.product_category || "Produk KriyaLoka" }}
          </span>
        </div>
      </div>

      <div class="review-rating-section">
        <strong>Bagaimana kualitas produk ini?</strong>

        <div class="review-rating-buttons">
          <button
            v-for="star in 5"
            :key="star"
            type="button"
            class="review-rating-star"
            :class="{ active: star <= selectedReviewRating }"
            :disabled="submittingReview"
            :aria-label="`Rating ${star} dari 5`"
            @click="selectReviewRating(star)"
          >
            <Star
              :size="32"
              :fill="star <= selectedReviewRating ? 'currentColor' : 'none'"
            />
          </button>
        </div>

        <span class="review-rating-label">
          {{
            selectedReviewRating === 0
              ? "Pilih rating bintang"
              : [
                  "",
                  "Sangat buruk",
                  "Kurang baik",
                  "Cukup baik",
                  "Sangat baik",
                  "Sempurna",
                ][selectedReviewRating]
          }}
        </span>
      </div>

      <div class="review-comment-section">
        <label for="product-review-text">
          Ceritakan pengalamanmu
          <span>(Opsional)</span>
        </label>

        <textarea
          id="product-review-text"
          v-model="reviewText"
          rows="4"
          maxlength="1000"
          placeholder="Bagaimana kualitas produk yang kamu terima? Apakah sesuai dengan deskripsi?"
          :disabled="submittingReview"
        />

        <div class="review-character-count">
          {{ reviewText.length }}/1000 karakter
        </div>
      </div>

      <div class="review-modal-note">
        <CheckCircle2 :size="16" />
        <span>
          Ulasanmu akan membantu pembeli lain mengenal kualitas produk pengrajin
          KriyaLoka.
        </span>
      </div>
    </div>
  </AppModal>

  <!-- TOAST -->
  <AppToast
    v-model="toast.visible"
    :type="toast.type"
    :title="toast.title"
    :message="toast.message"
    :duration="3500"
  />
</template>

<style scoped>
/* ==========================================
   ORDER EXPAND / COLLAPSE
========================================== */

.order-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.order-expand-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 12px;
  border: 1px solid #e7ded2;
  border-radius: 9px;
  background: #fff;
  color: #8b6245;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.order-expand-button:hover {
  background: #f8f3ed;
  border-color: #c9a98d;
}

.order-card-details {
  overflow: hidden;
}

.order-expand-enter-active,
.order-expand-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.order-expand-enter-from,
.order-expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ==========================================
   ORDER QUICK SUMMARY
========================================== */

.order-quick-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 0 2px;
}

.order-quick-summary > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-quick-summary > div > span {
  color: #888;
  font-size: 12px;
}

.order-quick-summary .order-total {
  font-size: 16px;
}

.order-detail-hint {
  color: #999;
  font-size: 12px;
}

/* ==========================================
   BUYER CONFIRM RECEIVED
========================================== */

.confirm-received-card {
  display: flex;
  align-items: center;
  gap: 13px;
  margin: 15px 0;
  padding: 16px;
  border: 1px solid #e8dccb;
  border-radius: 14px;
  background: #fffaf4;
}

.confirm-received-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #f2e8da;
  color: #946b45;
}

.confirm-received-content {
  flex: 1;
  min-width: 0;
}

.confirm-received-content strong {
  display: block;
  color: #59432f;
  font-size: 13px;
}

.confirm-received-content p {
  margin: 5px 0 0;
  color: #8a7969;
  font-size: 12px;
  line-height: 1.6;
}

.confirm-received-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex-shrink: 0;
  padding: 11px 14px;
  border: none;
  border-radius: 10px;
  background: #52633b;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

.confirm-received-button:hover:not(:disabled) {
  background: #3f4e2d;
}

.confirm-received-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ==========================================
   PAYMENT VERIFIED COMPACT
========================================== */

.payment-success-compact {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 13px;
  padding: 11px 14px;
  border: 1px solid #d7eadb;
  border-radius: 12px;
  background: #f2f9f3;
  color: #287a43;
  font-size: 13px;
  font-weight: 500;
}

/* ==========================================
   COMPLETED SELLER ORDER
========================================== */

.completed-order-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 14px 0;
  padding: 15px;
  border: 1px solid #d7eadb;
  border-radius: 13px;
  background: #f5faf5;
}

.completed-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #e0f1e3;
  color: #287a43;
}

.completed-message-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.completed-message-content strong {
  color: #286b3c;
  font-size: 14px;
}

.completed-message-content p {
  margin: 0;
  color: #55745d;
  font-size: 12px;
  line-height: 1.6;
}

/* ==========================================
   MAIN ORDER COMPLETED
========================================== */

.order-completed-footer {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 13px;
  background: #f5faf5;
  color: #287a43;
}

.order-completed-footer > svg {
  flex-shrink: 0;
}

.order-completed-footer strong {
  display: block;
  font-size: 13px;
}

.order-completed-footer p {
  margin: 4px 0 0;
  color: #55745d;
  font-size: 12px;
  line-height: 1.5;
}

/* ==========================================
   PRODUCT REVIEW
========================================== */

.product-review-inline {
  margin-top: 9px;
}

.review-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 11px;
  border: 1px solid #e5d5bd;
  border-radius: 8px;
  background: #fffaf2;
  color: #936a37;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.review-action-button:hover {
  border-color: #c6a36d;
  background: #f8efdf;
}

.review-already-submitted {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.review-submitted-heading {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #39794b;
  font-size: 11px;
  font-weight: 700;
}

.review-stars-display {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #d6d0c5;
}

.review-stars-display .review-star-filled {
  color: #d69a35;
}

.review-submitted-text {
  margin: 2px 0 0;
  color: #777064;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

/* ==========================================
   REVIEW MODAL
========================================== */

.review-modal-content {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.review-product-preview {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 12px;
  border: 1px solid #eee5d9;
  border-radius: 12px;
  background: #fcfaf7;
}

.review-product-preview img,
.review-product-placeholder {
  width: 62px;
  height: 62px;
  flex-shrink: 0;
  border-radius: 9px;
  object-fit: cover;
}

.review-product-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1eade;
  color: #927a5d;
}

.review-product-preview > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.review-product-preview strong {
  color: #493d30;
  font-size: 13px;
  line-height: 1.5;
}

.review-product-preview span {
  color: #93877a;
  font-size: 11px;
}

.review-rating-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.review-rating-section > strong {
  color: #514638;
  font-size: 14px;
  text-align: center;
}

.review-rating-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
}

.review-rating-star {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  border: none;
  background: transparent;
  color: #d5cec2;
  cursor: pointer;
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.review-rating-star:hover:not(:disabled) {
  color: #d69a35;
  transform: scale(1.12);
}

.review-rating-star.active {
  color: #d69a35;
}

.review-rating-star:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.review-rating-label {
  color: #987447;
  font-size: 12px;
  font-weight: 600;
}

.review-comment-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-comment-section label {
  color: #514638;
  font-size: 13px;
  font-weight: 700;
}

.review-comment-section label span {
  color: #999;
  font-size: 11px;
  font-weight: 400;
}

.review-comment-section textarea {
  width: 100%;
  min-height: 105px;
  padding: 12px 13px;
  border: 1px solid #e5ded3;
  border-radius: 10px;
  outline: none;
  background: #fff;
  color: #4c443b;
  font: inherit;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.review-comment-section textarea:focus {
  border-color: #a88b66;
}

.review-comment-section textarea:disabled {
  background: #f7f5f1;
  cursor: not-allowed;
}

.review-comment-section textarea::placeholder {
  color: #b1a99e;
}

.review-character-count {
  color: #999;
  font-size: 11px;
  text-align: right;
}

.review-modal-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 11px 12px;
  border-radius: 9px;
  background: #f3f7ef;
  color: #62764d;
  font-size: 11px;
  line-height: 1.6;
}

.review-modal-note svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* ==========================================
   MOBILE
========================================== */

@media (max-width: 600px) {
  .order-card-top {
    align-items: flex-start;
    gap: 12px;
  }

  .order-header-actions {
    align-items: flex-end;
    flex-direction: column;
    gap: 8px;
  }

  .order-expand-button {
    padding: 8px 10px;
    font-size: 11px;
  }

  .order-quick-summary {
    padding-top: 12px;
  }

  .confirm-received-card {
    align-items: flex-start;
    flex-wrap: wrap;
    padding: 13px;
  }

  .confirm-received-content {
    flex-basis: calc(100% - 58px);
  }

  .confirm-received-button {
    width: 100%;
    min-height: 42px;
  }

  .completed-order-message {
    padding: 12px;
  }

  .order-completed-footer {
    padding: 12px;
  }

  .payment-success-compact {
    padding: 10px 12px;
    font-size: 12px;
  }

  .review-rating-buttons {
    gap: 5px;
  }

  .review-rating-star svg {
    width: 28px;
    height: 28px;
  }

  .review-product-preview img,
  .review-product-placeholder {
    width: 54px;
    height: 54px;
  }
}
</style>
