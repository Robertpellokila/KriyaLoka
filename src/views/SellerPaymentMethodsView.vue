<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  CreditCard,
  QrCode,
  Landmark,
  Plus,
  Pencil,
  Trash2,
  Power,
  Upload,
  X,
  Save,
  LoaderCircle,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-vue-next";

import { supabase } from "@/services/supabase.js";

// ======================================================
// STATE
// ======================================================

// Buat bucket dengan nama yang sama di Supabase Storage.
const STORAGE_BUCKET = "seller-payment-methods";

const userId = ref(null);
const methods = ref([]);

const loading = ref(true);
const saving = ref(false);
const togglingId = ref(null);
const deleting = ref(false);

const showForm = ref(false);
const showDeleteModal = ref(false);

const editingMethod = ref(null);
const methodToDelete = ref(null);

const selectedFile = ref(null);
const previewUrl = ref("");
const fileInput = ref(null);

const toast = ref({
  show: false,
  type: "success",
  message: "",
});

let toastTimeout = null;

const form = ref({
  method_type: "qris",
  display_name: "QRIS Toko",
  bank_name: "",
  account_number: "",
  account_holder: "",
  is_active: true,
});

const isEditing = computed(() => !!editingMethod.value);

const isQris = computed(() => form.value.method_type === "qris");

const activeMethods = computed(
  () => methods.value.filter((item) => item.is_active).length,
);

const qrisMethods = computed(() =>
  methods.value.filter((item) => item.method_type === "qris"),
);

const bankMethods = computed(() =>
  methods.value.filter((item) => item.method_type === "bank_transfer"),
);

// ======================================================
// TOAST
// ======================================================

function showToast(message, type = "success") {
  toast.value = {
    show: true,
    type,
    message,
  };

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    toast.value.show = false;
  }, 3500);
}

// ======================================================
// AUTHENTICATION
// ======================================================

async function getCurrentSeller() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  if (!data.user) {
    throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
  }

  userId.value = data.user.id;
}

// ======================================================
// FETCH PAYMENT METHODS
// ======================================================

async function fetchMethods() {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from("seller_payment_methods")
      .select(
        `
        id,
        seller_id,
        method_type,
        display_name,
        qris_image_url,
        qris_image_path,
        bank_name,
        account_number,
        account_holder,
        is_active,
        sort_order,
        created_at,
        updated_at
      `,
      )
      .eq("seller_id", userId.value)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    methods.value = data || [];
  } catch (error) {
    console.error("Gagal mengambil metode pembayaran:", error);

    showToast(
      error.message || "Gagal mengambil data metode pembayaran.",
      "error",
    );
  } finally {
    loading.value = false;
  }
}

async function initializePage() {
  try {
    await getCurrentSeller();
    await fetchMethods();
  } catch (error) {
    console.error("Gagal menginisialisasi halaman:", error);

    loading.value = false;

    showToast(
      error.message || "Gagal memuat halaman metode pembayaran.",
      "error",
    );
  }
}

// ======================================================
// FORM
// ======================================================

function resetForm() {
  form.value = {
    method_type: "qris",
    display_name: "QRIS Toko",
    bank_name: "",
    account_number: "",
    account_holder: "",
    is_active: true,
  };

  editingMethod.value = null;
  selectedFile.value = null;

  clearPreview();
}

function clearPreview() {
  if (previewUrl.value && previewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl.value);
  }

  previewUrl.value = "";
}

function openAddForm(type = "qris") {
  resetForm();

  form.value.method_type = type;

  if (type === "qris") {
    form.value.display_name = "QRIS Toko";
  } else {
    form.value.display_name = "Transfer Bank";
  }

  showForm.value = true;
}

function openEditForm(method) {
  resetForm();

  editingMethod.value = method;

  form.value = {
    method_type: method.method_type,
    display_name: method.display_name || "",
    bank_name: method.bank_name || "",
    account_number: method.account_number || "",
    account_holder: method.account_holder || "",
    is_active: method.is_active,
  };

  if (method.method_type === "qris") {
    previewUrl.value = method.qris_image_url || "";
  }

  showForm.value = true;
}

function closeForm() {
  if (saving.value) return;

  showForm.value = false;
  resetForm();
}

// ======================================================
// QRIS IMAGE
// ======================================================

