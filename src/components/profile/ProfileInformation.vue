<script setup>
import { UserRound, Save } from "lucide-vue-next";

defineProps({
  profileForm: {
    type: Object,
    required: true,
  },
  userEmail: {
    type: String,
    default: "-",
  },
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["save-profile"]);
</script>

<template>
  <section class="section-content">
    <div class="panel-card">
      <div class="section-intro">
        <div class="large-section-icon">
          <UserRound :size="25" />
        </div>

        <div>
          <h3>Informasi Pribadi</h3>
          <p>Perbarui informasi yang digunakan pada akunmu.</p>
        </div>
      </div>

      <form class="account-form" @submit.prevent="emit('save-profile')">
        <div class="form-grid">
          <div class="form-field full">
            <label>Nama Lengkap</label>
            <input
              v-model="profileForm.full_name"
              type="text"
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div class="form-field full">
            <label>Alamat Email</label>
            <input :value="userEmail" type="email" disabled />
            <small> Email akun tidak dapat diubah dari halaman ini. </small>
          </div>

          <div class="form-field full">
            <label>Nomor Telepon</label>
            <input
              v-model="profileForm.phone_number"
              type="tel"
              placeholder="Contoh: 081234567890"
            />
          </div>
        </div>

        <div class="form-actions">
          <button class="primary-button" type="submit" :disabled="saving">
            <Save :size="17" />
            {{ saving ? "Menyimpan..." : "Simpan Perubahan" }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
