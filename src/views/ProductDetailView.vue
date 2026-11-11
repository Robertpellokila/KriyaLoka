<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, RouterLink } from "vue-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-vue-next";

import ProductCard from "../components/product/ProductCard.vue";
import { products } from "../data/products.js";
import { useCartStore } from "../stores/cart.js";

const route = useRoute();
const cartStore = useCartStore();

const quantity = ref(1);
const selectedImage = ref("");
const activeTab = ref("description");
const notification = ref("");
const notificationType = ref("success");

const product = computed(() => {
  return products.find((item) => String(item.id) === String(route.params.id));
});

const gallery = computed(() => {
  if (!product.value) return [];

  return product.value.gallery?.length
    ? product.value.gallery
    : [product.value.image];
});

const relatedProducts = computed(() => {
  if (!product.value) return [];

  return products
    .filter(
      (item) =>
        item.id !== product.value.id &&
        item.category === product.value.category,
    )
    .slice(0, 4);
});

const fallbackRecommendations = computed(() => {
  if (!product.value || relatedProducts.value.length > 0) {
    return relatedProducts.value;
  }

  return products.filter((item) => item.id !== product.value.id).slice(0, 4);
});

const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
};

const discountPercentage = computed(() => {
  if (
    !product.value?.originalPrice ||
    product.value.originalPrice <= product.value.price
  ) {
    return 0;
  }

  return Math.round(
    ((product.value.originalPrice - product.value.price) /
      product.value.originalPrice) *
      100,
  );
});

const increaseQuantity = () => {
  if (!product.value) return;

  if (quantity.value < product.value.stock) {
    quantity.value++;
  }
};

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const addToCart = () => {
  if (!product.value) return;

  const result = cartStore.addItem(product.value, quantity.value);

  notificationType.value = result.success ? "success" : "error";
  notification.value = result.message;

  if (result.success) {
    quantity.value = 1;
  }

  window.clearTimeout(notificationTimer);
  notificationTimer = window.setTimeout(() => {
    notification.value = "";
  }, 3500);
};

let notificationTimer;

watch(
  () => route.params.id,
  () => {
    quantity.value = 1;
    activeTab.value = "description";
    notification.value = "";
  },
  { immediate: true },
);

watch(
  [product, gallery],
  () => {
    selectedImage.value = gallery.value[0] || "";
  },
  { immediate: true },
);
</script>

