<script setup>
import { RouterLink } from "vue-router";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  HeartHandshake,
  Truck,
  Sparkles,
} from "lucide-vue-next";

import CategoryCard from "@/components/category/CategoryCard.vue";
import ProductCard from "@/components/product/ProductCard.vue";
import { categories, products } from "@/data/products.js";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Produk Terjamin",
    description:
      "Temukan produk pilihan dari pengrajin lokal yang telah dikurasi.",
  },
  {
    icon: HeartHandshake,
    title: "Dukung Pengrajin Lokal",
    description: "Setiap pembelian ikut mendukung karya dan ekonomi UMKM Bali.",
  },
  {
    icon: Truck,
    title: "Pengiriman Mudah",
    description: "Nikmati kemudahan pengiriman produk kerajinan ke rumahmu.",
  },
  {
    icon: Sparkles,
    title: "Karya Penuh Cerita",
    description:
      "Setiap produk memiliki nilai seni dan cerita di balik pembuatannya.",
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
</script>

<template>
  <main class="home-page">
    <!-- HERO -->
    <section class="hero-section">
      <div class="hero-container">
        <div class="hero-copy">
          <span class="eyebrow">
            <span class="eyebrow-dot"></span>
            MARKETPLACE KARYA LOKAL BALI
          </span>

          <h1>
            Temukan Keindahan
            <span>dalam Setiap Karya.</span>
          </h1>

          <p class="hero-description">
            Jelajahi berbagai mahakarya pengrajin lokal Bali. Dari kerajinan
            tradisional hingga karya modern, setiap produk memiliki cerita dan
            keunikan tersendiri.
          </p>

          <div class="hero-actions">
            <RouterLink to="/katalog" class="btn-primary">
              Jelajahi Produk
              <ArrowRight :size="18" />
            </RouterLink>

            <a href="#cerita-pengrajin" class="btn-secondary">
              Kenali Pengrajin
            </a>
          </div>

          <div class="hero-statistics">
            <div>
              <strong>100+</strong>
              <span>Produk Lokal</span>
            </div>
            <div>
              <strong>50+</strong>
              <span>Pengrajin</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Karya Lokal</span>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <img
            class="hero-main-image"
            src="https://images.unsplash.com/photo-1603006905003-be475563bc59?w=1100"
            alt="Kerajinan dan dekorasi handmade"
          />

          <div class="hero-image-caption">
            <span class="caption-icon">✦</span>
            <div>
              <strong>Made with Meaning</strong>
              <span>Karya lokal, cerita istimewa</span>
            </div>
          </div>

          <div class="hero-floating-note">
            <span>✺</span>
            <div>
              <strong>Local Heritage</strong>
              <small>Warisan budaya Bali</small>
            </div>
          </div>
        </div>
      </div>

      <div class="hero-decoration hero-decoration-one"></div>
      <div class="hero-decoration hero-decoration-two"></div>
    </section>

    <!-- CATEGORY -->
    <section class="section category-section">
      <div class="section-container">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow">JELAJAHI KOLEKSI</span>
            <h2>Temukan Karya Favoritmu</h2>
            <p>Beragam kategori kerajinan yang dibuat dengan sepenuh hati.</p>
          </div>

          <RouterLink to="/katalog" class="text-link">
            Semua kategori
            <ArrowUpRight :size="17" />
          </RouterLink>
        </div>

        <div class="category-grid">
          <CategoryCard
            v-for="category in categories"
            :key="category.id"
            :category="category"
          />
        </div>
      </div>
    </section>

    <!-- FEATURED PRODUCTS -->
    <section class="section featured-section">
      <div class="section-container">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow">PILIHAN UNTUKMU</span>
            <h2>Karya Pilihan Minggu Ini</h2>
            <p>Produk istimewa dari tangan-tangan kreatif pengrajin Bali.</p>
          </div>

          <RouterLink to="/katalog" class="text-link">
            Lihat semua produk
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
      </div>
    </section>

    <!-- BENEFITS -->
    <section class="benefit-section">
      <div class="section-container">
        <div class="benefit-heading">
          <span class="section-eyebrow">MENGAPA KRIYALOKA?</span>
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
              <component :is="benefit.icon" :size="23" />
            </div>
            <h3>{{ benefit.title }}</h3>
            <p>{{ benefit.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ARTISAN STORY -->
    <section id="cerita-pengrajin" class="section artisan-section">
      <div class="section-container">
        <div class="section-heading">
          <div>
            <span class="section-eyebrow">DI BALIK SETIAP KARYA</span>
            <h2>Cerita Para Pengrajin</h2>
            <p>Kenali orang-orang kreatif di balik produk pilihanmu.</p>
          </div>
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
              <span>{{ artisan.location }}</span>
              <h3>{{ artisan.name }}</h3>
              <p>{{ artisan.description }}</p>
              <RouterLink to="/katalog" class="artisan-link">
                Jelajahi karyanya
                <ArrowRight :size="16" />
              </RouterLink>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="cta-content">
        <span class="section-eyebrow">DUKUNG KARYA ANAK BANGSA</span>
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
.home-page {
  color: #3e3028;
}

/* HERO */
.hero-section {
  position: relative;
  overflow: hidden;
  padding: 75px 24px 85px;
  background: #f3e9dc;
}

.hero-container {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 0.95fr;
  align-items: center;
  gap: 65px;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.hero-copy {
  max-width: 570px;
}

.eyebrow,
.section-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #943c14;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.eyebrow-dot {
  width: 7px;
  height: 7px;
  background: #b4532a;
  border-radius: 50%;
}

.hero-copy h1 {
  margin: 24px 0 20px;
  color: #3e3028;
  font-family: Georgia, serif;
  font-size: clamp(42px, 5vw, 66px);
  font-weight: 600;
  line-height: 1.12;
  letter-spacing: -2px;
}

.hero-copy h1 span {
  display: block;
  color: #a64d27;
  font-style: italic;
}

.hero-description {
  max-width: 490px;
  color: #77685d;
  font-size: 14px;
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 13px;
  margin-top: 30px;
}

.btn-primary,
.btn-secondary,
.btn-light {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: 0.2s;
}

.btn-primary {
  color: #fff;
  background: #943c14;
}

.btn-primary:hover {
  background: #71300f;
  transform: translateY(-2px);
}

.btn-secondary {
  color: #684b39;
  border: 1px solid #cdb9a5;
}

.btn-secondary:hover {
  background: #fff8f0;
}

.hero-statistics {
  display: flex;
  gap: 38px;
  margin-top: 48px;
}

.hero-statistics div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.hero-statistics strong {
  color: #943c14;
  font-family: Georgia, serif;
  font-size: 25px;
}

.hero-statistics span {
  color: #85766a;
  font-size: 11px;
}

.hero-visual {
  position: relative;
  min-width: 0;
}

.hero-main-image {
  display: block;
  width: 100%;
  height: 470px;
  object-fit: cover;
  border-radius: 180px 180px 18px 18px;
  box-shadow: 0 22px 55px rgba(75, 47, 30, 0.15);
}

.hero-image-caption {
  position: absolute;
  right: -22px;
  bottom: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 35px rgba(75, 47, 30, 0.12);
}

.caption-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #943c14;
  background: #f7eee5;
  border-radius: 50%;
}

.hero-image-caption div,
.hero-floating-note div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hero-image-caption strong,
.hero-floating-note strong {
  color: #49382d;
  font-size: 12px;
}

.hero-image-caption span:last-child,
.hero-floating-note small {
  color: #98897d;
  font-size: 10px;
}

.hero-floating-note {
  position: absolute;
  top: 35px;
  left: -35px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(75, 47, 30, 0.1);
}

.hero-floating-note > span {
  color: #b4532a;
  font-size: 25px;
}

.hero-decoration {
  position: absolute;
  border: 1px solid rgba(148, 60, 20, 0.1);
  border-radius: 50%;
}

.hero-decoration-one {
  top: -150px;
  right: -100px;
  width: 420px;
  height: 420px;
}

.hero-decoration-two {
  bottom: -230px;
  left: -100px;
  width: 500px;
  height: 500px;
}

/* GENERAL SECTIONS */
.section {
  padding: 85px 24px;
}

.section-container {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 32px;
}

.section-heading h2,
.benefit-heading h2 {
  margin: 12px 0 8px;
  color: #3e3028;
  font-family: Georgia, serif;
  font-size: clamp(27px, 3vw, 36px);
  font-weight: 600;
}

.section-heading p,
.benefit-heading > p {
  margin: 0;
  color: #897b70;
  font-size: 13px;
  line-height: 1.7;
}

.text-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  color: #943c14;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.text-link:hover {
  color: #71300f;
}

/* CATEGORY */
.category-section {
  background: #fff;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

/* PRODUCTS */
.featured-section {
  background: #fbf7f2;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

/* BENEFITS */
.benefit-section {
  padding: 85px 24px;
  background: #eee4d8;
}

.benefit-heading {
  max-width: 600px;
  margin: 0 auto 45px;
  text-align: center;
}

.benefit-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 30px;
}

.benefit-item {
  text-align: center;
}

.benefit-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin: 0 auto 17px;
  color: #943c14;
  background: #fff;
  border-radius: 17px;
}

.benefit-item h3 {
  margin: 0 0 9px;
  font-size: 14px;
}

.benefit-item p {
  max-width: 230px;
  margin: 0 auto;
  color: #88786c;
  font-size: 12px;
  line-height: 1.8;
}

/* ARTISAN */
.artisan-section {
  background: #fff;
}

.artisan-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 25px;
}

