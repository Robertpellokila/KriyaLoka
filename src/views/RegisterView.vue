
<script setup>
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  role: "buyer",
});

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const showPassword = ref(false);

const submitRegister = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  if (form.value.fullName.trim().length < 3) {
    errorMessage.value = "Nama minimal terdiri dari 3 karakter.";
    return;
  }

  if (form.value.password.length < 8) {
    errorMessage.value = "Password minimal 8 karakter.";
    return;
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = "Konfirmasi password tidak sama.";
    return;
  }

  loading.value = true;

  try {
    const result = await authStore.register({
      fullName: form.value.fullName.trim(),
      email: form.value.email.trim(),
      phoneNumber: form.value.phoneNumber.trim(),
      password: form.value.password,
      role: form.value.role,
    });

    if (result.session) {
      const destination =
        form.value.role === "seller"
          ? "/dashboard/penjual"
          : "/dashboard/pembeli";

      await router.push(destination);
    } else {
      successMessage.value =
        "Pendaftaran berhasil. Silakan periksa email kamu untuk melakukan konfirmasi sebelum login.";
    }
  } catch (error) {
    errorMessage.value =
      error.message || "Pendaftaran gagal. Silakan coba kembali.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="auth-form-view register-view">
    <div class="form-heading">
      <span class="form-eyebrow">CREATE YOUR ACCOUNT</span>
      <h2>Mulai perjalananmu.</h2>
      <p>
        Buat akun dan temukan pengalaman baru bersama KriyaLoka.
      </p>
    </div>

    <Transition name="message">
      <div v-if="errorMessage" class="auth-alert alert-error" role="alert">
        <span class="alert-icon">!</span>
        <span>{{ errorMessage }}</span>
      </div>
    </Transition>

    <Transition name="message">
      <div v-if="successMessage" class="auth-alert alert-success" role="status">
        <span class="alert-icon success-icon">✓</span>
        <span>{{ successMessage }}</span>
      </div>
    </Transition>

    <form class="auth-form register-form" @submit.prevent="submitRegister">
      <div class="form-group">
        <label for="register-name">Nama lengkap</label>

        <div class="input-wrapper">
          <span class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <circle cx="12" cy="8" r="4" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          </span>

          <input
            id="register-name"
            v-model="form.fullName"
            type="text"
            placeholder="Masukkan nama lengkap"
            autocomplete="name"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="register-email">Alamat email</label>

        <div class="input-wrapper">
          <span class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="m4 7 8 6 8-6" />
            </svg>
          </span>

          <input
            id="register-email"
            v-model="form.email"
            type="email"
            placeholder="nama@email.com"
            autocomplete="email"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="register-phone">
          Nomor telepon
          <span class="optional-label">Opsional</span>
        </label>

        <div class="input-wrapper">
          <span class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M6.6 3h2.8l1.4 4-2 1.5a14 14 0 0 0 5.7 5.7l1.5-2 4 1.4v2.8a2 2 0 0 1-2 2A16 16 0 0 1 4.6 5a2 2 0 0 1 2-2Z" />
            </svg>
          </span>

          <input
            id="register-phone"
            v-model="form.phoneNumber"
            type="tel"
            placeholder="081234567890"
            autocomplete="tel"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Daftar sebagai</label>

        <div class="role-options">
          <button
            type="button"
            class="role-option"
            :class="{ selected: form.role === 'buyer' }"
            @click="form.role = 'buyer'"
          >
            <span class="role-icon">🛍️</span>
            <span class="role-check">{{ form.role === "buyer" ? "✓" : "" }}</span>
            <strong>Pembeli</strong>
            <small>Belanja produk lokal</small>
          </button>

          <button
            type="button"
            class="role-option"
            :class="{ selected: form.role === 'seller' }"
            @click="form.role = 'seller'"
          >
            <span class="role-icon">🏺</span>
            <span class="role-check">{{ form.role === "seller" ? "✓" : "" }}</span>
            <strong>Penjual</strong>
            <small>Jual karya kerajinan</small>
          </button>
        </div>

        <Transition name="message">
          <p v-if="form.role === 'seller'" class="role-note">
            Akun penjual perlu diverifikasi oleh Super Admin sebelum dapat
            mulai berjualan.
          </p>
        </Transition>
      </div>

      <div class="form-group">
        <label for="register-password">Password</label>

        <div class="input-wrapper">
          <span class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="4" y="10" width="16" height="11" rx="3" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </span>

          <input
            id="register-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Minimal 8 karakter"
            autocomplete="new-password"
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

        <small class="password-hint">Gunakan minimal 8 karakter.</small>
      </div>

      <div class="form-group">
        <label for="register-confirm-password">Konfirmasi password</label>

        <div class="input-wrapper">
          <span class="input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="4" y="10" width="16" height="11" rx="3" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </span>

          <input
            id="register-confirm-password"
            v-model="form.confirmPassword"
            type="password"
            placeholder="Ulangi password"
            autocomplete="new-password"
            required
          />
        </div>
      </div>

      <button class="submit-button" type="submit" :disabled="loading">
        <span v-if="!loading">Buat Akun</span>

        <span v-else class="loading-content">
          <span class="spinner"></span>
          Memproses...
        </span>

        <span v-if="!loading" class="button-arrow">→</span>
      </button>
    </form>

    <div class="auth-switch">
      <span>Sudah memiliki akun?</span>
      <RouterLink to="/login">Login di sini</RouterLink>
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
      Bergabunglah dengan komunitas yang mendukung karya dan kreativitas lokal.
    </p>
  </div>
</template>
