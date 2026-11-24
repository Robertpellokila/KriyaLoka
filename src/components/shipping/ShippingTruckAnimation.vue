<script setup>
import { computed } from "vue";
import { Package, MapPin, Truck } from "lucide-vue-next";

const props = defineProps({
  status: {
    type: String,
    default: "processing",
  },
  courier: {
    type: String,
    default: "",
  },
  service: {
    type: String,
    default: "",
  },
  trackingNumber: {
    type: String,
    default: "",
  },
});

const isMoving = computed(() => props.status === "shipped");

const statusLabel = computed(() => {
  const labels = {
    processing: "Pesanan sedang disiapkan",
    shipped: "Pesanan sedang dalam perjalanan",
    completed: "Pesanan telah sampai",
  };

  return labels[props.status] || "Memproses pesanan";
});

const truckMessage = computed(() => {
  if (props.status === "completed") {
    return "Terima kasih telah berbelanja di KriyaLoka!";
  }

  if (props.status === "shipped") {
    return "Kurir sedang mengantarkan pesanan Anda.";
  }

  return "Penjual sedang menyiapkan paket Anda.";
});
</script>

<template>
  <section class="shipping-animation">
    <!-- HEADER -->
    <div class="shipping-heading">
      <div class="heading-icon">
        <Truck :size="19" />
      </div>

      <div>
        <span class="shipping-eyebrow">KRIYALOKA DELIVERY</span>
        <h3>{{ statusLabel }}</h3>
      </div>
    </div>

    <!-- ANIMATION SCENE -->
    <div
      class="truck-scene"
      :class="{
        moving: isMoving,
        arrived: status === 'completed',
      }"
    >
      <!-- BACKGROUND -->
      <div class="scene-sky">
        <div class="cloud cloud-one"></div>
        <div class="cloud cloud-two"></div>

        <div class="hill hill-back"></div>
        <div class="hill hill-front"></div>
      </div>

      <!-- ROAD -->
      <div class="road">
        <div class="road-line"></div>
      </div>

      <!-- TRUCK -->
      <div class="truck-wrapper">
        <div class="truck-shadow"></div>

        <div class="truck-3d">
          <!-- CARGO -->
          <div class="truck-cargo">
            <div class="cargo-top"></div>
            <div class="cargo-side">
              <Package :size="27" />
              <span>KRIYALOKA</span>
            </div>
          </div>

          <!-- CABIN -->
          <div class="truck-cabin">
            <div class="cabin-top"></div>
            <div class="cabin-window"></div>
            <div class="cabin-door"></div>
            <div class="cabin-light"></div>
          </div>

          <!-- FRONT BUMPER -->
          <div class="truck-bumper"></div>

          <!-- WHEELS -->
          <div class="truck-wheel wheel-back">
            <div class="wheel-center"></div>
          </div>

          <div class="truck-wheel wheel-front">
            <div class="wheel-center"></div>
          </div>
        </div>
      </div>

      <!-- DECORATION -->
      <div class="scene-package">
        <Package :size="18" />
      </div>
    </div>

    <!-- DESCRIPTION -->
    <div class="shipping-caption">
      <div class="caption-status">
        <span
          class="status-dot"
          :class="{ active: isMoving, completed: status === 'completed' }"
        ></span>

        <strong>{{ statusLabel }}</strong>
      </div>

      <p>{{ truckMessage }}</p>
    </div>

    <!-- SHIPPING INFORMATION -->
    <div
      v-if="courier || service || trackingNumber"
      class="shipping-information"
    >
      <div v-if="courier || service" class="shipping-info-item">
        <span>Kurir</span>
        <strong>
          {{ courier || "-" }}
          <template v-if="service"> · {{ service }}</template>
        </strong>
      </div>

      <div v-if="trackingNumber" class="shipping-info-item">
        <span>Nomor Resi</span>
        <strong class="tracking-number">{{ trackingNumber }}</strong>
      </div>
    </div>
  </section>
</template>

<style scoped>
.shipping-animation {
  width: 100%;
  overflow: hidden;
  border: 1px solid #eee5dc;
  border-radius: 14px;
  background: #fff;
  color: #332b25;
}

/* HEADER */

.shipping-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 17px;
}

.heading-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  background: #f8eee8;
  color: #a34319;
}

