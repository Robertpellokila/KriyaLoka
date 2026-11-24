<script setup>
import { RouterLink } from "vue-router";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  HeartHandshake,
  Truck,
  Sparkles,
  Play,
} from "lucide-vue-next";

import ProductCard from "@/components/product/ProductCard.vue";
import { categories, products } from "@/data/products.js";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Produk Terjamin",
    description: "Produk pilihan dari pengrajin lokal yang telah dikurasi.",
  },
  {
    icon: HeartHandshake,
    title: "Dukung Pengrajin",
    description: "Setiap pembelian membantu ekonomi kreatif masyarakat Bali.",
  },
  {
    icon: Truck,
    title: "Pengiriman Mudah",
    description: "Nikmati kemudahan pengiriman karya lokal ke rumahmu.",
  },
  {
    icon: Sparkles,
    title: "Karya Penuh Cerita",
    description: "Setiap produk memiliki nilai seni dan keunikan tersendiri.",
  },
];

const artisans = [
  {
    name: "Made Art Studio",
    location: "Gianyar, Bali",
    description: "Menghadirkan seni ukir kayu dengan sentuhan budaya Bali.",
    image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=900",
  },
  {
    name: "Bali Woven Craft",
    location: "Ubud, Bali",
    description: "Mengolah bahan alami menjadi karya anyaman yang bernilai.",
    image: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=900",
  },
];

const categoryImages = {
  "kerajinan-kayu":
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900",

  "tenun-tekstil":
    "https://images.unsplash.com/photo-1600166898405-da9535204843?w=900",

  keramik: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=900",

  aksesori:
    "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900",

  "dekorasi-rumah":
    "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=900",

  anyaman: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900",
};

function getCategoryImage(category) {
  return (
    categoryImages[category.slug] ||
    "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=900"
  );
}
</script>

