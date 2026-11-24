<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, RouterLink } from "vue-router";
import {
  ShoppingBag,
  Minus,
  Plus,
  ArrowLeft,
  Package,
  ShieldCheck,
  Truck,
  Store,
  ImageOff,
} from "lucide-vue-next";

import { useProductStore } from "@/stores/product.js";
import { useCartStore } from "@/stores/cart.js";
import AppToast from "@/components/ui/AppToast.vue";

const route = useRoute();
const productStore = useProductStore();
const cartStore = useCartStore();

const quantity = ref(1);
const activeImage = ref(0);
const loading = ref(false);
const loadError = ref("");

const toast = ref({
  visible: false,
  type: "success",
  title: "",
  message: "",
});

function showToast(type, title, message) {
  toast.value = {
    visible: true,
    type,
    title,
    message,
  };
}

const product = computed(() => productStore.currentProduct);

const images = computed(() => {
  const productImages = product.value?.product_images || [];

  return [...productImages]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((image) => image.image_url)
    .filter(Boolean);
});

const currentImage = computed(() => {
  return (
    images.value[activeImage.value] ||
    "https://placehold.co/800x800/F3EBDD/943C14?text=KriyaLoka"
  );
});

const stock = computed(() => Number(product.value?.stock || 0));

const isAvailable = computed(() => {
  return product.value?.status === "published" && stock.value > 0;
});

const totalPrice = computed(() => {
  return Number(product.value?.price || 0) * quantity.value;
});

function formatPrice(price) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(price || 0));
}

function decreaseQuantity() {
  if (quantity.value > 1) {
    quantity.value--;
  }
}

function increaseQuantity() {
  if (quantity.value < stock.value) {
    quantity.value++;
  }
}

async function addToCart() {
  if (!product.value || !isAvailable.value) {
    showToast(
      "error",
      "Produk tidak tersedia",
      "Produk ini belum tersedia atau stoknya sudah habis.",
    );
    return;
  }

  const result = await cartStore.addItem(
    {
      id: product.value.id,
      name: product.value.name,
      artisan:
        product.value.artisan ||
        product.value.store_name ||
        "Pengrajin KriyaLoka",
      image: images.value[0] || currentImage.value,
      price: Number(product.value.price),
      stock: stock.value,
    },
    quantity.value,
  );

  showToast(
    result.success ? "success" : "error",
    result.success ? "Berhasil ditambahkan" : "Gagal menambahkan produk",
    result.message,
  );
}

async function loadProduct(productId) {
  loading.value = true;
  loadError.value = "";
  quantity.value = 1;
  activeImage.value = 0;

  productStore.clearCurrentProduct();

  try {
    await productStore.fetchProductById(productId);

    if (!productStore.currentProduct) {
      loadError.value = "Produk yang kamu cari tidak ditemukan.";
    }
  } catch (error) {
    console.error("Gagal mengambil detail produk:", error);
    loadError.value =
      error.message || "Terjadi kesalahan saat mengambil detail produk.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadProduct(route.params.id);
});

watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadProduct(newId);
    }
  },
);
</script>

