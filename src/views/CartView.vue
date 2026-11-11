<script setup>
import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingCart,
  ShieldCheck,
  Truck,
  PackageCheck,
  ArrowLeft,
} from "lucide-vue-next";
import { useCartStore } from "../stores/cart.js";

const cartStore = useCartStore();
const router = useRouter()

const notification = ref("");
const notificationType = ref("success");
let notificationTimer;

const isEmpty = computed(() => cartStore.items.length === 0);

const formatCurrency = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const showNotification = (message, type = "success") => {
  notification.value = message;
  notificationType.value = type;

  clearTimeout(notificationTimer);

  notificationTimer = setTimeout(() => {
    notification.value = "";
  }, 3000);
};

const increaseQuantity = (item) => {
  if (item.quantity >= item.stock) {
    showNotification(
      `Stok ${item.name} hanya tersedia ${item.stock} produk.`,
      "error",
    );
    return;
  }

  cartStore.updateQuantity(item.id, item.quantity + 1);
};

const decreaseQuantity = (item) => {
  cartStore.updateQuantity(item.id, item.quantity - 1);
};

const removeItem = (item) => {
  cartStore.removeItem(item.id);
  showNotification(`${item.name} dihapus dari keranjang.`);
};

const clearCart = () => {
  cartStore.clearCart();
  showNotification("Keranjang berhasil dikosongkan.");
};

const handleCheckout = () => {
  if (cartStore.items.length === 0) return

  router.push('/checkout')
};
</script>

<template>
  <main class="cart-page">
    <div class="cart-container">
      <!-- Breadcrumb -->
      <div class="cart-breadcrumb">
        <RouterLink to="/">Beranda</RouterLink>
        <span>/</span>
        <span>Keranjang</span>
      </div>

      <!-- Heading -->
      <section class="cart-heading">
        <div>
          <span class="section-eyebrow">PESANAN KAMU</span>
          <h1>Keranjang Belanja</h1>
          <p>Periksa kembali produk pilihanmu sebelum melanjutkan pesanan.</p>
        </div>

        <div v-if="!isEmpty" class="cart-total-items">
          <ShoppingBag :size="18" />
          <span>{{ cartStore.totalItems }} produk</span>
        </div>
      </section>

      <!-- Notification -->
      <Transition name="notification">
        <div
          v-if="notification"
          class="cart-notification"
          :class="notificationType"
        >
          {{ notification }}
        </div>
      </Transition>

      <!-- Empty Cart -->
      <section v-if="isEmpty" class="empty-cart">
        <div class="empty-cart-icon">
          <ShoppingCart :size="42" :stroke-width="1.5" />
        </div>

        <h2>Keranjangmu masih kosong</h2>

        <p>
          Sepertinya kamu belum menemukan produk yang ingin dibawa pulang. Yuk,
          jelajahi karya terbaik dari para pengrajin lokal Bali.
        </p>

        <RouterLink to="/katalog" class="primary-button">
          Mulai Jelajahi Produk
          <ArrowRight :size="18" />
        </RouterLink>
      </section>

      <!-- Cart Content -->
      <section v-else class="cart-layout">
        <!-- Product List -->
        <div class="cart-items-section">
          <div class="cart-list-header">
            <h2>Produk Pilihanmu</h2>

            <button class="clear-cart-button" @click="clearCart">
              Kosongkan keranjang
            </button>
          </div>

          <article
            v-for="item in cartStore.items"
            :key="item.id"
            class="cart-item"
          >
            <!-- Product Image -->
            <RouterLink :to="`/produk/${item.id}`" class="cart-item-image">
              <img :src="item.image" :alt="item.name" />
            </RouterLink>

            <!-- Product Information -->
            <div class="cart-item-info">
              <span class="cart-item-artisan">
                {{ item.artisan }}
              </span>

              <RouterLink :to="`/produk/${item.id}`" class="cart-item-name">
                {{ item.name }}
              </RouterLink>

              <span class="cart-item-price">
                {{ formatCurrency(item.price) }}
              </span>

              <span class="cart-item-stock">
                Stok tersedia: {{ item.stock }}
              </span>

              <!-- Quantity and Remove -->
              <div class="cart-item-actions">
                <div class="quantity-control">
                  <button
                    aria-label="Kurangi jumlah"
                    :disabled="item.quantity <= 1"
                    @click="decreaseQuantity(item)"
                  >
                    <Minus :size="15" />
                  </button>

                  <span>{{ item.quantity }}</span>

                  <button
                    aria-label="Tambah jumlah"
                    :disabled="item.quantity >= item.stock"
                    @click="increaseQuantity(item)"
                  >
                    <Plus :size="15" />
                  </button>
                </div>

                <button class="remove-item-button" @click="removeItem(item)">
                  <Trash2 :size="15" />
                  Hapus
                </button>
              </div>
            </div>

            <!-- Subtotal Per Item -->
            <div class="cart-item-subtotal">
              <span>Subtotal</span>
              <strong>
                {{ formatCurrency(item.price * item.quantity) }}
              </strong>
            </div>
          </article>

          <RouterLink to="/katalog" class="continue-shopping">
            <ArrowLeft :size="17" />
            Lanjutkan Belanja
          </RouterLink>
        </div>

        <!-- Order Summary -->
        <aside class="order-summary">
          <h2>Ringkasan Pesanan</h2>

          <div class="summary-row">
            <span>Total produk</span>
            <strong>{{ cartStore.totalItems }} produk</strong>
          </div>

          <div class="summary-row">
            <span>Subtotal</span>
            <strong>{{ formatCurrency(cartStore.subtotal) }}</strong>
          </div>

          <div class="summary-row shipping-row">
            <span>Ongkos kirim</span>
            <span>Belum dihitung</span>
          </div>

          <div class="summary-divider"></div>

          <div class="summary-total">
            <span>Total sementara</span>
            <strong>{{ formatCurrency(cartStore.subtotal) }}</strong>
          </div>

          <p class="shipping-note">
            Ongkos kirim dan total pembayaran akhir akan dihitung setelah alamat
            pengiriman ditentukan.
          </p>

          <button class="checkout-button" @click="handleCheckout">
            Lanjut ke Checkout
            <ArrowRight :size="18" />
          </button>

          <div class="summary-benefits">
            <div>
              <ShieldCheck :size="19" />
              <span>Belanja lebih nyaman</span>
            </div>

            <div>
              <PackageCheck :size="19" />
              <span>Produk dari pengrajin lokal</span>
            </div>

            <div>
              <Truck :size="19" />
              <span>Pengiriman ke seluruh Indonesia</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  </main>
