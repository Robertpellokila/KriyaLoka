<script setup>
import { computed, ref, reactive, onMounted } from "vue";
import { RouterLink } from "vue-router";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  ShieldCheck,
  ShoppingBag,
  CheckCircle2,
  Plus,
  MapPinned,
  PackageCheck,
  CreditCard,
} from "lucide-vue-next";

import { useCartStore } from "../stores/cart.js";
import { supabase } from "../services/supabase.js";
import AppToast from "@/components/ui/AppToast.vue";

const cartStore = useCartStore();

// ==========================================
// STATE ALAMAT
// ==========================================

const addresses = ref([]);
const selectedAddressId = ref(null);
const loadingAddresses = ref(true);
const addressError = ref("");

// ==========================================
// STATE HALAMAN
// ==========================================

const loadingPage = ref(true);
const showReview = ref(false);
const submitting = ref(false);

const orderCreated = ref(false);
const createdOrderNumber = ref("");
const createdOrderId = ref(null);

// ==========================================
// TOAST
// ==========================================

const toast = reactive({
  visible: false,
  type: "success",
  title: "",
  message: "",
});

function showToast(type, title, message) {
  toast.type = type;
  toast.title = title;
  toast.message = message;
  toast.visible = true;
}

// ==========================================
// COMPUTED
// ==========================================

const selectedAddress = computed(() => {
  return (
    addresses.value.find((address) => address.id === selectedAddressId.value) ||
    null
  );
});

const subtotal = computed(() => cartStore.subtotal);

const isCartEmpty = computed(() => cartStore.items.length === 0);

const totalItems = computed(() => cartStore.totalItems);

// ==========================================
// FORMAT CURRENCY
// ==========================================

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

// ==========================================
// FORMAT ALAMAT
// ==========================================

function formatAddress(address) {
  if (!address) return "";

  return [
    address.address_line,
    address.district,
    address.city,
    address.province,
    address.postal_code,
  ]
    .filter(Boolean)
    .join(", ");
}

// ==========================================
// AMBIL ALAMAT BUYER
// ==========================================

async function fetchAddresses() {
  loadingAddresses.value = true;
  addressError.value = "";

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      throw new Error("Silakan login terlebih dahulu.");
    }

    const { data, error } = await supabase
      .from("user_addresses")
      .select(
        `
        id,
        label,
        recipient_name,
        phone_number,
        province,
        city,
        district,
        postal_code,
        address_line,
        address_notes,
        is_default
      `,
      )
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    addresses.value = data || [];

    // Prioritaskan alamat utama
    const defaultAddress = addresses.value.find(
      (address) => address.is_default,
    );

    if (defaultAddress) {
      selectedAddressId.value = defaultAddress.id;
    } else if (addresses.value.length > 0) {
      selectedAddressId.value = addresses.value[0].id;
    } else {
      selectedAddressId.value = null;
    }
  } catch (error) {
    console.error("Gagal mengambil alamat:", error);

    addressError.value = error.message || "Gagal mengambil alamat pengiriman.";

    showToast("error", "Gagal memuat alamat", addressError.value);
  } finally {
    loadingAddresses.value = false;
  }
}

// ==========================================
// INISIALISASI CHECKOUT
// ==========================================

async function initializeCheckout() {
  loadingPage.value = true;

  try {
    // Ambil data keranjang dari Supabase
    const cartResult = await cartStore.fetchCart();

    if (!cartResult?.success) {
      throw new Error(cartResult?.message || "Gagal mengambil keranjang.");
    }

    // Ambil alamat buyer
    await fetchAddresses();
  } catch (error) {
    console.error("Inisialisasi checkout gagal:", error);

    showToast(
      "error",
      "Checkout tidak dapat dimuat",
      error.message || "Silakan coba kembali.",
    );
  } finally {
    loadingPage.value = false;
  }
}

// ==========================================
// PILIH ALAMAT
// ==========================================

function selectAddress(addressId) {
  selectedAddressId.value = addressId;
}

// ==========================================
// LANJUT KE REVIEW
// ==========================================