<template>
  <main v-if="product" class="detail-page">
    <!-- BREADCRUMB -->
    <div class="detail-container">
      <nav class="breadcrumb">
        <RouterLink to="/">Beranda</RouterLink>
        <ChevronRight :size="13" />
        <RouterLink to="/katalog">Katalog</RouterLink>
        <ChevronRight :size="13" />
        <span>{{ product.category }}</span>
        <ChevronRight :size="13" />
        <span class="breadcrumb-current">{{ product.name }}</span>
      </nav>

      <!-- PRODUCT DETAIL -->
      <section class="product-detail-layout">
        <!-- GALLERY -->
        <div class="gallery-section">
          <div class="main-image">
            <img :src="selectedImage || product.image" :alt="product.name" />

            <span v-if="product.badge" class="image-badge">
              {{ product.badge }}
            </span>

            <span v-if="discountPercentage" class="discount-badge">
              -{{ discountPercentage }}%
            </span>
          </div>

          <div class="thumbnail-list">
            <button
              v-for="(image, index) in gallery"
              :key="image"
              :class="{ active: selectedImage === image }"
              @click="selectedImage = image"
              :aria-label="`Lihat foto ${index + 1}`"
            >
              <img :src="image" :alt="`${product.name} ${index + 1}`" />
            </button>
          </div>
        </div>

        <!-- PRODUCT INFORMATION -->
        <div class="product-information">
          <div class="product-category-label">
            {{ product.category }}
          </div>

          <h1>{{ product.name }}</h1>

          <div class="rating-row">
            <div class="rating-stars">
              <Star :size="15" fill="#D99B35" color="#D99B35" />
              <strong>{{ product.rating }}</strong>
            </div>

            <span class="rating-separator">|</span>
            <span>{{ product.sold }} produk terjual</span>
          </div>

          <div class="price-section">
            <strong class="current-price">
              {{ formatPrice(product.price) }}
            </strong>

            <div v-if="product.originalPrice" class="original-price-row">
              <del>{{ formatPrice(product.originalPrice) }}</del>
              <span v-if="discountPercentage">
                Hemat {{ discountPercentage }}%
              </span>
            </div>
          </div>

          <div class="stock-indicator">
            <span
              class="stock-dot"
              :class="{ 'low-stock': product.stock <= 5 }"
            ></span>

            <span>
              {{
                product.stock > 0
                  ? `${product.stock} produk tersedia`
                  : "Stok habis"
              }}
            </span>
          </div>

          <div class="product-divider"></div>

          <!-- ARTISAN -->
          <div class="artisan-summary">
            <div class="artisan-avatar">
              {{ product.artisan.charAt(0) }}
            </div>

            <div class="artisan-summary-info">
              <span>Diproduksi oleh</span>
              <strong>{{ product.artisan }}</strong>
              <small>
                <MapPin :size="12" />
                {{ product.location }}
              </small>
            </div>

            <span class="artisan-verified">
              <ShieldCheck :size="16" />
              Pengrajin Lokal
            </span>
          </div>

          <div class="product-divider"></div>

          <!-- QUANTITY -->
          <div class="purchase-section">
            <label>Jumlah Pembelian</label>

            <div class="quantity-row">
              <div class="quantity-control">
                <button
                  :disabled="quantity <= 1"
                  @click="decreaseQuantity"
                  aria-label="Kurangi jumlah"
                >
                  <Minus :size="15" />
                </button>

                <span>{{ quantity }}</span>

                <button
                  :disabled="quantity >= product.stock"
                  @click="increaseQuantity"
                  aria-label="Tambah jumlah"
                >
                  <Plus :size="15" />
                </button>
              </div>

              <span class="quantity-hint">
                Maksimal {{ product.stock }} produk
              </span>
            </div>
          </div>

          <!-- ACTIONS -->
          <div class="purchase-actions">
            <button
              class="add-cart-button"
              :disabled="product.stock <= 0"
              @click="addToCart"
            >
              <ShoppingCart :size="18" />
              {{ product.stock > 0 ? "Tambah ke Keranjang" : "Stok Habis" }}
            </button>

            <RouterLink
              to="/keranjang"
              class="view-cart-button"
              aria-label="Lihat keranjang"
            >
              <ShoppingBag :size="19" />
            </RouterLink>
          </div>

          <div
            v-if="notification"
            class="notification"
            :class="notificationType"
          >
            <Check v-if="notificationType === 'success'" :size="16" />
            <span>{{ notification }}</span>

            <RouterLink v-if="notificationType === 'success'" to="/keranjang">
              Lihat keranjang
            </RouterLink>
          </div>

          <!-- DELIVERY INFORMATION -->
          <div class="delivery-information">
            <div>
              <Truck :size="19" />
              <div>
                <strong>Pengiriman Produk</strong>
                <span
                  >Informasi ongkos kirim tersedia pada tahap checkout.</span
                >
              </div>
            </div>

            <div>
              <ShieldCheck :size="19" />
              <div>
                <strong>Produk Pengrajin Lokal</strong>
                <span
                  >Setiap produk memiliki karakter dan keunikan
                  tersendiri.</span
                >
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PRODUCT DESCRIPTION -->
      <section class="product-information-section">
        <div class="detail-tabs">
          <button
            :class="{ active: activeTab === 'description' }"
            @click="activeTab = 'description'"
          >
            Deskripsi Produk
          </button>

          <button
            :class="{ active: activeTab === 'specification' }"
            @click="activeTab = 'specification'"
          >
            Detail Produk
          </button>

          <button
            :class="{ active: activeTab === 'artisan' }"
            @click="activeTab = 'artisan'"
          >
            Tentang Pengrajin
          </button>
        </div>

        <div class="tab-content">
          <div v-if="activeTab === 'description'">
            <h2>Tentang Produk</h2>
            <p>{{ product.description }}</p>
          </div>

          <div v-else-if="activeTab === 'specification'">
            <h2>Spesifikasi Produk</h2>

            <div class="specification-list">
              <div v-for="detail in product.details" :key="detail.label">
                <span>{{ detail.label }}</span>
                <strong>{{ detail.value }}</strong>
              </div>
            </div>
          </div>

          <div v-else>
            <h2>{{ product.artisan }}</h2>
            <p>{{ product.artisanBio }}</p>

            <div class="artisan-location-detail">
              <MapPin :size="16" />
              {{ product.location }}
            </div>
          </div>
        </div>
      </section>

      <!-- RELATED PRODUCTS -->
      <section v-if="fallbackRecommendations.length" class="related-section">
        <div class="related-heading">
          <div>
            <span class="section-eyebrow">KOLEKSI LAINNYA</span>
            <h2>Karya yang Mungkin Kamu Sukai</h2>
          </div>

          <RouterLink to="/katalog">
            Jelajahi semua
            <ArrowRight :size="16" />
          </RouterLink>
        </div>

        <div class="related-grid">
          <ProductCard
            v-for="item in fallbackRecommendations"
            :key="item.id"
            :product="item"
          />
        </div>
      </section>
    </div>
  </main>

  <!-- PRODUCT NOT FOUND -->
  <main v-else class="not-found">
    <div>
      <h1>Produk Tidak Ditemukan</h1>
      <p>Produk yang kamu cari mungkin sudah tidak tersedia.</p>
      <RouterLink to="/katalog">
        <ArrowLeft :size="16" />
        Kembali ke Katalog
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.detail-page {
  min-height: 70vh;
  padding: 28px 24px 85px;
  color: #3e3028;
  background: #fbf7f2;
}

