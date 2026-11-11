<script setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
  CheckCircle2,
} from "lucide-vue-next";
import { useCartStore } from "../stores/cart.js";

const cartStore = useCartStore();

const form = ref({
  recipient: "",
  phone: "",
  province: "",
  city: "",
  district: "",
  postalCode: "",
  address: "",
  notes: "",
  shipping: "regular",
  payment: "bank_transfer",
});

const showReview = ref(false);
const notification = ref("");

const shippingOptions = [
  {
    id: "regular",
    name: "Reguler",
    description: "Pengiriman standar",
  },
  {
    id: "express",
    name: "Express",
    description: "Pengiriman lebih cepat",
  },
];

const paymentOptions = [
  {
    id: "bank_transfer",
    name: "Transfer Bank",
    description: "Pembayaran melalui transfer bank",
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    description: "Pembayaran melalui dompet digital",
  },
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const selectedShipping = computed(() =>
  shippingOptions.find((item) => item.id === form.value.shipping),
);

const selectedPayment = computed(() =>
  paymentOptions.find((item) => item.id === form.value.payment),
);

const subtotal = computed(() => cartStore.subtotal);

const isCartEmpty = computed(() => cartStore.items.length === 0);

const submitAddress = () => {
  showReview.value = true;
  notification.value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const editAddress = () => {
  showReview.value = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const confirmOrder = () => {
  notification.value =
    "Form checkout berhasil diperiksa. Integrasi database pesanan dan pembayaran belum tersedia.";
};
</script>

<template>
  <main class="checkout-page">
    <div class="checkout-container">
      <!-- Breadcrumb -->
      <div class="checkout-breadcrumb">
        <RouterLink to="/">Beranda</RouterLink>
        <span>/</span>
        <RouterLink to="/keranjang">Keranjang</RouterLink>
        <span>/</span>
        <span>Checkout</span>
      </div>

      <!-- Heading -->
      <section class="checkout-heading">
        <span class="section-eyebrow">LANGKAH TERAKHIR</span>
        <h1>Checkout Pesanan</h1>
        <p>Lengkapi informasi pengiriman untuk melanjutkan pesananmu.</p>
      </section>

      <!-- Empty Cart -->
      <section v-if="isCartEmpty" class="checkout-empty">
        <ShoppingBag :size="45" />
        <h2>Keranjang masih kosong</h2>
        <p>Tambahkan produk terlebih dahulu sebelum melakukan checkout.</p>
        <RouterLink to="/katalog" class="primary-button">
          Jelajahi Produk
          <ArrowRight :size="17" />
        </RouterLink>
      </section>

      <template v-else>
        <!-- Progress -->
        <div class="checkout-progress">
          <div class="progress-step completed">
            <span>1</span>
            <p>Keranjang</p>
          </div>

          <div class="progress-line"></div>

          <div
            class="progress-step"
            :class="{ completed: showReview, active: !showReview }"
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

        <div v-if="notification" class="checkout-notification">
          {{ notification }}
        </div>

        <div class="checkout-layout">
          <!-- Main Form -->
          <section class="checkout-form-section">
            <template v-if="!showReview">
              <form @submit.prevent="submitAddress">
                <!-- Address -->
                <div class="checkout-card">
                  <div class="checkout-card-heading">
                    <div class="heading-icon">
                      <MapPin :size="20" />
                    </div>

                    <div>
                      <h2>Alamat Pengiriman</h2>
                      <p>Masukkan alamat lengkap penerima pesanan.</p>
                    </div>
                  </div>

                  <div class="form-grid">
                    <div class="form-group full">
                      <label for="recipient">Nama penerima *</label>
                      <input
                        id="recipient"
                        v-model.trim="form.recipient"
                        type="text"
                        placeholder="Nama lengkap penerima"
                        required
                      />
                    </div>

                    <div class="form-group full">
                      <label for="phone">Nomor telepon *</label>
                      <input
                        id="phone"
                        v-model.trim="form.phone"
                        type="tel"
                        placeholder="Contoh: 081234567890"
                        pattern="[0-9+ -]{9,16}"
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label for="province">Provinsi *</label>
                      <input
                        id="province"
                        v-model.trim="form.province"
                        type="text"
                        placeholder="Nama provinsi"
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label for="city">Kota / Kabupaten *</label>
                      <input
                        id="city"
                        v-model.trim="form.city"
                        type="text"
                        placeholder="Nama kota atau kabupaten"
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label for="district">Kecamatan *</label>
                      <input
                        id="district"
                        v-model.trim="form.district"
                        type="text"
                        placeholder="Nama kecamatan"
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label for="postalCode">Kode pos *</label>
                      <input
                        id="postalCode"
                        v-model.trim="form.postalCode"
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]{5}"
                        maxlength="5"
                        placeholder="Contoh: 80225"
                        required
                      />
                    </div>

                    <div class="form-group full">
                      <label for="address">Alamat lengkap *</label>
                      <textarea
                        id="address"
                        v-model.trim="form.address"
                        rows="4"
                        placeholder="Nama jalan, nomor rumah, banjar, patokan, dan detail lainnya"
                        required
                      ></textarea>
                    </div>

                    <div class="form-group full">
                      <label for="notes">
                        Catatan untuk kurir
                        <span>(Opsional)</span>
                      </label>
                      <textarea
                        id="notes"
                        v-model.trim="form.notes"
                        rows="2"
                        placeholder="Contoh: Rumah pagar hitam di sebelah minimarket."
                      ></textarea>
                    </div>
                  </div>
                </div>

                <!-- Shipping -->
                <div class="checkout-card">
                  <div class="checkout-card-heading">
                    <div class="heading-icon">
                      <Truck :size="20" />
                    </div>

                    <div>
                      <h2>Metode Pengiriman</h2>
                      <p>Pilih jenis pengiriman yang diinginkan.</p>
                    </div>
                  </div>

                  <div class="option-list">
                    <label
                      v-for="option in shippingOptions"
                      :key="option.id"
                      class="option-card"
                      :class="{ selected: form.shipping === option.id }"
                    >
                      <input
                        v-model="form.shipping"
                        type="radio"
                        :value="option.id"
                        name="shipping"
                      />

                      <div class="option-content">
                        <strong>{{ option.name }}</strong>
                        <span>{{ option.description }}</span>
                      </div>

                      <span class="option-price"> Dihitung nanti </span>
                    </label>
                  </div>

                  <p class="form-info">
                    Biaya pengiriman belum tersedia. Estimasi ongkir akan
                    ditentukan setelah integrasi layanan kurir.
                  </p>
                </div>

                <!-- Payment -->
                <div class="checkout-card">
                  <div class="checkout-card-heading">
                    <div class="heading-icon">
                      <CreditCard :size="20" />
                    </div>

                    <div>
                      <h2>Metode Pembayaran</h2>
                      <p>Pilih metode pembayaran yang diinginkan.</p>
                    </div>
                  </div>

                  <div class="option-list">
                    <label
                      v-for="option in paymentOptions"
                      :key="option.id"
                      class="option-card"
                      :class="{ selected: form.payment === option.id }"
                    >
                      <input
                        v-model="form.payment"
                        type="radio"
                        :value="option.id"
                        name="payment"
                      />

                      <div class="option-content">
                        <strong>{{ option.name }}</strong>
                        <span>{{ option.description }}</span>
                      </div>
                    </label>
                  </div>

                  <p class="form-info">
                    Pilihan pembayaran ini masih berupa rancangan antarmuka.
                    Belum ada transaksi atau pembayaran yang diproses.
                  </p>
                </div>

                <button type="submit" class="primary-button form-submit">
                  Periksa Pesanan
                  <ArrowRight :size="18" />
                </button>
              </form>
            </template>

            <!-- Review -->
            <template v-else>
              <div class="checkout-card review-card">
                <div class="review-success-icon">
                  <CheckCircle2 :size="30" />
                </div>

                <h2>Periksa Kembali Pesananmu</h2>
                <p>
                  Pastikan informasi penerima dan pilihan pengiriman sudah
                  benar.
                </p>

                <div class="review-section">
                  <div class="review-title">
                    <strong>Alamat Penerima</strong>
                    <button type="button" @click="editAddress">Ubah</button>
                  </div>

                  <strong>{{ form.recipient }}</strong>
                  <p>{{ form.phone }}</p>
                  <p>
                    {{ form.address }}, {{ form.district }}, {{ form.city }},
                    {{ form.province }},
                    {{ form.postalCode }}
                  </p>

                  <p v-if="form.notes">Catatan: {{ form.notes }}</p>
                </div>

                <div class="review-section">
                  <div class="review-title">
                    <strong>Pengiriman</strong>
                    <button type="button" @click="editAddress">Ubah</button>
                  </div>

                  <strong>{{ selectedShipping?.name }}</strong>
                  <p>{{ selectedShipping?.description }}</p>
                  <p>Ongkos kirim belum dihitung.</p>
                </div>

                <div class="review-section">
                  <div class="review-title">
                    <strong>Pembayaran</strong>
                    <button type="button" @click="editAddress">Ubah</button>
                  </div>

                  <strong>{{ selectedPayment?.name }}</strong>
                  <p>{{ selectedPayment?.description }}</p>
                </div>

                <div class="review-warning">
                  Ini masih tahap pemeriksaan data. Pesanan belum disimpan ke
                  database dan belum ada pembayaran yang dilakukan.
                </div>

                <div class="review-actions">
                  <button
                    type="button"
                    class="secondary-button"
                    @click="editAddress"
                  >
                    <ArrowLeft :size="17" />
                    Kembali
                  </button>

                  <button
                    type="button"
                    class="primary-button"
                    @click="confirmOrder"
                  >
                    Konfirmasi Data
                    <ArrowRight :size="17" />
                  </button>
                </div>
              </div>
            </template>
          </section>

          <!-- Order Summary -->
          <aside class="checkout-summary">
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
                  <span
                    >{{ item.quantity }} ×
                    {{ formatCurrency(item.price) }}</span
                  >
                </div>

                <strong class="summary-product-total">
                  {{ formatCurrency(item.price * item.quantity) }}
                </strong>
              </div>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-row">
              <span>Total produk</span>
              <strong>{{ cartStore.totalItems }}</strong>
            </div>

            <div class="summary-row">
              <span>Subtotal</span>
              <strong>{{ formatCurrency(subtotal) }}</strong>
            </div>

            <div class="summary-row">
              <span>Ongkos kirim</span>
              <span class="pending-text">Belum dihitung</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-total">
              <span>Total sementara</span>
              <strong>{{ formatCurrency(subtotal) }}</strong>
            </div>

            <p class="summary-note">
              Total akhir akan diperbarui setelah biaya pengiriman dan
              pembayaran terintegrasi.
            </p>

            <div class="secure-info">
              <ShieldCheck :size="20" />
              <span>Informasi pesanan ditampilkan untuk pemeriksaan.</span>
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

/* Progress */
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

/* Layout */
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

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full {
  grid-column: 1 / -1;
}

.form-group label {
  color: #514438;
  font-size: 12px;
  font-weight: 700;
}

.form-group label span {
  color: #a29487;
  font-weight: 400;
}

.form-group input,
.form-group textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 14px;
  border: 1px solid #e4d9ce;
  border-radius: 8px;
  outline: none;
  background: #fff;
  color: #302820;
  font: inherit;
  font-size: 13px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #a65b36;
}

.form-group textarea {
  resize: vertical;
  line-height: 1.6;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #b5a99e;
}

/* Options */
.option-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 16px;
  border: 1px solid #e8ded4;
  border-radius: 9px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background 0.2s;
}