function submitAddress() {
  if (!selectedAddress.value) {
    showToast(
      "warning",
      "Alamat belum dipilih",
      "Silakan pilih alamat pengiriman terlebih dahulu.",
    );
    return;
  }

  if (isCartEmpty.value) {
    showToast(
      "warning",
      "Keranjang kosong",
      "Tambahkan produk sebelum melanjutkan checkout.",
    );
    return;
  }

  showReview.value = true;

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ==========================================
// KEMBALI KE PILIH ALAMAT
// ==========================================

function editAddress() {
  showReview.value = false;

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ==========================================
// BUAT PESANAN
// ==========================================

async function confirmOrder() {
  if (submitting.value || orderCreated.value) return;

  if (!selectedAddress.value) {
    showToast(
      "warning",
      "Alamat belum dipilih",
      "Pilih alamat pengiriman terlebih dahulu.",
    );

    showReview.value = false;
    return;
  }

  if (cartStore.items.length === 0) {
    showToast("warning", "Keranjang kosong", "Tidak ada produk untuk dipesan.");
    return;
  }

  submitting.value = true;

  try {
    // Siapkan produk yang akan dipesan
    const items = cartStore.items.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    }));

    // Panggil RPC Supabase
    const { data, error } = await supabase.rpc("create_checkout_order", {
      p_address_id: selectedAddressId.value,
      p_items: items,
      p_buyer_note: null,
    });

    if (error) {
      throw error;
    }

    // Validasi hasil RPC
    if (!data || data.success !== true) {
      throw new Error(
        data?.message || "Pesanan belum berhasil dibuat. Silakan coba kembali.",
      );
    }

    // Simpan informasi pesanan
    createdOrderId.value = data.order?.id || data.order_id || null;

    createdOrderNumber.value =
      data.order?.order_number ||
      data.order_number ||
      "Pesanan berhasil dibuat";

    // Tandai bahwa pesanan berhasil dibuat
    orderCreated.value = true;

    showReview.value = false;

    // Bersihkan keranjang setelah transaksi berhasil
    try {
      const clearResult = await cartStore.clearCart();

      if (clearResult?.success === false) {
        throw new Error(clearResult.message || "Gagal membersihkan keranjang.");
      }
    } catch (clearError) {
      console.error(
        "Pesanan berhasil, tetapi keranjang gagal dibersihkan:",
        clearError,
      );

      showToast(
        "warning",
        "Pesanan berhasil dibuat",
        "Pesanan tersimpan, tetapi keranjang belum berhasil dibersihkan.",
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (error) {
    console.error("Gagal membuat pesanan:", error);

    showToast(
      "error",
      "Pesanan gagal dibuat",
      error.message || "Terjadi kesalahan saat membuat pesanan.",
    );
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  initializeCheckout();
});
</script>

<template>
  <main class="checkout-page">
    <AppToast
      v-model="toast.visible"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="3500"
    />

    <div class="checkout-container">
      <!-- BREADCRUMB -->
      <div class="checkout-breadcrumb">
        <RouterLink to="/">Beranda</RouterLink>
        <span>/</span>
        <RouterLink to="/keranjang">Keranjang</RouterLink>
        <span>/</span>
        <span>Checkout</span>
      </div>

      <!-- HEADING -->
      <section class="checkout-heading">
        <span class="section-eyebrow">LANGKAH TERAKHIR</span>
        <h1>Checkout Pesanan</h1>
        <p>Periksa pesanan dan pastikan alamat pengirimanmu sudah benar.</p>
      </section>

      <!-- LOADING -->
      <section v-if="loadingPage" class="checkout-empty">
        <div class="checkout-loading-spinner"></div>
        <h2>Menyiapkan Checkout...</h2>
        <p>Sedang memuat keranjang dan alamat pengiriman.</p>
      </section>

      <!-- EMPTY CART -->
      <section v-else-if="isCartEmpty && !orderCreated" class="checkout-empty">
        <ShoppingBag :size="45" />

        <h2>Keranjang masih kosong</h2>

        <p>Tambahkan produk terlebih dahulu sebelum melakukan checkout.</p>

        <RouterLink to="/katalog" class="primary-button">
          Jelajahi Produk
          <ArrowRight :size="17" />
        </RouterLink>
      </section>

      <template v-else>
        <!-- PROGRESS -->
        <div v-if="!orderCreated" class="checkout-progress">
          <div class="progress-step completed">
            <span>1</span>
            <p>Keranjang</p>
          </div>

          <div class="progress-line"></div>

          <div
            class="progress-step"
            :class="{
              completed: showReview,
              active: !showReview,
            }"
          >
            <span>2</span>
            <p>Pengiriman</p>
          </div>

          <div class="progress-line"></div>

          <div class="progress-step" :class="{ active: showReview }">
            <span>3</span>
            <p>Konfirmasi</p>
          </div>
        </div>

        <div class="checkout-layout">
          <!-- MAIN CONTENT -->
          <section class="checkout-form-section">
            <!-- ================================= -->
            <!-- SUCCESS ORDER -->
            <!-- ================================= -->

            <template v-if="orderCreated">
              <div class="checkout-card order-success-card">
                <div class="review-success-icon">
                  <CheckCircle2 :size="30" />
                </div>

                <span class="success-eyebrow"> PESANAN BERHASIL DIBUAT </span>

                <h2>Terima Kasih!</h2>

                <p class="success-description">
                  Pesananmu sudah berhasil disimpan. Selanjutnya seller akan
                  mengonfirmasi biaya pengiriman.
                </p>

                <div class="order-number-box">
                  <span>Nomor Pesanan</span>
                  <strong>{{ createdOrderNumber }}</strong>
                </div>

                <div class="success-status">
                  <div class="status-icon">
                    <Truck :size="21" />
                  </div>

                  <div>
                    <strong>Menunggu Konfirmasi Ongkos Kirim</strong>
                    <p>
                      Seller sedang memeriksa pesanan dan menentukan biaya
                      pengiriman.
                    </p>
                  </div>
                </div>

                <div class="success-status">
                  <div class="status-icon">
                    <CreditCard :size="21" />
                  </div>

                  <div>
                    <strong>Pembayaran Belum Dilakukan</strong>
                    <p>
                      Kamu dapat melakukan pembayaran melalui QRIS atau transfer
                      bank setelah ongkir seluruh seller dikonfirmasi.
                    </p>
                  </div>
                </div>

                <div class="review-section">
                  <strong>Alamat Pengiriman</strong>

                  <p>
                    {{ selectedAddress?.recipient_name }}
                  </p>

                  <p>
                    {{ selectedAddress?.phone_number }}
                  </p>

                  <p>
                    {{ formatAddress(selectedAddress) }}
                  </p>
                </div>

                <div class="review-warning">
                  Simpan nomor pesananmu untuk memudahkan pengecekan status
                  pesanan berikutnya.
                </div>

                <RouterLink to="/account" class="primary-button success-button">
                  Kembali ke Akun Saya
                  <ArrowRight :size="17" />
                </RouterLink>
              </div>
            </template>

            <!-- ================================= -->
            <!-- REVIEW ORDER -->
            <!-- ================================= -->

            <template v-else-if="showReview">
              <div class="checkout-card review-card">
                <div class="review-success-icon">
                  <CheckCircle2 :size="30" />
                </div>

                <h2>Periksa Kembali Pesananmu</h2>

                <p>
                  Pastikan informasi penerima dan produk yang akan dipesan sudah
                  benar.
                </p>

                <!-- ADDRESS REVIEW -->
                <div class="review-section">
                  <div class="review-title">
                    <strong>Alamat Penerima</strong>

                    <button type="button" @click="editAddress">Ubah</button>
                  </div>

                  <template v-if="selectedAddress">
                    <div class="review-address-label">
                      {{ selectedAddress.label || "Alamat Saya" }}

                      <span v-if="selectedAddress.is_default">
                        Alamat Utama
                      </span>
                    </div>

                    <strong>
                      {{ selectedAddress.recipient_name }}
                    </strong>

                    <p>{{ selectedAddress.phone_number }}</p>

                    <p>
                      {{ formatAddress(selectedAddress) }}
                    </p>

                    <p v-if="selectedAddress.address_notes">
                      Catatan: {{ selectedAddress.address_notes }}
                    </p>
                  </template>
                </div>

                <!-- PRODUCT REVIEW -->
                <div class="review-section">
                  <strong>Produk yang Dipesan</strong>

                  <div
                    v-for="item in cartStore.items"
                    :key="item.id"
                    class="review-product"
                  >
                    <img :src="item.image" :alt="item.name" />

                    <div>
                      <strong>{{ item.name }}</strong>
                      <p>
                        {{ item.quantity }} ×
                        {{ formatCurrency(item.price) }}
                      </p>
                    </div>

                    <strong>
                      {{ formatCurrency(item.price * item.quantity) }}
                    </strong>
                  </div>
                </div>

                <!-- SHIPPING INFO -->
                <div class="review-section">
                  <strong>Pengiriman</strong>

                  <div class="review-info-row">
                    <Truck :size="20" />

                    <div>
                      <strong>Ditentukan oleh Seller</strong>

                      <p>
                        Masing-masing seller akan mengonfirmasi biaya pengiriman
                        setelah pesanan dibuat.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- PAYMENT INFO -->
                <div class="review-section">
                  <strong>Pembayaran</strong>

                  <div class="review-info-row">
                    <CreditCard :size="20" />

                    <div>
                      <strong>QRIS atau Transfer Bank</strong>

                      <p>
                        Pilihan pembayaran akan tersedia setelah semua seller
                        mengonfirmasi ongkos kirim.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- TOTAL -->
                <div class="review-total">
                  <span>Subtotal Produk</span>
                  <strong>{{ formatCurrency(subtotal) }}</strong>
                </div>

                <div class="review-warning">
                  Setelah menekan tombol Buat Pesanan, stok produk akan
                  diperbarui dan pesanan akan disimpan ke database. Kamu belum
                  perlu melakukan pembayaran sekarang.
                </div>

                <!-- ACTIONS -->
                <div class="review-actions">
                  <button
                    type="button"
                    class="secondary-button"
                    :disabled="submitting"
                    @click="editAddress"
                  >
                    <ArrowLeft :size="17" />
                    Kembali
                  </button>

                  <button
                    type="button"
                    class="primary-button"
                    :disabled="submitting"
                    @click="confirmOrder"
                  >
                    <span v-if="submitting"> Membuat Pesanan... </span>

                    <span v-else> Buat Pesanan </span>

                    <ArrowRight v-if="!submitting" :size="17" />
                  </button>
                </div>
              </div>
            </template>

            <!-- ================================= -->
            <!-- ADDRESS SELECTION -->
            <!-- ================================= -->

            <template v-else>
              <form @submit.prevent="submitAddress">
                <!-- ADDRESS CARD -->
                <div class="checkout-card">
                  <div class="checkout-card-heading">
                    <div class="heading-icon">
                      <MapPin :size="20" />
                    </div>

                    <div>
                      <h2>Alamat Pengiriman</h2>
                      <p>Pilih alamat yang sudah tersimpan di akunmu.</p>
                    </div>
                  </div>

                  <!-- ADDRESS LOADING -->
                  <div v-if="loadingAddresses" class="address-loading">
                    Memuat alamat pengiriman...
                  </div>

                  <!-- ADDRESS ERROR -->
                  <div v-else-if="addressError" class="address-empty">
                    <MapPinned :size="32" />

                    <h3>Alamat belum dapat dimuat</h3>

                    <p>{{ addressError }}</p>

                    <button
                      type="button"
                      class="secondary-button"
                      @click="fetchAddresses"
                    >
                      Coba Lagi
                    </button>
                  </div>

                  <!-- NO ADDRESS -->
                  <div v-else-if="addresses.length === 0" class="address-empty">
                    <MapPinned :size="35" />

                    <h3>Belum ada alamat tersimpan</h3>

                    <p>
                      Tambahkan alamat pengiriman melalui halaman akun sebelum
                      melanjutkan checkout.
                    </p>

                    <RouterLink to="/account" class="primary-button">
                      <Plus :size="17" />
                      Tambahkan Alamat
                    </RouterLink>
                  </div>

                  <!-- ADDRESS LIST -->
                  <div v-else class="address-list">
                    <label
                      v-for="address in addresses"
                      :key="address.id"
                      class="address-option"
                      :class="{
                        selected: selectedAddressId === address.id,
                      }"
                    >
                      <input
                        type="radio"
                        name="delivery-address"
                        :value="address.id"
                        :checked="selectedAddressId === address.id"
                        @change="selectAddress(address.id)"
                      />

                      <div class="address-option-content">
                        <div class="address-option-header">
                          <strong>
                            {{ address.label || "Alamat Saya" }}
                          </strong>

                          <span
                            v-if="address.is_default"
                            class="default-address-badge"
                          >
                            Utama
                          </span>
                        </div>

                        <strong class="address-recipient">
                          {{ address.recipient_name }}
                        </strong>

                        <span class="address-phone">
                          {{ address.phone_number }}
                        </span>

                        <p>{{ formatAddress(address) }}</p>

                        <span
                          v-if="address.address_notes"
                          class="address-notes"
                        >
                          Catatan: {{ address.address_notes }}
                        </span>
                      </div>
                    </label>

                    <RouterLink to="/account" class="manage-address-link">
                      <Plus :size="16" />
                      Kelola atau tambah alamat
                    </RouterLink>
                  </div>
                </div>

                <!-- SHIPPING AND PAYMENT INFORMATION -->
                <div class="checkout-card">
                  <div class="checkout-card-heading">
                    <div class="heading-icon">
                      <Truck :size="20" />
                    </div>

                    <div>
                      <h2>Pengiriman dan Pembayaran</h2>

                      <p>Informasi tahap selanjutnya setelah pesanan dibuat.</p>
                    </div>
                  </div>

                  <div class="checkout-process-info">
                    <div class="process-info-item">
                      <span class="process-number">1</span>

                      <div>
                        <strong>Konfirmasi Ongkos Kirim</strong>

                        <p>
                          Setiap seller akan menentukan biaya pengiriman
                          berdasarkan pesanan yang diterima.
                        </p>
                      </div>
                    </div>

                    <div class="process-info-item">
                      <span class="process-number">2</span>

                      <div>
                        <strong>Pembayaran Pesanan</strong>

                        <p>
                          Setelah seluruh seller mengonfirmasi ongkir, kamu
                          dapat membayar melalui QRIS atau transfer bank.
                        </p>
                      </div>
                    </div>

                    <div class="process-info-item">
                      <span class="process-number">3</span>

                      <div>
                        <strong>Verifikasi Pembayaran</strong>

                        <p>
                          Unggah bukti pembayaran untuk diperiksa oleh seller.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  class="primary-button form-submit"
                  :disabled="loadingAddresses || addresses.length === 0"
                >
                  Periksa Pesanan
                  <ArrowRight :size="18" />
                </button>
              </form>
            </template>
          </section>

          <!-- ================================= -->
          <!-- ORDER SUMMARY -->
          <!-- ================================= -->

          <aside v-if="!orderCreated" class="checkout-summary">
            <h2>Ringkasan Pesanan</h2>

            <div class="summary-products">
              <div
                v-for="item in cartStore.items"
                :key="item.id"
                class="summary-product"
              >
                <img :src="item.image" :alt="item.name" />

                <div class="summary-product-info">
                  <strong>{{ item.name }}</strong>

                  <span>
                    {{ item.quantity }} ×
                    {{ formatCurrency(item.price) }}
                  </span>
                </div>

                <strong class="summary-product-total">
                  {{ formatCurrency(item.price * item.quantity) }}
                </strong>
              </div>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row">
              <span>Total produk</span>
              <strong>{{ totalItems }}</strong>
            </div>

            <div class="summary-row">
              <span>Subtotal</span>
              <strong>{{ formatCurrency(subtotal) }}</strong>
            </div>

            <div class="summary-row">
              <span>Ongkos kirim</span>
              <span class="pending-text"> Belum dihitung </span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-total">
              <span>Total sementara</span>

              <strong>
                {{ formatCurrency(subtotal) }}
              </strong>
            </div>

            <p class="summary-note">
              Total akhir akan diperbarui setelah seluruh seller mengonfirmasi
              biaya pengiriman.
            </p>

            <div class="secure-info">
              <ShieldCheck :size="20" />

              <span>
                Transaksi diproses melalui sistem pesanan KriyaLoka.
              </span>
            </div>

            <RouterLink to="/keranjang" class="back-to-cart">
              <ArrowLeft :size="16" />
              Kembali ke keranjang
            </RouterLink>
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.checkout-page {
  min-height: 75vh;
  padding: 38px 0 90px;
  background: #fbf7f2;
  color: #302820;
}

