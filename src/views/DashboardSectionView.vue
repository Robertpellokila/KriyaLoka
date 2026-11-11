<script setup>
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";

const route = useRoute();

const pageTitle = computed(() => route.meta.title || "Halaman Dashboard");

const pageDescription = computed(
  () => route.meta.description || "Fitur ini sedang dipersiapkan.",
);
</script>

<template>
  <section class="placeholder-page">
    <span class="eyebrow">KRIYALOKA WORKSPACE</span>
    <h2>{{ pageTitle }}</h2>
    <p>{{ pageDescription }}</p>

    <div class="placeholder-card">
      <div class="placeholder-icon">K</div>
      <h3>Fitur sedang dikembangkan</h3>
      <p>Halaman ini akan dilengkapi pada tahap pengembangan berikutnya.</p>
      <RouterLink to="/" class="back-link">
        <ArrowLeft :size="15" />
        Kembali ke marketplace
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.placeholder-page > .eyebrow {
  color: #943c14;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.placeholder-page > h2 {
  margin: 9px 0 5px;
  font-size: 24px;
}

.placeholder-page > p {
  color: #8c7e72;
  font-size: 12px;
}

.placeholder-card {
  display: flex;
  min-height: 280px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 25px;
  padding: 25px;
  border: 1px solid #ece5dd;
  border-radius: 12px;
  background: white;
  text-align: center;
}

.placeholder-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 13px;
  background: #943c14;
  color: white;
  font-family: Georgia, serif;
  font-size: 27px;
  font-weight: 700;
}

.placeholder-card h3 {
  margin: 17px 0 5px;
  font-size: 16px;
}

.placeholder-card p {
  max-width: 350px;
  color: #93867b;
  font-size: 12px;
  line-height: 1.7;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 12px;
  color: #943c14;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}
</style>
