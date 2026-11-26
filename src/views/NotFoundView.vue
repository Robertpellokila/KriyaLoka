<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Home,
  ArrowLeft,
  Search,
  Compass,
  ShieldAlert,
  ServerCrash,
  WifiOff,
  Sparkles,
} from "lucide-vue-next";

const route = useRoute();
const router = useRouter();

// Jenis error dapat ditentukan melalui query:
// /not-found?type=403
// /not-found?type=500
// /not-found?type=offline

const errorType = computed(() => {
  const type = props.type || route.query.type;

  const supportedTypes = ["403", "500", "offline"];

  return supportedTypes.includes(type) ? type : "404";
});

const props = defineProps({
  type: {
    type: String,
    default: "",
  },
});

const errorContent = computed(() => {
  const contents = {
    404: {
      code: "404",
      label: "PAGE NOT FOUND",
      title: "Ups! Halamannya tidak ada.",
      description:
        "Sepertinya halaman yang kamu cari sudah berpindah, dihapus, atau memang tidak pernah ada.",
      icon: Compass,
      suggestion: "Jangan khawatir, masih banyak hal menarik di KriyaLoka.",
    },
    403: {
      code: "403",
      label: "ACCESS FORBIDDEN",
      title: "Sepertinya kamu belum punya akses.",
      description:
        "Halaman ini hanya dapat diakses oleh pengguna dengan izin tertentu.",
      icon: ShieldAlert,
      suggestion: "Silakan masuk menggunakan akun yang memiliki akses.",
    },
    500: {
      code: "500",
      label: "SERVER ERROR",
      title: "Ada sesuatu yang tidak beres.",
      description:
        "Server sedang mengalami kendala saat memproses permintaanmu.",
      icon: ServerCrash,
      suggestion: "Coba beberapa saat lagi, ya.",
    },
    offline: {
      code: "OFF",
      label: "CONNECTION LOST",
      title: "Koneksi sedang terputus.",
      description:
        "Sepertinya perangkatmu tidak terhubung ke internet. Periksa koneksi dan coba kembali.",
      icon: WifiOff,
      suggestion: "Pastikan jaringan internetmu sudah aktif.",
    },
  };

  return contents[errorType.value];
});

const goHome = () => {
  router.push("/");
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    goHome();
  }
};

const retry = () => {
  if (!navigator.onLine) {
    return;
  }

  if (errorType.value === "offline" || errorType.value === "500") {
    window.location.reload();
  } else {
    goHome();
  }
};
</script>

<template>
  <main class="error-page">
    <!-- Background -->
    <div class="background-decoration">
      <div class="bg-circle circle-one"></div>
      <div class="bg-circle circle-two"></div>
      <div class="bg-circle circle-three"></div>
      <div class="background-grid"></div>
    </div>

    <!-- Main content -->
    <section class="error-content">
      <div class="error-brand">
        <div class="brand-icon">
          <Sparkles :size="21" />
        </div>
        <span>Kriya<span class="brand-highlight">Loka</span></span>
      </div>

      <!-- Animated illustration -->
      <div class="illustration">
        <div class="illustration-glow"></div>

        <div class="orbit orbit-large"></div>
        <div class="orbit orbit-small"></div>

        <div class="floating-star star-one">✦</div>
        <div class="floating-star star-two">✧</div>
        <div class="floating-star star-three">✦</div>

        <div class="illustration-card">
          <div class="card-top">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div class="card-body">
            <component
              :is="errorContent.icon"
              class="error-icon"
              :size="66"
              :stroke-width="1.4"
            />

            <div class="illustration-code">
              {{ errorContent.code }}
            </div>
          </div>
        </div>

        <div class="floating-element element-left">
          <Search :size="22" />
        </div>

        <div class="floating-element element-right">
          <Sparkles :size="20" />
        </div>
      </div>

      <!-- Error information -->
      <div class="error-information" :key="errorType">
        <div class="error-label">
          <span class="status-dot"></span>
          {{ errorContent.label }}
        </div>

        <h1>{{ errorContent.title }}</h1>

        <p class="error-description">
          {{ errorContent.description }}
        </p>

        <p class="error-suggestion">
          {{ errorContent.suggestion }}
        </p>

        <!-- Actions -->
        <div class="error-actions">
          <button class="primary-button" @click="goHome">
            <Home :size="18" />
            <span>Kembali ke Beranda</span>
          </button>

          <button class="secondary-button" @click="retry">
            <Search :size="17" />
            <span>
              {{
                errorType === "404" || errorType === "403"
                  ? "Jelajahi Beranda"
                  : "Coba Lagi"
              }}
            </span>
          </button>
        </div>

        <button class="back-button" @click="goBack">
          <ArrowLeft :size="15" />
          Kembali ke halaman sebelumnya
        </button>
      </div>

      <!-- Footer -->
      <footer class="error-footer">
        <span>© {{ new Date().getFullYear() }} KriyaLoka</span>
        <span class="footer-separator">•</span>
        <span>Temukan keindahan dalam setiap karya.</span>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.error-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 45px 24px;
  overflow: hidden;
  isolation: isolate;
  background: #f8f6ef;
  color: #303526;
  font-family: inherit;
}