</template>

<style scoped>
.cart-page {
  min-height: 70vh;
  padding: 38px 0 90px;
  background: #fbf7f2;
  color: #302820;
}

.cart-container {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
}

/* Breadcrumb */
.cart-breadcrumb {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 36px;
  color: #988b7e;
  font-size: 13px;
}

.cart-breadcrumb a {
  color: #943c14;
  text-decoration: none;
}

/* Heading */
.cart-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 32px;
}

.section-eyebrow {
  color: #a65b36;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.cart-heading h1 {
  margin: 9px 0;
  font-size: clamp(30px, 4vw, 42px);
  letter-spacing: -1.5px;
}

.cart-heading p {
  margin: 0;
  color: #85796e;
  font-size: 14px;
}

.cart-total-items {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 16px;
  border: 1px solid #e6ddd3;
  border-radius: 30px;
  color: #6b5c4e;
  font-size: 13px;
  font-weight: 600;
}

/* Notification */
.cart-notification {
  margin-bottom: 20px;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 13px;
}

.cart-notification.success {
  background: #e8f1e9;
  color: #28613e;
}

.cart-notification.error {
  background: #f9e9e3;
  color: #a13e24;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.2s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Empty Cart */
.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 75px 20px;
  border: 1px solid #e9dfd5;
  border-radius: 18px;
  background: #fffdf9;
  text-align: center;
}

.empty-cart-icon {
  display: grid;
  width: 90px;
  height: 90px;
  place-items: center;
  border-radius: 50%;
  background: #f3e9de;
  color: #a6532f;
}

.empty-cart h2 {
  margin: 25px 0 10px;
  font-size: 24px;
}