<template>
  <main class="home-page">
    <!-- ======================================
         HERO SECTION
    ======================================= -->

    <section class="marketplace-hero">
      <img
        class="marketplace-hero-image"
        src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=2000"
        alt="Pemandangan dan keindahan budaya Bali"
        fetchpriority="high"
      />

      <div class="marketplace-hero-overlay"></div>

      <div class="marketplace-hero-container">
        <div class="marketplace-hero-content">
          <div class="marketplace-eyebrow">
            <span></span>
            KRIYALOKA
            <span class="eyebrow-separator">/</span>
            BALI HERITAGE MARKETPLACE
          </div>

          <h1>
            Belanja Karya Lokal
            <em>Dari Bali.</em>
          </h1>

          <p>
            Temukan kerajinan tangan berkualitas dari pengrajin terbaik di Bali.
            Setiap karya membawa cerita, tradisi, dan keindahan budaya yang
            istimewa.
          </p>

          <div class="marketplace-hero-actions">
            <RouterLink to="/katalog" class="hero-shop-button">
              Mulai Belanja
              <ArrowRight :size="18" />
            </RouterLink>

            <a href="#cerita-pengrajin" class="hero-story-button">
              <span class="story-play">
                <Play :size="15" fill="currentColor" />
              </span>
              Kenali Pengrajin
            </a>
          </div>
        </div>

        <div class="hero-heritage-label">
          <span class="heritage-symbol">✺</span>

          <div>
            <strong>Authentic Bali Heritage</strong>
            <span>Warisan budaya dalam setiap karya</span>
          </div>
        </div>
      </div>

      <!-- HERO STATISTICS -->

      <div class="hero-bottom-info">
        <div class="hero-info-item">
          <span class="hero-info-icon">✺</span>

          <div>
            <strong>100+</strong>
            <span>Produk Lokal</span>
          </div>
        </div>

        <div class="hero-info-divider"></div>

        <div class="hero-info-item">
          <span class="hero-info-icon">♙</span>

          <div>
            <strong>50+</strong>
            <span>Pengrajin</span>
          </div>
        </div>

        <div class="hero-info-divider"></div>

        <div class="hero-info-item">
          <span class="hero-info-icon">✿</span>

          <div>
            <strong>100%</strong>
            <span>Karya Lokal</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================
         POPULAR CATEGORIES
    ======================================= -->

    <section class="section category-section">
      <div class="section-container">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow"> JELAJAHI KOLEKSI </span>

            <h2>Temukan Karya Favoritmu</h2>

            <p>
              Dari seni ukir hingga kerajinan anyaman, temukan keunikan karya
              pengrajin lokal Bali.
            </p>
          </div>

          <RouterLink to="/katalog" class="text-link">
            Lihat Semua
            <ArrowUpRight :size="17" />
          </RouterLink>
        </div>

        <div class="visual-category-grid">
          <RouterLink
            v-for="category in categories"
            :key="category.id"
            :to="`/katalog?kategori=${category.slug}`"
            class="visual-category-card"
          >
            <img
              :src="getCategoryImage(category)"
              :alt="category.name"
              loading="lazy"
            />

            <div class="category-card-overlay"></div>

            <div class="category-card-content">
              <span class="category-card-count">
                {{ category.count }}
              </span>

              <h3>{{ category.name }}</h3>

              <span class="category-card-link">
                Jelajahi Koleksi
                <ArrowUpRight :size="16" />
              </span>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ======================================
         FEATURED PRODUCTS
    ======================================= -->

    <section class="section featured-section">
      <div class="section-container">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow"> PILIHAN TERBAIK UNTUKMU </span>

            <h2>Karya Pilihan Minggu Ini</h2>

            <p>Produk favorit pelanggan dari pengrajin terpercaya.</p>
          </div>

          <RouterLink to="/katalog" class="text-link">
            Lihat Semua Produk
            <ArrowUpRight :size="17" />
          </RouterLink>
        </div>

        <div class="product-grid">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>

        <div class="product-bottom">
          <RouterLink to="/katalog" class="btn-outline">
            Jelajahi Semua Produk
            <ArrowRight :size="17" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- ======================================
         HERITAGE BANNER
    ======================================= -->

    <section class="heritage-section">
      <div class="heritage-image">
        <img
          src="https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1400"
          alt="Kreativitas dan proses pembuatan karya seni"
          loading="lazy"
        />
      </div>

      <div class="heritage-overlay"></div>

      <div class="heritage-content">
        <span class="section-eyebrow"> WARISAN BUDAYA BALI </span>

        <h2>Di Balik Setiap Karya, Ada Cerita yang Istimewa.</h2>

        <p>
          Dari tangan para pengrajin hingga menjadi karya yang memiliki nilai
          seni. Bersama KriyaLoka, mari ikut melestarikan warisan budaya Bali.
        </p>

        <RouterLink to="/katalog" class="heritage-button">
          Temukan Ceritanya
          <ArrowRight :size="17" />
        </RouterLink>
      </div>

      <div class="heritage-pattern"></div>
    </section>

    <!-- ======================================
         BENEFITS
    ======================================= -->

    <section class="benefit-section">
      <div class="section-container">
        <div class="benefit-heading">
          <span class="section-eyebrow"> MENGAPA KRIYALOKA? </span>

          <h2>Lebih dari Sekadar Berbelanja</h2>

          <p>
            Kami menghubungkan karya pengrajin lokal dengan orang-orang yang
            menghargai keindahan, kualitas, dan cerita.
          </p>
        </div>

        <div class="benefit-grid">
          <div
            v-for="benefit in benefits"
            :key="benefit.title"
            class="benefit-item"
          >
            <div class="benefit-icon">
              <component :is="benefit.icon" :size="24" />
            </div>

            <h3>{{ benefit.title }}</h3>

            <p>{{ benefit.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ======================================
         ARTISAN STORIES
    ======================================= -->

    <section id="cerita-pengrajin" class="section artisan-section">
      <div class="section-container">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow"> DI BALIK SETIAP KARYA </span>

            <h2>Cerita Para Pengrajin</h2>

            <p>Kenali orang-orang kreatif di balik karya pilihanmu.</p>
          </div>

          <RouterLink to="/katalog" class="text-link">
            Jelajahi Karya
            <ArrowUpRight :size="17" />
          </RouterLink>
        </div>

        <div class="artisan-grid">
          <article
            v-for="artisan in artisans"
            :key="artisan.name"
            class="artisan-card"
          >
            <div class="artisan-image">
              <img :src="artisan.image" :alt="artisan.name" loading="lazy" />
            </div>

            <div class="artisan-content">
              <span class="artisan-location">
                {{ artisan.location }}
              </span>

              <h3>{{ artisan.name }}</h3>

              <p>{{ artisan.description }}</p>

              <RouterLink to="/katalog" class="artisan-link">
                Jelajahi Karyanya
                <ArrowRight :size="16" />
              </RouterLink>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ======================================
         FINAL CTA
    ======================================= -->

    <section class="cta-section">
      <div class="cta-pattern"></div>

      <div class="cta-content">
        <span class="section-eyebrow"> DUKUNG KARYA PENGRAJIN LOKAL </span>

        <h2>Setiap Karya Punya Cerita. Jadilah Bagian Darinya.</h2>

        <p>
          Temukan karya unik, dukung pengrajin lokal, dan bawa pulang sebagian
          keindahan Bali.
        </p>

        <RouterLink to="/katalog" class="btn-light">
          Mulai Menjelajah
          <ArrowRight :size="18" />
        </RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
/* ==========================================
   GLOBAL
========================================== */

.home-page {
  --cream: #faf5ed;
  --cream-dark: #f0e5d6;
  --terracotta: #a64d27;
  --terracotta-dark: #873b1b;
  --brown: #493328;
  --muted: #89796d;
  --gold: #c39a65;
  --forest: #294b3b;

  color: var(--brown);
  background: #fffdf9;
  overflow: clip;
}

.section-container {
  width: 100%;
  max-width: 1220px;
  margin: 0 auto;
}

.section {
  padding: 85px 24px;
}

/* ==========================================
   HERO
========================================== */

.marketplace-hero {
  position: relative;
  isolation: isolate;
  padding: 0 24px;
  background: #f8efe4;
}

.marketplace-hero-image {
  position: absolute;
  inset: 0 0 75px;
  z-index: -2;

  width: 100%;
  height: calc(100% - 75px);

  object-fit: cover;
  object-position: center 48%;
}

.marketplace-hero-overlay {
  position: absolute;
  inset: 0 0 75px;
  z-index: -1;

  background:
    linear-gradient(
      90deg,
      rgba(39, 28, 22, 0.76) 0%,
      rgba(39, 28, 22, 0.48) 42%,
      rgba(39, 28, 22, 0.08) 100%
    ),
    linear-gradient(0deg, rgba(39, 28, 22, 0.25), transparent 55%);
}

.marketplace-hero-container {
  position: relative;
  display: flex;
  align-items: center;

  max-width: 1220px;
  min-height: 570px;
  margin: 0 auto;
}

.marketplace-hero-content {
  max-width: 650px;
  padding: 70px 0 90px;
  color: #fffaf2;
}

.marketplace-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;

  color: #f3d1a4;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.marketplace-eyebrow > span:first-child {
  width: 8px;
  height: 8px;
  background: #d47a42;
  border-radius: 50%;
}

.eyebrow-separator {
  opacity: 0.65;
}

.marketplace-hero-content h1 {
  margin: 28px 0 22px;

  color: #fffaf2;
  font-family: Georgia, serif;
  font-size: clamp(48px, 6vw, 76px);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -2.5px;
}

.marketplace-hero-content h1 em {
  display: block;
  color: #e49a65;
  font-weight: 600;
}

.marketplace-hero-content > p {
  max-width: 480px;
  color: rgba(255, 250, 242, 0.88);
  font-size: 14px;
  line-height: 1.9;
}

.marketplace-hero-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 25px;
  margin-top: 30px;
}