.shipping-eyebrow {
  color: #a34319;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

.shipping-heading h3 {
  margin: 4px 0 0;
  font-size: 13px;
}

/* SCENE */

.truck-scene {
  position: relative;
  height: 205px;
  overflow: hidden;
  perspective: 700px;
  background: linear-gradient(180deg, #eaf1e8 0%, #f5f0e7 76%, #d8c8ad 100%);
}

.scene-sky {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.cloud {
  position: absolute;
  width: 48px;
  height: 15px;
  border-radius: 20px;
  background: #fffdf7;
  opacity: 0.85;
}

.cloud::before,
.cloud::after {
  position: absolute;
  content: "";
  border-radius: 50%;
  background: inherit;
}

.cloud::before {
  top: -9px;
  left: 9px;
  width: 22px;
  height: 22px;
}

.cloud::after {
  top: -6px;
  right: 5px;
  width: 17px;
  height: 17px;
}

.cloud-one {
  top: 37px;
  left: 15%;
}

.cloud-two {
  top: 65px;
  right: 17%;
  transform: scale(0.8);
}

.hill {
  position: absolute;
  bottom: 43px;
  width: 180px;
  height: 85px;
  border-radius: 50% 50% 0 0;
}

.hill-back {
  left: -30px;
  background: #b9c9a8;
  transform: rotate(-9deg);
}

.hill-front {
  right: -30px;
  background: #9eaf8a;
  transform: rotate(10deg);
}

/* ROAD */

.road {
  position: absolute;
  right: -10%;
  bottom: 0;
  left: -10%;
  height: 54px;
  overflow: hidden;
  transform: perspective(180px) rotateX(12deg);
  transform-origin: bottom;
  background: #786e63;
}

.road-line {
  position: absolute;
  top: 24px;
  left: 0;
  width: 200%;
  height: 4px;
  background: repeating-linear-gradient(
    90deg,
    #f6e9c9 0 35px,
    transparent 35px 65px
  );
}

.moving .road-line {
  animation: road-move 0.7s linear infinite;
}

/* TRUCK */

.truck-wrapper {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 30px;
  left: 0;
  display: flex;
  justify-content: center;
  animation: truck-bounce 1.4s ease-in-out infinite;
}

.truck-3d {
  position: relative;
  width: 220px;
  height: 100px;
  transform: rotateX(-4deg) rotateY(-8deg);
  transform-style: preserve-3d;
}

.truck-shadow {
  position: absolute;
  bottom: -8px;
  left: 20px;
  width: 195px;
  height: 17px;
  border-radius: 50%;
  background: #342d2630;
  filter: blur(5px);
}

/* CARGO */

.truck-cargo {
  position: absolute;
  bottom: 24px;
  left: 8px;
  width: 133px;
  height: 67px;
  border-radius: 7px 5px 4px 4px;
  background: linear-gradient(145deg, #c77950, #a34319);
  box-shadow: 0 6px 0 #773a20;
}

.cargo-top {
  position: absolute;
  top: -6px;
  left: 5px;
  width: 126px;
  height: 8px;
  border-radius: 5px;
  background: #d9956c;
  transform: skewX(-12deg);
}

.cargo-side {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff5e9;
}

.cargo-side span {
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 1px;
}

/* CABIN */

.truck-cabin {
  position: absolute;
  right: 4px;
  bottom: 24px;
  width: 76px;
  height: 57px;
  border-radius: 5px 12px 4px 4px;
  background: #617b50;
  box-shadow: 0 6px 0 #405d3b;
}

.cabin-top {
  position: absolute;
  top: -5px;
  right: 6px;
  width: 62px;
  height: 9px;
  border-radius: 6px 10px 0 0;
  background: #879b73;
}

.cabin-window {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 35px;
  height: 23px;
  border: 3px solid #405d3b;
  border-radius: 4px 9px 3px 3px;
  background: #d7e8df;
}

.cabin-door {
  position: absolute;
  bottom: 5px;
  left: 7px;
  width: 25px;
  height: 24px;
  border: 1px solid #ffffff50;
  border-radius: 3px;
}

.cabin-light {
  position: absolute;
  right: -3px;
  bottom: 7px;
  width: 7px;
  height: 10px;
  border-radius: 3px;
  background: #f4d38c;
}

/* BUMPER */

.truck-bumper {
  position: absolute;
  right: -2px;
  bottom: 22px;
  width: 13px;
  height: 7px;
  border-radius: 2px;
  background: #e5d5b9;
}

/* WHEELS */

.truck-wheel {
  position: absolute;
  z-index: 3;
  bottom: 12px;
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border: 5px solid #393b39;
  border-radius: 50%;
  background: #777b75;
  box-shadow: 0 2px 0 #252825;
}

.wheel-back {
  left: 31px;
}

.wheel-front {
  right: 22px;
}

.wheel-center {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e7ddca;
}

.moving .truck-wheel {
  animation: wheel-spin 0.45s linear infinite;
}

/* DECORATION */

.scene-package {
  position: absolute;
  right: 15%;
  bottom: 58px;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 6px;
  background: #f4dfbd;
  color: #a34319;
  transform: rotate(-8deg);
}

/* CAPTION */

.shipping-caption {
  padding: 16px 17px;
}

.caption-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b47737;
}

.status-dot.active {
  background: #52734b;
  box-shadow: 0 0 0 4px #52734b20;
}

.status-dot.completed {
  background: #52734b;
}

.shipping-caption p {
  margin: 7px 0 0 16px;
  color: #938579;
  font-size: 11px;
  line-height: 1.6;
}

/* INFORMATION */

.shipping-information {
  display: grid;
  gap: 11px;
  margin: 0 17px 17px;
  padding: 13px;
  border-radius: 9px;
  background: #faf7f3;
}

.shipping-info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.shipping-info-item span {
  color: #938579;
  font-size: 10px;
}

.shipping-info-item strong {
  color: #493c32;
  font-size: 11px;
}

.tracking-number {
  overflow-wrap: anywhere;
}

/* ANIMATION */

@keyframes wheel-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes road-move {
  to {
    transform: translateX(-65px);
  }
}

@keyframes truck-bounce {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

.arrived .truck-wrapper {
  animation: none;
}

/* ACCESSIBILITY */

@media (prefers-reduced-motion: reduce) {
  .truck-wrapper,
  .moving .truck-wheel,
  .moving .road-line {
    animation: none;
  }
}
</style>
