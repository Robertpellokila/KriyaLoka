<script setup>
import {
  UserRound,
  MapPin,
  ShieldCheck,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-vue-next";

const emit = defineEmits(["change-section", "logout"]);
</script>

<template>
  <section class="section-content">
    <div class="panel-card">
      <div class="section-intro">
        <div class="large-section-icon">
          <Settings :size="25" />
        </div>

        <div>
          <h3>Pengaturan Akun</h3>
          <p>Kelola akses dan keamanan akunmu.</p>
        </div>
      </div>

      <div class="settings-list">
        <div class="setting-item">
          <div class="setting-icon">
            <UserRound :size="20" />
          </div>

          <div>
            <strong>Informasi Profil</strong>
            <p>Perbarui nama dan nomor telepon.</p>
          </div>

          <button
            class="text-button"
            @click="emit('change-section', 'profile')"
          >
            Kelola <ChevronRight :size="15" />
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-icon">
            <MapPin :size="20" />
          </div>

          <div>
            <strong>Alamat Pengiriman</strong>
            <p>Kelola alamat yang tersimpan.</p>
          </div>

          <button
            class="text-button"
            @click="emit('change-section', 'addresses')"
          >
            Kelola <ChevronRight :size="15" />
          </button>
        </div>

        <div class="setting-item">
          <div class="setting-icon">
            <ShieldCheck :size="20" />
          </div>

          <div>
            <strong>Keamanan Akun</strong>
            <p>
              Kata sandi dan keamanan login dikelola melalui autentikasi akun.
            </p>
          </div>

          <span class="setting-note">Supabase Auth</span>
        </div>
      </div>
    </div>

    <div class="panel-card logout-panel">
      <div>
        <h3>Keluar dari Akun</h3>
        <p>Kamu dapat login kembali kapan saja.</p>
      </div>

      <button class="danger-button" @click="emit('logout')">
        <LogOut :size="17" />
        Keluar
      </button>
    </div>
  </section>
</template>