.checkout-container {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
}

/* BREADCRUMB */

.checkout-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 35px;
  color: #988b7e;
  font-size: 13px;
}

.checkout-breadcrumb a {
  color: #943c14;
  text-decoration: none;
}

/* HEADING */

.checkout-heading {
  margin-bottom: 30px;
}

.section-eyebrow {
  color: #a65b36;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.checkout-heading h1 {
  margin: 9px 0;
  font-size: clamp(30px, 4vw, 42px);
  letter-spacing: -1.5px;
}

.checkout-heading p {
  margin: 0;
  color: #85796e;
  font-size: 14px;
}

/* PROGRESS */

.checkout-progress {
  display: flex;
  max-width: 600px;
  align-items: center;
  margin: 0 auto 35px;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #a99b8d;
}

.progress-step span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid #ded2c6;
  border-radius: 50%;
  background: #fffdf9;
  font-size: 13px;
  font-weight: 700;
}

.progress-step p {
  margin: 0;
  font-size: 11px;
  white-space: nowrap;
}

.progress-step.active,
.progress-step.completed {
  color: #943c14;
}

.progress-step.active span,
.progress-step.completed span {
  border-color: #943c14;
  background: #943c14;
  color: white;
}

.progress-line {
  height: 1px;
  flex: 1;
  margin: 0 12px 20px;
  background: #dfd2c5;
}

