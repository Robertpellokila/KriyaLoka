<script setup>
import { useAuthStore } from "../stores/auth.js";
import { ShoppingBag, Heart, UserRound } from "lucide-vue-next";

const authStore = useAuthStore();
</script>

<template>
  <section class="dashboard-home">
    <div class="welcome">
      <span>BUYER CENTER</span>
      <h2>Halo, {{ authStore.profile?.full_name }}!</h2>
      <p>Selamat datang di ruang belanja KriyaLoka.</p>
    </div>

    <div class="quick-cards">
      <article>
        <ShoppingBag />
        <h3>Pesanan Saya</h3>
        <p>Pantau pesanan dan status pembelian Anda.</p>
        <span>Segera tersedia</span>
      </article>

      <article>
        <Heart />
        <h3>Produk Favorit</h3>
        <p>Simpan kerajinan yang ingin Anda beli.</p>
        <span>Segera tersedia</span>
      </article>

      <article>
        <UserRound />
        <h3>Profil Saya</h3>
        <p>Perbarui informasi akun pembeli.</p>
        <RouterLink to="/profil">Lihat profil</RouterLink>
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
.quick-cards p {
  color: #85766a;
  font-size: 12px;
}

.quick-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  margin: 17px 0 7px;
  font-size: 15px;
}

.quick-cards article > span,
.quick-cards a {
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
