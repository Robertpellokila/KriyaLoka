
<script setup>
import { computed } from "vue";
import {
  Check,
  Package,
  ClipboardCheck,
  Truck,
  House,
} from "lucide-vue-next";

import ShippingTruckAnimation from "./ShippingTruckAnimation.vue";

const props = defineProps({
  status: {
    type: String,
    default: "processing",
  },
  courierName: {
    type: String,
    default: "",
  },
  courierService: {
    type: String,
    default: "",
  },
  trackingNumber: {
    type: String,
    default: "",
  },
  shippedAt: {
    type: String,
    default: "",
  },
  deliveredAt: {
    type: String,
    default: "",
  },
});

const steps = [
  {
    key: "paid",
    label: "Pembayaran dikonfirmasi",
    description: "Pembayaran pesanan berhasil diverifikasi.",
    icon: ClipboardCheck,
  },
  {
    key: "processing",
    label: "Pesanan diproses",
    description: "Seller sedang menyiapkan pesanan.",
    icon: Package,
  },
  {
    key: "shipped",
    label: "Pesanan dikirim",
    description: "Pesanan sedang dalam perjalanan.",
    icon: Truck,
  },
  {
    key: "completed",
    label: "Pesanan diterima",
    description: "Pesanan telah sampai di tujuan.",
    icon: House,
  },
];

const statusOrder = {
  awaiting_shipping_cost: -1,
  waiting_payment: -1,
  payment_review: -1,
  paid: 0,
  processing: 1,
  shipped: 2,
  completed: 3,
  cancelled: -1,
};

const currentStep = computed(() => {
  return statusOrder[props.status] ?? -1;
});

const isCancelled = computed(() => {
  return props.status === "cancelled";
});

const isShipping = computed(() => {
  return props.status === "shipped";
});

const progressWidth = computed(() => {
  if (currentStep.value < 0) return "0%";
  return `${(currentStep.value / (steps.length - 1)) * 100}%`;
});

const formatDate = (date) => {
  if (!date) return "";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};
</script>

<template>
  <section class="shipping-progress">
    <div class="progress-header">
      <div>
        <span class="section-eyebrow">ORDER TRACKING</span>
        <h3>Perjalanan Pesanan</h3>
        <p>Pantau perkembangan pesananmu di sini.</p>
      </div>

      <span
        v-if="isCancelled"
        class="status-badge cancelled"
      >
        Pesanan Dibatalkan
      </span>

      <span
        v-else
        class="status-badge"
        :class="isShipping ? 'shipping' : 'normal'"
      >
        {{ steps[currentStep]?.label || "Menunggu proses" }}
      </span>
    </div>

    <div
      v-if="isCancelled"
      class="cancelled-message"
    >
      <Package :size="24" />
      <div>
        <strong>Pesanan dibatalkan</strong>
        <p>Pesanan ini tidak melanjutkan proses pengiriman.</p>
      </div>
    </div>

    <template v-else>
      <!-- Truck Animation -->
      <div
        v-if="isShipping"
        class="truck-animation-wrapper"
      >
        <ShippingTruckAnimation
          status="shipped"
          :courier-name="courierName"
          :tracking-number="trackingNumber"
        />
      </div>

      <!-- Shipping Information -->
      <div
        v-if="isShipping && (courierName || courierService || trackingNumber)"
        class="courier-information"
      >
        <div class="courier-heading">
          <Truck :size="19" />
          <strong>Informasi Pengiriman</strong>
        </div>

        <div class="courier-grid">
          <div v-if="courierName">
            <span>Kurir</span>
            <strong>{{ courierName }}</strong>
          </div>

          <div v-if="courierService">
            <span>Layanan</span>
            <strong>{{ courierService }}</strong>
          </div>

          <div v-if="trackingNumber">
            <span>Nomor Resi</span>
            <strong class="tracking-number">
              {{ trackingNumber }}
            </strong>
          </div>
        </div>
      </div>

      <!-- Progress Timeline -->
      <div class="timeline">
        <div class="timeline-track">
          <div
            class="timeline-track-fill"
            :style="{ width: progressWidth }"
          ></div>
        </div>

        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="timeline-step"
          :class="{
            completed: index < currentStep,
            active: index === currentStep,
            pending: index > currentStep,
          }"
        >
          <div class="timeline-icon">
            <Check
              v-if="index < currentStep"
              :size="17"
            />

            <component
              v-else
              :is="step.icon"
              :size="18"
            />
          </div>

          <div class="timeline-content">
            <strong>{{ step.label }}</strong>
            <p>{{ step.description }}</p>

            <span
              v-if="step.key === 'shipped' && shippedAt"
              class="timeline-date"
            >
              {{ formatDate(shippedAt) }}
            </span>

            <span
              v-if="step.key === 'completed' && deliveredAt"
              class="timeline-date"
            >
              {{ formatDate(deliveredAt) }}
            </span>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.shipping-progress {
  width: 100%;
  padding: 24px;
  background: #fdfbf9;
  border: 1px solid #eee5db;
  border-radius: 20px;
  color: #493b32;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 26px;
}

