<script setup>
import { computed } from "vue";
import { useAuthStore } from "../stores/auth.js";
import { Store, Package, ClipboardList, CreditCard } from "lucide-vue-next";

const authStore = useAuthStore();

const isPending = computed(
  () => authStore.profile?.account_status === "pending",
);
</script>

<template>
  <section class="seller-home">
    <div class="welcome">
      <span>SELLER CENTER</span>
      <h2>Halo, {{ authStore.profile?.full_name }}!</h2>
      <p>Kelola usaha dan produk kerajinan Anda di KriyaLoka.</p>
    </div>

    <div v-if="isPending" class="verification-notice">
      <strong>Pendaftaran toko sedang ditinjau</strong>
      <p>
        Tim KriyaLoka sedang memeriksa akun Anda. Setelah disetujui, Anda dapat
        mulai mengelola toko dan produk.
      </p>
    </div>

    <div v-else class="verification-success">
      <strong>Akun penjual Anda sudah aktif.</strong>
      <p>Anda dapat melanjutkan pengaturan toko dan produk.</p>
    </div>

    <div class="quick-cards">
      <article>
        <Store />
        <h3>Profil Toko</h3>
        <p>Lengkapi nama, deskripsi, dan informasi usaha.</p>
        <RouterLink to="/dashboard/penjual/toko"> Kelola toko </RouterLink>
      </article>

      <article>
        <Package />
        <h3>Produk Saya</h3>
        <p>Tambahkan dan kelola produk kerajinan.</p>
        <RouterLink to="/dashboard/penjual/produk"> Kelola produk </RouterLink>
      </article>

      <article>
        <ClipboardList />
        <h3>Pesanan</h3>
        <p>Pantau pesanan dari pembeli.</p>
        <RouterLink to="/dashboard/penjual/pesanan"> Lihat pesanan </RouterLink>
      </article>

      <article>
        <CreditCard />
        <h3>Pembayaran</h3>
        <p>Atur metode pembayaran untuk toko.</p>
        <span>Segera tersedia</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.welcome {
  padding: 28px;
  border-radius: 14px;
  background: #f3e7dc;
}

.welcome > span {
  color: #943c14;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.welcome h2 {
  margin: 10px 0 7px;
  font-size: 25px;
}

.welcome p,
.quick-cards p,
.verification-notice p,
.verification-success p {
  color: #85766a;
  font-size: 12px;
  line-height: 1.7;
}

.verification-notice,
.verification-success {
  margin-top: 18px;
  padding: 18px 20px;
  border-radius: 10px;
}

.verification-notice {
  border: 1px solid #f0dfb8;
  background: #fff7e5;
  color: #8b671d;
}

.verification-success {
  border: 1px solid #cce5d2;
  background: #edf7ef;
  color: #34754a;
}

.verification-notice p,
.verification-success p {
  margin-bottom: 0;
}

.quick-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.quick-cards article {
  padding: 22px;
  border: 1px solid #ece5dd;
  border-radius: 12px;
  background: white;
}

.quick-cards article > svg {
  color: #943c14;
}

.quick-cards h3 {
  margin: 15px 0 7px;
  font-size: 15px;
}

.quick-cards a,
.quick-cards span {
  display: inline-block;
  margin-top: 12px;
  color: #943c14;
  font-size: 11px;
  font-weight: 700;
}

@media (max-width: 750px) {
  .quick-cards {
    grid-template-columns: 1fr;
  }
}
</style>