.empty-cart p {
  max-width: 460px;
  margin: 0 0 25px;
  color: #887c70;
  font-size: 14px;
  line-height: 1.8;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 22px;
  border-radius: 9px;
  background: #943c14;
  color: white;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.primary-button:hover,
.checkout-button:hover {
  background: #74300f;
}

/* Cart Layout */
.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 350px;
  align-items: start;
  gap: 28px;
}

.cart-items-section {
  min-width: 0;
}

.cart-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 15px;
}

.cart-list-header h2,
.order-summary h2 {
  margin: 0;
  font-size: 19px;
  letter-spacing: -0.4px;
}

.clear-cart-button {
  border: none;
  background: transparent;
  color: #a34c2d;
  font-size: 12px;
  cursor: pointer;
}

/* Cart Item */
.cart-item {
  display: grid;
  grid-template-columns: 125px minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  margin-bottom: 14px;
  padding: 18px;
  border: 1px solid #e9dfd5;
  border-radius: 13px;
  background: #fffdf9;
}

.cart-item-image {
  display: block;
  overflow: hidden;
  width: 125px;
  height: 125px;
  border-radius: 9px;
  background: #f1e9df;
}

.cart-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-item-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.cart-item-artisan {
  margin-bottom: 6px;
  color: #9b7257;
  font-size: 11px;
}

.cart-item-name {
  margin-bottom: 7px;
  color: #302820;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  text-decoration: none;
}

.cart-item-price {
  color: #943c14;
  font-size: 14px;
  font-weight: 700;
}

.cart-item-stock {
  margin-top: 5px;
  color: #94877b;
  font-size: 11px;
}

.cart-item-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  margin-top: 15px;
}

.quantity-control {
  display: flex;
  height: 32px;
  align-items: center;
  border: 1px solid #e4d9ce;
  border-radius: 7px;
  background: #fff;
}

.quantity-control button {
  display: grid;
  width: 32px;
  height: 30px;
  place-items: center;
  border: none;
  background: transparent;
  color: #725e4c;
  cursor: pointer;
}

.quantity-control button:disabled {
  color: #c9c0b7;
  cursor: not-allowed;
}

.quantity-control span {
  min-width: 25px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
}

.remove-item-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  color: #a34c2d;
  font-size: 12px;
  cursor: pointer;
}

.cart-item-subtotal {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  white-space: nowrap;
}

.cart-item-subtotal span {
  color: #96897c;
  font-size: 11px;
}

.cart-item-subtotal strong {
  color: #3d3026;
  font-size: 13px;
}

.continue-shopping {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  color: #943c14;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

/* Order Summary */
.order-summary {
  position: sticky;
  top: 25px;
  padding: 25px;
  border: 1px solid #e9dfd5;
  border-radius: 14px;
  background: #fffdf9;
}

.order-summary h2 {
  margin-bottom: 25px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 17px;
  color: #817568;
  font-size: 13px;
}

.summary-row strong {
  color: #3c3027;
  font-weight: 700;
}

.shipping-row span:last-child {
  color: #a35b37;
  font-size: 11px;
  text-align: right;
}

.summary-divider {
  height: 1px;
  margin: 22px 0;
  background: #e9dfd5;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
}

.summary-total strong {
  color: #943c14;
  font-size: 19px;
}

.shipping-note {
  margin: 15px 0 20px;
  color: #95887b;
  font-size: 11px;
  line-height: 1.7;
}

.checkout-button {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: none;
  border-radius: 8px;
  background: #943c14;
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}

/* Benefits */
.summary-benefits {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #eee5dc;
}

.summary-benefits div {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6f8065;
}

.summary-benefits span {
  color: #817568;
  font-size: 11px;
}

/* Responsive */
@media (max-width: 900px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .order-summary {
    position: static;
  }
}

@media (max-width: 600px) {
  .cart-container {
    width: min(100% - 30px, 1180px);
  }

  .cart-page {
    padding-top: 25px;
  }

  .cart-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .cart-item {
    grid-template-columns: 90px minmax(0, 1fr);
    gap: 13px;
    padding: 13px;
  }

  .cart-item-image {
    width: 90px;
    height: 100px;
  }

  .cart-item-name {
    font-size: 13px;
  }

  .cart-item-subtotal {
    grid-column: 2;
    align-items: flex-start;
  }

  .cart-item-subtotal span {
    display: none;
  }

  .cart-list-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-summary {
    padding: 20px;
  }
}
</style>
