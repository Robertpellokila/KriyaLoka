
<script setup>
import { computed, ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth.js";
import { useSellerStore } from "../stores/sellerStore.js";
import {
  Store,
  Package,
  ClipboardList,
  CreditCard,
  Plus,
  Wallet,
  Users,
  ShoppingBag,
  TrendingUp,
} from "lucide-vue-next";

const authStore = useAuthStore();
const sellerStore = useSellerStore();

const isPending = computed(
  () => authStore.profile?.account_status === "pending",
);

// Ambil profil toko milik penjual yang sedang login
onMounted(async () => {
  try {
    if (!sellerStore.profile) {
      await sellerStore.fetchMyStore();
    }
  } catch (error) {
    console.error("Gagal memuat profil toko:", error);
  }
});

// Data identitas toko
const storeProfile = computed(() => sellerStore.profile);

const storeName = computed(
  () => storeProfile.value?.store_name || "Nama Toko Belum Diatur",
);

const storeLogo = computed(
  () => storeProfile.value?.logo_url || "",
);

const storeBanner = computed(
  () => storeProfile.value?.banner_url || "",
);

const storeCategory = computed(
  () => storeProfile.value?.category || "",
);

const storeCity = computed(
  () => storeProfile.value?.city || "",
);

// Pilihan tampilan grafik
const chartMode = ref("units");

// Data ilustrasi grafik
const chartData = {
  units: [18, 25, 21, 34, 29, 43],
  revenue: [12, 20, 17, 31, 27, 40],
};

const currentChartData = computed(
  () => chartData[chartMode.value],
);

const chartPoints = computed(() => {
  const values = currentChartData.value;
  const maxValue = Math.max(...values, 1) * 1.15;

  return values
    .map((value, index) => {
      const x = 20 + index * 108;
      const y = 155 - (value / maxValue) * 125;
      return `${x},${y}`;
    })
    .join(" ");
});

const chartArea = computed(() => {
  const points = chartPoints.value
    .split(" ")
    .map((point) => point.replace(",", " "));

  return `M ${points.join(" L ")} L 560 170 L 20 170 Z`;
});

// Data contoh produk terlaris
const topProducts = [
  { name: "Produk contoh 1", sold: 35, width: 100 },
  { name: "Produk contoh 2", sold: 24, width: 69 },
  { name: "Produk contoh 3", sold: 18, width: 51 },
  { name: "Produk contoh 4", sold: 12, width: 34 },
  { name: "Produk contoh 5", sold: 9, width: 26 },
];
</script>

<template>
  <section class="seller-home">

    <!-- 1. Identitas Toko -->
    <section class="store-profile-card">

      <div class="store-banner">
        <img
          v-if="storeBanner"
          :src="storeBanner"
          alt="Banner toko"
          class="store-banner-image"
        />

        <div v-else class="store-banner-placeholder">
          <Store />
          <span>KriyaLoka Seller Center</span>
        </div>
      </div>

      <div class="store-profile-content">

        <div class="store-logo">
          <img
            v-if="storeLogo"
            :src="storeLogo"
            alt="Logo toko"
          />

          <div v-else class="store-logo-placeholder">
            <Store />
          </div>
        </div>

        <div class="store-information">
          <div class="store-name-row">
            <div>
              <h2>{{ storeName }}</h2>

              <div class="store-meta">
                <span v-if="storeCategory">
                  {{ storeCategory }}
                </span>

                <span v-if="storeCity">
                  <span v-if="storeCategory">•</span>
                  {{ storeCity }}
                </span>
              </div>
            </div>

            <RouterLink
              to="/dashboard/penjual/toko"
              class="edit-store-button"
            >
              <Store />
              <span>Kelola Profil Toko</span>
            </RouterLink>
          </div>

          <p class="owner-greeting">
            Halo, {{ authStore.profile?.full_name || "Penjual" }}!
            Selamat datang di Seller Center KriyaLoka.
          </p>
        </div>

      </div>
    </section>

    <!-- 2. Status Akun -->
    <div
      v-if="isPending"
      class="verification-notice"
      role="status"
    >
      <div class="status-indicator"></div>

      <div>
        <strong>Pendaftaran toko sedang ditinjau</strong>
        <p>
          Tim KriyaLoka sedang memeriksa akun Anda.
          Setelah disetujui, Anda dapat mulai mengelola
          toko dan produk.
        </p>
      </div>
    </div>

    <div
      v-else
      class="verification-success"
      role="status"
    >
      <div class="status-indicator"></div>

      <div>
        <strong>Akun penjual Anda sudah aktif.</strong>
        <p>
          Anda dapat melanjutkan pengaturan toko dan produk.
        </p>
      </div>
    </div>

    <!-- 3. Ringkasan Toko -->
    <section class="dashboard-section">
      <div class="section-heading">
        <div>
          <h3>Ringkasan Toko</h3>
          <p>Pantau perkembangan usaha Anda.</p>
        </div>
      </div>

      <div class="stats-grid">

        <article class="stat-card">
          <div class="stat-icon">
            <Wallet />
          </div>

          <div class="stat-info">
            <span>Total Pendapatan</span>
            <h3>--</h3>
            <small>Per bulan ini</small>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon">
            <Users />
          </div>

          <div class="stat-info">
            <span>Pelanggan Baru</span>
            <h3>--</h3>
            <small>Per bulan ini</small>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon">
            <Package />
          </div>

          <div class="stat-info">
            <span>Total Produk</span>
            <h3>--</h3>
            <small>Produk terdaftar</small>
          </div>
        </article>

        <article class="stat-card">
          <div class="stat-icon">
            <ShoppingBag />
          </div>

          <div class="stat-info">
            <span>Total Penjualan</span>
            <h3>--</h3>
            <small>Unit terjual</small>
          </div>
        </article>

      </div>
    </section>

    <!-- 4. Akses Cepat -->
    <section class="dashboard-section">
      <div class="section-heading">
        <div>
          <h3>Akses Cepat</h3>
          <p>Pilih menu untuk mengelola toko Anda.</p>
        </div>
      </div>

      <div class="action-grid">

        <RouterLink
          :to="{ name: 'seller-product-create' }"
          class="action-card"
        >
          <div class="action-icon">
            <Plus />
          </div>
          <span>Tambah Produk</span>
        </RouterLink>

        <RouterLink
          to="/dashboard/penjual/toko"
          class="action-card"
        >
          <div class="action-icon">
            <Store />
          </div>
          <span>Profil Toko</span>
        </RouterLink>

        <RouterLink
          to="/dashboard/penjual/pesanan"
          class="action-card"
        >
          <div class="action-icon">
            <ClipboardList />
          </div>
          <span>Pesanan</span>
        </RouterLink>

        <RouterLink
          to="/dashboard/penjual/produk"
          class="action-card"
        >
          <div class="action-icon">
            <Package />
          </div>
          <span>Produk Saya</span>
        </RouterLink>

        <div
          class="action-card action-disabled"
          aria-disabled="true"
          title="Fitur pembayaran belum tersedia"
        >
          <div class="action-icon">
            <CreditCard />
          </div>
          <span>Pembayaran</span>
          <small>Segera tersedia</small>
        </div>

      </div>
    </section>

    <!-- 5. Insight Toko -->
    <section class="dashboard-section insight-section">

      <div class="section-heading">
        <div>
          <h3>Insight Toko</h3>
          <p>
            Lihat perkembangan dan performa penjualan Anda.
          </p>
        </div>
      </div>

      <!-- A. Tren Penjualan -->
      <article class="insight-card sales-card">

        <div class="insight-heading">
          <div>
            <h4>Tren Penjualan</h4>
            <p>Perkembangan penjualan setiap bulan.</p>
          </div>

          <div
            class="chart-switch"
            role="group"
            aria-label="Pilih jenis data grafik"
          >
            <button
              type="button"
              :class="{ active: chartMode === 'units' }"
              :aria-pressed="chartMode === 'units'"
              @click="chartMode = 'units'"
            >
              Produk Terjual
            </button>

            <button
              type="button"
              :class="{ active: chartMode === 'revenue' }"
              :aria-pressed="chartMode === 'revenue'"
              @click="chartMode = 'revenue'"
            >
              Pendapatan
            </button>
          </div>
        </div>

        <div class="chart-summary">
          <strong>--</strong>
          <span>
            {{
              chartMode === "units"
                ? "Unit terjual"
                : "Total pendapatan"
            }}
          </span>
        </div>

        <div class="line-chart">
          <svg
            viewBox="0 0 580 190"
            preserveAspectRatio="none"
            role="img"
            :aria-label="
              chartMode === 'units'
                ? 'Ilustrasi tren jumlah produk terjual'
                : 'Ilustrasi tren pendapatan'
            "
          >
            <defs>
              <linearGradient
                id="salesFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stop-color="#943c14"
                  stop-opacity=".22"
                />
                <stop
                  offset="100%"
                  stop-color="#943c14"
                  stop-opacity=".01"
                />
              </linearGradient>
            </defs>

            <line
              v-for="y in [35, 75, 115, 155]"
              :key="y"
              x1="20"
              :y1="y"
              x2="560"
              :y2="y"
              class="chart-grid-line"
            />

            <path
              :d="chartArea"
              fill="url(#salesFill)"
            />

            <polyline
              :points="chartPoints"
              fill="none"
              stroke="#943c14"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <circle
              v-for="(point, index) in chartPoints.split(' ')"
              :key="index"
              :cx="Number(point.split(',')[0])"
              :cy="Number(point.split(',')[1])"
              r="4"
              fill="#943c14"
              stroke="white"
              stroke-width="2"
            />
          </svg>

          <div class="chart-months">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>Mei</span>
            <span>Jun</span>
          </div>
        </div>

        <small class="demo-note">
          Grafik masih berupa ilustrasi dan belum menggunakan
          data transaksi sebenarnya.
        </small>

      </article>

      <!-- B. Produk Terlaris dan Status Pesanan -->
      <div class="insight-grid">

        <!-- Produk Paling Laris -->
        <article class="insight-card">

          <div class="insight-heading">
            <div>
              <h4>Produk Paling Laris</h4>
              <p>
                Produk dengan jumlah penjualan tertinggi.
              </p>
            </div>

            <TrendingUp class="heading-icon" />
          </div>

          <div class="product-ranking">
            <div
              v-for="(product, index) in topProducts"
              :key="product.name"
              class="product-row"
            >
              <div class="product-info">
                <span class="product-rank">
                  {{ index + 1 }}
                </span>

                <span class="product-name">
                  {{ product.name }}
                </span>

                <strong>{{ product.sold }}</strong>
              </div>

              <div class="bar-track">
                <div
                  class="bar-fill"
                  :style="{ width: `${product.width}%` }"
                ></div>
              </div>
            </div>
          </div>

          <small class="demo-note">
            Daftar ini masih menggunakan data contoh.
          </small>

        </article>

        <!-- Status Pesanan -->
        <article class="insight-card">

          <div class="insight-heading">
            <div>
              <h4>Status Pesanan</h4>
              <p>
                Ringkasan status pesanan pembeli.
              </p>
            </div>

            <ClipboardList class="heading-icon" />
          </div>

          <div class="order-chart-content">

            <div
              class="donut-chart"
              role="img"
              aria-label="Ilustrasi pembagian status pesanan"
            >
              <div class="donut-center">
                <strong>--</strong>
                <span>Pesanan</span>
              </div>
            </div>

            <div class="order-legend">

              <div>
                <span class="legend-dot waiting"></span>
                <span>Menunggu</span>
                <strong>--</strong>
              </div>

              <div>
                <span class="legend-dot processing"></span>
                <span>Diproses</span>
                <strong>--</strong>
              </div>

              <div>
                <span class="legend-dot shipped"></span>
                <span>Dikirim</span>
                <strong>--</strong>
              </div>

              <div>
                <span class="legend-dot completed"></span>
                <span>Selesai</span>
                <strong>--</strong>
              </div>

            </div>
          </div>

          <small class="demo-note">
            Grafik akan mengikuti status pesanan setelah
            data transaksi dihubungkan.
          </small>

        </article>
      </div>
    </section>

  </section>
</template>

<style scoped>
.seller-home {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  min-width: 0;
  color: #302923;
}

/* Identitas Toko */
.store-profile-card {
  overflow: hidden;
  border: 1px solid #ece5dd;
  border-radius: 14px;
  background: #fff;
}

.store-banner {
  position: relative;
  height: 145px;
  overflow: hidden;
  background: #f3e7dc;
}

.store-banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-banner-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  background: linear-gradient(120deg, #f3e7dc, #ead2c1);
  color: #943c14;
  font-size: 12px;
  font-weight: 700;
}

.store-banner-placeholder svg {
  width: 22px;
  height: 22px;
}

.store-profile-content {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  padding: 0 22px 20px;
}

.store-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  margin-top: -43px;
  overflow: hidden;
  border: 4px solid #fff;
  border-radius: 14px;
  background: #f8eee7;
  z-index: 1;
}

