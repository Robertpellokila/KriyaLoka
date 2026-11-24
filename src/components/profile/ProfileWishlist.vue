<script setup>
import { Heart, ChevronRight } from "lucide-vue-next";

const emit = defineEmits(["go-catalog"]);
</script>

<template>
  <section class="section-content">
    <div class="empty-state feature-placeholder">
      <div class="placeholder-icon">
        <Heart :size="35" />
      </div>

      <span class="coming-soon">SEGERA HADIR</span>

      <h3>Wishlist Kamu</h3>

      <p>
        Simpan produk kerajinan favorit agar kamu bisa menemukannya kembali
        dengan mudah.
      </p>

      <button class="primary-button" @click="emit('go-catalog')">
        Jelajahi Produk
        <ChevronRight :size="17" />
      </button>
    </div>
  </section>
</template>
