<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  ImagePlus,
  X,
  Save,
  LoaderCircle,
  Package,
  AlertCircle,
} from "lucide-vue-next";

import { useProductStore } from "../stores/product.js";
import AppToast from "../components/ui/AppToast.vue";

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();

const isEditMode = computed(() => Boolean(route.params.id));

const isLoadingProduct = ref(false);
const isSubmitting = ref(false);

const productStatus = ref("");
const rejectionNote = ref("");

const hasRejectionNotice = computed(
  () => isEditMode.value && productStatus.value === "rejected",
);

const rejectionMessage = computed(() => {
  return (
    rejectionNote.value?.trim() ||
    "Produk ini ditolak oleh admin. Silakan periksa kembali informasi dan foto produk sebelum mengajukan ulang."
  );
});

const selectedFiles = ref([]);
const previews = ref([]);
const existingImages = ref([]);

const toast = ref({
  visible: false,
  type: "success",
  title: "",
  message: "",
});

let toastResetTimer = null;

function showToast(type, title, message = "") {
  clearTimeout(toastResetTimer);

  toast.value.visible = false;

  toastResetTimer = setTimeout(() => {
    toast.value = {
      visible: true,
      type,
      title,
      message,
    };
  }, 30);
}

const categories = [
  "Kerajinan Kayu",
  "Anyaman",
  "Keramik",
  "Tekstil",
  "Perhiasan",
  "Dekorasi",
  "Lukisan",
  "Lainnya",
];

const form = ref({
  name: "",
  category: "",
  description: "",
  price: "",
  stock: "",
  weight_grams: "",
});

const totalImages = computed(
  () => existingImages.value.length + selectedFiles.value.length,
);

const canAddMoreImages = computed(() => totalImages.value < 5);

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function clearPreviews() {
  previews.value.forEach((url) => {
    URL.revokeObjectURL(url);
  });

  previews.value = [];
  selectedFiles.value = [];
}

function handleFileSelection(event) {
  const files = Array.from(event.target.files || []);

  event.target.value = "";

  if (files.length === 0) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  const maxSize = 5 * 1024 * 1024;
  const availableSlots = 5 - totalImages.value;

  if (availableSlots <= 0) {
    showToast(
      "error",
      "Batas foto tercapai",
      "Satu produk maksimal memiliki 5 foto.",
    );
    return;
  }

  const validFiles = [];

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      showToast(
        "error",
        "Format foto tidak didukung",
        "Gunakan format JPG, PNG, atau WEBP.",
      );
      continue;
    }

    if (file.size > maxSize) {
      showToast(
        "error",
        "Ukuran foto terlalu besar",
        `${file.name} melebihi batas 5 MB.`,
      );
      continue;
    }

    if (validFiles.length >= availableSlots) {
      showToast(
        "info",
        "Batas foto tercapai",
        "Maksimal 5 foto untuk setiap produk.",
      );
      break;
    }

    validFiles.push(file);
  }

  validFiles.forEach((file) => {
    selectedFiles.value.push(file);
    previews.value.push(URL.createObjectURL(file));
  });
}

function removeSelectedImage(index) {
  URL.revokeObjectURL(previews.value[index]);

  previews.value.splice(index, 1);
  selectedFiles.value.splice(index, 1);
}

async function removeExistingImage(image) {
  if (!window.confirm("Apakah kamu yakin ingin menghapus foto ini?")) {
    return;
  }

  try {
    await productStore.deleteProductImage(image.id);

    existingImages.value = existingImages.value.filter(
      (item) => item.id !== image.id,
    );

    showToast("success", "Foto berhasil dihapus", "Foto produk sudah dihapus.");
  } catch (error) {
    showToast(
      "error",
      "Gagal menghapus foto",
      error.message || "Terjadi kesalahan saat menghapus foto.",
    );
  }
}