.background-decoration {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.background-grid {
  position: absolute;
  inset: 0;
  opacity: 0.19;
  background-image:
    linear-gradient(#b9b99f 1px, transparent 1px),
    linear-gradient(90deg, #b9b99f 1px, transparent 1px);
  background-size: 55px 55px;
  mask-image: linear-gradient(to bottom, black, transparent 85%);
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.55;
  animation: backgroundFloat 9s ease-in-out infinite;
}

.circle-one {
  width: 350px;
  height: 350px;
  top: -160px;
  left: -100px;
  background: #e9e8d5;
}

.circle-two {
  width: 420px;
  height: 420px;
  right: -190px;
  bottom: -180px;
  background: #ead8c2;
  animation-delay: -3s;
}

.circle-three {
  width: 170px;
  height: 170px;
  right: 14%;
  top: 13%;
  background: #e3e7d4;
  animation-delay: -5s;
}

.error-content {
  width: 100%;
  max-width: 670px;
  text-align: center;
  animation: contentEnter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.error-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 850;
  letter-spacing: -1px;
}

.brand-icon {
  width: 37px;
  height: 37px;
  display: grid;
  place-items: center;
  color: #f8f6ef;
  background: #4f5b2a;
  border-radius: 12px;
}

.brand-highlight {
  color: #a86c40;
}

.illustration {
  position: relative;
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 12px auto 4px;
}

.illustration-glow {
  position: absolute;
  width: 230px;
  height: 230px;
  background: #e5e7d6;
  border-radius: 50%;
  filter: blur(35px);
  animation: glowPulse 4s ease-in-out infinite;
}

.orbit {
  position: absolute;
  border: 1px dashed #c6c8ae;
  border-radius: 50%;
}

.orbit-large {
  width: 270px;
  height: 270px;
  animation: rotate 30s linear infinite;
}

.orbit-small {
  width: 205px;
  height: 205px;
  border-color: #d8b99c;
  animation: rotateReverse 23s linear infinite;
}

.illustration-card {
  position: relative;
  z-index: 2;
  width: 185px;
  height: 205px;
  padding: 12px;
  background: #fffefa;
  border: 1px solid #e8e4d8;
  border-radius: 22px;
  box-shadow:
    0 25px 60px rgba(66, 68, 43, 0.13),
    0 5px 15px rgba(66, 68, 43, 0.06);
  transform: rotate(-5deg);
  animation: cardFloat 4s ease-in-out infinite;
}

.card-top {
  display: flex;
  gap: 5px;
  padding-bottom: 11px;
  border-bottom: 1px solid #efede5;
}

.card-top span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d7d5c8;
}

.card-top span:first-child {
  background: #c58c69;
}

.card-body {
  height: 155px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: #f5f2e8;
  border-radius: 14px;
  margin-top: 10px;
}

.error-icon {
  color: #687444;
  animation: iconPulse 3s ease-in-out infinite;
}

.illustration-code {
  font-size: 34px;
  font-weight: 900;
  letter-spacing: 3px;
  color: #4f5b2a;
}

.floating-star {
  position: absolute;
  z-index: 3;
  color: #b8892d;
  animation: starFloat 3s ease-in-out infinite;
}

.star-one {
  top: 37px;
  left: 26%;
  font-size: 25px;
}

.star-two {
  top: 70px;
  right: 24%;
  font-size: 35px;
  animation-delay: -1s;
}

.star-three {
  bottom: 35px;
  left: 32%;
  font-size: 19px;
  animation-delay: -2s;
}

.floating-element {
  position: absolute;
  z-index: 4;
  width: 47px;
  height: 47px;
  display: grid;
  place-items: center;
  color: #4f5b2a;
  background: #fffefa;
  border: 1px solid #ece8db;
  border-radius: 15px;
  box-shadow: 0 10px 25px rgba(66, 68, 43, 0.1);
  animation: elementFloat 4s ease-in-out infinite;
}

.element-left {
  left: 20%;
  bottom: 60px;
  transform: rotate(-12deg);
}

.element-right {
  right: 19%;
  top: 54px;
  color: #b8892d;
  transform: rotate(12deg);
  animation-delay: -2s;
}

.error-information {
  animation: contentEnter 0.8s 0.15s both;
}

.error-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 13px;
  margin-bottom: 17px;
  color: #687444;
  background: #e9ebdd;
  border-radius: 30px;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: 1.5px;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #89965e;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(137, 150, 94, 0.13);
}

.error-information h1 {
  max-width: 560px;
  margin: 0 auto 13px;
  color: #333a2a;
  font-size: clamp(29px, 5vw, 43px);
  font-weight: 850;
  letter-spacing: -1.8px;
  line-height: 1.16;
}

.error-description {
  max-width: 465px;
  margin: 0 auto;
  color: #77796a;
  font-size: 14px;
  line-height: 1.8;
}

.error-suggestion {
  margin: 12px 0 25px;
  color: #a16f45;
  font-size: 12px;
  font-weight: 650;
}

.error-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 11px;
}

