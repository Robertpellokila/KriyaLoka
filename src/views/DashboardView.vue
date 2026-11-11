<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const roleLabels = {
  buyer: "Pembeli",
  seller: "Penjual",
  super_admin: "Super Admin",
};

const roleTitle = computed(() => {
  return roleLabels[authStore.role] || "Pengguna";
});

const isRestrictedPage = computed(() => {
  return route.meta.statusPage === true;
});

const isSellerPending = computed(() => {
  return authStore.isSeller && authStore.accountStatus === "pending";
});

const logout = async () => {
  try {
    await authStore.logout();
    await router.push("/login");
  } catch (error) {
    console.error("Logout gagal:", error);
  }
};
</script>

<template>
  <main class="dashboard-page">
    <section class="dashboard-card">
      <span class="brand-label">KRIYALOKA</span>

      <template v-if="isRestrictedPage">
        <h1>Akun Tidak Dapat Mengakses Platform</h1>
        <p>
          Status akun kamu saat ini:
          <strong>{{ authStore.accountStatus }}</strong
          >. Silakan hubungi administrator KriyaLoka untuk mendapatkan informasi
          lebih lanjut.
        </p>
      </template>

      <template v-else>
        <h1>
          Selamat Datang,
          {{ authStore.profile?.full_name }}
        </h1>

        <p class="role-label">Login sebagai {{ roleTitle }}</p>

        <div v-if="isSellerPending" class="status-notice">
          <strong>Menunggu Verifikasi Penjual</strong>
          <p>
            Akun toko kamu sudah terdaftar. Super Admin perlu memverifikasi akun
            sebelum kamu dapat mulai berjualan.
          </p>
        </div>

        <div v-else class="dashboard-info">
          <h3>Dashboard {{ roleTitle }}</h3>
          <p>
            Autentikasi berhasil. Selanjutnya kita akan membangun fitur khusus
            untuk role ini.
          </p>
        </div>

        <div class="profile-summary">
          <div>
            <span>Email</span>
            <strong>{{ authStore.profile?.email }}</strong>
          </div>

          <div>
            <span>Role</span>
            <strong>{{ authStore.role }}</strong>
          </div>

          <div>
            <span>Status akun</span>
            <strong>{{ authStore.accountStatus }}</strong>
          </div>
        </div>
      </template>

      <button class="logout-button" @click="logout">Logout</button>
    </section>
  </main>
</template>

<style scoped>
.dashboard-page {
  min-height: 75vh;
  padding: 60px 20px;
  background: #fbf7f2;
}

.dashboard-card {
  max-width: 760px;
  margin: auto;
  padding: 40px;
  border: 1px solid #e6ddd3;
  border-radius: 18px;
  background: white;
}

.brand-label {
  color: #943c14;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 3px;
}

h1 {
  margin: 20px 0 10px;
  color: #33251e;
  font-size: 28px;
}

p {
  color: #81746b;
  line-height: 1.7;
}

.role-label {
  color: #2d694d;
  font-weight: 700;
}

.dashboard-info,
.status-notice {
  margin-top: 28px;
  padding: 20px;
  border-radius: 12px;
}

.dashboard-info {
  background: #f6f3ed;
}

.status-notice {
  background: #fff5e8;
  color: #79511d;
}

.status-notice p {
  color: #79511d;
}

.profile-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 24px;
}

.profile-summary div {
  padding: 16px;
  border: 1px solid #e6ddd3;
  border-radius: 10px;
  overflow-wrap: anywhere;
}

.profile-summary span,
.profile-summary strong {
  display: block;
}

.profile-summary span {
  margin-bottom: 8px;
  color: #81746b;
  font-size: 12px;
}

.profile-summary strong {
  color: #45372e;
  font-size: 13px;
}

.logout-button {
  margin-top: 28px;
  padding: 12px 24px;
  border: 0;
  border-radius: 8px;
  background: #943c14;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 600px) {
  .dashboard-card {
    padding: 25px 20px;
  }

  .profile-summary {
    grid-template-columns: 1fr;
  }
}
</style>