function validateForm() {
  if (form.value.name.trim().length < 3) {
    return "Nama produk minimal 3 karakter.";
  }

  if (!form.value.category) {
    return "Silakan pilih kategori produk.";
  }

  if (form.value.description.trim().length < 10) {
    return "Deskripsi produk minimal 10 karakter.";
  }

  if (form.value.price === "" || Number(form.value.price) <= 0) {
    return "Harga produk harus lebih dari 0.";
  }

  if (
    form.value.stock === "" ||
    Number(form.value.stock) < 0 ||
    !Number.isInteger(Number(form.value.stock))
  ) {
    return "Stok harus berupa bilangan bulat dan tidak boleh negatif.";
  }

  if (
    form.value.weight_grams === "" ||
    Number(form.value.weight_grams) < 0 ||
    !Number.isInteger(Number(form.value.weight_grams))
  ) {
    return "Berat harus berupa bilangan bulat dan tidak boleh negatif.";
  }

  if (totalImages.value > 5) {
    return "Maksimal 5 foto untuk setiap produk.";
  }

  if (!isEditMode.value && totalImages.value < 1) {
    return "Tambahkan minimal 1 foto produk.";
  }

  return "";
}

async function loadProduct() {
  if (!isEditMode.value) return;

  isLoadingProduct.value = true;

  try {
    const product = await productStore.fetchProductById(route.params.id);

    if (!product) {
      throw new Error("Produk tidak ditemukan.");
    }

    productStatus.value = product.status || "";
    rejectionNote.value = product.rejection_note || "";

    form.value = {
      name: product.name || "",
      category: product.category || "",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      weight_grams: product.weight_grams ?? "",
    };

    existingImages.value = product.product_images || [];
  } catch (error) {
    showToast(
      "error",
      "Gagal memuat produk",
      error.message || "Gagal memuat data produk.",
    );
  } finally {
    isLoadingProduct.value = false;
  }
}

async function submitForm() {
  const validationMessage = validateForm();

  if (validationMessage) {
    showToast("error", "Periksa kembali data produk", validationMessage);
    return;
  }

  isSubmitting.value = true;

  try {
    const payload = {
      name: form.value.name.trim(),
      category: form.value.category,
      description: form.value.description.trim(),
      price: Number(form.value.price),
      stock: Number(form.value.stock),
      weight_grams: Number(form.value.weight_grams),
    };

    let productId;

    if (isEditMode.value) {
      await productStore.updateProduct(route.params.id, payload);

      productId = route.params.id;
    } else {
      const createdProduct = await productStore.createProduct(payload);

      productId = createdProduct?.id || productStore.currentProduct?.id;
    }

    if (!productId) {
      throw new Error("Produk tersimpan, tetapi ID produk tidak ditemukan.");
    }

    if (selectedFiles.value.length > 0) {
      await productStore.uploadProductImages(productId, selectedFiles.value);
    }

    await productStore.fetchMyProducts();

    clearPreviews();

    await router.push({
      name: "seller-products",
      query: {
        toast: isEditMode.value ? "updated" : "created",
      },
    });
  } catch (error) {
    showToast(
      "error",
      "Gagal menyimpan produk",
      error.message || "Terjadi kesalahan saat menyimpan produk.",
    );
  } finally {
    isSubmitting.value = false;
  }
}

function goBack() {
  router.push({ name: "seller-products" });
}

onMounted(() => {
  loadProduct();
});

onBeforeUnmount(() => {
  clearPreviews();
  clearTimeout(toastResetTimer);
});
</script>