.hero-shop-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;

  min-height: 49px;
  padding: 0 23px;

  color: white;
  background: #b65327;
  border-radius: 9px;

  font-size: 13px;
  font-weight: 700;
  text-decoration: none;

  transition: 0.25s ease;
}

.hero-shop-button:hover {
  background: #913b1c;
  transform: translateY(-3px);
}

.hero-story-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  color: white;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.story-play {
  display: grid;
  place-items: center;

  width: 39px;
  height: 39px;

  color: #a64d27;
  background: #fffaf2;
  border-radius: 50%;

  transition: 0.2s ease;
}

.hero-story-button:hover .story-play {
  transform: scale(1.1);
}

.hero-heritage-label {
  position: absolute;
  right: 0;
  bottom: 100px;

  display: flex;
  align-items: center;
  gap: 13px;

  padding: 15px 20px;

  color: #483328;
  background: rgba(255, 250, 242, 0.95);
  border-radius: 11px;

  box-shadow: 0 10px 35px rgba(30, 20, 12, 0.15);
}

.heritage-symbol {
  color: #b65327;
  font-size: 28px;
}

.hero-heritage-label div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.hero-heritage-label strong {
  font-size: 12px;
}

.hero-heritage-label div span {
  color: #938174;
  font-size: 10px;
}