.primary-button,
.secondary-button {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 20px;
  border-radius: 13px;
  font: inherit;
  font-size: 13px;
  font-weight: 750;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
}

.primary-button {
  color: white;
  background: #4f5b2a;
  border: 1px solid #4f5b2a;
  box-shadow: 0 7px 17px rgba(79, 91, 42, 0.18);
}

.primary-button:hover {
  background: #3e4820;
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(79, 91, 42, 0.23);
}

.secondary-button {
  color: #4f5b2a;
  background: #fffefa;
  border: 1px solid #e4e1d5;
}

.secondary-button:hover {
  background: #eeefe5;
  transform: translateY(-3px);
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 22px;
  padding: 7px;
  color: #8a8b7d;
  background: transparent;
  border: 0;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.back-button:hover {
  color: #4f5b2a;
}

.error-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  margin-top: 48px;
  color: #a0a092;
  font-size: 11px;
}

.footer-separator {
  color: #c2b79e;
}

@keyframes contentEnter {
  from {
    opacity: 0;
    transform: translateY(22px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardFloat {
  0%,
  100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-12px) rotate(-2deg);
  }
}

@keyframes elementFloat {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -13px;
  }
}

@keyframes starFloat {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.65;
  }
  50% {
    transform: translateY(-12px) rotate(25deg);
    opacity: 1;
  }
}

@keyframes backgroundFloat {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(20px, -20px);
  }
}

@keyframes glowPulse {
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.85;
  }
}

@keyframes iconPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes rotateReverse {
  to {
    transform: rotate(-360deg);
  }
}

@media (max-width: 600px) {
  .error-page {
    padding: 30px 20px;
  }

  .illustration {
    height: 260px;
  }

  .orbit-large {
    width: 225px;
    height: 225px;
  }

  .orbit-small {
    width: 175px;
    height: 175px;
  }

  .illustration-card {
    width: 160px;
    height: 185px;
  }

  .card-body {
    height: 135px;
  }

  .element-left {
    left: 9%;
    bottom: 45px;
  }

  .element-right {
    right: 8%;
    top: 40px;
  }

  .star-one {
    left: 13%;
  }

  .star-two {
    right: 12%;
  }

  .error-information h1 {
    font-size: 31px;
    letter-spacing: -1px;
  }

  .error-description {
    font-size: 13px;
  }

  .error-actions {
    flex-direction: column;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }

  .error-footer {
    flex-wrap: wrap;
    margin-top: 35px;
    font-size: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