.store-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.store-logo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #943c14;
}

.store-logo-placeholder svg {
  width: 32px;
  height: 32px;
}

.store-information {
  flex: 1;
  min-width: 0;
  padding-top: 13px;
}

.store-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.store-name-row h2 {
  margin: 0;
  color: #302923;
  font-size: 19px;
  font-weight: 750;
}

.store-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 6px;
  color: #85766a;
  font-size: 10px;
}

.owner-greeting {
  margin: 10px 0 0;
  color: #85766a;
  font-size: 11px;
}

.edit-store-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  flex-shrink: 0;
  padding: 9px 12px;
  border: 1px solid #ead9cb;
  border-radius: 8px;
  background: #fff;
  color: #943c14;
  font-size: 10px;
  font-weight: 700;
  text-decoration: none;
  transition: background .2s ease;
}

.edit-store-button:hover {
  background: #f8eee7;
}

.edit-store-button svg {
  width: 15px;
  height: 15px;
}

/* Status Akun */
.verification-notice,
.verification-success {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 15px 18px;
  border-radius: 10px;
}

.verification-notice {
  border: 1px solid #f0dfb8;
  background: #fff8e9;
  color: #8b671d;
}

.verification-success {
  border: 1px solid #cce5d2;
  background: #eff7f0;
  color: #34754a;
}