.detail-container {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 35px;
  color: #a19488;
  font-size: 11px;
}

.breadcrumb a {
  color: #943c14;
  text-decoration: none;
}

.breadcrumb-current {
  color: #554438;
}

/* PRODUCT LAYOUT */
.product-detail-layout {
  display: grid;
  grid-template-columns: 1fr 0.9fr;
  align-items: start;
  gap: 55px;
}

/* GALLERY */
.gallery-section {
  min-width: 0;
}

.main-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: #f0e8df;
  border-radius: 17px;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-badge,
.discount-badge {
  position: absolute;
  top: 17px;
  padding: 8px 12px;
  color: #fff;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

.image-badge {
  left: 17px;
  background: #943c14;
}

.discount-badge {
  right: 17px;
  background: #2d694d;
}

.thumbnail-list {
  display: flex;
  gap: 12px;
  margin-top: 15px;
}

.thumbnail-list button {
  overflow: hidden;
  width: 85px;
  height: 85px;
  padding: 0;
  background: #f0e8df;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
}

.thumbnail-list button.active {
  border-color: #943c14;
}

.thumbnail-list img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* INFORMATION */
.product-information {
  min-width: 0;
  padding-top: 8px;
}

.product-category-label {
  color: #a16a48;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}

.product-information h1 {
  margin: 13px 0;
  font-family: Georgia, serif;
  font-size: clamp(30px, 3vw, 39px);
  font-weight: 600;
  line-height: 1.2;
}

.rating-row,
.rating-stars {
  display: flex;
  align-items: center;
  gap: 7px;
}

.rating-row {
  color: #8e8075;
  font-size: 11px;
}

.rating-stars {
  color: #5c4c3f;
}

.rating-stars strong {
  font-size: 12px;
}

.rating-separator {
  color: #c8bdb2;
}

.price-section {
  margin-top: 28px;
}

.current-price {
  color: #943c14;
  font-family: Georgia, serif;
  font-size: 29px;
}

.original-price-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 7px;
}

.original-price-row del {
  color: #a79b90;
  font-size: 12px;
}

.original-price-row span {
  color: #2d694d;
  font-size: 11px;
  font-weight: 700;
}

.stock-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: #6f665d;
  font-size: 12px;
}

.stock-dot {
  width: 8px;
  height: 8px;
  background: #2d9b63;
  border-radius: 50%;
}

.stock-dot.low-stock {
  background: #d48a35;
}

.product-divider {
  height: 1px;
  margin: 24px 0;
  background: #eae1d8;
}

/* ARTISAN */
.artisan-summary {
  display: flex;
  align-items: center;
  gap: 13px;
}

.artisan-avatar {
  display: grid;
  place-items: center;
  width: 49px;
  height: 49px;
  flex-shrink: 0;
  color: #943c14;
  background: #f0e2d4;
  border-radius: 50%;
  font-family: Georgia, serif;
  font-size: 21px;
  font-weight: 700;
}

.artisan-summary-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.artisan-summary-info > span {
  color: #9c8d81;
  font-size: 10px;
}

.artisan-summary-info strong {
  font-size: 13px;
}

.artisan-summary-info small {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #95877b;
  font-size: 10px;
}

.artisan-verified {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #2d694d;
  font-size: 10px;
  font-weight: 700;
}

/* QUANTITY */
.purchase-section > label {
  display: block;
  margin-bottom: 13px;
  font-size: 12px;
  font-weight: 700;
}

.quantity-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.quantity-control {
  display: flex;
  align-items: center;
  height: 39px;
  background: #fff;
  border: 1px solid #e4d9ce;
  border-radius: 8px;
}

.quantity-control button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 100%;
  color: #795b48;
  background: transparent;
  border: none;
  cursor: pointer;
}