/* LAYOUT */

.checkout-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 370px;
  align-items: start;
  gap: 28px;
}

.checkout-form-section {
  min-width: 0;
}

.checkout-card,
.checkout-summary {
  margin-bottom: 20px;
  padding: 25px;
  border: 1px solid #e9dfd5;
  border-radius: 14px;
  background: #fffdf9;
}

.checkout-card-heading {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 25px;
}

.heading-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  background: #f5e9df;
  color: #943c14;
}

.checkout-card-heading h2 {
  margin: 0 0 5px;
  font-size: 17px;
}

.checkout-card-heading p {
  margin: 0;
  color: #94877b;
  font-size: 12px;
}

/* BUTTONS */

.primary-button,
.secondary-button {
  display: inline-flex;
  min-height: 47px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: 0.2s ease;
}

.primary-button {
  background: #943c14;
  color: white;
}

.primary-button:hover {
  background: #74300f;
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.secondary-button {
  border: 1px solid #e4d9ce;
  background: white;
  color: #725e4c;
}

.form-submit {
  width: 100%;
}

/* ADDRESS */

.address-loading {
  padding: 30px 15px;
  color: #94877b;
  font-size: 13px;
  text-align: center;
}

.address-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 35px 20px;
  border: 1px dashed #dfd1c3;
  border-radius: 10px;
  background: #fdf9f4;
  color: #a65b36;
  text-align: center;
}