<template>
  <div class="detail-page">
    <AppToast
      v-model="toast.visible"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="3500"
    />

    <div class="detail-container">
      <RouterLink to="/katalog" class="back-link">
        <ArrowLeft :size="17" />
        Kembali ke Katalog
      </RouterLink>

      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Sedang memuat detail produk...</p>
      </div>

      <div v-else-if="loadError" class="error-state">
        <div class="error-icon">
          <ImageOff :size="34" />
        </div>
        <h2>Produk tidak ditemukan</h2>
        <p>{{ loadError }}</p>
        <RouterLink to="/katalog" class="primary-button">
          Kembali ke Katalog
        </RouterLink>
      </div>

      <div v-else-if="product" class="product-detail">
        <div class="product-gallery">
          <div class="main-image">
            <img :src="currentImage" :alt="product.name" />
          </div>

          <div v-if="images.length > 1" class="thumbnail-list">
            <button
              v-for="(image, index) in images"
              :key="`${image}-${index}`"
              type="button"
              class="thumbnail"
              :class="{ active: activeImage === index }"
              @click="activeImage = index"
            >
              <img :src="image" :alt="`${product.name} ${index + 1}`" />
            </button>
          </div>
        </div>

        <div class="product-information">
          <span class="product-category">
            {{ product.category || "Kerajinan Lokal" }}
          </span>

          <h1>{{ product.name }}</h1>

          <div class="artisan-information">
            <div class="artisan-icon">
              <Store :size="18" />
            </div>
            <div>
              <span>Diproduksi oleh</span>
              <strong>
                {{
                  product.artisan ||
                  product.store_name ||
                  "Pengrajin Lokal KriyaLoka"
                }}
              </strong>
            </div>
          </div>

          <div class="price-section">
            <span>Harga produk</span>
            <strong>{{ formatPrice(product.price) }}</strong>
          </div>

          <p class="product-description">
            {{ product.description || "Belum ada deskripsi untuk produk ini." }}
          </p>

          <div class="product-specifications">
            <div class="specification">
              <Package :size="19" />
              <div>
                <span>Stok tersedia</span>
                <strong>{{ stock }} produk</strong>
              </div>
            </div>

            <div class="specification">
              <Truck :size="19" />
              <div>
                <span>Berat produk</span>
                <strong>
                  {{
                    Number(product.weight_grams || 0).toLocaleString("id-ID")
                  }}
                  gram
                </strong>
              </div>
            </div>
          </div>

          <div v-if="isAvailable" class="purchase-section">
            <label class="quantity-label">Jumlah produk</label>

            <div class="purchase-controls">
              <div class="quantity-control">
                <button
                  type="button"
                  :disabled="quantity <= 1"
                  @click="decreaseQuantity"
                >
                  <Minus :size="16" />
                </button>

                <span>{{ quantity }}</span>

                <button
                  type="button"
                  :disabled="quantity >= stock"
                  @click="increaseQuantity"
                >
                  <Plus :size="16" />
                </button>
              </div>

              <span class="available-stock"> Maks. {{ stock }} produk </span>
            </div>

            <div class="purchase-total">
              <span>Total harga</span>
              <strong>{{ formatPrice(totalPrice) }}</strong>
            </div>

            <button type="button" class="add-to-cart-button" @click="addToCart">
              <ShoppingBag :size="19" />
              Tambah ke Keranjang
            </button>
          </div>

          <div v-else class="unavailable-box">
            <strong>
              {{ stock <= 0 ? "Stok sedang habis" : "Produk belum tersedia" }}
            </strong>
            <p>Produk ini belum dapat ditambahkan ke keranjang.</p>
          </div>

          <div class="purchase-benefits">
            <div>
              <ShieldCheck :size="18" />
              <span>Produk dari pengrajin lokal</span>
            </div>
            <div>
              <Package :size="18" />
              <span>Detail pesanan tersimpan di KriyaLoka</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-page {
  min-height: 100vh;
  padding: 35px 20px 80px;
  background: #faf7f0;
  color: #30291f;
}

.detail-container {
  max-width: 1150px;
  margin: auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 30px;
  color: #827768;
  font-size: 13px;
  text-decoration: none;
  transition: color 0.2s;
}

.back-link:hover {
  color: #943c14;
}

.product-detail {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 55px;
  align-items: start;
}

.product-gallery {
  min-width: 0;
}

