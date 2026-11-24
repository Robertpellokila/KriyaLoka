<script setup>
import { ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");
const showPassword = ref(false);

const getDashboardPath = (role) => {
  const destinations = {
    buyer: "/dashboard/pembeli",
    seller: "/dashboard/penjual",
    super_admin: "/dashboard/admin",
  };

  return destinations[role] || "/";
};

const submitLogin = async () => {
  errorMessage.value = "";
  loading.value = true;

  try {
    const profile = await authStore.login({
      email: email.value.trim(),
      password: password.value,
    });

    if (!profile) {
      throw new Error(
        "Profil akun tidak ditemukan. Silakan hubungi administrator.",
      );
    }

    if (
      profile.account_status === "suspended" ||
      profile.account_status === "rejected"
    ) {
      await router.push("/akses-dibatasi");
      return;
    }

    const destination =
      profile.role === "seller" && profile.account_status === "pending"
        ? "/dashboard/penjual"
        : getDashboardPath(profile.role);

    const requestedPath = route.query.redirect;

    await router.push(
      typeof requestedPath === "string" ? requestedPath : destination,
    );
  } catch (error) {
    errorMessage.value =
      error.message || "Login gagal. Periksa email dan password.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-form-view login-view">
    <div class="form-heading">
      <span class="form-eyebrow">WELCOME BACK</span>
      <h2>Senang melihatmu kembali.</h2>
      <p>Masuk ke akunmu dan lanjutkan menemukan karya lokal favoritmu.</p>
    </div>

    <Transition name="message">
      <div v-if="errorMessage" class="auth-alert alert-error" role="alert">
        <span class="alert-icon">!</span>
        <span>{{ errorMessage }}</span>
      </div>
    </Transition>

    <form class="auth-form" @submit.prevent="submitLogin">
      <div class="form-group">
        <label for="login-email">Alamat email</label>

        <div class="input-wrapper">
          <span class="input-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="m4 7 8 6 8-6" />
            </svg>
          </span>

          <input
            id="login-email"
            v-model="email"
            type="email"
            placeholder="nama@email.com"
            autocomplete="email"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="login-password">Password</label>

        <div class="input-wrapper">
          <span class="input-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
            >
              <rect x="4" y="10" width="16" height="11" rx="3" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </span>

          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Masukkan password"
            autocomplete="current-password"
            required
          />

          <button
            type="button"
            class="password-toggle"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? "Sembunyikan" : "Lihat" }}
          </button>
        </div>
      </div>

      <button class="submit-button" type="submit" :disabled="loading">
        <span v-if="!loading">Masuk ke Akun</span>

        <span v-else class="loading-content">
          <span class="spinner"></span>
          Memproses...
        </span>

        <span v-if="!loading" class="button-arrow">→</span>
      </button>
    </form>

    <div class="auth-switch">
      <span>Belum memiliki akun?</span>
      <RouterLink to="/register">Buat akun sekarang</RouterLink>
    </div>

    <div class="form-divider">
      <span></span>
      <small>ATAU</small>
      <span></span>
    </div>

    <RouterLink to="/" class="back-home">
      <span>←</span>
      Kembali ke beranda
    </RouterLink>

    <p class="form-bottom">
      Dengan masuk, kamu dapat menjelajahi berbagai karya kreatif dari pengrajin
      lokal.
    </p>
  </div>
</template>
