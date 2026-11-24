<script setup>
import { Star, ChevronRight } from "lucide-vue-next";

const emit = defineEmits(["change-section"]);
</script>

<template>
  <section class="section-content">
    <div class="empty-state feature-placeholder">
      <div class="placeholder-icon">
        <Star :size="35" />
      </div>

      <span class="coming-soon">SEGERA HADIR</span>

      <h3>Ulasan Saya</h3>

      <p>Ulasan produk yang sudah kamu beli akan ditampilkan di sini.</p>

      <button
        class="secondary-button"
        @click="emit('change-section', 'orders')"
      >
        Lihat Pesanan
        <ChevronRight :size="17" />
      </button>
    </div>
  </section>
</template>