function handleFileChange(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    showToast("Format gambar harus PNG, JPG, atau WEBP.", "error");

    event.target.value = "";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("Ukuran gambar maksimal 5 MB.", "error");

    event.target.value = "";
    return;
  }

  clearPreview();

  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
}

function removeSelectedImage() {
  selectedFile.value = null;
  clearPreview();

  if (fileInput.value) {
    fileInput.value.value = "";
  }

  // Jika sedang edit, kembalikan gambar lama.
  if (editingMethod.value?.qris_image_url) {
    previewUrl.value = editingMethod.value.qris_image_url;
  }
}

async function uploadQrisImage(file) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const filePath = `${userId.value}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return {
    path: filePath,
    url: data.publicUrl,
  };
}

// ======================================================
// VALIDATION
// ======================================================

function validateForm() {
  if (!form.value.display_name.trim()) {
    showToast("Nama metode pembayaran wajib diisi.", "error");
    return false;
  }

  if (isQris.value) {
    const hasExistingImage =
      !!editingMethod.value?.qris_image_path &&
      !!editingMethod.value?.qris_image_url;

    if (!selectedFile.value && !hasExistingImage) {
      showToast("Silakan upload gambar QRIS terlebih dahulu.", "error");
      return false;
    }
  } else {
    if (!form.value.bank_name.trim()) {
      showToast("Nama bank wajib diisi.", "error");
      return false;
    }

    if (!form.value.account_number.trim()) {
      showToast("Nomor rekening wajib diisi.", "error");
      return false;
    }

    if (!/^[0-9]+$/.test(form.value.account_number.trim())) {
      showToast("Nomor rekening hanya boleh berisi angka.", "error");
      return false;
    }

    if (!form.value.account_holder.trim()) {
      showToast("Nama pemilik rekening wajib diisi.", "error");
      return false;
    }
  }

  return true;
}

// ======================================================
// SAVE METHOD
// ======================================================

async function saveMethod() {
  if (saving.value || !validateForm()) return;

  const wasEditing = !!editingMethod.value;

  saving.value = true;

  let uploadedImage = null;

  try {
    let qrisImageUrl = null;
    let qrisImagePath = null;

    if (isQris.value) {
      if (selectedFile.value) {
        uploadedImage = await uploadQrisImage(selectedFile.value);

        qrisImageUrl = uploadedImage.url;
        qrisImagePath = uploadedImage.path;
      } else if (editingMethod.value) {
        qrisImageUrl = editingMethod.value.qris_image_url;
        qrisImagePath = editingMethod.value.qris_image_path;
      }
    }

    const payload = {
      seller_id: userId.value,
      method_type: form.value.method_type,
      display_name: form.value.display_name.trim(),
      qris_image_url: qrisImageUrl,
      qris_image_path: qrisImagePath,
      bank_name: isQris.value ? null : form.value.bank_name.trim(),
      account_number: isQris.value ? null : form.value.account_number.trim(),
      account_holder: isQris.value ? null : form.value.account_holder.trim(),
      is_active: form.value.is_active,
      sort_order: editingMethod.value
        ? editingMethod.value.sort_order
        : methods.value.length + 1,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (editingMethod.value) {
      result = await supabase
        .from("seller_payment_methods")
        .update(payload)
        .eq("id", editingMethod.value.id)
        .eq("seller_id", userId.value);
    } else {
      result = await supabase.from("seller_payment_methods").insert(payload);
    }

    if (result.error) throw result.error;

    // Hapus gambar lama setelah database berhasil diperbarui.
    if (
      uploadedImage &&
      editingMethod.value?.qris_image_path &&
      editingMethod.value.qris_image_path !== uploadedImage.path
    ) {
      const { error: deleteOldError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([editingMethod.value.qris_image_path]);

      if (deleteOldError) {
        console.warn("Gambar QRIS lama gagal dihapus:", deleteOldError);
      }
    }

    showForm.value = false;
    resetForm();

    await fetchMethods();

    showToast(
      editingMethod.value
        ? "Metode pembayaran berhasil diperbarui."
        : "Metode pembayaran berhasil ditambahkan.",
    );
  } catch (error) {
    console.error("Gagal menyimpan metode pembayaran:", error);

    // Bersihkan upload baru jika penyimpanan database gagal.
    if (uploadedImage) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadedImage.path]);
    }

    showToast(error.message || "Gagal menyimpan metode pembayaran.", "error");
  } finally {
    saving.value = false;
  }
}

// ======================================================
// ACTIVE / INACTIVE
// ======================================================

async function toggleMethod(method) {
  if (togglingId.value) return;

  togglingId.value = method.id;

  try {
    const { error } = await supabase
      .from("seller_payment_methods")
      .update({
        is_active: !method.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", method.id)
      .eq("seller_id", userId.value);

    if (error) throw error;

    method.is_active = !method.is_active;

    showToast(
      method.is_active
        ? "Metode pembayaran berhasil diaktifkan."
        : "Metode pembayaran berhasil dinonaktifkan.",
    );
  } catch (error) {
    console.error("Gagal mengubah status metode:", error);

    showToast(
      error.message || "Gagal mengubah status metode pembayaran.",
      "error",
    );
  } finally {
    togglingId.value = null;
  }
}

// ======================================================
// DELETE METHOD
// ======================================================

function askDelete(method) {
  methodToDelete.value = method;
  showDeleteModal.value = true;
}

function closeDeleteModal() {
  if (deleting.value) return;

  showDeleteModal.value = false;
  methodToDelete.value = null;
}

async function deleteMethod() {
  if (!methodToDelete.value || deleting.value) return;

  deleting.value = true;

  const method = methodToDelete.value;

  try {
    const { error } = await supabase
      .from("seller_payment_methods")
      .delete()
      .eq("id", method.id)
      .eq("seller_id", userId.value);

    if (error) throw error;

    if (method.qris_image_path) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([method.qris_image_path]);

      if (storageError) {
        console.warn("Gambar QRIS gagal dihapus:", storageError);
      }
    }

    methods.value = methods.value.filter((item) => item.id !== method.id);

    showDeleteModal.value = false;
    methodToDelete.value = null;

    showToast("Metode pembayaran berhasil dihapus.");
  } catch (error) {
    console.error("Gagal menghapus metode:", error);

    showToast(error.message || "Gagal menghapus metode pembayaran.", "error");
  } finally {
    deleting.value = false;
  }
}

// ======================================================
// LIFECYCLE
// ======================================================

onMounted(initializePage);

onBeforeUnmount(() => {
  if (toastTimeout) clearTimeout(toastTimeout);
  clearPreview();
});
</script>

<template>
  <div class="payment-page">
    <!-- TOAST -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-message" :class="toast.type">
        <CheckCircle2 v-if="toast.type === 'success'" :size="19" />
        <AlertCircle v-else :size="19" />

        <span>{{ toast.message }}</span>

        <button @click="toast.show = false" aria-label="Tutup notifikasi">
          <X :size="16" />
        </button>
      </div>
    </Transition>

    <!-- PAGE HEADER -->
    <div class="page-header">
      <div>
        <div class="eyebrow">
          <CreditCard :size="15" />
          PENGATURAN TOKO
        </div>

        <h2>Metode Pembayaran</h2>

        <p>
          Atur QRIS dan rekening bank yang dapat digunakan pembeli untuk
          membayar pesanan dari toko Anda.
        </p>
      </div>

      <button class="refresh-button" :disabled="loading" @click="fetchMethods">
        <RefreshCw :size="16" :class="{ spinning: loading }" />
        <span>Muat Ulang</span>
      </button>
    </div>

    <!-- SUMMARY -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon">
          <CreditCard :size="20" />
        </div>

        <div>
          <span>Total Metode</span>
          <strong>{{ methods.length }}</strong>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon green">
          <CheckCircle2 :size="20" />
        </div>

        <div>
          <span>Metode Aktif</span>
          <strong>{{ activeMethods }}</strong>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon purple">
          <QrCode :size="20" />
        </div>

        <div>
          <span>Metode QRIS</span>
          <strong>{{ qrisMethods.length }}</strong>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon orange">
          <Landmark :size="20" />
        </div>

        <div>
          <span>Rekening Bank</span>
          <strong>{{ bankMethods.length }}</strong>
        </div>
      </div>
    </div>

    <!-- INFORMATION -->
    <div class="information-box">
      <div class="information-icon">
        <AlertCircle :size="19" />
      </div>

      <div>
        <strong>Informasi untuk penjual</strong>
        <p>
          Pembeli baru dapat melakukan pembayaran setelah seluruh seller dalam
          pesanan mengonfirmasi ongkos kirim. Pastikan metode pembayaran Anda
          sudah benar dan aktif.
        </p>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="loading-state">
      <LoaderCircle :size="30" class="spinning" />
      <p>Memuat metode pembayaran...</p>
    </div>

    <template v-else>
      <!-- QRIS SECTION -->
      <section class="method-section">
        <div class="section-header">
          <div class="section-title">
            <div class="section-icon qris-icon">
              <QrCode :size="21" />
            </div>

            <div>
              <h3>QRIS</h3>
              <p>Terima pembayaran melalui pemindaian QRIS.</p>
            </div>
          </div>

          <button class="add-button" @click="openAddForm('qris')">
            <Plus :size="17" />
            Tambah QRIS
          </button>
        </div>

        <div v-if="qrisMethods.length" class="method-grid">
          <article
            v-for="method in qrisMethods"
            :key="method.id"
            class="method-card"
          >
            <div class="method-card-header">
              <div class="method-name">
                <span class="type-icon qris-icon">
                  <QrCode :size="17" />
                </span>

                <div>
                  <strong>{{ method.display_name }}</strong>
                  <span>QRIS</span>
                </div>
              </div>

              <span
                class="status-badge"
                :class="method.is_active ? 'active' : 'inactive'"
              >
                {{ method.is_active ? "Aktif" : "Nonaktif" }}
              </span>
            </div>

            <div class="qris-preview">
              <img
                v-if="method.qris_image_url"
                :src="method.qris_image_url"
                :alt="`QRIS ${method.display_name}`"
              />

              <div v-else class="no-image">
                <ImageIcon :size="28" />
                <span>Gambar QRIS tidak tersedia</span>
              </div>
            </div>

            <div class="method-card-footer">
              <button class="action-button" @click="openEditForm(method)">
                <Pencil :size="15" />
                Edit
              </button>

              <button
                class="action-button"
                :disabled="togglingId === method.id"
                @click="toggleMethod(method)"
              >
                <Power :size="15" />
                {{ method.is_active ? "Nonaktifkan" : "Aktifkan" }}
              </button>

              <button class="action-button danger" @click="askDelete(method)">
                <Trash2 :size="15" />
                Hapus
              </button>
            </div>
          </article>
        </div>

        <div v-else class="empty-method">
          <div class="empty-icon">
            <QrCode :size="26" />
          </div>

          <strong>Belum ada QRIS toko</strong>

          <p>Tambahkan gambar QRIS agar pembeli dapat membayar melalui QRIS.</p>

          <button class="outline-button" @click="openAddForm('qris')">
            <Plus :size="16" />
            Tambahkan QRIS
          </button>
        </div>
      </section>

      <!-- BANK SECTION -->
      <section class="method-section">
        <div class="section-header">
          <div class="section-title">
            <div class="section-icon bank-icon">
              <Landmark :size="21" />
            </div>

            <div>
              <h3>Transfer Bank</h3>
              <p>Terima pembayaran melalui transfer rekening.</p>
            </div>
          </div>

          <button class="add-button" @click="openAddForm('bank_transfer')">
            <Plus :size="17" />
            Tambah Rekening
          </button>
        </div>

        <div v-if="bankMethods.length" class="bank-grid">
          <article
            v-for="method in bankMethods"
            :key="method.id"
            class="bank-card"
          >
            <div class="bank-card-top">
              <div class="bank-logo">
                <Landmark :size="22" />
              </div>

              <span
                class="status-badge"
                :class="method.is_active ? 'active' : 'inactive'"
              >
                {{ method.is_active ? "Aktif" : "Nonaktif" }}
              </span>
            </div>

            <span class="bank-label">{{ method.bank_name }}</span>

            <strong class="account-number">
              {{ method.account_number }}
            </strong>

            <span class="account-holder">
              a.n. {{ method.account_holder }}
            </span>

            <div class="bank-card-footer">
              <span>{{ method.display_name }}</span>

              <div class="card-actions">
                <button
                  class="icon-action"
                  title="Edit rekening"
                  @click="openEditForm(method)"
                >
                  <Pencil :size="16" />
                </button>

                <button
                  class="icon-action"
                  title="Aktifkan atau nonaktifkan"
                  :disabled="togglingId === method.id"
                  @click="toggleMethod(method)"
                >
                  <Power :size="16" />
                </button>

                <button
                  class="icon-action danger"
                  title="Hapus rekening"
                  @click="askDelete(method)"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-method">
          <div class="empty-icon">
            <Landmark :size="26" />
          </div>

          <strong>Belum ada rekening bank</strong>

          <p>
            Tambahkan rekening bank toko agar pembeli dapat melakukan transfer.
          </p>

          <button class="outline-button" @click="openAddForm('bank_transfer')">
            <Plus :size="16" />
            Tambahkan Rekening
          </button>
        </div>
      </section>
    </template>

    <!-- ADD / EDIT MODAL -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
          <div class="modal-card">
            <div class="modal-header">
              <div>
                <span class="modal-eyebrow"> PENGATURAN PEMBAYARAN </span>

                <h3>
                  {{
                    isEditing
                      ? "Edit Metode Pembayaran"
                      : "Tambah Metode Pembayaran"
                  }}
                </h3>
              </div>

              <button
                class="close-button"
                :disabled="saving"
                @click="closeForm"
              >
                <X :size="20" />
              </button>
            </div>

            <form @submit.prevent="saveMethod">
              <div class="form-group">
                <label>Jenis Metode Pembayaran</label>

                <div class="type-selector">
                  <button
                    type="button"
                    :class="{ selected: form.method_type === 'qris' }"
                    :disabled="isEditing"
                    @click="
                      form.method_type = 'qris';
                      form.display_name = 'QRIS Toko';
                    "
                  >
                    <QrCode :size="19" />
                    QRIS
                  </button>

                  <button
                    type="button"
                    :class="{ selected: form.method_type === 'bank_transfer' }"
                    :disabled="isEditing"
                    @click="
                      form.method_type = 'bank_transfer';
                      form.display_name = 'Transfer Bank';
                    "
                  >
                    <Landmark :size="19" />
                    Transfer Bank
                  </button>
                </div>

                <small v-if="isEditing">
                  Jenis metode tidak dapat diubah saat mengedit.
                </small>
              </div>

              <div class="form-group">
                <label for="displayName">Nama Metode</label>

                <input
                  id="displayName"
                  v-model="form.display_name"
                  type="text"
                  placeholder="Contoh: QRIS Toko Utama"
                  maxlength="100"
                  required
                />
              </div>

              <!-- QRIS FORM -->
              <template v-if="isQris">
                <div class="form-group">
                  <label>Gambar QRIS</label>

                  <div class="upload-area">
                    <input
                      ref="fileInput"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      @change="handleFileChange"
                    />

                    <div v-if="previewUrl" class="image-preview">
                      <img :src="previewUrl" alt="Pratinjau QRIS" />

                      <button
                        type="button"
                        class="remove-image"
                        @click="removeSelectedImage"
                      >
                        <X :size="15" />
                      </button>
                    </div>

                    <button
                      v-else
                      type="button"
                      class="upload-placeholder"
                      @click="fileInput?.click()"
                    >
                      <Upload :size="25" />
                      <strong>Pilih gambar QRIS</strong>
                      <span>PNG, JPG, WEBP · Maksimal 5 MB</span>
                    </button>

                    <button
                      v-if="previewUrl"
                      type="button"
                      class="change-image-button"
                      @click="fileInput?.click()"
                    >
                      <Upload :size="15" />
                      Ganti gambar
                    </button>
                  </div>
                </div>
              </template>

              <!-- BANK FORM -->
              <template v-else>
                <div class="form-group">
                  <label for="bankName">Nama Bank</label>

                  <select id="bankName" v-model="form.bank_name" required>
                    <option value="" disabled>Pilih bank</option>
                    <option value="BCA">BCA</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="Bank Mandiri">Bank Mandiri</option>
                    <option value="BSI">Bank Syariah Indonesia</option>
                    <option value="BTN">BTN</option>
                    <option value="CIMB Niaga">CIMB Niaga</option>
                    <option value="Danamon">Danamon</option>
                    <option value="Permata Bank">Permata Bank</option>
                    <option value="Bank Lainnya">Bank Lainnya</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="accountNumber">Nomor Rekening</label>

                  <input
                    id="accountNumber"
                    v-model="form.account_number"
                    type="text"
                    inputmode="numeric"
                    placeholder="Masukkan nomor rekening"
                    maxlength="40"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="accountHolder">Nama Pemilik Rekening</label>

                  <input
                    id="accountHolder"
                    v-model="form.account_holder"
                    type="text"
                    placeholder="Nama sesuai buku rekening"
                    maxlength="150"
                    required
                  />
                </div>
              </template>

              <label class="active-toggle">
                <input v-model="form.is_active" type="checkbox" />

                <span class="toggle-visual"></span>

                <span>
                  <strong>Aktifkan metode pembayaran</strong>
                  <small> Metode ini dapat ditampilkan kepada pembeli. </small>
                </span>
              </label>

              <div class="modal-actions">
                <button
                  type="button"
                  class="cancel-button"
                  :disabled="saving"
                  @click="closeForm"
                >
                  Batal
                </button>

                <button type="submit" class="save-button" :disabled="saving">
                  <LoaderCircle v-if="saving" :size="17" class="spinning" />

                  <Save v-else :size="17" />

                  {{ saving ? "Menyimpan..." : "Simpan Metode" }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- DELETE CONFIRMATION -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showDeleteModal"
          class="modal-overlay"
          @click.self="closeDeleteModal"
        >
          <div class="confirm-card">
            <div class="confirm-icon">
              <Trash2 :size="25" />
            </div>

            <h3>Hapus Metode Pembayaran?</h3>

            <p>
              Metode
              <strong>{{ methodToDelete?.display_name }}</strong>
              akan dihapus dari toko Anda. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div class="modal-actions">
              <button
                class="cancel-button"
                :disabled="deleting"
                @click="closeDeleteModal"
              >
                Batal
              </button>

              <button
                class="delete-button"
                :disabled="deleting"
                @click="deleteMethod"
              >
                <LoaderCircle v-if="deleting" :size="17" class="spinning" />

                <Trash2 v-else :size="17" />

                {{ deleting ? "Menghapus..." : "Ya, Hapus" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.payment-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  color: #332b25;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 25px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: #a34a20;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
}

.page-header h2 {
  margin: 0;
  font-size: 25px;
  letter-spacing: -0.7px;
}

.page-header p {
  max-width: 620px;
  margin: 9px 0 0;
  color: #938579;
  font-size: 13px;
  line-height: 1.7;
}

.refresh-button,
.add-button,
.outline-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.refresh-button {
  padding: 10px 13px;
  border: 1px solid #e8ddd3;
  background: white;
  color: #725e50;
}

.refresh-button:hover {
  border-color: #a34319;
  color: #943c14;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
  margin-bottom: 20px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 17px;
  border: 1px solid #eee5dc;
  border-radius: 12px;
  background: white;
}

.summary-icon,
.section-icon,
.type-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  background: #f9eee8;
  color: #a34319;
}

.summary-icon {
  width: 43px;
  height: 43px;
}

.summary-icon.green {
  background: #edf5ed;
  color: #56845a;
}

.summary-icon.purple {
  background: #f1edfa;
  color: #7861a8;
}

.summary-icon.orange {
  background: #fff2e4;
  color: #b46a26;
}

.summary-card span,
.summary-card strong {
  display: block;
}

.summary-card span {
  color: #948579;
  font-size: 11px;
}

.summary-card strong {
  margin-top: 5px;
  font-size: 22px;
}

.information-box {
  display: flex;
  gap: 12px;
  margin-bottom: 25px;
  padding: 15px;
  border: 1px solid #f0dfc9;
  border-radius: 10px;
  background: #fffaf2;
}

.information-icon {
  color: #b47737;
}

.information-box strong {
  font-size: 12px;
}

.information-box p {
  margin: 5px 0 0;
  color: #8e7d6c;
  font-size: 11px;
  line-height: 1.7;
}

.method-section {
  margin-bottom: 24px;
  padding: 22px;
  border: 1px solid #eae2d9;
  border-radius: 14px;
  background: white;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-icon {
  width: 43px;
  height: 43px;
}

.qris-icon {
  background: #f7eee8;
  color: #a34319;
}

.bank-icon {
  background: #edf3ed;
  color: #5b795d;
}

.section-title h3 {
  margin: 0;
  font-size: 15px;
}

.section-title p {
  margin: 5px 0 0;
  color: #97897d;
  font-size: 11px;
}

.add-button {
  padding: 10px 14px;
  border: 1px solid #943c14;
  background: #943c14;
  color: white;
}

.add-button:hover {
  background: #7e3010;
}

.method-grid,
.bank-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.method-card,
.bank-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #eee5dc;
  border-radius: 11px;
  background: #fffdfa;
}

.method-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px;
}

.method-name {
  display: flex;
  align-items: center;
  place-items: center;
  gap: 10px;
  min-width: 0;
}

.type-icon {
  width: 36px;
  height: 36px;
}

.method-name strong,
.method-name span {
  display: block;
}

.method-name strong {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.method-name div > span {
  margin-top: 4px;
  color: #9c8c7e;
  font-size: 10px;
}

.status-badge {
  flex-shrink: 0;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}

.status-badge.active {
  background: #eaf4e9;
  color: #4d7d4d;
}

.status-badge.inactive {
  background: #f1efec;
  color: #887e75;
}

.qris-preview {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  padding: 15px;
  border-top: 1px solid #f0eae4;
  border-bottom: 1px solid #f0eae4;
  background: #faf8f4;
}

.qris-preview img {
  display: block;
  width: 100%;
  max-width: 220px;
  max-height: 250px;
  object-fit: contain;
}

.no-image {
  display: grid;
  justify-items: center;
  gap: 8px;
  color: #a99b8f;
  font-size: 11px;
}

.method-card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 11px;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #786b60;
  font-size: 10px;
  cursor: pointer;
}

.action-button:hover {
  background: #f7eee8;
  color: #943c14;
}

.action-button.danger {
  color: #b34c40;
}

.bank-card {
  padding: 17px;
}

.bank-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bank-logo {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 10px;
  background: #edf3ed;
  color: #5b795d;
}

.bank-label {
  display: block;
  margin-top: 19px;
  color: #928579;
  font-size: 11px;
  font-weight: 700;
}

.account-number {
  display: block;
  margin-top: 7px;
  font-size: 21px;
  letter-spacing: 1px;
  overflow-wrap: anywhere;
}

.account-holder {
  display: block;
  margin-top: 6px;
  color: #817469;
  font-size: 11px;
}

.bank-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid #eee8e1;
  color: #a08e80;
  font-size: 10px;
}

.card-actions {
  display: flex;
  gap: 5px;
}

.icon-action {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: #f7f3ee;
  color: #75695e;
  cursor: pointer;
}

.icon-action:hover {
  background: #f8eae1;
  color: #943c14;
}

.icon-action.danger {
  color: #b34c40;
}

.empty-method {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 35px 15px;
  border: 1px dashed #e8ddd2;
  border-radius: 10px;
  text-align: center;
}

.empty-icon {
  display: grid;
  width: 55px;
  height: 55px;
  place-items: center;
  border-radius: 50%;
  background: #f8eee8;
  color: #a34319;
}

.empty-method strong {
  margin-top: 13px;
  font-size: 13px;
}

.empty-method p {
  max-width: 350px;
  margin: 7px 0 15px;
  color: #998b7f;
  font-size: 11px;
  line-height: 1.6;
}

.outline-button {
  padding: 9px 13px;
  border: 1px solid #d9b9a7;
  background: white;
  color: #943c14;
}

.outline-button:hover {
  background: #fbf1eb;
}

.loading-state {
  display: grid;
  min-height: 280px;
  align-content: center;
  justify-items: center;
  gap: 12px;
  color: #a34319;
}

.loading-state p {
  color: #938579;
  font-size: 12px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* TOAST */

.toast-message {
  position: fixed;
  z-index: 3000;
  top: 20px;
  right: 22px;
  display: flex;
  max-width: min(420px, calc(100vw - 30px));
  align-items: center;
  gap: 10px;
  padding: 13px 15px;
  border: 1px solid #dce9d9;
  border-radius: 10px;
  background: white;
  box-shadow: 0 8px 30px #332b2518;
  color: #47764a;
  font-size: 12px;
}

.toast-message.error {
  border-color: #f0d5d0;
  color: #b34c40;
}

.toast-message button {
  display: grid;
  place-items: center;
  margin-left: auto;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

/* MODAL */

.modal-overlay {
  position: fixed;
  z-index: 2500;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 20px;
  background: #21181180;
  backdrop-filter: blur(3px);
}

.modal-card,
.confirm-card {
  width: 100%;
  max-width: 510px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  border-radius: 15px;
  background: white;
  box-shadow: 0 20px 70px #0002;
}

.modal-card {
  padding: 23px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 22px;
}

.modal-eyebrow {
  color: #a34319;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

.modal-header h3 {
  margin: 7px 0 0;
  font-size: 18px;
}

.close-button {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: #f7f3ef;
  color: #786b60;
  cursor: pointer;
}

.form-group {
  display: grid;
  gap: 8px;
  margin-bottom: 17px;
}

.form-group label {
  color: #51453b;
  font-size: 11px;
  font-weight: 700;
}

.form-group input,
.form-group select {
  width: 100%;
  min-height: 43px;
  padding: 10px 12px;
  border: 1px solid #e7ddd3;
  border-radius: 8px;
  outline: none;
  background: white;
  color: #332b25;
  font-family: inherit;
  font-size: 12px;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #a34319;
  box-shadow: 0 0 0 3px #a3431912;
}

.form-group small {
  color: #9a8c80;
  font-size: 10px;
}

.type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.type-selector button {
  display: flex;
  min-height: 55px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #e9dfd5;
  border-radius: 9px;
  background: white;
  color: #827469;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.type-selector button.selected {
  border-color: #a34319;
  background: #fbf1eb;
  color: #943c14;
}

.type-selector button:disabled {
  cursor: not-allowed;
  opacity: 0.85;
}

.upload-area {
  padding: 12px;
  border: 1px dashed #ddcabc;
  border-radius: 10px;
  background: #fdfbf8;
}

.upload-area input {
  display: none;
}

.upload-placeholder {
  display: flex;
  width: 100%;
  min-height: 145px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: #a34319;
  cursor: pointer;
}

.upload-placeholder strong {
  font-size: 12px;
}

.upload-placeholder span {
  color: #9c8e82;
  font-size: 10px;
}

.image-preview {
  position: relative;
  display: flex;
  min-height: 160px;
  justify-content: center;
  padding: 10px;
}

.image-preview img {
  max-width: 100%;
  max-height: 220px;
  object-fit: contain;
}

.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #943c14;
  color: white;
  cursor: pointer;
}

.change-image-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 9px;
  border: 0;
  border-top: 1px solid #eee4da;
  background: transparent;
  color: #943c14;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.active-toggle {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 20px;
  cursor: pointer;
}

.active-toggle input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.toggle-visual {
  position: relative;
  width: 37px;
  height: 21px;
  flex-shrink: 0;
  border-radius: 20px;
  background: #d8d1ca;
  transition: 0.2s;
}

.toggle-visual::after {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: white;
  content: "";
  transition: 0.2s;
}

.active-toggle input:checked + .toggle-visual {
  background: #62875e;
}

.active-toggle input:checked + .toggle-visual::after {
  transform: translateX(16px);
}

.active-toggle strong,
.active-toggle small {
  display: block;
}

.active-toggle strong {
  font-size: 11px;
}

.active-toggle small {
  margin-top: 4px;
  color: #998b7f;
  font-size: 10px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 24px;
}

.cancel-button,
.save-button,
.delete-button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 15px;
  border-radius: 8px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #e7ddd3;
  background: white;
  color: #776b60;
}

.save-button {
  border: 1px solid #943c14;
  background: #943c14;
  color: white;
}

.delete-button {
  border: 1px solid #b34c40;
  background: #b34c40;
  color: white;
}

.cancel-button:disabled,
.save-button:disabled,
.delete-button:disabled,
.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.confirm-card {
  max-width: 390px;
  padding: 25px;
  text-align: center;
}

.confirm-icon {
  display: grid;
  width: 55px;
  height: 55px;
  place-items: center;
  margin: 0 auto 15px;
  border-radius: 50%;
  background: #fff0ed;
  color: #b34c40;
}

.confirm-card h3 {
  margin: 0;
  font-size: 17px;
}

.confirm-card p {
  margin: 10px 0 0;
  color: #8f8176;
  font-size: 11px;
  line-height: 1.7;
}

.confirm-card .modal-actions {
  justify-content: center;
}

.toast-enter-active,
.toast-leave-active,
.modal-enter-active,
.modal-leave-active {
  transition: 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .page-header {
    flex-direction: column;
  }

  .refresh-button {
    align-self: flex-start;
  }

  .method-section {
    padding: 15px;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .method-grid,
  .bank-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .summary-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .summary-card {
    gap: 8px;
    padding: 11px;
  }

  .summary-icon {
    width: 35px;
    height: 35px;
  }

  .summary-card strong {
    font-size: 18px;
  }

  .modal-card {
    padding: 17px;
  }

  .type-selector {
    grid-template-columns: 1fr;
  }
}
</style>