.section-eyebrow {
  display: block;
  margin-bottom: 7px;
  color: #a36b4c;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.8px;
}

.progress-header h3 {
  margin: 0;
  font-size: 21px;
  font-weight: 800;
}

.progress-header p {
  margin: 6px 0 0;
  color: #95877c;
  font-size: 13px;
}

.status-badge {
  padding: 8px 12px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.status-badge.normal {
  background: #eaf0e5;
  color: #52734b;
}

.status-badge.shipping {
  background: #fff0e5;
  color: #a6532c;
}

.status-badge.cancelled {
  background: #fce8e6;
  color: #b33b32;
}

.truck-animation-wrapper {
  margin-bottom: 24px;
}

.courier-information {
  padding: 16px;
  margin-bottom: 28px;
  background: #f6f2ec;
  border: 1px solid #eee5db;
  border-radius: 14px;
}

.courier-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 14px;
  color: #52734b;
  font-size: 13px;
}

.courier-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.courier-grid div {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.courier-grid span {
  color: #95877c;
  font-size: 11px;
}

.courier-grid strong {
  color: #493b32;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.tracking-number {
  color: #a6532c !important;
}

.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 4px;
}

.timeline-track {
  position: absolute;
  top: 19px;
  bottom: 34px;
  left: 22px;
  width: 3px;
  background: #e9e2d9;
  border-radius: 10px;
}

.timeline-track-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  background: #719466;
  border-radius: 10px;
  transition: width 0.4s ease;
}

.timeline-step {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-height: 82px;
}

.timeline-step:last-child {
  min-height: 0;
}

.timeline-icon {
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  width: 38px;
  height: 38px;
  border: 2px solid #e5ddd4;
  border-radius: 50%;
  background: #fdfbf9;
  color: #b8aaa0;
  transition: all 0.3s ease;
}

.timeline-step.completed .timeline-icon {
  border-color: #719466;
  background: #719466;
  color: white;
}

.timeline-step.active .timeline-icon {
  border-color: #b66a45;
  background: #fff0e5;
  color: #a6532c;
  box-shadow: 0 0 0 5px #f9eee7;
}

.timeline-content {
  padding-top: 2px;
}

.timeline-content strong {
  display: block;
  color: #493b32;
  font-size: 13px;
}

.timeline-step.pending .timeline-content strong {
  color: #a99c92;
}

.timeline-content p {
  margin: 5px 0 0;
  color: #95877c;
  font-size: 12px;
  line-height: 1.5;
}

.timeline-date {
  display: block;
  margin-top: 6px;
  color: #a6532c;
  font-size: 11px;
  font-weight: 600;
}

.cancelled-message {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  background: #fcefed;
  color: #b33b32;
}

.cancelled-message strong {
  font-size: 14px;
}

.cancelled-message p {
  margin: 5px 0 0;
  color: #98635e;
  font-size: 12px;
}

@media (max-width: 600px) {
  .shipping-progress {
    padding: 18px;
  }

  .progress-header {
    flex-direction: column;
  }

  .courier-grid {
    grid-template-columns: 1fr;
  }

  .timeline-step {
    min-height: 88px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .timeline-icon,
  .timeline-track-fill {
    transition: none;
  }
}
</style>