.address-empty h3 {
  margin: 15px 0 7px;
  color: #302820;
  font-size: 15px;
}

.address-empty p {
  max-width: 390px;
  margin: 0 0 18px;
  color: #94877b;
  font-size: 12px;
  line-height: 1.7;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.address-option {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 17px;
  border: 1px solid #e8ded4;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: 0.2s ease;
}

.address-option:hover {
  border-color: #c69b7c;
}

.address-option.selected {
  border-color: #a65b36;
  background: #fbf3ed;
}

.address-option input {
  margin-top: 4px;
  accent-color: #943c14;
}

.address-option-content {
  flex: 1;
  min-width: 0;
}

.address-option-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin-bottom: 12px;
}

.address-option-header > strong {
  color: #943c14;
  font-size: 13px;
}

.default-address-badge {
  padding: 4px 8px;
  border-radius: 20px;
  background: #e8f1e9;
  color: #28613e;
  font-size: 10px;
  font-weight: 700;
}

.address-recipient {
  display: block;
  color: #302820;
  font-size: 13px;
}

.address-phone {
  display: block;
  margin-top: 5px;
  color: #85796e;
  font-size: 12px;
}

.address-option-content p {
  margin: 9px 0 0;
  color: #72665b;
  font-size: 12px;
  line-height: 1.7;
}

