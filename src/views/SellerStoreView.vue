<script setup>
import { computed, onMounted, reactive, ref, watch, onBeforeUnmount } from "vue";
import {
  Store,
  MapPin,
  Phone,
  Save,
  LoaderCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-vue-next";
import { useAuthStore } from "../stores/auth.js";
import { useSellerStore } from "../stores/sellerStore.js";

const authStore = useAuthStore();
const sellerStore = useSellerStore();

const categories = [
  "Kerajinan Kayu",
  "Tenun & Tekstil",
  "Keramik",
  "Aksesori",
  "Dekorasi Rumah",
  "Anyaman",
  "Kerajinan Perak",
  "Kerajinan Batu",
  "Produk Kreatif Lainnya",
];

const form = reactive({
  store_name: "",
  category: "",
  description: "",
  contact_phone: "",
  province: "Bali",
  city: "",
  district: "",
  postal_code: "",
  address: "",
});

const successMessage = ref("");
const errorMessage = ref("");

const isPending = computed(
  () => authStore.profile?.account_status === "pending",
);

const isActive = computed(() => authStore.profile?.account_status === "active");

const isRejected = computed(
  () => authStore.profile?.account_status === "rejected",
);

const isSuspended = computed(
  () => authStore.profile?.account_status === "suspended",
);

// Akun suspended tidak boleh mengubah profil.
// Akun rejected tetap boleh memperbaiki pengajuan.
const isRestricted = isSuspended;

const isEditing = computed(() => sellerStore.hasStore);

const fillForm = (data) => {
  if (!data) return;

  Object.keys(form).forEach((key) => {
    form[key] = data[key] ?? "";
  });

  logoPreview.value = data.logo_url || "";
  bannerPreview.value = data.banner_url || "";
};

const applicationToast = ref({
  visible: false,
  type: "success",
  message: "",
});

let applicationToastTimer = null;

function showApplicationToast(message, type = "success") {
  // Hentikan timer sebelumnya jika ada toast baru.
  if (applicationToastTimer) {
    window.clearTimeout(applicationToastTimer);
  }

  applicationToast.value = {
    visible: true,
    type,
    message,
  };

  // Toast menghilang otomatis setelah 3,5 detik.
  applicationToastTimer = window.setTimeout(() => {
    applicationToast.value.visible = false;
    applicationToastTimer = null;
  }, 3500);
}

function closeApplicationToast() {
  if (applicationToastTimer) {
    window.clearTimeout(applicationToastTimer);
    applicationToastTimer = null;
  }

  applicationToast.value.visible = false;
}

// Bersihkan timer ketika halaman ditinggalkan.
onBeforeUnmount(() => {
  if (applicationToastTimer) {
    window.clearTimeout(applicationToastTimer);
  }
});

async function resubmitApplication() {
  if (sellerStore.saving) return;

  // Pastikan profil toko sudah disimpan.
  const store = sellerStore.profile;

  if (
    !store?.store_name?.trim() ||
    !store?.category?.trim() ||
    !store?.address?.trim()
  ) {
    showApplicationToast(
      "Lengkapi dan simpan nama toko, kategori, serta alamat terlebih dahulu.",
      "error",
    );
    return;
  }

  try {
    const result = await sellerStore.resubmitApplication();

    // Perbarui status lokal agar tampilan langsung berubah.
    if (authStore.profile) {
      authStore.profile.account_status = "pending";
    }

    if (sellerStore.profile) {
      sellerStore.profile.verification_note = null;
    }

    showApplicationToast(
      result?.message ||
        "Pengajuan ulang berhasil dikirim. Silakan tunggu pemeriksaan admin.",
      "success",
    );
  } catch (error) {
    console.error("Gagal mengajukan ulang:", error);

    showApplicationToast(
      error.message || "Pengajuan ulang gagal. Silakan coba kembali.",
      "error",
    );
  }
}

const loadStore = async () => {
  try {
    const data = await sellerStore.fetchMyStore();
    fillForm(data);
  } catch (error) {
    errorMessage.value = error.message;
  }
};

const saveStore = async () => {
  successMessage.value = "";
  errorMessage.value = "";

  if (isRestricted.value) {
    errorMessage.value =
      "Akun Anda sedang dibatasi. Hubungi Super Admin untuk informasi lebih lanjut.";
    return;
  }

  if (!form.store_name.trim()) {
    errorMessage.value = "Nama toko wajib diisi.";
    return;
  }

  if (!form.category) {
    errorMessage.value = "Pilih kategori usaha terlebih dahulu.";
    return;
  }

  if (!form.address.trim() || form.address.trim().length < 5) {
    errorMessage.value = "Alamat usaha minimal 5 karakter.";
    return;
  }

  try {
    const wasEditing = sellerStore.hasStore;

    await sellerStore.saveStore(form);

    successMessage.value = wasEditing
      ? "Informasi toko berhasil diperbarui."
      : "Profil toko berhasil dibuat.";
  } catch (error) {
    errorMessage.value = error.message || "Gagal menyimpan profil toko.";
  }
};

const logoInput = ref(null);
const bannerInput = ref(null);

const logoPreview = ref("");
const bannerPreview = ref("");

const handleImageUpload = async (type, event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  successMessage.value = "";
  errorMessage.value = "";

  const previewUrl = URL.createObjectURL(file);

  if (type === "logo") {
    if (logoPreview.value.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview.value);
    }

    logoPreview.value = previewUrl;
  } else {
    if (bannerPreview.value.startsWith("blob:")) {
      URL.revokeObjectURL(bannerPreview.value);
    }

    bannerPreview.value = previewUrl;
  }

  try {
    const data = await sellerStore.uploadStoreImage(type, file);

    if (type === "logo") {
      logoPreview.value = data.logo_url || "";
    } else {
      bannerPreview.value = data.banner_url || "";
    }

    successMessage.value = `${type === "logo" ? "Logo" : "Banner"} toko berhasil diunggah.`;
  } catch (error) {
    errorMessage.value = error.message || "Gagal mengunggah gambar.";

    if (type === "logo") {
      logoPreview.value = sellerStore.profile?.logo_url || "";
    } else {
      bannerPreview.value = sellerStore.profile?.banner_url || "";
    }
  } finally {
    event.target.value = "";
  }
};

