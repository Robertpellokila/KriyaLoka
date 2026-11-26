
<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { ShoppingBag, MapPin, ArrowUpRight } from "lucide-vue-next";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(price || 0));
};

const productImage = computed(() => {
  const images = [...(props.product.product_images || [])].sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
  );

  return images[0]?.image_url || "/images/product-placeholder.png";
});

const sellerName = computed(() => {
  return (
    props.product.seller_name ||
    props.product.store_name ||
    "Pengrajin KriyaLoka"
  );
});

const sellerLocation = computed(() => {
  return (
    props.product.seller_location ||
    props.product.store_location ||
    "Indonesia"
  );
});

const isAvailable = computed(() => {
  return Number(props.product.stock || 0) > 0;
});
</script>

<template>
  <article class="product-card">
    <div class="card-inner">
      <!-- PRODUCT IMAGE -->
      <RouterLink
        :to="`/produk/${product.id}`"
        class="product-image-link"
        :aria-label="`Lihat ${product.name}`"
      >
        <div class="product-image">
          <img
            :src="productImage"
            :alt="product.name"
            loading="lazy"
          />

          <span class="image-overlay"></span>

          <span class="product-badge">
            Kriya Lokal
          </span>

          <span
            v-if="!isAvailable"
            class="stock-badge"
          >
            Stok Habis
          </span>

          <span class="image-action">
            <ArrowUpRight :size="17" />
          </span>
        </div>
      </RouterLink>

      <!-- PRODUCT CONTENT -->
      <div class="product-content">
        <span class="product-category">
          {{ product.category || "Kerajinan Lokal" }}
        </span>

        <RouterLink
          :to="`/produk/${product.id}`"
          class="product-name"
        >
          {{ product.name }}
        </RouterLink>

        <!-- SELLER -->
        <div class="product-artisan">
          <span class="artisan-name">
            {{ sellerName }}
          </span>

          <span class="artisan-location">
            <MapPin :size="12" />
            <span>{{ sellerLocation }}</span>
          </span>
        </div>

        <!-- PRICE -->
        <div class="product-bottom">
          <div class="product-prices">
            <span class="price-label">Harga produk</span>
            <strong>{{ formatPrice(product.price) }}</strong>
          </div>

          <RouterLink
            :to="`/produk/${product.id}`"
            class="product-action"
            aria-label="Lihat detail produk"
          >
            <ShoppingBag :size="17" />
          </RouterLink>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  min-width: 0;
  perspective: 1000px;
}

.card-inner {
  height: 100%;
  overflow: hidden;
  background: #fffdf9;
  border: 1px solid #e9dfd4;
  border-radius: 17px;
  box-shadow: 0 5px 15px rgba(68, 47, 32, 0.055);
  transform: translateY(0) rotateX(0) rotateY(0);
  transform-style: preserve-3d;
  transition:
    transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1),
    box-shadow 0.35s ease,
    border-color 0.35s ease;
}

.product-card:hover .card-inner {
  transform: translateY(-7px) rotateX(1.5deg) rotateY(-1deg);
  border-color: #d9bda8;
  box-shadow:
    0 18px 32px rgba(68, 47, 32, 0.12),
    0 5px 10px rgba(68, 47, 32, 0.05);
}

.product-image-link {
  display: block;
  text-decoration: none;
}

.product-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: #f1e8dd;
  transform: translateZ(12px);
}

.product-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.product-card:hover .product-image img {
  transform: scale(1.075);
}

.image-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(25, 20, 15, 0.12),
    transparent 34%,
    transparent 70%,
    rgba(25, 20, 15, 0.12)
  );
}

.product-badge {
  position: absolute;
  top: 11px;
  left: 11px;
  padding: 6px 10px;
  color: #fff;
  background: rgba(79, 91, 42, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.3px;
  backdrop-filter: blur(8px);
}

.stock-badge {
  position: absolute;
  right: 10px;
  top: 10px;
  padding: 6px 9px;
  color: #fff;
  background: #943c14;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
}

.image-action {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #49382d;
  background: rgba(255, 253, 249, 0.94);
  border-radius: 50%;
  opacity: 0;
  transform: translateY(7px);
  transition: all 0.3s ease;
}

.product-card:hover .image-action {
  opacity: 1;
  transform: translateY(0);
}

.product-content {
  padding: 14px;
}

.product-category {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  margin-bottom: 7px;
  color: #943c14;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.product-name {
  display: -webkit-box;
  min-height: 42px;
  overflow: hidden;
  color: #49382d;
  font-family: Georgia, serif;
  font-size: 16px;
  font-weight: 650;
  line-height: 1.35;
  text-decoration: none;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  transition: color 0.2s ease;
}

.product-name:hover {
  color: #943c14;
}

.product-artisan {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  color: #88786c;
  font-size: 10px;
}

.artisan-name {
  overflow: hidden;
  color: #625044;
  font-weight: 650;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.artisan-location {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.artisan-location span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid #eee7e0;
}

.product-prices {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.price-label {
  color: #a39487;
  font-size: 9px;
}

.product-prices strong {
  color: #943c14;
  font-size: 14px;
  font-weight: 850;
}

.product-action {
  display: grid;
  flex-shrink: 0;
  width: 37px;
  height: 37px;
  place-items: center;
  color: #fff;
  background: #943c14;
  border-radius: 11px;
  text-decoration: none;
  box-shadow: 0 4px 9px rgba(148, 60, 20, 0.2);
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.product-action:hover {
  background: #71300f;
  transform: translateY(-2px);
}

/* TABLET */
@media (max-width: 768px) {
  .product-content {
    padding: 12px;
  }

  .product-name {
    font-size: 14px;
  }
}

/* MOBILE */
@media (max-width: 480px) {
  .card-inner {
    border-radius: 13px;
  }

  .product-content {
    padding: 10px;
  }

  .product-name {
    min-height: 38px;
    font-size: 13px;
  }

  .product-artisan {
    gap: 5px;
    font-size: 9px;
  }

  .product-prices strong {
    font-size: 12px;
  }

  .product-action {
    width: 33px;
    height: 33px;
    border-radius: 9px;
  }

  .product-badge {
    top: 8px;
    left: 8px;
    padding: 5px 8px;
    font-size: 8px;
  }
}

/* Touch devices: no hover lift, keep the card stable */
@media (hover: none) {
  .product-card:hover .card-inner {
    transform: none;
    box-shadow: 0 5px 15px rgba(68, 47, 32, 0.055);
  }

  .image-action {
    display: none;
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card-inner,
  .product-image img,
  .image-action,
  .product-action {
    transition: none;
  }
}
</style>