.status-indicator {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  margin-top: 5px;
  border-radius: 50%;
  background: currentColor;
}

.verification-notice strong,
.verification-success strong {
  font-size: 12px;
  font-weight: 750;
}

.verification-notice p,
.verification-success p {
  margin: 5px 0 0;
  color: #85766a;
  font-size: 11px;
  line-height: 1.6;
}

/* Section */
.dashboard-section {
  display: flex;
  flex-direction: column;
  gap: 13px;
  min-width: 0;
}

.section-heading h3 {
  margin: 0;
  color: #302923;
  font-size: 16px;
  font-weight: 750;
}

.section-heading p {
  margin: 5px 0 0;
  color: #85766a;
  font-size: 11px;
}

/* Ringkasan Toko */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 16px;
  border: 1px solid #ece5dd;
  border-radius: 12px;
  background: #fff;
  transition: transform .2s ease, box-shadow .2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 16px rgba(80, 50, 30, .06);
}

.stat-icon,
.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #943c14;
  background: #f8eee7;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

.stat-icon svg {
  width: 19px;
  height: 19px;
  stroke-width: 1.9;
}

.stat-info {
  min-width: 0;
}

.stat-info span {
  display: block;
  color: #85766a;
  font-size: 10px;
  line-height: 1.4;
}

