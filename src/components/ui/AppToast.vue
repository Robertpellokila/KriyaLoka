<script setup>
import { computed, onBeforeUnmount, watch } from "vue";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "success",
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
  duration: {
    type: Number,
    default: 3500,
  },
});

const emit = defineEmits(["update:modelValue"]);

let timeoutId = null;

const iconComponent = computed(() => {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  return icons[props.type] || Info;
});

function closeToast() {
  clearTimeout(timeoutId);
  emit("update:modelValue", false);
}

watch(
  () => props.modelValue,
  (visible) => {
    clearTimeout(timeoutId);

    if (visible && props.duration > 0) {
      timeoutId = setTimeout(() => {
        closeToast();
      }, props.duration);
    }
  },
);

onBeforeUnmount(() => {
  clearTimeout(timeoutId);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div
        v-if="modelValue"
        class="toast-notification"
        :class="`toast-${type}`"
        role="status"
        aria-live="polite"
      >
        <div class="toast-icon">
          <component :is="iconComponent" :size="22" />
        </div>

        <div class="toast-content">
          <strong>{{ title }}</strong>
          <p v-if="message">{{ message }}</p>
        </div>

        <button
          type="button"
          class="toast-close"
          aria-label="Tutup notifikasi"
          @click="closeToast"
        >
          <X :size="17" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-notification {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 99999;

  display: flex;
  align-items: flex-start;
  gap: 12px;

  width: min(390px, calc(100vw - 32px));
  padding: 16px;

  border: 1px solid #e9dfd5;
  border-radius: 13px;
  background: #ffffff;

  box-shadow: 0 12px 40px rgba(48, 35, 25, 0.15);
}

.toast-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;

  width: 36px;
  height: 36px;

  border-radius: 10px;
}

.toast-success .toast-icon {
  background: #eaf5ed;
  color: #34734e;
}

.toast-error .toast-icon {
  background: #fff0ed;
  color: #b54736;
}

.toast-info .toast-icon {
  background: #edf3f8;
  color: #47728e;
}

.toast-content {
  flex: 1;
  min-width: 0;
  padding-top: 1px;
}

.toast-content strong {
  display: block;
  color: #40352d;
  font-size: 13px;
  font-weight: 800;
}

.toast-content p {
  margin: 5px 0 0;
  color: #897d73;
  font-size: 11px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.toast-close {
  display: grid;
  place-items: center;
  flex-shrink: 0;

  width: 27px;
  height: 27px;
  padding: 0;

  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #9b9087;
  cursor: pointer;
}

.toast-close:hover {
  background: #f5f0eb;
  color: #55483e;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(25px);
}

@media (max-width: 600px) {
  .toast-notification {
    top: 14px;
    right: 16px;
    width: calc(100vw - 32px);
  }
}
</style>
