<script setup>
import { onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits(["finish"]);

let splashTimer = null;

onMounted(() => {
  splashTimer = setTimeout(() => {
    emit("finish");
  }, 2800);
});

function skipSplash() {
  clearTimeout(splashTimer);
  emit("finish");
}

onBeforeUnmount(() => {
  clearTimeout(splashTimer);
});
</script>

<template>
  <section class="splash-screen">
    <!-- Dekorasi background -->
    <div class="splash-decoration decoration-one"></div>
    <div class="splash-decoration decoration-two"></div>
    <div class="splash-decoration decoration-three"></div>

    <button type="button" class="splash-skip" @click="skipSplash">
      Lewati
      <span>→</span>
    </button>

    <div class="splash-content">
      <!-- Maskot -->
      <div class="mascot-container">
        <div class="mascot-glow"></div>

        <div class="mascot-sparkle sparkle-one">✦</div>
        <div class="mascot-sparkle sparkle-two">✧</div>
        <div class="mascot-sparkle sparkle-three">✦</div>

        <svg
          class="splash-mascot"
          viewBox="0 0 100 110"
          aria-label="Loka, maskot KriyaLoka"
          role="img"
        >
          <ellipse class="mascot-shadow" cx="50" cy="106" rx="24" ry="3.5" />

          <g class="mascot-body">
            <!-- Kaki -->
            <ellipse cx="40" cy="99" rx="8" ry="5" fill="#7e2c03" />
            <ellipse cx="60" cy="99" rx="8" ry="5" fill="#7e2c03" />

            <!-- Tangan kiri -->
            <ellipse cx="25" cy="74" rx="5.5" ry="9" fill="#e9b88f" />

            <!-- Tangan kanan -->
            <g class="mascot-wave">
              <path
                d="M72 68 Q82 64 87 53"
                fill="none"
                stroke="#e9b88f"
                stroke-width="8"
                stroke-linecap="round"
              />
              <circle cx="87" cy="51" r="5" fill="#e9b88f" />
            </g>

            <!-- Badan -->
            <ellipse cx="50" cy="75" rx="26" ry="24" fill="#b4532a" />
            <ellipse cx="50" cy="80" rx="14" ry="15" fill="#f3e9df" />

            <path
              d="M50 70 L56 79 L50 88 L44 79 Z"
              fill="none"
              stroke="#b4532a"
              stroke-width="2"
              stroke-linejoin="round"
            />

            <!-- Kepala -->
            <circle cx="50" cy="44" r="24" fill="#f1c9a5" />

            <!-- Udeng Bali -->
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

            <!-- Wajah -->
            <ellipse
              class="mascot-eye"
              cx="42"
              cy="52"
              rx="3"
              ry="4"
              fill="#211a16"
            />

            <ellipse
              class="mascot-eye"
              cx="58"
              cy="52"
              rx="3"
              ry="4"
              fill="#211a16"
            />

            <circle cx="34" cy="60" r="4.5" fill="#e58a6a" opacity=".45" />
            <circle cx="66" cy="60" r="4.5" fill="#e58a6a" opacity=".45" />

            <path
              d="M44 61 Q50 67 56 61"
              fill="none"
              stroke="#211a16"
              stroke-width="2"
              stroke-linecap="round"
            />
          </g>
        </svg>
      </div>

      <!-- Brand -->
      <div class="splash-brand">
        <h1>Kriya<span>Loka</span></h1>
        <div class="brand-divider">
          <span></span>
          <i>✦</i>
          <span></span>
        </div>

        <p class="splash-tagline">Mahakarya Bali, Cerita Indonesia.</p>
      </div>

      <!-- Loading -->
      <div class="splash-loading">
        <div class="loading-track">
          <div class="loading-progress"></div>
        </div>

        <p>Menyiapkan keindahan karya lokal...</p>
      </div>
    </div>

    <div class="splash-footer">
      <span>BUILT WITH LOVE</span>
      <span>♡</span>
      <span>FOR LOCAL CREATIVITY</span>
    </div>
  </section>
</template>

<style scoped>
.splash-screen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f7f0e7;
  color: #513321;
  font-family: inherit;
}

.splash-content {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  animation: content-enter 0.8s ease both;
}

/* Dekorasi */
.splash-decoration {
  position: absolute;
  border: 1px solid rgba(164, 77, 39, 0.12);
  border-radius: 50%;
  pointer-events: none;
}

.decoration-one {
  width: 430px;
  height: 430px;
  top: -190px;
  left: -180px;
}

.decoration-two {
  width: 570px;
  height: 570px;
  right: -280px;
  bottom: -280px;
}

.decoration-three {
  width: 260px;
  height: 260px;
  right: 12%;
  top: 10%;
  opacity: 0.5;
}

