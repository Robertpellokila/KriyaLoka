<script setup>
import AppHeader from "../components/layout/AppHeader.vue";
import AppFooter from "../components/layout/AppFooter.vue";
</script>

<template>
  <div class="public-layout">
    <AppHeader />

    <main class="public-content">
      <RouterView />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.public-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.public-content {
  flex: 1;
}
</style>
