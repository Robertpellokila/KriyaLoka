<script setup>
import { ref, onBeforeUnmount } from "vue";

const year = new Date().getFullYear();

const linkGroups = [
  {
    title: "Jelajahi",
    links: [
      { label: "Beranda", to: "/" },
      { label: "Katalog Produk", to: "/katalog" },
      { label: "Cerita Pengrajin", href: "/#pengrajin" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "Cara Berbelanja", href: "#" },
      { label: "Pengiriman", href: "#" },
      { label: "Kebijakan Privasi", href: "#" },
    ],
  },
];

// ==========================================
// MASKOT "LOKA"
// ==========================================

const greetings = [
  "Om Swastiastu!",
  "Sudah lihat kerajinan hari ini?",
  "Setiap karya punya cerita.",
  "Yuk, dukung pengrajin lokal!",
];

const greetingIndex = ref(0);
const bubbleVisible = ref(false);
const jumping = ref(false);

let bubbleTimer = null;
let jumpTimer = null;

function pokeMascot() {
  clearTimeout(bubbleTimer);
  clearTimeout(jumpTimer);

  greetingIndex.value = (greetingIndex.value + 1) % greetings.length;
  bubbleVisible.value = true;

  // Reset class agar animasi lompat bisa diulang saat diketuk berkali-kali.
  jumping.value = false;
  requestAnimationFrame(() => {
    jumping.value = true;
  });

  jumpTimer = setTimeout(() => (jumping.value = false), 700);
  bubbleTimer = setTimeout(() => (bubbleVisible.value = false), 3000);
}

onBeforeUnmount(() => {
  clearTimeout(bubbleTimer);
  clearTimeout(jumpTimer);
});
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <!-- Brand + maskot -->
      <div class="footer-brand">
        <div class="mascot-wrap">
          <Transition name="bubble">
            <p v-if="bubbleVisible" class="mascot-bubble" role="status">
              {{ greetings[greetingIndex] }}
            </p>
          </Transition>

          <button
            type="button"
            class="mascot"
            aria-label="Sapa Loka, maskot KriyaLoka"
            @click="pokeMascot"
          >
            <svg viewBox="0 0 100 110" aria-hidden="true">
              <ellipse class="mascot-shadow" cx="50" cy="106" rx="24" ry="3.5" />

              <g class="mascot-bob">
                <g class="mascot-jump" :class="{ 'is-jumping': jumping }">
                  <!-- kaki -->
                  <ellipse cx="40" cy="99" rx="8" ry="5" fill="#7e2c03" />
                  <ellipse cx="60" cy="99" rx="8" ry="5" fill="#7e2c03" />

                  <!-- tangan kiri (diam) -->
                  <ellipse cx="25" cy="74" rx="5.5" ry="9" fill="#e9b88f" />

                  <!-- tangan kanan (melambai) -->
                  <g class="mascot-arm">
                    <path
                      d="M72 68 Q82 64 87 53"
                      fill="none"
                      stroke="#e9b88f"
                      stroke-width="8"
                      stroke-linecap="round"
                    />
                    <circle cx="87" cy="51" r="5" fill="#e9b88f" />
                  </g>

                  <!-- badan -->
                  <ellipse cx="50" cy="75" rx="26" ry="24" fill="#b4532a" />
                  <ellipse cx="50" cy="80" rx="14" ry="15" fill="#f3e9df" />
                  <path
                    d="M50 70 L56 79 L50 88 L44 79 Z"
                    fill="none"
                    stroke="#b4532a"
                    stroke-width="2"
                    stroke-linejoin="round"
                  />

                  <!-- kepala -->
                  <circle cx="50" cy="44" r="24" fill="#f1c9a5" />

                  <!-- udeng (ikat kepala Bali) -->
                  <path
                    d="M40 30 Q45 14 54 5 Q61 16 63 30 Q51 25 40 30 Z"
                    fill="#7e2c03"
                  />
                  <path
                    d="M26 39 Q50 22 74 39 L74 46 Q50 31 26 46 Z"
                    fill="#943c14"
                  />
                  <path
                    d="M27 42.5 Q50 27 73 42.5"
                    fill="none"
                    stroke="#e8b04a"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />

                  <!-- wajah -->
                  <ellipse class="mascot-eye" cx="42" cy="52" rx="3" ry="4" fill="#211a16" />
                  <ellipse class="mascot-eye" cx="58" cy="52" rx="3" ry="4" fill="#211a16" />
                  <circle cx="34" cy="60" r="4.5" fill="#e58a6a" opacity="0.45" />
                  <circle cx="66" cy="60" r="4.5" fill="#e58a6a" opacity="0.45" />
                  <path
                    d="M44 61 Q50 67 56 61"
                    fill="none"
                    stroke="#211a16"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </g>
              </g>
            </svg>
          </button>
        </div>

        <div class="footer-brand-text">
          <RouterLink to="/" class="brand footer-logo">
            <span class="brand-symbol">K</span>
            <span class="brand-name">Kriya<span>Loka</span></span>
          </RouterLink>

          <p class="footer-desc">
            Merayakan karya, budaya, dan kreativitas pengrajin lokal Bali.
            Temukan cerita di balik setiap mahakarya.
          </p>
          <p class="footer-desc-short">Mahakarya Bali, Cerita Indonesia.</p>
        </div>
      </div>

      <!-- Tautan: kolom di desktop, deretan chip di mobile -->
      <div class="footer-links">
        <nav
          v-for="group in linkGroups"
          :key="group.title"
          class="footer-column"
          :aria-label="group.title"
        >
          <h3>{{ group.title }}</h3>

          <template v-for="link in group.links" :key="link.label">
            <RouterLink v-if="link.to" :to="link.to">{{ link.label }}</RouterLink>
            <a v-else :href="link.href">{{ link.label }}</a>
          </template>
        </nav>

        <div class="footer-column">
          <h3>Hubungi Kami</h3>
          <p class="footer-location">Bali, Indonesia</p>
          <a href="mailto:halo@kriyaloka.id">halo@kriyaloka.id</a>
        </div>
      </div>
    </div>

    <div class="container footer-bottom">
      <p>© {{ year }} KriyaLoka. Dibuat dengan bangga untuk karya lokal.</p>
      <span>Mahakarya Bali, Cerita Indonesia.</span>
    </div>
  </footer>
</template>