.quantity-control button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.quantity-control span {
  min-width: 32px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
}

.quantity-hint {
  color: #a09387;
  font-size: 10px;
}

/* BUTTONS */
.purchase-actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.add-cart-button,
.view-cart-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 50px;
  border-radius: 9px;
  cursor: pointer;
}

.add-cart-button {
  flex: 1;
  color: #fff;
  background: #943c14;
  border: none;
  font-size: 12px;
  font-weight: 700;
  transition: 0.2s;
}

.add-cart-button:hover {
  background: #71300f;
}

.add-cart-button:disabled {
  background: #b6aaa0;
  cursor: not-allowed;
}

.view-cart-button {
  width: 50px;
  color: #943c14;
  background: #fff;
  border: 1px solid #e4d9ce;
}

.notification {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
  padding: 12px;
  border-radius: 8px;
  font-size: 11px;
}

.notification.success {
  color: #276345;
  background: #e9f3ec;
}

.notification.error {
  color: #9b3b2d;
  background: #faeae7;
}

.notification a {
  color: inherit;
  font-weight: 800;
}

/* DELIVERY */
.delivery-information {
  display: flex;
  flex-direction: column;
  gap: 17px;
  margin-top: 27px;
}

.delivery-information > div {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #96735c;
}

.delivery-information > div > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.delivery-information strong {
  color: #554438;
  font-size: 11px;
}

.delivery-information span {
  color: #998b80;
  font-size: 10px;
  line-height: 1.6;
}

/* DESCRIPTION TABS */
.product-information-section {
  margin-top: 75px;
  padding: 28px;
  background: #fff;
  border: 1px solid #eae1d8;
  border-radius: 14px;
}

.detail-tabs {
  display: flex;
  gap: 30px;
  border-bottom: 1px solid #eee7e0;
}

.detail-tabs button {
  position: relative;
  padding: 0 0 16px;
  color: #95877b;
  background: transparent;
  border: none;
  font-size: 12px;
  cursor: pointer;
}

.detail-tabs button.active {
  color: #943c14;
  font-weight: 800;
}

.detail-tabs button.active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: #943c14;
  content: "";
}

.tab-content {
  min-height: 145px;
  padding-top: 25px;
}

.tab-content h2 {
  margin: 0 0 13px;
  font-family: Georgia, serif;
  font-size: 21px;
}

.tab-content p {
  max-width: 800px;
  margin: 0;
  color: #827469;
  font-size: 12px;
  line-height: 1.9;
}

.specification-list {
  max-width: 650px;
}

.specification-list > div {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 12px 0;
  border-bottom: 1px solid #f0eae4;
  font-size: 12px;
}

.specification-list span {
  color: #93857a;
}

.specification-list strong {
  color: #59483b;
  text-align: right;
}

.artisan-location-detail {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 15px;
  color: #943c14;
  font-size: 12px;
}

/* RELATED PRODUCTS */
.related-section {
  margin-top: 75px;
}

.related-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.section-eyebrow {
  color: #943c14;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.3px;
}

.related-heading h2 {
  margin: 10px 0 0;
  font-family: Georgia, serif;
  font-size: 29px;
  font-weight: 600;
}

.related-heading > a {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #943c14;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 17px;
}

/* NOT FOUND */
.not-found {
  display: grid;
  place-items: center;
  min-height: 65vh;
  padding: 30px;
  background: #fbf7f2;
  text-align: center;
}

.not-found h1 {
  font-family: Georgia, serif;
}

.not-found p {
  color: #897b70;
  font-size: 13px;
}

.not-found a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
  color: #943c14;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .product-detail-layout {
    gap: 30px;
  }

  .related-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .artisan-verified {
    display: none;
  }
}

@media (max-width: 650px) {
  .detail-page {
    padding: 22px 17px 60px;
  }

  .breadcrumb {
    margin-bottom: 23px;
    font-size: 10px;
  }

  .product-detail-layout {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .main-image {
    border-radius: 12px;
  }

  .thumbnail-list button {
    width: 68px;
    height: 68px;
  }

  .product-information h1 {
    font-size: 31px;
  }

  .product-information-section {
    margin-top: 50px;
    padding: 20px 16px;
  }

  .detail-tabs {
    gap: 20px;
    overflow-x: auto;
  }

  .detail-tabs button {
    flex-shrink: 0;
    font-size: 11px;
  }

  .related-section {
    margin-top: 50px;
  }

  .related-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .related-heading h2 {
    font-size: 25px;
  }

  .related-grid {
    gap: 12px;
  }
}
</style>