.address-notes {
  display: block;
  margin-top: 8px;
  color: #94877b;
  font-size: 11px;
  line-height: 1.6;
}

.manage-address-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  align-self: flex-start;
  margin-top: 7px;
  color: #943c14;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.manage-address-link:hover {
  color: #74300f;
}

/* SHIPPING AND PAYMENT INFORMATION */

.checkout-process-info {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.process-info-item {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 15px;
  border: 1px solid #e9dfd5;
  border-radius: 9px;
  background: #fdf9f4;
}

.process-number {
  display: grid;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: #f1e3d8;
  color: #943c14;
  font-size: 12px;
  font-weight: 800;
}

.process-info-item strong {
  color: #49372a;
  font-size: 13px;
}

.process-info-item p {
  margin: 7px 0 0;
  color: #897c70;
  font-size: 12px;
  line-height: 1.7;
}

/* SUMMARY */

.checkout-summary {
  position: sticky;
  top: 25px;
}

.checkout-summary h2 {
  margin: 0 0 22px;
  font-size: 19px;
}

.summary-products {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.summary-product {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.summary-product img {
  width: 58px;
  height: 58px;
  border-radius: 7px;
  object-fit: cover;
  background: #f5eee7;
}

.summary-product-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.summary-product-info strong {
  overflow: hidden;
  color: #45372c;
  font-size: 12px;
  text-overflow: ellipsis;
}

.summary-product-info span {
  color: #96897c;
  font-size: 11px;
}

.summary-product-total {
  display: none;
}

.summary-divider {
  height: 1px;
  margin: 22px 0;
  background: #e9dfd5;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  color: #817568;
  font-size: 12px;
}

.summary-row strong {
  color: #3c3027;
}

.pending-text {
  color: #a35b37;
  font-size: 11px;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
}

.summary-total strong {
  color: #943c14;
  font-size: 18px;
}

.summary-note {
  margin: 15px 0;
  color: #95887b;
  font-size: 11px;
  line-height: 1.7;
}

.secure-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #eee5dc;
  color: #6f8065;
}

.secure-info span {
  color: #817568;
  font-size: 11px;
  line-height: 1.6;
}

.back-to-cart {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 22px;
  color: #943c14;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

/* REVIEW */

.review-card {
  text-align: left;
}

.review-success-icon {
  display: grid;
  width: 55px;
  height: 55px;
  place-items: center;
  border-radius: 50%;
  background: #e8f1e9;
  color: #28613e;
}

.review-card h2 {
  margin: 18px 0 7px;
  font-size: 20px;
}

.review-card > p {
  color: #94877b;
  font-size: 12px;
  line-height: 1.7;
}

.review-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee5dc;
}

.review-title {
  display: flex;
  justify-content: space-between;
  margin-bottom: 13px;
}

.review-title strong,
.review-section > strong {
  font-size: 13px;
}

.review-title button {
  border: none;
  background: transparent;
  color: #943c14;
  font-size: 12px;
  cursor: pointer;
}

.review-section p {
  margin: 7px 0 0;
  color: #817568;
  font-size: 12px;
  line-height: 1.7;
}

.review-address-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #943c14;
  font-size: 12px;
  font-weight: 700;
}

.review-address-label span {
  padding: 4px 7px;
  border-radius: 15px;
  background: #e8f1e9;
  color: #28613e;
  font-size: 10px;
}

/* REVIEW PRODUCTS */

.review-product {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 15px;
}

.review-product img {
  width: 52px;
  height: 52px;
  border-radius: 7px;
  object-fit: cover;
  background: #f5eee7;
}

.review-product > div {
  min-width: 0;
}

.review-product > div strong {
  font-size: 12px;
}

.review-product > div p {
  font-size: 11px;
}

.review-product > strong {
  font-size: 12px;
}

/* REVIEW INFORMATION */

.review-info-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 14px;
  color: #943c14;
}