.artisan-card {
  display: grid;
  grid-template-columns: 0.9fr 1fr;
  overflow: hidden;
  min-height: 245px;
  background: #fbf7f2;
  border: 1px solid #eee5dc;
  border-radius: 16px;
}

.artisan-image {
  min-height: 245px;
  overflow: hidden;
}

.artisan-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.artisan-card:hover .artisan-image img {
  transform: scale(1.05);
}

.artisan-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 25px;
}

.artisan-content > span {
  color: #a16a48;
  font-size: 10px;
  font-weight: 700;
}

.artisan-content h3 {
  margin: 10px 0;
  font-family: Georgia, serif;
  font-size: 21px;
}

.artisan-content p {
  margin: 0 0 18px;
  color: #897b70;
  font-size: 12px;
  line-height: 1.7;
}

.artisan-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #943c14;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

/* CTA */
.cta-section {
  padding: 80px 24px;
  color: #fff;
  background: #2d694d;
  text-align: center;
}

.cta-content {
  max-width: 680px;
  margin: 0 auto;
}

.cta-content .section-eyebrow {
  color: #e7c89c;
}

.cta-content h2 {
  margin: 18px 0 15px;
  font-family: Georgia, serif;
  font-size: clamp(30px, 4vw, 43px);
  font-weight: 500;
  line-height: 1.2;
}