onMounted(loadStore);
</script>

<template>
  <section class="store-page">
    <Transition name="toast">
      <div
        v-if="applicationToast.visible"
        class="application-toast"
        :class="`toast-${applicationToast.type}`"
        role="status"
      >
        <div class="application-toast-icon">
          <span v-if="applicationToast.type === 'success'">✓</span>
          <span v-else>!</span>
        </div>

        <div class="application-toast-content">
          <strong>
            {{
              applicationToast.type === "success"
                ? "Berhasil"
                : "Perlu diperiksa"
            }}
          </strong>

          <p>{{ applicationToast.message }}</p>
        </div>

        <button
          type="button"
          class="application-toast-close"
          aria-label="Tutup notifikasi"
          @click="closeApplicationToast"
        >
          ×
        </button>
      </div>
    </Transition>

    <div class="page-heading">
      <div>
        <span class="eyebrow">SELLER CENTER</span>
        <h2>Profil Toko</h2>
        <p>Perkenalkan usaha dan karya lokal Anda kepada pembeli KriyaLoka.</p>
      </div>

      <div class="store-icon">
        <Store :size="23" />
      </div>
    </div>

    <div v-if="isPending" class="status-notice pending">
      <span class="notice-icon">
        <LoaderCircle :size="19" />
      </span>
      <div>
        <strong>Akun sedang menunggu verifikasi</strong>
        <p>
          Lengkapi profil usaha Anda. Super Admin akan memeriksa informasi ini
          sebelum mengaktifkan akun penjual.
        </p>
      </div>
    </div>

    <div v-else-if="isActive" class="status-notice active">
      <CheckCircle2 :size="20" />
      <div>
        <strong>Toko Anda telah aktif</strong>
        <p>Informasi toko dapat diperbarui melalui halaman ini.</p>
      </div>
    </div>

    <div v-if="isRestricted" class="status-notice restricted">
      <div>
        <strong>Akun sedang dibatasi</strong>
        <p>
          Anda belum dapat mengubah informasi toko. Hubungi administrator
          KriyaLoka.
        </p>
      </div>
    </div>
    <div
      v-if="isRejected && sellerStore.profile?.verification_note"
      class="rejection-notice"
    >
      <div class="rejection-notice-icon">
        <AlertTriangle :size="22" />
      </div>

      <div class="rejection-notice-content">
        <strong>Pengajuan toko belum disetujui</strong>

        <p>Admin memberikan catatan berikut sebagai alasan penolakan:</p>

        <blockquote>
          {{ sellerStore.profile.verification_note }}
        </blockquote>

        <small>
          Silakan perbaiki informasi toko sesuai catatan admin, kemudian simpan
          perubahan untuk persiapan pengajuan ulang.
        </small>
      </div>
    </div>

    <div v-else-if="isRejected" class="rejection-notice">
      <div class="rejection-notice-icon">
        <AlertTriangle :size="22" />
      </div>

      <div class="rejection-notice-content">
        <strong>Pengajuan toko ditolak</strong>
        <p>Silakan periksa kembali dan lengkapi informasi profil toko.</p>
      </div>
    </div>

    <form class="store-form" @submit.prevent="saveStore">
      <section class="form-section">
        <div class="form-section-heading">
          <Store :size="19" />
          <div>
            <h3>Identitas Visual Toko</h3>
            <p>Gunakan gambar yang mewakili karakter usaha Anda.</p>
          </div>
        </div>

        <div class="image-upload-grid">
          <div class="image-upload-item">
            <span class="upload-label">Logo Toko</span>

            <div class="logo-preview">
              <img
                v-if="logoPreview"
                :src="logoPreview"
                alt="Preview logo toko"
              />

              <Store v-else :size="35" />
            </div>

            <input
              ref="logoInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              :disabled="isRestricted || sellerStore.saving"
              @change="handleImageUpload('logo', $event)"
            />

            <button
              type="button"
              class="upload-button"
              :disabled="isRestricted || sellerStore.saving"
              @click="logoInput?.click()"
            >
              {{ logoPreview ? "Ganti Logo" : "Upload Logo" }}
            </button>

            <small>Format JPG, PNG, WEBP · Maks. 2 MB</small>
          </div>

          <div class="image-upload-item banner-upload-item">
            <span class="upload-label">Banner Toko</span>

            <div class="banner-preview">
              <img
                v-if="bannerPreview"
                :src="bannerPreview"
                alt="Preview banner toko"
              />

              <div v-else class="banner-empty">
                <Store :size="28" />
                <span>Preview Banner Toko</span>
              </div>
            </div>

            <input
              ref="bannerInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              :disabled="isRestricted || sellerStore.saving"
              @change="handleImageUpload('banner', $event)"
            />

            <button
              type="button"
              class="upload-button"
              :disabled="isRestricted || sellerStore.saving"
              @click="bannerInput?.click()"
            >
              {{ bannerPreview ? "Ganti Banner" : "Upload Banner" }}
            </button>

            <small>Disarankan rasio 3:1 · Maks. 2 MB</small>
          </div>
        </div>

        <p v-if="!sellerStore.hasStore" class="upload-hint">
          Logo dan banner dapat diunggah terlebih dahulu. Pastikan identitas
          usaha dilengkapi dan disimpan sebelum mengajukan verifikasi.
        </p>
      </section>

      <section class="form-section">
        <div class="form-section-heading">
          <Store :size="19" />
          <div>
            <h3>Identitas Usaha</h3>
            <p>Informasi utama mengenai toko Anda.</p>
          </div>
        </div>

        <div class="form-grid">
          <label class="field full">
            <span>Nama Toko <b>*</b></span>
            <input
              v-model="form.store_name"
              type="text"
              placeholder="Contoh: Bali Woven Craft"
              maxlength="100"
              required
              :disabled="isRestricted"
            />
          </label>

          <label class="field">
            <span>Kategori Usaha <b>*</b></span>
            <select v-model="form.category" required :disabled="isRestricted">
              <option value="" disabled>Pilih kategori</option>
              <option
                v-for="category in categories"
                :key="category"
                :value="category"
              >
                {{ category }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Nomor Telepon Toko</span>
            <div class="input-with-icon">
              <Phone :size="17" />
              <input
                v-model="form.contact_phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                maxlength="25"
                :disabled="isRestricted"
              />
            </div>
          </label>

          <label class="field full">
            <span>Deskripsi Usaha</span>
            <textarea
              v-model="form.description"
              rows="5"
              maxlength="2000"
              placeholder="Ceritakan usaha, proses produksi, keunikan, dan karya yang Anda hasilkan..."
              :disabled="isRestricted"
            />
            <small>{{ form.description.length }}/2000 karakter</small>
          </label>
        </div>
      </section>

      <section class="form-section">
        <div class="form-section-heading">
          <MapPin :size="19" />
          <div>
            <h3>Lokasi Usaha</h3>
            <p>Berikan informasi lokasi agar pembeli mengenal asal produk.</p>
          </div>
        </div>

        <div class="form-grid">
          <label class="field">
            <span>Provinsi</span>
            <input
              v-model="form.province"
              type="text"
              placeholder="Bali"
              :disabled="isRestricted"
            />
          </label>

          <label class="field">
            <span>Kabupaten / Kota</span>
            <input
              v-model="form.city"
              type="text"
              placeholder="Contoh: Gianyar"
              :disabled="isRestricted"
            />
          </label>

          <label class="field">
            <span>Kecamatan</span>
            <input
              v-model="form.district"
              type="text"
              placeholder="Nama kecamatan"
              :disabled="isRestricted"
            />
          </label>

          <label class="field">
            <span>Kode Pos</span>
            <input
              v-model="form.postal_code"
              type="text"
              maxlength="10"
              placeholder="80511"
              :disabled="isRestricted"
            />
          </label>

          <label class="field full">
            <span>Alamat Lengkap <b>*</b></span>
            <textarea
              v-model="form.address"
              rows="3"
              maxlength="500"
              placeholder="Nama jalan, nomor bangunan, banjar, desa, dan petunjuk lokasi..."
              required
              :disabled="isRestricted"
            />
          </label>
        </div>
      </section>

      <div v-if="errorMessage" class="form-message error">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="form-message success">
        <CheckCircle2 :size="17" />
        {{ successMessage }}
      </div>

      <div class="form-actions">
        <span>* Wajib diisi</span>

        <button
          type="submit"
          :disabled="sellerStore.saving || sellerStore.loading || isRestricted"
        >
          <LoaderCircle v-if="sellerStore.saving" class="spinner" :size="17" />
          <Save v-else :size="17" />

          {{ sellerStore.saving ? "Menyimpan..." : "Simpan Profil Toko" }}
        </button>
      </div>

      <div v-if="isRejected" class="resubmit-section">
        <div class="resubmit-info">
          <strong>Sudah memperbaiki profil toko?</strong>
          <p>
            Simpan semua perubahan terlebih dahulu, kemudian kirim ulang
            pengajuan agar dapat diperiksa oleh Super Admin.
          </p>
        </div>

        <button
          type="button"
          class="resubmit-button"
          :disabled="sellerStore.saving || isSuspended"
          @click="resubmitApplication"
        >
          <span v-if="sellerStore.saving"> Mengirim pengajuan... </span>
          <span v-else> Ajukan Ulang Verifikasi </span>
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.store-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.eyebrow {
  color: #943c14;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.4px;
}

.page-heading h2 {
  margin: 8px 0 6px;
  font-size: 25px;
}

.page-heading p,
.form-section-heading p {
  margin: 0;
  color: #94877d;
  font-size: 12px;
  line-height: 1.7;
}

.store-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 12px;
  background: #f3e7dc;
  color: #943c14;
}