<template>
  <div class="product-form-page">
    <AppToast
      v-model="toast.visible"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
    />

    <button class="back-button" @click="goBack">
      <ArrowLeft :size="17" />
      Kembali ke Produk
    </button>

    <div class="page-heading">
      <div>
        <span class="eyebrow">MANAJEMEN PRODUK</span>

        <h1>
          {{ isEditMode ? "Edit Produk" : "Tambah Produk" }}
        </h1>

        <p>
          {{
            isEditMode
              ? "Perbarui informasi produk kerajinanmu."
              : "Tambahkan produk kerajinan baru ke tokomu."
          }}
        </p>
      </div>
    </div>

    <div v-if="hasRejectionNotice" class="rejection-notice">
      <div class="rejection-icon">
        <AlertCircle :size="21" />
      </div>

      <div class="rejection-content">
        <h3>Produk Ditolak oleh Admin</h3>

        <p class="rejection-label">Alasan penolakan</p>

        <div class="rejection-message">
          {{ rejectionMessage }}
        </div>

        <p class="rejection-instruction">
          Silakan perbaiki informasi atau foto produk sesuai catatan di atas.
          Setelah selesai, ajukan kembali produk untuk diperiksa oleh admin.
        </p>
      </div>
    </div>

    <div v-if="isLoadingProduct" class="loading-state">
      <LoaderCircle :size="28" class="spinning" />
      <p>Memuat informasi produk...</p>
    </div>

    <form v-else class="product-form" @submit.prevent="submitForm">
      <div class="form-main">
        <section class="form-card">
          <div class="section-heading">
            <div>
              <h2>Informasi Produk</h2>
              <p>Informasi utama produk yang akan ditampilkan.</p>
            </div>
            <Package :size="21" />
          </div>

          <div class="form-group">
            <label for="product-name"> Nama Produk <span>*</span> </label>

            <input
              id="product-name"
              v-model="form.name"
              type="text"
              maxlength="150"
              placeholder="Contoh: Patung Garuda Ukiran Kayu"
            />

            <small>Gunakan nama yang jelas dan mudah dipahami.</small>
          </div>

          <div class="form-group">
            <label for="product-category"> Kategori <span>*</span> </label>

            <select id="product-category" v-model="form.category">
              <option value="" disabled>Pilih kategori produk</option>

              <option
                v-for="category in categories"
                :key="category"
                :value="category"
              >
                {{ category }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="product-description">
              Deskripsi Produk <span>*</span>
            </label>

            <textarea
              id="product-description"
              v-model="form.description"
              rows="6"
              maxlength="10000"
              placeholder="Jelaskan bahan, ukuran, teknik pembuatan, keunikan, dan informasi lainnya..."
            />

            <small>
              Minimal 10 karakter. Jelaskan keunikan produk agar pembeli lebih
              tertarik.
            </small>
          </div>
        </section>

        <section class="form-card">
          <div class="section-heading">
            <div>
              <h2>Harga dan Persediaan</h2>
              <p>Atur harga jual dan jumlah stok produk.</p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="product-price">
                Harga Produk (Rp) <span>*</span>
              </label>

              <input
                id="product-price"
                v-model="form.price"
                type="number"
                min="1"
                placeholder="Contoh: 450000"
              />

              <small>
                Preview:
                {{ formatCurrency(form.price) }}
              </small>
            </div>

            <div class="form-group">
              <label for="product-stock"> Stok Produk <span>*</span> </label>

              <input
                id="product-stock"
                v-model="form.stock"
                type="number"
                min="0"
                step="1"
                placeholder="Contoh: 10"
              />

              <small>Jumlah produk yang tersedia.</small>
            </div>

            <div class="form-group">
              <label for="product-weight">
                Berat Produk (gram) <span>*</span>
              </label>

              <input
                id="product-weight"
                v-model="form.weight_grams"
                type="number"
                min="0"
                step="1"
                placeholder="Contoh: 500"
              />

              <small>
                Digunakan untuk perhitungan ongkos kirim nantinya.
              </small>
            </div>
          </div>
        </section>

        <section class="form-card">
          <div class="section-heading">
            <div>
              <h2>Foto Produk</h2>
              <p>
                Tambahkan foto produk agar pembeli dapat melihat detail
                kerajinan.
              </p>
            </div>

            <ImagePlus :size="21" />
          </div>

          <div class="image-upload-area">
            <label
              v-if="canAddMoreImages"
              class="upload-box"
              for="product-images"
            >
              <ImagePlus :size="28" />

              <strong>Tambah Foto Produk</strong>

              <span> Klik untuk memilih foto dari perangkatmu. </span>

              <small>JPG, PNG, WEBP · Maksimal 5 MB per foto</small>
            </label>

            <div v-else class="upload-limit">
              Batas 5 foto produk sudah tercapai.
            </div>

            <input
              id="product-images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              :disabled="!canAddMoreImages"
              @change="handleFileSelection"
            />

            <div
              v-if="existingImages.length || previews.length"
              class="image-preview-grid"
            >
              <div
                v-for="image in existingImages"
                :key="image.id"
                class="image-preview"
              >
                <img :src="image.image_url" alt="Foto produk" />

                <button
                  type="button"
                  aria-label="Hapus foto"
                  @click="removeExistingImage(image)"
                >
                  <X :size="15" />
                </button>

                <span>Foto tersimpan</span>
              </div>

              <div
                v-for="(preview, index) in previews"
                :key="preview"
                class="image-preview"
              >
                <img :src="preview" alt="Preview foto produk" />

                <button
                  type="button"
                  aria-label="Hapus foto"
                  @click="removeSelectedImage(index)"
                >
                  <X :size="15" />
                </button>

                <span>Foto baru</span>
              </div>
            </div>

            <p class="image-counter">{{ totalImages }} dari 5 foto digunakan</p>
          </div>
        </section>
      </div>

      <aside class="form-sidebar">
        <div class="form-card publish-card">
          <h2>Informasi Penyimpanan</h2>

          <p>
            Produk baru akan disimpan sebagai draft. Kamu dapat
            mempublikasikannya setelah informasi dan foto produk sudah lengkap.
          </p>

          <div class="publish-note">
            <strong>Perhatikan sebelum menyimpan:</strong>

            <ul>
              <li>Nama dan kategori produk sudah benar.</li>
              <li>Harga dan stok sudah sesuai.</li>
              <li>Deskripsi menjelaskan produk dengan baik.</li>
              <li>Minimal satu foto untuk produk baru.</li>
            </ul>
          </div>

          <button type="submit" class="submit-button" :disabled="isSubmitting">
            <LoaderCircle v-if="isSubmitting" :size="18" class="spinning" />

            <Save v-else :size="18" />

            {{
              isSubmitting
                ? "Menyimpan..."
                : isEditMode
                  ? "Simpan Perubahan"
                  : "Simpan Produk"
            }}
          </button>

          <button
            type="button"
            class="cancel-button"
            :disabled="isSubmitting"
            @click="goBack"
          >
            Batal
          </button>
        </div>
      </aside>
    </form>
  </div>
</template>

<style scoped>
.product-form-page {
  width: 100%;
  color: #40352d;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 22px;
  padding: 0;
  border: none;
  background: transparent;
  color: #8d7868;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.back-button:hover {
  color: #943c14;
}

.page-heading {
  margin-bottom: 25px;
}

.eyebrow {
  color: #a65a37;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.page-heading h1 {
  margin: 7px 0;
  font-size: 27px;
  font-weight: 800;
  letter-spacing: -0.8px;
}

.page-heading p {
  margin: 0;
  color: #92867c;
  font-size: 12px;
}

.product-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: start;
  gap: 20px;
}

