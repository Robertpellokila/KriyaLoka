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
  <main class="auth-page">
    <section class="auth-card">
      <div class="auth-heading">
        <span class="brand-label">KRIYALOKA</span>
        <h1>Bergabung dengan KriyaLoka</h1>
        <p>
          Temukan karya lokal atau mulai perjalanan bisnismu bersama para
          pengrajin Bali.
        </p>
      </div>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <form @submit.prevent="submitRegister">
        <div class="form-group">
          <label for="fullName">Nama lengkap</label>
          <input
            id="fullName"
            v-model="form.fullName"
            type="text"
            placeholder="Masukkan nama lengkap"
            autocomplete="name"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Alamat email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="nama@email.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="phoneNumber">Nomor telepon</label>
          <input
            id="phoneNumber"
            v-model="form.phoneNumber"
            type="tel"
            placeholder="Contoh: 081234567890"
            autocomplete="tel"
          />
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
              <strong>Penjual</strong>
              <small>Jual karya kerajinan</small>
            </button>
          </div>

          <p v-if="form.role === 'seller'" class="role-note">
            Akun penjual perlu diverifikasi oleh Super Admin sebelum dapat mulai
            berjualan.
          </p>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-field">
            <input
              id="password"
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
        </div>

        <div class="form-group">
          <label for="confirmPassword">Konfirmasi password</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            placeholder="Ulangi password"
            autocomplete="new-password"
            required
          />
        </div>

        <button class="submit-button" type="submit" :disabled="loading">
          {{ loading ? "Memproses..." : "Buat Akun" }}
        </button>
      </form>

      <p class="auth-footer">
        Sudah memiliki akun?
        <RouterLink to="/login">Login di sini</RouterLink>
      </p>

      <RouterLink to="/" class="back-home"> ← Kembali ke beranda </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 80vh;
  padding: 64px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fbf7f2;
}

.auth-card {
  width: 100%;
  max-width: 520px;
  padding: 40px;
  border: 1px solid #e6ddd3;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 12px 40px rgba(70, 45, 25, 0.06);
}

.auth-heading {
  margin-bottom: 28px;
  text-align: center;
}

.brand-label {
  color: #943c14;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 3px;
}

.auth-heading h1 {
  margin: 14px 0 10px;
  color: #33251e;
  font-size: 27px;
  line-height: 1.3;
}

.auth-heading p {
  color: #81746b;
  font-size: 14px;
  line-height: 1.7;
}

.form-group {
  margin-bottom: 19px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #45372e;
  font-size: 13px;
  font-weight: 700;
}

.form-group input {
  width: 100%;
  min-height: 46px;
  padding: 12px 14px;
  border: 1px solid #e6ddd3;
  border-radius: 9px;
  outline: none;
  color: #33251e;
  background: #fff;
  font: inherit;
  font-size: 14px;
}

.form-group input:focus {
  border-color: #943c14;
  box-shadow: 0 0 0 3px rgba(148, 60, 20, 0.08);
}

.role-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.role-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 16px;
  border: 1px solid #e6ddd3;
  border-radius: 10px;
  background: white;
  color: #45372e;
  text-align: left;
  cursor: pointer;
}

.role-option.selected {
  border: 2px solid #943c14;
  background: #fff8f3;
}

.role-icon {
  font-size: 23px;
}

.role-option strong {
  font-size: 14px;
}

.role-option small {
  color: #81746b;
  font-size: 11px;
}

.role-note {
  margin-top: 10px;
  color: #80603b;
  font-size: 12px;
  line-height: 1.6;
}

.password-field {
  position: relative;
}

.password-field input {
  padding-right: 95px;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  border: 0;
  background: transparent;
  color: #943c14;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.submit-button {
  width: 100%;
  min-height: 48px;
  margin-top: 8px;
  border: 0;
  border-radius: 9px;
  background: #943c14;
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.alert-error {
  background: #fff0ed;
  color: #a33120;
}

.alert-success {
  background: #edf8ef;
  color: #28643b;
}

.auth-footer {
  margin-top: 24px;
  color: #81746b;
  font-size: 13px;
  text-align: center;
}

.auth-footer a,
.back-home {
  color: #943c14;
  font-weight: 700;
  text-decoration: none;
}

.back-home {
  display: block;
  margin-top: 20px;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 520px) {
  .auth-card {
    padding: 28px 20px;
  }

  .auth-heading h1 {
    font-size: 23px;
  }
}
</style>