.status-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
  padding: 16px;
  border-radius: 10px;
}

.status-notice strong {
  font-size: 12px;
}

.status-notice p {
  margin: 5px 0 0;
  font-size: 11px;
  line-height: 1.7;
}

.status-notice.pending {
  border: 1px solid #f0dfb8;
  background: #fff7e5;
  color: #8b671d;
}

.status-notice.active {
  border: 1px solid #cce5d2;
  background: #edf7ef;
  color: #34754a;
}

.status-notice.restricted {
  border: 1px solid #f0d4ce;
  background: #fff0ed;
  color: #ad4938;
}

.notice-icon {
  flex-shrink: 0;
}

.store-form {
  display: grid;
  gap: 18px;
}

.form-section {
  padding: 23px;
  border: 1px solid #ece5dd;
  border-radius: 12px;
  background: #fff;
}

.form-section-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 23px;
  color: #943c14;
}

.form-section-heading h3 {
  margin: 0 0 5px;
  color: #332b25;
  font-size: 15px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 19px 16px;
}

.field {
  display: grid;
  align-content: start;
  gap: 8px;
}

.field.full {
  grid-column: 1 / -1;
}

.field > span {
  color: #51443a;
  font-size: 11px;
  font-weight: 700;
}

.field b {
  color: #b4532a;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-width: 0;
  padding: 12px;
  border: 1px solid #e8dfd6;
  border-radius: 8px;
  outline: none;
  background: #fff;
  color: #332b25;
  font: inherit;
  font-size: 12px;
}