/* ==========================================
   HERO STATISTICS
========================================== */

.hero-bottom-info {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 55px;

  width: min(700px, 100%);
  min-height: 125px;

  margin: -35px auto 0;
  padding: 35px 30px 20px;

  background: #f8efe4;
  border-radius: 50% 50% 0 0 / 28% 28% 0 0;
}

.hero-info-item {
  display: flex;
  align-items: center;
  gap: 13px;
}

.hero-info-icon {
  color: #ae542b;
  font-size: 27px;
}

.hero-info-item div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-info-item strong {
  color: #603b28;
  font-family: Georgia, serif;
  font-size: 25px;
}

.hero-info-item div span {
  color: #87776a;
  font-size: 11px;
}

.hero-info-divider {
  width: 1px;
  height: 35px;
  background: #ddcbbb;
}

/* ==========================================
   SECTION HEADING
========================================== */

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 35px;
}

.section-eyebrow {
  display: inline-block;

  color: var(--terracotta);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.section-heading h2,
.benefit-heading h2 {
  margin: 12px 0 9px;

  color: #3d2d24;
  font-family: Georgia, serif;
  font-size: clamp(28px, 3vw, 37px);
  font-weight: 600;
  letter-spacing: -0.7px;
}

.section-heading p,
.benefit-heading p {
  margin: 0;

  color: var(--muted);
  font-size: 13px;
  line-height: 1.8;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;

  padding-bottom: 5px;

  color: var(--terracotta);
  border-bottom: 1px solid #dfc3ac;

  font-size: 12px;
  font-weight: 700;
  text-decoration: none;

  transition: 0.2s ease;
}

.text-link:hover {
  color: var(--terracotta-dark);
  gap: 11px;
}

/* ==========================================
   CATEGORIES
========================================== */

.category-section {
  padding: 55px 24px 85px;
  background: #fffaf4;
}

.visual-category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.visual-category-card {
  position: relative;
  display: block;

  min-width: 0;
  aspect-ratio: 1.25 / 1;

  overflow: hidden;

  background: #e8d9c7;
  border-radius: 14px;

  text-decoration: none;
  isolation: isolate;

  box-shadow: 0 5px 18px rgba(61, 42, 29, 0.07);
}

.visual-category-card > img {
  position: absolute;
  inset: 0;
  z-index: -2;

  width: 100%;
  height: 100%;

  object-fit: cover;
  transition: transform 0.6s ease;
}

.category-card-overlay {
  position: absolute;
  inset: 0;
  z-index: -1;

  background: linear-gradient(
    0deg,
    rgba(35, 23, 16, 0.88) 0%,
    rgba(35, 23, 16, 0.35) 48%,
    rgba(35, 23, 16, 0.02) 100%
  );
}

.category-card-content {
  position: absolute;
  inset: auto 0 0;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  padding: 23px;
  color: white;
}

.category-card-count {
  display: inline-block;
  margin-bottom: 8px;
  padding: 5px 10px;

  color: white;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;

  font-size: 10px;
  font-weight: 600;

  backdrop-filter: blur(8px);
}

.category-card-content h3 {
  margin: 0 0 10px;

  color: white;
  font-family: Georgia, serif;
  font-size: 23px;
  font-weight: 600;
}

.category-card-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: #f4c59c;
  font-size: 11px;
  font-weight: 600;

  transition: gap 0.25s ease;
}

