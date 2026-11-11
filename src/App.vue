
<script setup>
import { useRoute, RouterView } from 'vue-router'
import PublicLayout from './layouts/PublicLayout.vue'

const route = useRoute()
</script>

<template>
  <PublicLayout v-if="!route.meta.hidePublicLayout" />

  <RouterView v-else />
</template>