/* Tombol lewati */
.splash-skip {
  position: absolute;
  top: 28px;
  right: 32px;
  z-index: 5;
  border: 1px solid rgba(126, 44, 3, 0.16);
  border-radius: 30px;
  padding: 9px 17px;
  background: rgba(255, 255, 255, 0.55);
  color: #7e2c03;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s ease;
}

.splash-skip:hover {
  background: #7e2c03;
  color: white;
}

.splash-skip span {
  margin-left: 5px;
}

/* Maskot */
.mascot-container {
  position: relative;
  display: grid;
  width: 190px;
  height: 205px;
  place-items: center;
  margin-bottom: 12px;
}

.mascot-glow {
  position: absolute;
  width: 155px;
  height: 155px;
  border-radius: 50%;
  background: rgba(222, 172, 125, 0.24);
  filter: blur(5px);
  animation: glow-pulse 2.5s ease-in-out infinite;
}

.splash-mascot {
  position: relative;
  z-index: 1;
  width: 155px;
  overflow: visible;
  animation: mascot-bounce 1.8s ease-in-out infinite;
}

.mascot-wave {
  transform-box: fill-box;
  transform-origin: 15% 90%;
  animation: mascot-wave 1s ease-in-out infinite;
}

.mascot-shadow {
  animation: shadow-pulse 1.8s ease-in-out infinite;
}

.mascot-sparkle {
  position: absolute;
  z-index: 2;
  color: #c58b3d;
  animation: sparkle 2s ease-in-out infinite;
}

.sparkle-one {
  top: 32px;
  left: 20px;
  font-size: 23px;
}

.sparkle-two {
  top: 65px;
  right: 12px;
  font-size: 28px;
  animation-delay: 0.5s;
}

.sparkle-three {
  bottom: 22px;
  left: 24px;
  font-size: 15px;
  animation-delay: 1s;
}

/* Logo */
.splash-brand {
  text-align: center;
  margin-top: 8px;
}

.splash-brand h1 {
  margin: 0;
  color: #7e2c03;
  font-size: clamp(38px, 7vw, 49px);
  font-weight: 800;
  letter-spacing: -2px;
}

.splash-brand h1 span {
  color: #bd7445;
}

.brand-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 10px 0;
  color: #c58b3d;
}

.brand-divider span {
  width: 35px;
  height: 1px;
  background: #d9b99a;
}

.brand-divider i {
  font-size: 12px;
  font-style: normal;
}

.splash-tagline {
  margin: 0;
  color: #896b55;
  font-size: 13px;
  letter-spacing: 1.2px;
}

/* Loading */
.splash-loading {
  width: min(250px, 75vw);
  margin-top: 42px;
  text-align: center;
}

.loading-track {
  height: 4px;
  overflow: hidden;
  border-radius: 20px;
  background: #e6d8c9;
}

.loading-progress {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: #a64d27;
  transform: scaleX(0);
  transform-origin: left;
  animation: loading-fill 2.8s ease-in-out forwards;
}

.splash-loading p {
  margin: 12px 0 0;
  color: #9b806a;
  font-size: 11px;
  letter-spacing: 0.3px;
}

/* Footer */
.splash-footer {
  position: absolute;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 9px;
  color: #ad9178;
  font-size: 9px;
  letter-spacing: 1.5px;
}

/* Animasi */
@keyframes content-enter {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes mascot-bounce {
  0%,
  100% {
    transform: translateY(0) rotate(-2deg);
  }
  50% {
    transform: translateY(-12px) rotate(2deg);
  }
}

@keyframes mascot-wave {
  0%,
  100% {
    transform: rotate(0);
  }
  50% {
    transform: rotate(18deg);
  }
}

@keyframes glow-pulse {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}

@keyframes shadow-pulse {
  0%,
  100% {
    transform: scaleX(1);
    opacity: 0.5;
  }
  50% {
    transform: scaleX(0.7);
    opacity: 0.25;
  }
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8) rotate(0);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(20deg);
  }
}

@keyframes loading-fill {
  to {
    transform: scaleX(1);
  }
}

/* Mobile */
@media (max-width: 600px) {
  .splash-skip {
    top: 20px;
    right: 18px;
  }

  .mascot-container {
    width: 165px;
    height: 180px;
  }

  .splash-mascot {
    width: 135px;
  }

  .splash-brand h1 {
    font-size: 40px;
  }

  .splash-tagline {
    font-size: 11px;
    letter-spacing: 0.7px;
  }

  .splash-loading {
    margin-top: 35px;
  }

  .splash-footer {
    bottom: 18px;
    font-size: 8px;
    gap: 6px;
    letter-spacing: 1px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .splash-content,
  .splash-mascot,
  .mascot-wave,
  .mascot-shadow,
  .mascot-glow,
  .mascot-sparkle,
  .loading-progress {
    animation: none !important;
  }

  .loading-progress {
    transform: scaleX(1);
  }
}
</style>