.review-info-row div {
  flex: 1;
}

.review-info-row strong {
  color: #49372a;
  font-size: 12px;
}

.review-info-row p {
  margin: 6px 0 0;
  color: #897c70;
  font-size: 11px;
  line-height: 1.7;
}

.review-total {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee5dc;
  font-size: 13px;
}

.review-total strong {
  color: #943c14;
  font-size: 17px;
}

.review-warning {
  margin-top: 22px;
  padding: 14px;
  border-radius: 8px;
  background: #fbf0e5;
  color: #87522e;
  font-size: 12px;
  line-height: 1.7;
}

.review-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 22px;
}

.review-actions > button {
  flex: 1;
}

/* SUCCESS */

.order-success-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.success-eyebrow {
  margin-top: 10px;
  color: #28613e;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.order-success-card h2 {
  margin: 8px 0;
  font-size: 27px;
}

.success-description {
  color: #817568;
  font-size: 13px;
  line-height: 1.7;
}

.order-number-box {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  flex-direction: column;
  gap: 8px;
  margin-top: 18px;
  padding: 17px;
  border: 1px dashed #cba98f;
  border-radius: 9px;
  background: #fbf3ed;
}

.order-number-box span {
  color: #897c70;
  font-size: 11px;
}

.order-number-box strong {
  color: #943c14;
  font-size: 17px;
  overflow-wrap: anywhere;
}

