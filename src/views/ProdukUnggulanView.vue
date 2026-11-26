<script setup>
import { ref, computed, onMounted } from "vue";
import { RouterLink } from "vue-router";
import { Sparkles, Heart, ArrowUpRight, ArrowLeft } from "lucide-vue-next";
import { useProductStore } from "@/stores/product.js";

const productStore = useProductStore();

const activeCategory = ref("Semua");
const savedIds = ref(new Set());
const loading = ref(false);

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const unggulanList = computed(() => {
  const list = productStore.publicProducts || [];
  const published = [];
  const featured = [];

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item?.status !== "published") continue;
    published.push(item);
    if (item.is_featured || item.featured) {
      featured.push(item);
    }
  }

  return (featured.length ? featured : published).slice(0, 8);
});

// Precompute gambar & harga sekali per daftar produk unggulan
const enrichedList = computed(() => {
  return unggulanList.value.map((product) => {
    const imgs = product?.product_images;
    let imageUrl = product?.image_url || "";

    if (Array.isArray(imgs) && imgs.length) {
      const sorted = imgs.length > 1
        ? [...imgs].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
        : imgs;
      imageUrl = sorted[0]?.image_url || imageUrl;
    }

    return {
      id: product.id,
      name: product.name || product.title || "Produk Kriya",
      category: (product.category || "Kerajinan").trim(),
      priceText: currencyFormatter.format(Number(product.price || 0)),
      imageUrl,
    };
  });
});

const categories = computed(() => {
  const set = new Set();
  for (const item of enrichedList.value) {
    if (item.category) set.add(item.category);
  }
  return ["Semua", ...set];
});

const filteredList = computed(() => {
  if (activeCategory.value === "Semua") return enrichedList.value;
  return enrichedList.value.filter(
    (item) => item.category === activeCategory.value,
  );
});

function toggleSave(id) {
  const next = new Set(savedIds.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  savedIds.value = next;
}

onMounted(async () => {
  if (!productStore.publicProducts?.length) {
    loading.value = true;
    try {
      await productStore.fetchPublicProducts();
    } finally {
      loading.value = false;
    }
  }
});
</script>

<template>
  <section class="unggulan-wrap">
    <div class="unggulan-top">
      <div>
        <span class="unggulan-pill-eyebrow">
          <Sparkles :size="13" />
          PRODUK UNGGULAN
        </span>
        <h2>Produk Unggulan</h2>
        <p>Karya pilihan dari pengrajin lokal yang siap dibuka detailnya.</p>
      </div>

      <RouterLink to="/katalog" class="unggulan-pill-btn">
        <ArrowLeft :size="15" />
        Kembali ke Katalog
      </RouterLink>
    </div>

    <div v-if="categories.length > 1" class="unggulan-filters">
      <button
        v-for="cat in categories"
        :key="cat"
        type="button"
        class="unggulan-chip"
        :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div v-if="loading" class="unggulan-state">Memuat produk unggulan...</div>

    <div v-else-if="filteredList.length" class="unggulan-grid">
      <article
        v-for="product in filteredList"
        :key="product.id"
        class="unggulan-card"
      >
        <div class="unggulan-media">
          <img
            v-if="product.imageUrl"
            :src="product.imageUrl"
            :alt="product.name"
            loading="lazy"
            decoding="async"
          />
          <div v-else class="unggulan-placeholder">
            <Sparkles :size="26" />
          </div>

          <span class="unggulan-badge-pill">Unggulan</span>

          <button
            type="button"
            class="unggulan-fav-circle"
            :class="{ active: savedIds.has(product.id) }"
            aria-label="Simpan favorit"
            @click="toggleSave(product.id)"
          >
            <Heart
              :size="15"
              :fill="savedIds.has(product.id) ? 'currentColor' : 'none'"
            />
          </button>
        </div>

        <div class="unggulan-body">
          <span class="unggulan-cat">{{ product.category }}</span>
          <h3>{{ product.name }}</h3>

          <div class="unggulan-foot">
            <strong>{{ product.priceText }}</strong>
            <RouterLink :to="`/produk/${product.id}`" class="unggulan-action-pill">
              Lihat
              <ArrowUpRight :size="15" />
            </RouterLink>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="unggulan-state">
      Belum ada produk unggulan yang tersedia.
    </div>
  </section>
</template>

<style scoped>
.unggulan-wrap {
  max-width: 1220px;
  margin: 0 auto;
  padding: 40px 24px 72px;
  color: #3d2d24;
}

.unggulan-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 22px;
}

.unggulan-pill-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: #f3e7dc;
  color: #943c14;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
}

.unggulan-top h2 {
  margin: 10px 0 4px;
  font-family: Georgia, serif;
  font-size: 28px;
  font-weight: 600;
}

.unggulan-top p {
  margin: 0;
  color: #85766a;
  font-size: 13px;
}

.unggulan-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid #e6ddd3;
  background: #ffffff;
  color: #493328;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  transition: border-color 0.18s ease, color 0.18s ease;
}

.unggulan-pill-btn:hover {
  border-color: #943c14;
  color: #943c14;
}

.unggulan-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.unggulan-chip {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid #e6ddd3;
  background: #fbf7f2;
  color: #5a483d;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.unggulan-chip.active {
  border-color: #943c14;
  background: #943c14;
  color: #fffaf2;
}

.unggulan-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.unggulan-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid #ece5dd;
  background: #ffffff;
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.unggulan-card:hover {
  transform: translateY(-2px);
  border-color: #dec9b8;
}

.unggulan-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f3e7dc;
}

.unggulan-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.unggulan-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #943c14;
}

.unggulan-badge-pill {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 12px;
  border-radius: 999px;
  background: rgba(255, 250, 242, 0.95);
  color: #943c14;
  font-size: 10px;
  font-weight: 700;
}

.unggulan-fav-circle {
  position: absolute;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 250, 242, 0.94);
  color: #5a483d;
  cursor: pointer;
}

.unggulan-fav-circle.active {
  background: #943c14;
  color: #fffaf2;
}

.unggulan-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 16px;
}

.unggulan-cat {
  color: #943c14;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.unggulan-body h3 {
  margin: 6px 0 14px;
  font-family: Georgia, serif;
  font-size: 16px;
  font-weight: 600;
}

.unggulan-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f2ece5;
}

.unggulan-foot strong {
  font-size: 14px;
  color: #33251e;
}

.unggulan-action-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border-radius: 999px;
  background: #943c14;
  color: #fffaf2;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.unggulan-action-pill:hover {
  background: #7d3210;
}

.unggulan-state {
  padding: 36px 20px;
  border-radius: 16px;
  border: 1px dashed #e2d5c5;
  background: #fbf7f2;
  text-align: center;
  color: #85766a;
  font-size: 13px;
}

@media (max-width: 1024px) {
  .unggulan-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .unggulan-grid {
    grid-template-columns: 1fr;
  }
}
</style>