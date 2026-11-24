<script setup>
import {
  Package,
  RefreshCw,
  ChevronRight,
  Download,
  Copy,
  Upload,
} from "lucide-vue-next";

import ShippingProgress from "@/components/shipping/ShippingProgress.vue";

defineProps({
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
</script>

<template>
  <section class="section-content">
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

          <span class="status-badge" :class="getOrderStatusClass(order.status)">
            {{ getOrderStatusLabel(order.status) }}
          </span>
        </div>

        <!-- SELLER ORDERS -->
        <div
          v-for="sellerOrder in order.seller_orders || []"
          :key="sellerOrder.id"
          class="seller-order-group"
        >
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
              ['paid', 'processing', 'shipped', 'completed'].includes(
                sellerOrder.status,
              )
            "
            :status="sellerOrder.status"
            :courier-name="sellerOrder.courier_name"
            :courier-service="sellerOrder.courier_service"
            :tracking-number="sellerOrder.courier_tracking_number"
            :shipped-at="sellerOrder.shipped_at"
            :delivered-at="sellerOrder.delivered_at"
          />

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
            v-if="sellerOrder.status !== 'awaiting_shipping_cost'"
            class="seller-payment-section"
          >
            <div class="seller-payment-header">
              <h4>Pembayaran Seller</h4>

              <span
                class="payment-status-badge"
                :class="
                  getPaymentStatusClass(getSellerPayment(sellerOrder)?.status)
                "
              >
                {{
                  getPaymentStatusLabel(getSellerPayment(sellerOrder)?.status)
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
                  !getSelectedPaymentMethodId(sellerOrder) || selectingPayment
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
                  getPaymentMethodSnapshot(sellerOrder).method_type === 'qris'
                "
              >
                <p>Silakan scan QRIS berikut untuk melakukan pembayaran.</p>

                <div
                  v-if="getPaymentMethodSnapshot(sellerOrder).qris_image_url"
                  class="payment-qris-wrapper"
                >
                  <img
                    :src="getPaymentMethodSnapshot(sellerOrder).qris_image_url"
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
                          getPaymentMethodSnapshot(sellerOrder).account_number
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
                      {{ getPaymentMethodSnapshot(sellerOrder).account_holder }}
                    </strong>
                  </div>
                </div>
              </template>

              <p class="payment-instruction-note">
                Pastikan nominal transfer sesuai dengan total pembayaran pesanan
                ini.
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
              v-if="getSellerPayment(sellerOrder)?.status === 'proof_submitted'"
              class="payment-info-message"
            >
              Bukti pembayaran sudah dikirim. Silakan tunggu seller melakukan
              verifikasi.
            </div>

            <!-- PAYMENT VERIFIED -->
            <div
              v-if="getSellerPayment(sellerOrder)?.status === 'verified'"
              class="payment-success-message"
            >
              Pembayaran telah diverifikasi oleh seller.
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
</template>