.field input,
.field select {
  min-height: 43px;
}

.field textarea {
  resize: vertical;
  line-height: 1.7;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #b4532a;
  box-shadow: 0 0 0 3px #b4532a16;
}

.field input:disabled,
.field select:disabled,
.field textarea:disabled {
  background: #f7f5f2;
  color: #998c81;
  cursor: not-allowed;
}

.field > small {
  color: #a09388;
  font-size: 10px;
  text-align: right;
}

.input-with-icon {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-left: 11px;
  border: 1px solid #e8dfd6;
  border-radius: 8px;
  color: #a09388;
}

.input-with-icon input {
  border: 0;
  box-shadow: none !important;
}

.form-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
}

.form-message.error {
  background: #fff0ed;
  color: #ad4938;
}

.form-message.success {
  background: #edf7ef;
  color: #34754a;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 16px 0;
}

.form-actions > span {
  color: #998c81;
  font-size: 10px;
}

.form-actions button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  background: #943c14;
  color: white;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.form-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .form-section {
    padding: 17px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .field.full {
    grid-column: auto;
  }

  .page-heading h2 {
    font-size: 21px;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}

.image-upload-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 25px;
}

.image-upload-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.upload-label {
  color: #51443a;
  font-size: 11px;
  font-weight: 700;
}

