<script setup>
import { RouterLink } from "vue-router";

defineProps({
  category: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <RouterLink :to="`/katalog?kategori=${category.slug}`" class="category-card">
    <div class="category-icon">
      {{ category.icon }}
    </div>

    <div class="category-info">
      <h3>{{ category.name }}</h3>
      <p>{{ category.description }}</p>
      <span>{{ category.count }}</span>
    </div>

    <div class="category-arrow">↗</div>
  </RouterLink>
</template>

<style scoped>
.category-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 18px;
  min-height: 145px;
  background: #fff;
  border: 1px solid #e6ddd3;
  border-radius: 16px;
  color: inherit;
  text-decoration: none;
  transition: 0.25s ease;
}

.category-card:hover {
  transform: translateY(-5px);
  border-color: #b4532a;
  box-shadow: 0 12px 30px rgba(77, 48, 29, 0.08);
}

.category-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #f7eee5;
  font-size: 27px;
}

.category-info h3 {
  margin: 2px 0 7px;
  color: #3e3028;
  font-size: 15px;
  font-weight: 700;
}

.category-info p {
  margin: 0 0 12px;
  color: #887c72;
  font-size: 12px;
  line-height: 1.5;
}

.category-info span {
  color: #943c14;
  font-size: 11px;
  font-weight: 700;
}

.category-arrow {
  position: absolute;
  top: 18px;
  right: 18px;
  color: #b8a99b;
  font-size: 18px;
  transition: 0.2s;
}

.category-card:hover .category-arrow {
  color: #943c14;
  transform: translate(2px, -2px);
}

@media (max-width: 480px) {
  .category-card {
    gap: 10px;
    padding: 16px 12px;
  }

  .category-icon {
    width: 42px;
    height: 42px;
    font-size: 22px;
  }
}
</style>