.main-image {
  width: 100%;
  height: 510px;
  overflow: hidden;
  background: #eee6da;
  border-radius: 7px;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-list {
  display: flex;
  gap: 12px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.thumbnail {
  width: 75px;
  height: 75px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 4px;
  background: #eee6da;
  overflow: hidden;
  cursor: pointer;
}

.thumbnail.active {
  border-color: #943c14;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-information {
  padding-top: 10px;
}

.product-category {
  display: inline-block;
  padding: 7px 12px;
  border-radius: 3px;
  background: #e8eadf;
  color: #64704c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.product-information h1 {
  margin: 17px 0 20px;
  font-family: Georgia, serif;
  font-size: clamp(32px, 4vw, 45px);
  line-height: 1.15;
  font-weight: 500;
  letter-spacing: -1px;
}

.artisan-information {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 22px;
  border-bottom: 1px solid #e8dfd2;
}

.artisan-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #efe5d4;
  color: #943c14;
}

.artisan-information span,
.artisan-information strong {
  display: block;
}

.artisan-information span {
  color: #8b806f;
  font-size: 11px;
  margin-bottom: 4px;
}

.artisan-information strong {
  color: #514738;
  font-size: 13px;
}

.price-section {
  padding: 23px 0;
}

.price-section span,
.purchase-total span {
  display: block;
  color: #827768;
  font-size: 12px;
  margin-bottom: 7px;
}

.price-section strong {
  color: #943c14;
  font-size: 28px;
  font-weight: 700;
}

.product-description {
  color: #716657;
  font-size: 14px;
  line-height: 1.9;
  white-space: pre-line;
}

.product-specifications {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 25px 0;
}

.specification {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 12px;
  background: #f1ebdf;
  border-radius: 5px;
  color: #64704c;
}

.specification span,
.specification strong {
  display: block;
}

.specification span {
  color: #8b806f;
  font-size: 10px;
  margin-bottom: 4px;
}

.specification strong {
  color: #514738;
  font-size: 12px;
}

.purchase-section {
  padding: 22px;
  border: 1px solid #e8dfd2;
  border-radius: 6px;
  background: #fffdf9;
}

.quantity-label {
  display: block;
  color: #514738;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
}

.purchase-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.quantity-control {
  height: 40px;
  display: flex;
  align-items: center;
  border: 1px solid #e5dac9;
  border-radius: 4px;
  overflow: hidden;
}

.quantity-control button {
  width: 39px;
  height: 100%;
  display: grid;
  place-items: center;
  border: 0;
  background: #f1ebdf;
  color: #514738;
  cursor: pointer;
}

.quantity-control button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.quantity-control span {
  min-width: 40px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
}

.available-stock {
  color: #8b806f;
  font-size: 11px;
}

.purchase-total {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 10px;
  margin: 22px 0;
  padding-top: 18px;
  border-top: 1px solid #eee6da;
}

.purchase-total span {
  margin: 0;
}

.purchase-total strong {
  color: #943c14;
  font-size: 19px;
}

.add-to-cart-button,
.primary-button {
  min-height: 48px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 4px;
  background: #943c14;
  color: white;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s;
}

.add-to-cart-button:hover,
.primary-button:hover {
  background: #78300f;
}

.unavailable-box {
  padding: 20px;
  border: 1px solid #e8c9bc;
  border-radius: 5px;
  background: #f8eae4;
  color: #943c14;
}

.unavailable-box p {
  margin-bottom: 0;
  font-size: 12px;
}

.purchase-benefits {
  display: grid;
  gap: 12px;
  margin-top: 23px;
}

.purchase-benefits div {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64704c;
}

.purchase-benefits span {
  color: #827768;
  font-size: 11px;
}

.loading-state,
.error-state {
  padding: 90px 20px;
  text-align: center;
  color: #827768;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  margin: 0 auto 15px;
  border: 3px solid #e7ddcf;
  border-top-color: #943c14;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  width: 65px;
  height: 65px;
  margin: 0 auto 18px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #eee6da;
  color: #943c14;
}

.error-state h2 {
  font-family: Georgia, serif;
  font-weight: 500;
  color: #30291f;
}

.error-state p {
  font-size: 13px;
  margin-bottom: 22px;
}

.primary-button {
  width: auto;
  display: inline-flex;
  padding: 0 20px;
}

@media (max-width: 800px) {
  .product-detail {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .main-image {
    height: min(500px, 75vw);
  }

  .product-information {
    padding-top: 0;
  }
}

@media (max-width: 480px) {
  .detail-page {
    padding: 25px 15px 55px;
  }

  .main-image {
    height: 350px;
  }

  .product-information h1 {
    font-size: 34px;
  }

  .product-specifications {
    gap: 8px;
  }

  .specification {
    padding: 12px 8px;
    gap: 7px;
  }

  .specification strong {
    font-size: 11px;
  }

  .purchase-section {
    padding: 17px;
  }
}
</style>
