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
  <main class="auth-page">
    <section class="auth-card">
      <div class="auth-heading">
        <span class="brand-label">KRIYALOKA</span>
        <h1>Selamat Datang Kembali</h1>
        <p>
          Login untuk melanjutkan perjalananmu bersama produk dan pengrajin
          lokal Bali.
        </p>
      </div>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="submitLogin">
        <div class="form-group">
          <label for="email">Alamat email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="nama@email.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>

          <div class="password-field">
            <input
              id="password"
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
          {{ loading ? "Memproses..." : "Login" }}
        </button>
      </form>

      <p class="auth-footer">
        Belum memiliki akun?
        <RouterLink to="/register">Daftar sekarang</RouterLink>
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
  max-width: 460px;
  padding: 40px;
  border: 1px solid #e6ddd3;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 12px 40px rgba(70, 45, 25, 0.06);
}

.auth-heading {
  margin-bottom: 30px;
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
}

.auth-heading p {
  color: #81746b;
  font-size: 14px;
  line-height: 1.7;
}

.form-group {
  margin-bottom: 20px;
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
  min-height: 47px;
  padding: 12px 14px;
  border: 1px solid #e6ddd3;
  border-radius: 9px;
  outline: none;
  font: inherit;
  font-size: 14px;
}

.form-group input:focus {
  border-color: #943c14;
  box-shadow: 0 0 0 3px rgba(148, 60, 20, 0.08);
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
}

.alert-error {
  background: #fff0ed;
  color: #a33120;
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
}
</style>
