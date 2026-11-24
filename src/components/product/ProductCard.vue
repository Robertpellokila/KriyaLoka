<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { ShoppingBag, MapPin } from "lucide-vue-next";

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

// Format harga Rupiah.
const formatPrice = (price) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(price || 0));
};

// Mengambil gambar utama produk.
const productImage = computed(() => {
  const images = [...(props.product.product_images || [])].sort(
    (a, b) => Number(a.sort_order) - Number(b.sort_order),
  );

  return images[0]?.image_url || "/images/product-placeholder.png";
});
</script>

<template>
  <article class="product-card">
    <!-- PRODUCT IMAGE -->
    <RouterLink :to="`/produk/${product.id}`" class="product-image-link">
      <div class="product-image">
        <img :src="productImage" :alt="product.name" loading="lazy" />
      </div>
    </RouterLink>

    <!-- PRODUCT CONTENT -->
    <div class="product-content">
      <span class="product-category">
        {{ product.category }}
      </span>

      <RouterLink :to="`/produk/${product.id}`" class="product-name">
        {{ product.name }}
      </RouterLink>

      <!-- SELLER INFORMATION -->
      <div class="product-artisan">
        <span>Produk Pengrajin KriyaLoka</span>

        <span class="artisan-location">
          <MapPin :size="12" />
          Bali
        </span>
      </div>

      <!-- PRICE AND ACTION -->
      <div class="product-bottom">
        <div class="product-prices">
          <strong>
            {{ formatPrice(product.price) }}
          </strong>
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
  border: 1px solid #e8dfd6;
  border-radius: 13px;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(75, 47, 30, 0.09);
}

.product-image-link {
  display: block;
  text-decoration: none;
}

.product-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background: #f3e9dc;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-content {
  padding: 15px;
}

.product-category {
  display: inline-block;
  margin-bottom: 8px;
  color: #943c14;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.product-name {
  display: block;
  min-height: 40px;
  color: #49382d;
  font-family: Georgia, serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  text-decoration: none;
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

.artisan-location {
  display: flex;
  align-items: center;
  gap: 4px;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 17px;
  padding-top: 13px;
  border-top: 1px solid #eee7e0;
}

.product-prices strong {
  color: #943c14;
  font-size: 14px;
  font-weight: 800;
}

.product-action {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #fff;
  background: #943c14;
  border-radius: 9px;
  text-decoration: none;
  transition: background 0.2s ease;
}

.product-action:hover {
  background: #71300f;
}

/* RESPONSIVE */
@media (max-width: 480px) {
  .product-content {
    padding: 11px;
  }

  .product-name {
    font-size: 14px;
  }

  .product-prices strong {
    font-size: 12px;
  }

  .product-artisan {
    font-size: 9px;
  }
}
</style>
