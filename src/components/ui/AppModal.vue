<script setup>
import { computed, watch, onBeforeUnmount } from "vue";
import {
  X,
  CircleAlert,
  CheckCircle2,
  Trash2,
  Info,
  LoaderCircle,
} from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Konfirmasi Tindakan",
  },
  description: {
    type: String,
    default: "",
  },
  confirmText: {
    type: String,
    default: "Ya, Lanjutkan",
  },
  cancelText: {
    type: String,
    default: "Batal",
  },
  variant: {
    type: String,
    default: "warning",
    validator: (value) =>
      ["warning", "danger", "success", "info"].includes(value),
  },
  // Ukuran modal: sm (380px) | md (430px, default) | lg (680px) | xl (820px)
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg", "xl"].includes(value),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: [Object, Function],
    default: null,
  },
  closeOnOverlay: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

const iconConfig = {
  warning: {
    component: CircleAlert,
    class: "warning-icon",
    buttonClass: "confirm-warning",
  },
  danger: {
    component: Trash2,
    class: "danger-icon",
    buttonClass: "confirm-danger",
  },
  success: {
    component: CheckCircle2,
    class: "success-icon",
    buttonClass: "confirm-success",
  },
  info: {
    component: Info,
    class: "info-icon",
    buttonClass: "confirm-info",
  },
};

const currentConfig = computed(
  () => iconConfig[props.variant] || iconConfig.warning,
);

const resolvedIcon = computed(
  () => props.icon || currentConfig.value.component,
);

function closeModal() {
  if (props.loading) return;

  emit("update:modelValue", false);
  emit("cancel");
}

function handleConfirm() {
  if (props.loading) return;

  emit("confirm");
}

function handleOverlayClick() {
  if (!props.closeOnOverlay) return;

  closeModal();
}

// Tutup dengan tombol ESC (listener global karena overlay tidak selalu fokus)
function handleKeydown(event) {
  if (event.key === "Escape" && props.modelValue) {
    closeModal();
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeydown);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeydown);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  document.body.style.overflow = "";
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-overlay"
        @click.self="handleOverlayClick"
      >
        <div
          class="confirmation-modal"
          :class="`modal-${size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <!-- CLOSE BUTTON -->
          <button
            type="button"
            class="modal-close"
            :disabled="loading"
            aria-label="Tutup modal"
            @click="closeModal"
          >
            <X :size="18" />
          </button>

          <!-- HEADER -->
          <div class="modal-header">
            <div class="confirmation-icon" :class="currentConfig.class">
              <component :is="resolvedIcon" :size="27" />
            </div>

            <h3>{{ title }}</h3>

            <p v-if="description" class="confirmation-description">
              {{ description }}
            </p>
          </div>

          <!-- CUSTOM CONTENT (scrollable) -->
          <div v-if="$slots.default" class="modal-body">
            <slot />
          </div>

          <!-- ACTIONS (selalu terlihat) -->
          <div class="modal-actions" :class="{ 'has-content': $slots.default }">
            <button
              type="button"
              class="cancel-button"
              :disabled="loading"
              @click="closeModal"
            >
              {{ cancelText }}
            </button>

            <button
              type="button"
              class="confirm-button"
              :class="currentConfig.buttonClass"
              :disabled="loading"
              @click="handleConfirm"
            >
              <LoaderCircle v-if="loading" :size="16" class="loading-icon" />

              <span>
                {{ loading ? "Memproses..." : confirmText }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  padding: 20px;
  background: rgba(35, 37, 29, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
}

.confirmation-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 430px;
  max-height: calc(100vh - 40px);
  overflow: hidden;
  border: 1px solid #eee8db;
  border-radius: 19px;
  background: #fffdf8;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.15);
  text-align: center;
}

/* SIZES */
.confirmation-modal.modal-sm {
  max-width: 380px;
}

.confirmation-modal.modal-md {
  max-width: 430px;
}

.confirmation-modal.modal-lg {
  max-width: 680px;
}

.confirmation-modal.modal-xl {
  max-width: 820px;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 9px;
  background: #f2f0e7;
  color: #797765;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
}

.modal-close:hover:not(:disabled) {
  background: #e8e5da;
}

.modal-header {
  flex-shrink: 0;
  padding: 30px 30px 0;
}

.confirmation-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 16px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-icon {
  background: #f8eae3;
  color: #ae6b56;
}

.danger-icon {
  background: #f8e5e2;
  color: #b94d43;
}

.success-icon {
  background: #e9f2e7;
  color: #54805b;
}

.info-icon {
  background: #e8edf4;
  color: #607b9c;
}

.confirmation-modal h3 {
  margin: 0;
  color: #3f4135;
  font-size: 19px;
  font-weight: 700;
}

.confirmation-description {
  margin: 10px 0 0;
  color: #898676;
  font-size: 12px;
  line-height: 1.7;
}

/* Area konten yang bisa di-scroll */
.modal-body {
  flex: 1;
  min-height: 0;
  margin-top: 20px;
  padding: 2px 30px 4px;
  overflow-y: auto;
  text-align: left;
}

.modal-actions {
  flex-shrink: 0;
  display: flex;
  gap: 9px;
  padding: 22px 30px 28px;
}

.modal-actions.has-content {
  margin-top: 8px;
  padding: 18px 30px 24px;
  border-top: 1px solid #eee8db;
  background: #fffdf8;
}

.cancel-button,
.confirm-button {
  min-height: 42px;
  flex: 1;
  padding: 0 14px;
  border: 0;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.cancel-button {
  background: #f0eee6;
  color: #777562;
}

.cancel-button:hover:not(:disabled) {
  background: #e8e5da;
}

.confirm-warning {
  background: #a96855;
  color: #fff;
}

.confirm-warning:hover:not(:disabled) {
  background: #945943;
}

.confirm-danger {
  background: #b94d43;
  color: #fff;
}

.confirm-danger:hover:not(:disabled) {
  background: #9f3e36;
}

.confirm-success {
  background: #68764c;
  color: #fff;
}

.confirm-success:hover:not(:disabled) {
  background: #56643d;
}

.confirm-info {
  background: #607b9c;
  color: #fff;
}

.confirm-info:hover:not(:disabled) {
  background: #4d6685;
}

.cancel-button:disabled,
.confirm-button:disabled,
.modal-close:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

/* TRANSITIONS */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .confirmation-modal,
.modal-leave-active .confirmation-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .confirmation-modal,
.modal-leave-to .confirmation-modal {
  transform: translateY(10px) scale(0.98);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 12px;
  }

  .confirmation-modal {
    max-height: calc(100vh - 24px);
  }

  .modal-header {
    padding: 25px 20px 0;
  }

  .modal-body {
    padding-right: 20px;
    padding-left: 20px;
  }

  .modal-actions,
  .modal-actions.has-content {
    padding-right: 20px;
    padding-left: 20px;
  }
}
</style>
