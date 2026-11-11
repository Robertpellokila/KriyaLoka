<script setup>
import { RouterLink } from "vue-router";
import { ShoppingBag, Star, MapPin } from "lucide-vue-next";

defineProps({
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
  }).format(price);
};
</script>

<template>
  <article class="product-card">
    <RouterLink :to="`/produk/${product.id}`" class="product-image-link">
      <div class="product-image">
        <img :src="product.image" :alt="product.name" loading="lazy" />

        <span v-if="product.badge" class="product-badge">
          {{ product.badge }}
        </span>
      </div>
    </RouterLink>

    <div class="product-content">
      <span class="product-category">{{ product.category }}</span>

      <RouterLink :to="`/produk/${product.id}`" class="product-name">
        {{ product.name }}
      </RouterLink>

      <div class="product-artisan">
        <span>{{ product.artisan }}</span>
        <span class="artisan-location">
          <MapPin :size="12" />
          {{ product.location }}
        </span>
      </div>

      <div class="product-rating">
        <Star :size="13" fill="#D99B35" color="#D99B35" />
        <strong>{{ product.rating }}</strong>
        <span>({{ product.sold }} terjual)</span>
      </div>

      <div class="product-bottom">
        <div class="product-prices">
          <strong>{{ formatPrice(product.price) }}</strong>
          <del v-if="product.originalPrice">
            {{ formatPrice(product.originalPrice) }}
          </del>
        </div>

        <RouterLink
          :to="`/produk/${product.id}`"
          class="product-action"
          aria-label="Lihat produk"
        >
          <ShoppingBag :size="17" />
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e6ddd3;
  border-radius: 17px;
  transition: 0.25s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 14px 32px rgba(77, 48, 29, 0.1);
}

.product-image-link {
  display: block;
  text-decoration: none;
}

.product-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: #f1e9df;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.06);
}

.product-badge {
  position: absolute;
  top: 13px;
  left: 13px;
  padding: 6px 10px;
  color: #fff;
  background: #943c14;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}

.product-content {
  padding: 16px;
}

.product-category {
  display: block;
  margin-bottom: 7px;
  color: #a16a48;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.product-name {
  display: -webkit-box;
  min-height: 42px;
  overflow: hidden;
  color: #3e3028;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
  text-decoration: none;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-artisan {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 9px;
  color: #76695f;
  font-size: 11px;
}

.artisan-location {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #9a8d81;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 13px;
  font-size: 11px;
}

.product-rating strong {
  color: #514238;
}

.product-rating span {
  color: #a3978c;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 15px;
  padding-top: 13px;
  border-top: 1px solid #f0eae4;
}

.product-prices {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-prices strong {
  color: #943c14;
  font-size: 14px;
}

.product-prices del {
  color: #a99d92;
  font-size: 10px;
}

.product-action {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  color: #fff;
  background: #943c14;
  border-radius: 11px;
  transition: 0.2s;
}

.product-action:hover {
  background: #71300f;
}

@media (max-width: 480px) {
  .product-content {
    padding: 12px;
  }

  .product-name {
    font-size: 12px;
  }

  .product-prices strong {
    font-size: 12px;
  }
}
</style>
