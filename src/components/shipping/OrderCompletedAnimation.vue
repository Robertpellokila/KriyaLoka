
<script setup>
import { PackageOpen, Check, Sparkles } from "lucide-vue-next";
</script>

<template>
  <div class="completion-animation">
    <div class="celebration-scene">
      <!-- Confetti -->
      <span class="confetti confetti-1"></span>
      <span class="confetti confetti-2"></span>
      <span class="confetti confetti-3"></span>
      <span class="confetti confetti-4"></span>
      <span class="confetti confetti-5"></span>
      <span class="confetti confetti-6"></span>
      <span class="confetti confetti-7"></span>
      <span class="confetti confetti-8"></span>

      <!-- Decorative sparkles -->
      <Sparkles class="sparkle sparkle-one" :size="19" />
      <Sparkles class="sparkle sparkle-two" :size="15" />
      <Sparkles class="sparkle sparkle-three" :size="17" />

      <!-- Success circle -->
      <div class="success-circle">
        <div class="success-circle-inner">
          <PackageOpen class="package-icon" :size="48" />
        </div>

        <div class="success-check">
          <Check :size="20" :stroke-width="3" />
        </div>
      </div>
    </div>

    <div class="completion-message">
      <span class="completion-eyebrow">
        ORDER COMPLETED
      </span>

      <h3>Pesanan Berhasil Diterima!</h3>

      <p>
        Yeay! Pesananmu sudah sampai dengan selamat.
        Terima kasih telah mendukung para pengrajin lokal
        bersama KriyaLoka.
      </p>

      <div class="completion-thank-you">
        <Sparkles :size="15" />
        <span>Selamat menikmati produk pilihanmu!</span>
        <Sparkles :size="15" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.completion-animation {
  position: relative;
  overflow: hidden;
  padding: 30px 20px;
  border: 1px solid #e6eadf;
  border-radius: 18px;
  background:
    radial-gradient(circle at 50% 30%, #f4f7ed 0, transparent 55%),
    #fafbf7;
  text-align: center;
}

.celebration-scene {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 145px;
}

.success-circle {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 108px;
  height: 108px;
  border: 2px solid #d7e5cf;
  border-radius: 50%;
  background: #eaf2e4;
  animation: success-appear 0.65s cubic-bezier(.2, 1.5, .5, 1) both;
}

.success-circle::before {
  position: absolute;
  inset: -10px;
  border: 1px solid #dce8d5;
  border-radius: 50%;
  content: "";
  animation: ring-pulse 2.2s ease-out infinite;
}

.success-circle-inner {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: #719466;
  color: white;
}

.package-icon {
  animation: package-bounce 1.1s ease-in-out infinite;
}

.success-check {
  position: absolute;
  right: -3px;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 35px;
  height: 35px;
  border: 3px solid #fafbf7;
  border-radius: 50%;
  background: #b66a45;
  color: white;
  animation: check-pop 0.5s 0.45s cubic-bezier(.2, 1.5, .5, 1) both;
}

.sparkle {
  position: absolute;
  color: #b88945;
  animation: sparkle 2s ease-in-out infinite;
}

.sparkle-one {
  top: 12px;
  left: calc(50% - 75px);
}

.sparkle-two {
  top: 42px;
  right: calc(50% - 90px);
  animation-delay: 0.4s;
}

.sparkle-three {
  bottom: 12px;
  left: calc(50% - 88px);
  animation-delay: 0.8s;
}

.confetti {
  position: absolute;
  width: 7px;
  height: 12px;
  border-radius: 3px;
  opacity: 0;
  animation: confetti-fall 2.4s ease-out infinite;
}

.confetti-1 {
  top: 10px;
  left: calc(50% - 100px);
  background: #719466;
  animation-delay: 0s;
}

.confetti-2 {
  top: 0;
  left: calc(50% - 55px);
  background: #d9a35e;
  animation-delay: 0.3s;
}

.confetti-3 {
  top: 12px;
  right: calc(50% - 105px);
  background: #b66a45;
  animation-delay: 0.6s;
}

.confetti-4 {
  top: 30px;
  right: calc(50% - 55px);
  background: #91a77e;
  animation-delay: 0.9s;
}

.confetti-5 {
  top: 45px;
  left: calc(50% - 115px);
  background: #d9a35e;
  animation-delay: 1.2s;
}

.confetti-6 {
  top: 48px;
  right: calc(50% - 120px);
  background: #719466;
  animation-delay: 1.5s;
}

.confetti-7 {
  top: 5px;
  left: calc(50% + 5px);
  background: #b66a45;
  animation-delay: 1.8s;
}

.confetti-8 {
  top: 65px;
  left: calc(50% + 90px);
  background: #d9a35e;
  animation-delay: 2.1s;
}

.completion-message {
  max-width: 440px;
  margin: 0 auto;
}

.completion-eyebrow {
  color: #719466;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2px;
}

.completion-message h3 {
  margin: 9px 0;
  color: #493b32;
  font-size: 21px;
  font-weight: 800;
}

.completion-message p {
  margin: 0 auto;
  color: #8d8075;
  font-size: 13px;
  line-height: 1.7;
}

.completion-thank-you {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding: 9px 14px;
  border-radius: 30px;
  background: #edf3e8;
  color: #64815a;
  font-size: 11px;
  font-weight: 700;
}

@keyframes success-appear {
  from {
    opacity: 0;
    transform: scale(0.3) rotate(-15deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

@keyframes check-pop {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes ring-pulse {
  0% {
    opacity: 0.8;
    transform: scale(0.85);
  }
  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}

@keyframes package-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0.4;
    transform: scale(0.7) rotate(0);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(20deg);
  }
}

@keyframes confetti-fall {
  0% {
    opacity: 0;
    transform: translateY(-10px) rotate(0);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(85px) rotate(180deg);
  }
}

@media (max-width: 600px) {
  .completion-animation {
    padding: 25px 15px;
  }

  .completion-message h3 {
    font-size: 18px;
  }

  .completion-message p {
    font-size: 12px;
  }

  .completion-thank-you {
    font-size: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .success-circle,
  .success-circle::before,
  .package-icon,
  .success-check,
  .sparkle,
  .confetti {
    animation: none;
  }

  .success-circle,
  .success-check {
    opacity: 1;
    transform: none;
  }
}
</style>