.stat-info h3 {
  margin: 5px 0 3px;
  color: #302923;
  font-size: 21px;
  font-weight: 750;
}

.stat-info small {
  color: #a0958b;
  font-size: 9px;
}

/* Akses Cepat */
.action-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.action-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-width: 0;
  min-height: 96px;
  padding: 14px 9px;
  border: 1px solid #ece5dd;
  border-radius: 11px;
  background: #fff;
  color: #302923;
  text-align: center;
  text-decoration: none;
  transition: border-color .2s ease, background .2s ease,
    transform .2s ease, box-shadow .2s ease;
}

.action-card:hover {
  transform: translateY(-2px);
  border-color: #d8b49f;
  background: #fdfaf8;
  box-shadow: 0 4px 12px rgba(80, 50, 30, .05);
}

.action-icon {
  width: 35px;
  height: 35px;
  border-radius: 9px;
}

.action-icon svg {
  width: 19px;
  height: 19px;
  stroke-width: 1.9;
}

.action-card > span {
  font-size: 10px;
  font-weight: 700;
  line-height: 1.35;
}

.action-card small {
  margin-top: -5px;
  color: #a0958b;
  font-size: 9px;
}

.action-disabled {
  cursor: not-allowed;
  opacity: .68;
}

.action-disabled:hover {
  transform: none;
  border-color: #ece5dd;
  background: #fff;
  box-shadow: none;
}

/* Insight Toko */
.insight-section {
  margin-bottom: 8px;
}

.insight-card {
  min-width: 0;
  padding: 19px;
  border: 1px solid #ece5dd;
  border-radius: 12px;
  background: #fff;
}

.insight-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.insight-heading h4 {
  margin: 0;
  color: #302923;
  font-size: 13px;
  font-weight: 750;
}

.insight-heading p {
  margin: 5px 0 0;
  color: #85766a;
  font-size: 10px;
  line-height: 1.5;
}

.heading-icon {
  width: 19px;
  height: 19px;
  flex-shrink: 0;
  color: #943c14;
  stroke-width: 1.8;
}

/* Tren Penjualan */
.sales-card {
  padding: 20px;
}

.chart-switch {
  display: flex;
  flex-shrink: 0;
  gap: 3px;
  padding: 3px;
  border-radius: 8px;
  background: #f7f2ee;
}

.chart-switch button {
  padding: 7px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #85766a;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
}

