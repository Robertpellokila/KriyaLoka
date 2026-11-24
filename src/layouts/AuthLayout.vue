<script setup>
import { computed } from "vue";
import { RouterView, useRoute, RouterLink } from "vue-router";

const route = useRoute();

const isRegister = computed(() => route.name === "register");
</script>

<template>
  <main class="auth-page">
    <div class="auth-bg-orb orb-one"></div>
    <div class="auth-bg-orb orb-two"></div>

    <div class="auth-container" :class="{ 'is-register': isRegister }">
      <!-- BRAND PANEL -->
      <section class="visual-panel">
        <RouterLink to="/" class="visual-brand">
          <span class="brand-symbol">K</span>
          <span>KRIYALOKA</span>
        </RouterLink>

        <div class="visual-message">
          <span class="visual-eyebrow">
            <span></span>
            LOCAL CRAFTS, LOCAL STORIES
          </span>

          <Transition name="visual-content" mode="out-in">
            <div :key="isRegister ? 'register' : 'login'">
              <h1 v-if="!isRegister">
                Setiap karya
                <em>memiliki cerita.</em>
              </h1>

              <h1 v-else>
                Tumbuh bersama
                <em>karya lokal.</em>
              </h1>

              <p v-if="!isRegister">
                Temukan keindahan karya lokal Bali, kenali para pengrajinnya,
                dan dukung kreativitas yang diwariskan dari generasi ke
                generasi.
              </p>

              <p v-else>
                Jadilah bagian dari ekosistem kreatif yang menghubungkan pembeli
                dengan para pengrajin lokal Bali.
              </p>
            </div>
          </Transition>

          <div class="visual-features">
            <div>
              <span>✦</span>
              Karya autentik lokal
            </div>
            <div>
              <span>✦</span>
              Pengrajin pilihan
            </div>
            <div>
              <span>✦</span>
              Belanja penuh makna
            </div>
          </div>
        </div>

        <!-- Decorative artwork -->
        <div class="artwork">
          <div class="artwork-orbit orbit-one"></div>
          <div class="artwork-orbit orbit-two"></div>
          <div class="artwork-circle circle-back"></div>
          <div class="artwork-circle circle-front"></div>

          <div class="artwork-center">
            <span>✿</span>
            <small>BALI</small>
          </div>

          <div class="artwork-tag tag-one">
            <span>✺</span>
            Handcrafted
          </div>

          <div class="artwork-tag tag-two">
            <span>❋</span>
            Made with care
          </div>
        </div>

        <div class="visual-bottom">
          <span>© 2026 KriyaLoka</span>
          <span>Merayakan kreativitas lokal.</span>
        </div>
      </section>

      <!-- FORM CARD -->
      <section class="form-panel">
        <div class="mobile-brand">
          <RouterLink to="/" class="visual-brand">
            <span class="brand-symbol">K</span>
            <span>KRIYALOKA</span>
          </RouterLink>
        </div>

        <div class="form-content">
          <RouterView v-slot="{ Component, route: currentRoute }">
            <Transition name="form-morph" mode="out-in">
              <component :is="Component" :key="currentRoute.name" />
            </Transition>
          </RouterView>
        </div>
      </section>
    </div>
  </main>
</template>

<style>
@import "../assets/styles/auth.css";
</style>