.visual-category-card:hover > img {
  transform: scale(1.09);
}

.visual-category-card:hover .category-card-link {
  gap: 12px;
}

/* ==========================================
   FEATURED PRODUCTS
========================================== */

.featured-section {
  background:
    radial-gradient(
      ellipse at 100% 0%,
      rgba(195, 154, 101, 0.1),
      transparent 35%
    ),
    #f8f4ed;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.product-bottom {
  display: flex;
  justify-content: center;
  margin-top: 38px;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  min-height: 46px;
  padding: 0 22px;

  color: var(--terracotta-dark);
  background: transparent;
  border: 1px solid #c9aa90;
  border-radius: 9px;

  font-size: 12px;
  font-weight: 700;
  text-decoration: none;

  transition: 0.25s ease;
}

.btn-outline:hover {
  color: white;
  background: var(--terracotta-dark);
  border-color: var(--terracotta-dark);
}

/* ==========================================
   HERITAGE BANNER
========================================== */

.heritage-section {
  position: relative;
  isolation: isolate;

  display: flex;
  align-items: center;

  min-height: 400px;
  overflow: hidden;

  color: white;
  background: #493328;
}

.heritage-image {
  position: absolute;
  inset: 0;
  z-index: -2;
}

.heritage-image img {
  width: 100%;
  height: 100%;

  object-fit: cover;
  object-position: center 45%;
}

.heritage-overlay {
  position: absolute;
  inset: 0;
  z-index: -1;

  background: linear-gradient(
    90deg,
    rgba(43, 29, 20, 0.94) 0%,
    rgba(43, 29, 20, 0.76) 47%,
    rgba(43, 29, 20, 0.13) 100%
  );
}

.heritage-content {
  width: 100%;
  max-width: 1220px;

  margin: 0 auto;
  padding: 75px 24px;
}

.heritage-content .section-eyebrow {
  color: #e6c28e;
}

.heritage-content h2 {
  max-width: 560px;
  margin: 18px 0;

  color: #fffaf2;
  font-family: Georgia, serif;
  font-size: clamp(32px, 4vw, 47px);
  font-weight: 500;
  line-height: 1.2;
}

.heritage-content p {
  max-width: 460px;
  margin-bottom: 25px;

  color: rgba(255, 250, 242, 0.78);
  font-size: 13px;
  line-height: 1.9;
}

.heritage-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  min-height: 45px;
  padding: 0 20px;

  color: #443126;
  background: #f4e7d3;
  border-radius: 8px;

  font-size: 12px;
  font-weight: 700;
  text-decoration: none;

  transition: 0.2s ease;
}

.heritage-button:hover {
  background: white;
  transform: translateY(-2px);
}

.heritage-pattern {
  position: absolute;
  top: -100px;
  right: -90px;

  width: 360px;
  height: 500px;

  border: 1px solid rgba(235, 201, 155, 0.25);
  border-radius: 45% 55% 40% 60%;

  transform: rotate(30deg);
  pointer-events: none;
}

/* ==========================================
   BENEFITS
========================================== */