.success-status {
  display: flex;
  width: 100%;
  box-sizing: border-box;
  align-items: flex-start;
  gap: 12px;
  margin-top: 15px;
  padding: 15px;
  border: 1px solid #e9dfd5;
  border-radius: 9px;
  background: #fdf9f4;
}

.status-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 9px;
  background: #f1e3d8;
  color: #943c14;
}

.success-status strong {
  color: #49372a;
  font-size: 12px;
}

.success-status p {
  margin: 6px 0 0;
  color: #897c70;
  font-size: 11px;
  line-height: 1.7;
}

.success-button {
  margin-top: 20px;
}

/* EMPTY CART */

.checkout-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 65px 20px;
  border: 1px solid #e9dfd5;
  border-radius: 14px;
  background: #fffdf9;
  color: #a65b36;
  text-align: center;
}

.checkout-empty h2 {
  margin: 20px 0 8px;
  color: #302820;
}

.checkout-empty p {
  margin: 0 0 20px;
  color: #94877b;
  font-size: 13px;
}

/* LOADING */

.checkout-loading-spinner {
  width: 34px;
  height: 34px;
  margin-bottom: 15px;
  border: 3px solid #e7ddcf;
  border-top-color: #943c14;
  border-radius: 50%;
  animation: checkout-spin 0.8s linear infinite;
}

@keyframes checkout-spin {
  to {
    transform: rotate(360deg);
  }
}

/* RESPONSIVE */

@media (max-width: 900px) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }

  .checkout-summary {
    position: static;
  }
}

@media (max-width: 600px) {
  .checkout-container {
    width: calc(100% - 30px);
  }

  .checkout-page {
    padding-top: 25px;
  }

  .checkout-card,
  .checkout-summary {
    padding: 18px;
  }

  .checkout-progress {
    margin-bottom: 25px;
  }

  .progress-line {
    margin-right: 7px;
    margin-left: 7px;
  }

  .review-actions {
    flex-direction: column;
  }

  .review-actions > button {
    width: 100%;
  }

  .review-product {
    grid-template-columns: 45px minmax(0, 1fr);
  }

  .review-product img {
    width: 45px;
    height: 45px;
  }

  .review-product > strong {
    grid-column: 2;
  }
}
</style>