.form-main {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.form-card {
  padding: 23px;
  border: 1px solid #e9e1d8;
  border-radius: 13px;
  background: #fff;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 23px;
  color: #a65a37;
}

.section-heading h2,
.publish-card h2 {
  margin: 0 0 6px;
  color: #44382f;
  font-size: 14px;
  font-weight: 800;
}

.section-heading p {
  margin: 0;
  color: #92867c;
  font-size: 11px;
  line-height: 1.6;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 19px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  color: #594a3f;
  font-size: 11px;
  font-weight: 700;
}

.form-group label span {
  color: #b54736;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 13px;
  border: 1px solid #e7ded5;
  border-radius: 8px;
  outline: none;
  background: #fff;
  color: #44382f;
  font: inherit;
  font-size: 11px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #b87551;
}

.form-group textarea {
  resize: vertical;
  line-height: 1.7;
}

.form-group small {
  color: #a2968b;
  font-size: 10px;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 15px;
}

.image-upload-area input[type="file"] {
  display: none;
}

.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: 20px;
  border: 1.5px dashed #d8c7b8;
  border-radius: 10px;
  background: #fcfaf8;
  color: #a65a37;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s;
}

.upload-box:hover {
  background: #f8eee7;
}

.upload-box strong {
  margin-top: 10px;
  color: #594a3f;
  font-size: 12px;
}