.benefit-section {
  position: relative;
  overflow: hidden;

  padding: 90px 24px;

  background:
    radial-gradient(
      circle at 0% 100%,
      rgba(195, 154, 101, 0.1),
      transparent 30%
    ),
    linear-gradient(120deg, #294b3b, #355b46);
}

.benefit-heading {
  max-width: 620px;
  margin: 0 auto 48px;
  text-align: center;
}

.benefit-heading .section-eyebrow {
  color: #e2bf8d;
}

.benefit-heading h2 {
  color: #fffaf2;
}

.benefit-heading p {
  color: rgba(255, 250, 242, 0.73);
}

.benefit-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.benefit-item {
  padding: 28px 20px;
  text-align: center;

  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 15px;

  background: rgba(255, 255, 255, 0.055);

  transition: 0.25s ease;
}

.benefit-item:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.11);
}

.benefit-icon {
  display: grid;
  place-items: center;

  width: 58px;
  height: 58px;

  margin: 0 auto 18px;

  color: #f0d2a6;
  background: rgba(255, 255, 255, 0.09);

  border: 1px solid rgba(240, 210, 166, 0.2);
  border-radius: 17px;
}

.benefit-item h3 {
  margin: 0 0 10px;
  color: white;
  font-size: 14px;
}

.benefit-item p {
  max-width: 230px;
  margin: 0 auto;

  color: rgba(255, 250, 242, 0.68);
  font-size: 12px;
  line-height: 1.8;
}

/* ==========================================
   ARTISAN STORIES
========================================== */

.artisan-section {
  background: #fffdf9;
}

.artisan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.artisan-card {
  display: grid;
  grid-template-columns: 0.95fr 1fr;

  min-height: 260px;
  overflow: hidden;

  background: #faf6ef;
  border: 1px solid #eee4d8;
  border-radius: 15px;

  transition: 0.25s ease;
}

.artisan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 35px rgba(57, 37, 25, 0.09);
}

.artisan-image {
  min-height: 260px;
  overflow: hidden;
}

.artisan-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.artisan-card:hover .artisan-image img {
  transform: scale(1.06);
}

.artisan-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 25px;
}