.cta-content p {
  margin: 0 auto;
  max-width: 540px;
  color: #d5e2d9;
  font-size: 13px;
  line-height: 1.8;
}

.btn-light {
  margin-top: 28px;
  color: #2d694d;
  background: #fff;
}

.btn-light:hover {
  background: #f4eadf;
  transform: translateY(-2px);
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .hero-container {
    gap: 35px;
  }

  .hero-main-image {
    height: 390px;
  }

  .product-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .benefit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 35px;
  }

  .artisan-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 650px) {
  .hero-section {
    padding: 55px 20px 65px;
  }

  .hero-container {
    grid-template-columns: 1fr;
  }

  .hero-copy h1 {
    font-size: 43px;
  }

  .hero-visual {
    margin: 15px 10px 0;
  }

  .hero-main-image {
    height: 350px;
    border-radius: 130px 130px 15px 15px;
  }

  .hero-image-caption {
    right: -10px;
  }

  .hero-floating-note {
    left: -10px;
  }

  .hero-statistics {
    gap: 25px;
    margin-top: 35px;
  }

  .section {
    padding: 60px 20px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .product-grid {
    gap: 12px;
  }

  .benefit-section {
    padding: 60px 20px;
  }

  .artisan-card {
    grid-template-columns: 1fr;
  }

  .artisan-image {
    height: 210px;
    min-height: 210px;
  }

  .artisan-content {
    padding: 22px;
  }

  .cta-section {
    padding: 65px 22px;
  }
}

@media (max-width: 380px) {
  .hero-copy h1 {
    font-size: 36px;
  }

  .hero-statistics {
    gap: 17px;
  }

  .hero-statistics strong {
    font-size: 21px;
  }

  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>
