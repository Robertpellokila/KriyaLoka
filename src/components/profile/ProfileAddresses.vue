<script setup>
import {
  MapPin,
  Plus,
  X,
  Save,
  RefreshCw,
  Check,
  Pencil,
  Trash2,
} from "lucide-vue-next";

defineProps({
  addresses: {
    type: Array,
    default: () => [],
  },
  addressForm: {
    type: Object,
    required: true,
  },
  showAddressForm: {
    type: Boolean,
    default: false,
  },
  editingAddressId: {
    type: [String, Number, null],
    default: null,
  },
  loadingAddresses: {
    type: Boolean,
    default: false,
  },
  saving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "open-add",
  "open-edit",
  "close-form",
  "save-address",
  "set-default",
  "delete-address",
]);
</script>

<template>
  <section class="section-content">
    <div class="section-toolbar">
      <div>
        <h3>Daftar Alamat</h3>
        <p>Simpan beberapa alamat untuk memudahkan pengiriman.</p>
      </div>

      <button
        class="primary-button"
        :disabled="showAddressForm"
        @click="emit('open-add')"
      >
        <Plus :size="17" />
        Tambah Alamat
      </button>
    </div>

    <!-- ADDRESS FORM -->
    <div v-if="showAddressForm" class="panel-card address-form-card">
      <div class="panel-heading">
        <div>
          <h3>
            {{ editingAddressId ? "Edit Alamat" : "Tambah Alamat Baru" }}
          </h3>
          <p>Isi informasi alamat pengiriman dengan lengkap.</p>
        </div>

        <button
          class="close-form-button"
          type="button"
          @click="emit('close-form')"
        >
          <X :size="19" />
        </button>
      </div>

      <form class="account-form" @submit.prevent="emit('save-address')">
        <div class="form-grid">
          <div class="form-field">
            <label>Label Alamat</label>
            <select v-model="addressForm.label">
              <option value="Rumah">Rumah</option>
              <option value="Kantor">Kantor</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div class="form-field">
            <label>Nama Penerima</label>
            <input
              v-model="addressForm.recipient_name"
              type="text"
              required
              placeholder="Nama penerima"
            />
          </div>

          <div class="form-field">
            <label>Nomor Telepon</label>
            <input
              v-model="addressForm.phone_number"
              type="tel"
              required
              placeholder="Nomor telepon penerima"
            />
          </div>

          <div class="form-field">
            <label>Provinsi</label>
            <input
              v-model="addressForm.province"
              type="text"
              required
              placeholder="Contoh: Bali"
            />
          </div>

          <div class="form-field">
            <label>Kota / Kabupaten</label>
            <input
              v-model="addressForm.city"
              type="text"
              required
              placeholder="Contoh: Denpasar"
            />
          </div>

          <div class="form-field">
            <label>Kecamatan</label>
            <input
              v-model="addressForm.district"
              type="text"
              required
              placeholder="Nama kecamatan"
            />
          </div>

          <div class="form-field">
            <label>Kode Pos</label>
            <input
              v-model="addressForm.postal_code"
              type="text"
              required
              placeholder="Kode pos"
            />
          </div>

          <div class="form-field full">
            <label>Alamat Lengkap</label>
            <textarea
              v-model="addressForm.address_line"
              rows="3"
              required
              placeholder="Nama jalan, nomor rumah, banjar, dan detail lainnya"
            ></textarea>
          </div>

          <div class="form-field full">
            <label>Catatan Alamat (Opsional)</label>
            <textarea
              v-model="addressForm.address_notes"
              rows="2"
              placeholder="Contoh: Rumah pagar hitam di sebelah minimarket"
            ></textarea>
          </div>
        </div>

        <label class="default-checkbox">
          <input v-model="addressForm.is_default" type="checkbox" />
          <span>Jadikan alamat utama</span>
        </label>

        <div class="form-actions">
          <button
            class="secondary-button"
            type="button"
            @click="emit('close-form')"
          >
            Batal
          </button>

          <button class="primary-button" type="submit" :disabled="saving">
            <Save :size="17" />
            {{ saving ? "Menyimpan..." : "Simpan Alamat" }}
          </button>
        </div>
      </form>
    </div>

    <!-- ADDRESS LOADING -->
    <div v-if="loadingAddresses" class="loading-inline">
      <RefreshCw class="spin" :size="22" />
      Memuat alamat...
    </div>

    <!-- ADDRESS LIST -->
    <div v-else-if="addresses.length" class="address-grid">
      <article
        v-for="address in addresses"
        :key="address.id"
        class="address-card"
        :class="{ 'is-default': address.is_default }"
      >
        <div class="address-card-header">
          <div class="address-label">
            <MapPin :size="18" />
            <strong>{{ address.label }}</strong>
          </div>

          <span v-if="address.is_default" class="default-badge">
            <Check :size="13" />
            Utama
          </span>
        </div>

        <div class="address-recipient">
          <strong>{{ address.recipient_name }}</strong>
          <span>{{ address.phone_number }}</span>
        </div>

        <p class="address-line">
          {{ address.address_line }}
        </p>

        <p class="address-region">
          {{ address.district }}, {{ address.city }}, {{ address.province }},
          {{ address.postal_code }}
        </p>

        <p v-if="address.address_notes" class="address-notes">
          Catatan: {{ address.address_notes }}
        </p>

        <div class="address-actions">
          <button class="small-action" @click="emit('open-edit', address)">
            <Pencil :size="14" />
            Edit
          </button>

          <button
            v-if="!address.is_default"
            class="small-action"
            @click="emit('set-default', address.id)"
          >
            <Check :size="14" />
            Jadikan Utama
          </button>

          <button
            class="small-action danger"
            @click="emit('delete-address', address)"
          >
            <Trash2 :size="14" />
            Hapus
          </button>
        </div>
      </article>
    </div>

    <!-- EMPTY STATE -->
    <div v-else class="empty-state">
      <MapPin :size="42" />
      <h3>Belum Ada Alamat</h3>
      <p>
        Tambahkan alamat pengiriman agar proses checkout menjadi lebih mudah.
      </p>

      <button class="primary-button" @click="emit('open-add')">
        <Plus :size="17" />
        Tambah Alamat Pertama
      </button>
    </div>
  </section>
</template>