.artisan-location {
  color: var(--terracotta);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.artisan-content h3 {
  margin: 12px 0;

  color: var(--brown);
  font-family: Georgia, serif;
  font-size: 23px;
}

.artisan-content p {
  margin: 0 0 18px;

  color: var(--muted);
  font-size: 12px;
  line-height: 1.8;
}

.artisan-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;

  color: var(--terracotta);
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.artisan-link:hover {
  gap: 11px;
}

/* ==========================================
   FINAL CTA
========================================== */

.cta-section {
  position: relative;
  isolation: isolate;
  overflow: hidden;

  padding: 95px 24px;

  color: white;

  background:
    radial-gradient(
      ellipse at 10% 100%,
      rgba(211, 177, 121, 0.12),
      transparent 35%
    ),
    linear-gradient(120deg, #233f32, #315b43);

  text-align: center;
}

.cta-pattern {
  position: absolute;
  z-index: -1;

  top: -160px;
  left: -90px;

  width: 350px;
  height: 450px;

  border: 1px solid rgba(231, 200, 156, 0.17);
  border-radius: 45%;

  transform: rotate(35deg);
}

.cta-content {
  max-width: 700px;
  margin: 0 auto;
}

.cta-content .section-eyebrow {
  color: #e7c89c;
}

.cta-content h2 {
  margin: 20px 0;

  color: #fffaf2;
  font-family: Georgia, serif;
  font-size: clamp(31px, 4vw, 45px);
  font-weight: 500;
  line-height: 1.2;
}

.cta-content p {
  max-width: 550px;
  margin: 0 auto;

  color: rgba(255, 250, 242, 0.75);
  font-size: 13px;
  line-height: 1.9;
}

.btn-light {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  min-height: 49px;
  margin-top: 30px;
  padding: 0 23px;

  color: var(--forest);
  background: #fffaf2;
  border-radius: 9px;

  font-size: 13px;
  font-weight: 700;
  text-decoration: none;

  transition: 0.25s ease;
}

.btn-light:hover {
  background: #f1dfc8;
  transform: translateY(-3px);
}

/* ==========================================
   TABLET
========================================== */

@media (max-width: 1000px) {
  .hero-heritage-label {
    right: 5px;
  }

  .visual-category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .benefit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ==========================================
   MOBILE
========================================== */

@media (max-width: 700px) {
  .marketplace-hero {
    padding: 0 18px;
  }

  .marketplace-hero-image,
  .marketplace-hero-overlay {
    inset: 0 0 55px;
    height: calc(100% - 55px);
  }

  .marketplace-hero-image {
    object-position: 58% center;
  }

  .marketplace-hero-overlay {
    background: linear-gradient(
      90deg,
      rgba(39, 28, 22, 0.76),
      rgba(39, 28, 22, 0.35)
    );
  }

  .marketplace-hero-container {
    min-height: 540px;
    align-items: center;
  }

  .marketplace-hero-content {
    padding: 60px 0 90px;
  }

  .marketplace-eyebrow {
    font-size: 9px;
    letter-spacing: 1.3px;
  }

  .marketplace-hero-content h1 {
    font-size: clamp(43px, 10vw, 57px);
    letter-spacing: -1.8px;
  }

  .marketplace-hero-content > p {
    max-width: 380px;
    font-size: 13px;
  }

  .hero-heritage-label {
    display: none;
  }

  .hero-bottom-info {
    gap: 17px;
    min-height: 100px;

    margin-top: -25px;
    padding: 28px 5px 15px;
  }

  .hero-info-item {
    gap: 6px;
  }

  .hero-info-icon {
    font-size: 19px;
  }

  .hero-info-item strong {
    font-size: 19px;
  }

  .hero-info-item div span {
    font-size: 9px;
  }

  .hero-info-divider {
    height: 28px;
  }

  .category-section {
    padding: 45px 20px 60px;
  }

  .section {
    padding: 65px 20px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 15px;
  }

  .section-heading h2,
  .benefit-heading h2 {
    font-size: 30px;
  }

  .visual-category-grid {
    gap: 12px;
  }

  .visual-category-card {
    aspect-ratio: 0.95 / 1;
    border-radius: 11px;
  }

  .category-card-content {
    padding: 14px;
  }

  .category-card-content h3 {
    font-size: 17px;
  }

  .category-card-count {
    font-size: 9px;
    padding: 4px 8px;
  }

  .category-card-link {
    font-size: 10px;
  }

  .product-grid {
    gap: 13px;
  }

  .heritage-section {
    min-height: 430px;
  }

  .heritage-content {
    padding: 65px 22px;
  }

  .heritage-overlay {
    background: linear-gradient(
      90deg,
      rgba(43, 29, 20, 0.91),
      rgba(43, 29, 20, 0.53)
    );
  }

  .benefit-section {
    padding: 65px 20px;
  }

  .benefit-grid {
    gap: 12px;
  }

  .benefit-item {
    padding: 23px 13px;
  }

  .artisan-grid {
    grid-template-columns: 1fr;
  }

  .artisan-card {
    grid-template-columns: 1fr;
  }

  .artisan-image {
    height: 220px;
    min-height: 220px;
  }

  .artisan-content {
    padding: 23px;
  }

  .cta-section {
    padding: 70px 22px;
  }
}

/* ==========================================
   SMALL MOBILE
========================================== */

@media (max-width: 380px) {
  .marketplace-hero-container {
    min-height: 490px;
  }

  .marketplace-hero-content h1 {
    font-size: 39px;
  }

  .marketplace-hero-actions {
    gap: 15px;
  }

  .hero-bottom-info {
    gap: 11px;
  }

  .hero-info-item strong {
    font-size: 17px;
  }

  .visual-category-grid {
    gap: 9px;
  }

  .category-card-content {
    padding: 11px;
  }

  .category-card-content h3 {
    font-size: 15px;
  }

  .benefit-grid {
    grid-template-columns: 1fr;
  }
}

/* ==========================================
   ACCESSIBILITY
========================================== */

@media (prefers-reduced-motion: reduce) {
  .home-page *,
  .home-page *::before,
  .home-page *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