.upload-box span {
  margin-top: 5px;
  color: #92867c;
  font-size: 10px;
}

.upload-box small {
  margin-top: 10px;
  color: #a2968b;
  font-size: 9px;
}

.upload-limit {
  padding: 18px;
  border: 1px solid #e9e1d8;
  border-radius: 8px;
  background: #fcfaf8;
  color: #92867c;
  font-size: 11px;
  text-align: center;
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 17px;
}

.image-preview {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 9px;
  background: #f5eee7;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview button {
  position: absolute;
  top: 6px;
  right: 6px;
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  color: #b54736;
  cursor: pointer;
}

.image-preview span {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 6px;
  background: rgba(45, 35, 28, 0.65);
  color: white;
  font-size: 9px;
  text-align: center;
}

.image-counter {
  margin: 13px 0 0;
  color: #a2968b;
  font-size: 10px;
}

.form-sidebar {
  position: sticky;
  top: 20px;
}

.publish-card h2 {
  margin-bottom: 11px;
}

.publish-card > p {
  margin: 0;
  color: #92867c;
  font-size: 11px;
  line-height: 1.7;
}

.publish-note {
  margin: 19px 0;
  padding: 13px;
  border-radius: 9px;
  background: #f8f5f0;
}

.publish-note strong {
  color: #665346;
  font-size: 10px;
}

.publish-note ul {
  margin: 10px 0 0;
  padding-left: 16px;
  color: #8c7d70;
  font-size: 10px;
  line-height: 1.9;
}

.submit-button,
.cancel-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 42px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.submit-button {
  border: none;
  background: #943c14;
  color: white;
}

.submit-button:hover {
  background: #77300f;
}

.submit-button:disabled,
.cancel-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-button {
  margin-top: 9px;
  border: 1px solid #e7ded5;
  background: white;
  color: #79695d;
}

.cancel-button:hover {
  background: #fcfaf8;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #a65a37;
}

.loading-state p {
  color: #92867c;
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

@media (max-width: 900px) {
  .product-form {
    grid-template-columns: 1fr;
  }

  .form-sidebar {
    position: static;
  }
}

@media (max-width: 600px) {
  .page-heading h1 {
    font-size: 23px;
  }

  .form-card {
    padding: 17px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .image-preview-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.rejection-notice {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  margin-bottom: 20px;
  padding: 17px 19px;
  border: 1px solid #efd2c4;
  border-radius: 11px;
  background: #fff8f4;
}

.rejection-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: #fbe8df;
  color: #b64c2c;
}

.rejection-content {
  flex: 1;
  min-width: 0;
}

.rejection-content h3 {
  margin: 1px 0 12px;
  color: #a54125;
  font-size: 13px;
  font-weight: 800;
}

.rejection-label {
  margin: 0 0 7px;
  color: #8c6d5c;
  font-size: 10px;
  font-weight: 700;
}

.rejection-message {
  padding: 12px 13px;
  border: 1px solid #f0ddd3;
  border-radius: 8px;
  background: #fff;
  color: #5c473b;
  font-size: 11px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.rejection-instruction {
  margin: 10px 0 0;
  color: #986b55;
  font-size: 10px;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .rejection-notice {
    padding: 14px;
  }
}
</style>