.chart-switch button.active {
  background: #943c14;
  color: #fff;
}

.chart-switch button:focus-visible,
.action-card:focus-visible,
.edit-store-button:focus-visible {
  outline: 2px solid #943c14;
  outline-offset: 3px;
}

.chart-summary {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 17px;
}

.chart-summary strong {
  color: #302923;
  font-size: 22px;
  font-weight: 750;
}

.chart-summary span {
  color: #85766a;
  font-size: 10px;
}

.line-chart {
  width: 100%;
  margin-top: 8px;
}

.line-chart svg {
  display: block;
  width: 100%;
  height: 180px;
  overflow: visible;
}

.chart-grid-line {
  stroke: #eee7e1;
  stroke-width: 1;
  stroke-dasharray: 4 5;
}

.chart-months {
  display: flex;
  justify-content: space-between;
  padding: 0 2%;
  color: #a0958b;
  font-size: 9px;
}

.demo-note {
  display: block;
  margin-top: 12px;
  color: #a0958b;
  font-size: 9px;
  line-height: 1.5;
}

/* Produk Terlaris dan Status Pesanan */
.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

/* Produk Terlaris */
.product-ranking {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
}

.product-row {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 10px;
}

.product-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 21px;
  height: 21px;
  flex-shrink: 0;
  border-radius: 6px;
  background: #f8eee7;
  color: #943c14;
  font-weight: 750;
}

.product-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: #51463e;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-info strong {
  color: #302923;
  font-size: 10px;
}

.bar-track {
  height: 7px;
  margin-left: 30px;
  overflow: hidden;
  border-radius: 10px;
  background: #f2ede8;
}

.bar-fill {
  height: 100%;
  border-radius: 10px;
  background: linear-gradient(90deg, #943c14, #c77b50);
}

/* Status Pesanan */
.order-chart-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 15px;
  margin-top: 20px;
}

.donut-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128px;
  height: 128px;
  flex-shrink: 0;
  border-radius: 50%;
  background: conic-gradient(
    #d9a45b 0% 20%,
    #943c14 20% 45%,
    #83a9c3 45% 65%,
    #6a9c75 65% 100%
  );
}

.donut-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff;
}

.donut-center strong {
  color: #302923;
  font-size: 19px;
}

.donut-center span {
  margin-top: 2px;
  color: #85766a;
  font-size: 9px;
}

.order-legend {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.order-legend > div {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #85766a;
  font-size: 10px;
}

.order-legend strong {
  margin-left: auto;
  color: #302923;
  font-size: 10px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-radius: 50%;
}

.waiting {
  background: #d9a45b;
}

.processing {
  background: #943c14;
}

.shipped {
  background: #83a9c3;
}

.completed {
  background: #6a9c75;
}

/* Responsif */
@media (max-width: 1000px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .action-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 750px) {
  .store-profile-content {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .store-information {
    padding-top: 0;
  }

  .store-name-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .insight-grid {
    grid-template-columns: 1fr;
  }

  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .order-chart-content {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .seller-home {
    gap: 17px;
  }

  .store-banner {
    height: 115px;
  }

  .store-profile-content {
    gap: 12px;
    padding: 0 14px 16px;
  }

  .store-logo {
    width: 70px;
    height: 70px;
    margin-top: -30px;
  }

  .store-name-row h2 {
    font-size: 16px;
  }

  .edit-store-button {
    padding: 8px 10px;
  }

  .stats-grid {
    gap: 9px;
  }

  .stat-card {
    align-items: flex-start;
    gap: 9px;
    padding: 12px;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
  }

  .stat-icon svg {
    width: 16px;
    height: 16px;
  }

  .stat-info span {
    font-size: 9px;
  }

  .stat-info h3 {
    font-size: 18px;
  }

  .stat-info small {
    font-size: 8px;
  }

  .insight-card {
    padding: 15px;
  }

  .sales-card {
    padding: 16px 13px;
  }

  .insight-heading {
    flex-wrap: wrap;
  }

  .chart-switch {
    width: 100%;
  }

  .chart-switch button {
    flex: 1;
    padding: 7px 5px;
    font-size: 9px;
  }

  .line-chart svg {
    height: 150px;
  }

  .order-chart-content {
    gap: 12px;
  }

  .donut-chart {
    width: 108px;
    height: 108px;
  }

  .donut-center {
    width: 68px;
    height: 68px;
  }

  .order-legend {
    gap: 10px;
  }

  .order-legend > div {
    font-size: 9px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .action-card,
  .chart-switch button {
    transition: none;
  }
}
</style>
