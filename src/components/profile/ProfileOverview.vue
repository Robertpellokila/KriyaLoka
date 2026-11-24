<script setup>
import {
  Package,
  Clock,
  Check,
  MapPin,
  ShoppingBag,
  ChevronRight,
} from "lucide-vue-next";

defineProps({
  userName: { type: String, default: "Pengguna" },
  userEmail: { type: String, default: "-" },
  userProfile: { type: Object, default: () => ({}) },
  totalOrder: { type: Number, default: 0 },
  activeOrderCount: { type: Number, default: 0 },
  completedOrderCount: { type: Number, default: 0 },
  addresses: { type: Array, default: () => [] },
  orders: { type: Array, default: () => [] },

  formatCurrency: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  getOrderStatusLabel: { type: Function, required: true },
  getOrderStatusClass: { type: Function, required: true },
});

const emit = defineEmits(["change-section", "go-catalog"]);

function defaultAddress(addresses) {
  return addresses.find((item) => item.is_default);
}
</script>

<template>
  <section class="section-content">
    <div class="welcome-card">
      <div>
        <span>RUANG PERSONALMU</span>
        <h3>Belanja kerajinan lokal dengan lebih mudah.</h3>
        <p>Pantau pesanan dan kelola informasi pengiriman dari satu tempat.</p>

        <button class="primary-button" @click="emit('go-catalog')">
          Mulai Belanja
          <ChevronRight :size="17" />
        </button>
      </div>

      <div class="welcome-decoration">
        <ShoppingBag :size="74" />
      </div>
    </div>

    <div class="overview-stats">
      <div class="stat-card">
        <div class="stat-icon brown"><Package :size="21" /></div>
        <div>
          <span>Total Pesanan</span>
          <strong>{{ totalOrder }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange"><Clock :size="21" /></div>
        <div>
          <span>Pesanan Aktif</span>
          <strong>{{ activeOrderCount }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green"><Check :size="21" /></div>
        <div>
          <span>Pesanan Selesai</span>
          <strong>{{ completedOrderCount }}</strong>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon cream"><MapPin :size="21" /></div>
        <div>
          <span>Alamat Tersimpan</span>
          <strong>{{ addresses.length }}</strong>
        </div>
      </div>
    </div>

    <div class="overview-grid">
      <div class="panel-card">
        <div class="panel-heading">
          <div>
            <h3>Informasi Akun</h3>
            <p>Informasi dasar akunmu.</p>
          </div>

          <button
            class="text-button"
            @click="emit('change-section', 'profile')"
          >
            Edit Profil <ChevronRight :size="15" />
          </button>
        </div>

        <div class="information-list">
          <div>
            <span>Nama Lengkap</span>
            <strong>{{ userName }}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{{ userEmail }}</strong>
          </div>
          <div>
            <span>Nomor Telepon</span>
            <strong>{{ userProfile.phone_number || "Belum diisi" }}</strong>
          </div>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-heading">
          <div>
            <h3>Alamat Utama</h3>
            <p>Alamat pengiriman pilihanmu.</p>
          </div>

          <button
            class="text-button"
            @click="emit('change-section', 'addresses')"
          >
            Lihat Semua <ChevronRight :size="15" />
          </button>
        </div>

        <div v-if="defaultAddress(addresses)" class="default-address">
          <strong>{{ defaultAddress(addresses).label }}</strong>
          <p>{{ defaultAddress(addresses).recipient_name }}</p>
          <p>{{ defaultAddress(addresses).address_line }}</p>
          <small>
            {{ defaultAddress(addresses).district }},
            {{ defaultAddress(addresses).city }},
            {{ defaultAddress(addresses).province }}
          </small>
        </div>

        <div v-else class="empty-mini">
          <MapPin :size="27" />
          <p>Belum ada alamat utama.</p>
          <button
            class="text-button"
            @click="emit('change-section', 'addresses')"
          >
            Tambahkan alamat
          </button>
        </div>
      </div>
    </div>

    <div class="panel-card recent-orders">
      <div class="panel-heading">
        <div>
          <h3>Pesanan Terbaru</h3>
          <p>Aktivitas belanja terakhirmu.</p>
        </div>

        <button class="text-button" @click="emit('change-section', 'orders')">
          Semua Pesanan <ChevronRight :size="15" />
        </button>
      </div>

      <div v-if="orders.length" class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nomor Pesanan</th>
              <th>Tanggal</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="order in orders.slice(0, 5)" :key="order.id">
              <td>{{ order.order_number }}</td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>{{ formatCurrency(order.grand_total) }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="getOrderStatusClass(order.status)"
                >
                  {{ getOrderStatusLabel(order.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state compact">
        <Package :size="32" />
        <p>Belum ada pesanan.</p>
        <button class="text-button" @click="emit('go-catalog')">
          Jelajahi produk
        </button>
      </div>
    </div>
  </section>
</template>