.option-card.selected {
  border-color: #a65b36;
  background: #fbf3ed;
}

.option-card input {
  accent-color: #943c14;
}

.option-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}

.option-content strong {
  font-size: 13px;
}

.option-content span {
  color: #94877b;
  font-size: 11px;
}

.option-price {
  color: #a35b37;
  font-size: 11px;
}

.form-info {
  margin: 15px 0 0;
  color: #938679;
  font-size: 11px;
  line-height: 1.7;
}

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
}

.primary-button {
  background: #943c14;
  color: white;
}

.primary-button:hover {
  background: #74300f;
}

.form-submit {
  width: 100%;
}

.secondary-button {
  border: 1px solid #e4d9ce;
  background: white;
  color: #725e4c;
}

/* Summary */
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

/* Review */
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

.review-title strong {
  font-size: 13px;
}

.review-title button {
  border: none;
  background: transparent;
  color: #943c14;
  font-size: 12px;
  cursor: pointer;
}

.review-section > strong {
  font-size: 13px;
}

.review-section p {
  margin: 7px 0 0;
  color: #817568;
  font-size: 12px;
  line-height: 1.7;
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

.checkout-notification {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ead5bd;
  border-radius: 9px;
  background: #fbf0e5;
  color: #87522e;
  font-size: 12px;
  line-height: 1.7;
}

/* Empty Cart */
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

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-group.full {
    grid-column: auto;
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

  .review-actions button {
    width: 100%;
  }
}
</style>