.logo-preview {
  display: grid;
  width: 120px;
  height: 120px;
  place-items: center;
  overflow: hidden;
  border: 1px dashed #d9c9ba;
  border-radius: 14px;
  background: #f8f3ed;
  color: #b18d75;
}

.logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-preview {
  display: grid;
  width: 100%;
  aspect-ratio: 3 / 1;
  min-height: 100px;
  place-items: center;
  overflow: hidden;
  border: 1px dashed #d9c9ba;
  border-radius: 12px;
  background: #f8f3ed;
}

.banner-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #b18d75;
  font-size: 11px;
}

.upload-button {
  padding: 9px 14px;
  border: 1px solid #943c14;
  border-radius: 7px;
  background: white;
  color: #943c14;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.upload-button:hover:not(:disabled) {
  background: #f9eee8;
}

.upload-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-upload-item > small,
.upload-hint {
  color: #998c81;
  font-size: 10px;
  line-height: 1.6;
}

.upload-hint {
  margin: 0;
}

@media (max-width: 600px) {
  .image-upload-grid {
    grid-template-columns: 1fr;
  }
}

.rejection-notice {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 24px;
  padding: 18px;
  border: 1px solid #f0d5ca;
  border-radius: 12px;
  background: #fff6f2;
}

.rejection-notice-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 11px;
  background: #fbe7df;
  color: #ad4938;
}

.rejection-notice-content {
  min-width: 0;
}

.rejection-notice-content strong {
  display: block;
  color: #873b2c;
  font-size: 13px;
}

.rejection-notice-content p {
  margin: 7px 0;
  color: #796257;
  font-size: 12px;
  line-height: 1.6;
}

.rejection-notice-content blockquote {
  margin: 12px 0;
  padding: 12px 14px;
  border-left: 3px solid #ad4938;
  border-radius: 0 7px 7px 0;
  background: #fff;
  color: #5c453b;
  font-size: 12px;
  line-height: 1.7;
}

.rejection-notice-content small {
  display: block;
  color: #9a786b;
  font-size: 10px;
  line-height: 1.6;
}

/* Re-submit application */
.resubmit-section {
  margin-top: 28px;
  padding: 22px;
  border: 1px solid #e6ddd3;
  border-radius: 16px;
  background: #fbf7f2;
}

.resubmit-info strong {
  display: block;
  color: #38291f;
  font-size: 15px;
  margin-bottom: 7px;
}

.resubmit-info p {
  color: #82776d;
  font-size: 13px;
  line-height: 1.7;
  margin: 0 0 18px;
}

.resubmit-button {
  width: 100%;
  min-height: 46px;
  border: none;
  border-radius: 10px;
  background: #943c14;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.2s;
}

.resubmit-button:hover:not(:disabled) {
  background: #7d3210;
  transform: translateY(-1px);
}

.resubmit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Application toast */
.application-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  gap: 13px;
  width: min(420px, calc(100vw - 32px));
  padding: 17px;
  border: 1px solid #e6ddd3;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 40px rgba(44, 32, 23, 0.13);
}

.application-toast-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-weight: 800;
}

.toast-success .application-toast-icon {
  background: #e4f1e8;
  color: #2d694d;
}

.toast-error .application-toast-icon {
  background: #fbe9e5;
  color: #943c14;
}

.application-toast-content {
  flex: 1;
  min-width: 0;
}

.application-toast-content strong {
  display: block;
  margin-bottom: 5px;
  color: #38291f;
  font-size: 14px;
}

.application-toast-content p {
  margin: 0;
  color: #82776d;
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.application-toast-close {
  border: none;
  background: transparent;
  color: #998d82;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.application-toast-close:hover {
  color: #38291f;
}

/* Toast animation */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
