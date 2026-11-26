<template>
  <div class="user-management">
    <!-- Header Halaman -->
    <div class="page-header">
      <div>
        <span class="eyebrow">KRIYALOKA WORKSPACE</span>
        <h1 class="page-title">Manajemen Pengguna</h1>
        <p class="page-subtitle">Kelola seluruh akun pengguna KriyaLoka.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="exportCSV">
          Ekspor CSV
        </button>
        <button class="btn btn-primary" @click="openAddModal = true">
          + Tambah Admin / Staf
        </button>
      </div>
    </div>

    <!-- 4 Kartu Ringkasan KPI -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">Total Pengguna</span>
        <strong class="kpi-value">{{ users.length }}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Pengguna Aktif</span>
        <strong class="kpi-value text-green">{{ countByStatus('Aktif') }}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Menunggu Verifikasi</span>
        <strong class="kpi-value text-amber">{{ countByStatus('Pending') }}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Akun Ditangguhkan</span>
        <strong class="kpi-value text-red">{{ countByStatus('Suspended') }}</strong>
      </div>
    </div>

    <!-- Toolbar Filter & Pencarian -->
    <div class="card table-container">
      <div class="toolbar">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Cari nama, email, atau nomor HP..."
        />
        <div class="filter-group">
          <select v-model="roleFilter" class="select-input">
            <option value="">Semua Peran</option>
            <option value="Buyer">Buyer</option>
            <option value="Seller">Seller</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Staff">Staff</option>
          </select>
          <select v-model="statusFilter" class="select-input">
            <option value="">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      <!-- Tabel Daftar Pengguna -->
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Bergabung</th>
              <th>Aktivitas Terakhir</th>
              <th class="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="empty-row">
                Tidak ada pengguna yang sesuai dengan filter.
                <button class="link-btn" @click="resetFilters">Reset Filter</button>
              </td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="avatar">{{ getInitials(user.name) }}</div>
                  <div>
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-meta">{{ user.email }} • {{ user.phone }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="role-badge">{{ user.role }}</span>
              </td>
              <td>
                <span :class="['status-badge', statusClass(user.status)]">
                  {{ user.status }}
                </span>
              </td>
              <td>{{ user.joinedAt }}</td>
              <td>{{ user.lastActive }}</td>
              <td class="text-right">
                <button class="btn-action" @click="selectedUser = user">
                  Detail
                </button>
                <button
                  v-if="user.role !== 'Super Admin'"
                  class="btn-action"
                  :class="user.status === 'Suspended' ? 'text-green' : 'text-red'"
                  @click="toggleSuspend(user)"
                >
                  {{ user.status === 'Suspended' ? 'Aktifkan' : 'Tangguhkan' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Drawer Detail Pengguna -->
    <div v-if="selectedUser" class="drawer-backdrop" @click.self="selectedUser = null">
      <div class="drawer-panel">
        <div class="drawer-header">
          <h3>Detail Pengguna</h3>
          <button class="close-btn" @click="selectedUser = null">✕</button>
        </div>
        <div class="drawer-body">
          <div class="detail-group">
            <label>Nama Lengkap</label>
            <p>{{ selectedUser.name }}</p>
          </div>
          <div class="detail-group">
            <label>Email & Telepon</label>
            <p>{{ selectedUser.email }} / {{ selectedUser.phone }}</p>
          </div>
          <div class="detail-group">
            <label>Peran & Status</label>
            <p>{{ selectedUser.role }} — <strong>{{ selectedUser.status }}</strong></p>
          </div>
          <div class="detail-group">
            <label>Total Pesanan</label>
            <p>{{ selectedUser.totalOrders }} pesanan selesai</p>
          </div>
          <div v-if="selectedUser.storeName" class="detail-group">
            <label>Toko Terdaftar</label>
            <p>{{ selectedUser.storeName }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Tambah Admin / Staf -->
    <div v-if="openAddModal" class="drawer-backdrop" @click.self="openAddModal = false">
      <div class="modal-box">
        <div class="drawer-header">
          <h3>Tambah Admin / Staf</h3>
          <button class="close-btn" @click="openAddModal = false">✕</button>
        </div>
        <form @submit.prevent="addStaff" class="modal-form">
          <input v-model="newUser.name" type="text" placeholder="Nama Lengkap" required class="search-input" />
          <input v-model="newUser.email" type="email" placeholder="Email" required class="search-input" />
          <input v-model="newUser.phone" type="text" placeholder="Nomor HP" required class="search-input" />
          <select v-model="newUser.role" class="select-input">
            <option value="Staff">Staff</option>
            <option value="Super Admin">Super Admin</option>
          </select>
          <button type="submit" class="btn btn-primary">Simpan Akun</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')
const selectedUser = ref(null)
const openAddModal = ref(false)

const newUser = ref({
  name: '',
  email: '',
  phone: '',
  role: 'Staff'
})

// Data contoh sementara (nantinya bisa diganti dengan fetch API / Axios dari backend)
const users = ref([
  {
    id: 1,
    name: 'Robert Pellokila',
    email: 'robert@kriyaloka.id',
    phone: '0812-3456-7890',
    role: 'Super Admin',
    status: 'Aktif',
    joinedAt: '10 Jan 2026',
    lastActive: 'Baru saja',
    totalOrders: 0,
    storeName: null
  },
  {
    id: 2,
    name: 'Ayu Lestari',
    email: 'ayu.kriya@gmail.com',
    phone: '0813-9876-5432',
    role: 'Seller',
    status: 'Aktif',
    joinedAt: '14 Feb 2026',
    lastActive: '1 jam lalu',
    totalOrders: 12,
    storeName: 'Tenun & Kriya Bali'
  },
  {
    id: 3,
    name: 'Dimas Pratama',
    email: 'dimas.pratama@yahoo.com',
    phone: '0857-1122-3344',
    role: 'Buyer',
    status: 'Pending',
    joinedAt: '22 Nov 2026',
    lastActive: '3 jam lalu',
    totalOrders: 2,
    storeName: null
  },
  {
    id: 4,
    name: 'Siti Rahmawati',
    email: 'siti.rahma@gmail.com',
    phone: '0821-5566-7788',
    role: 'Buyer',
    status: 'Suspended',
    joinedAt: '05 Agu 2026',
    lastActive: '5 hari lalu',
    totalOrders: 4,
    storeName: null
  }
])

const filteredUsers = computed(() => {
  return users.value.filter((user) => {
    const q = searchQuery.value.toLowerCase()
    const matchQuery =
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.phone.includes(q)
    const matchRole = !roleFilter.value || user.role === roleFilter.value
    const matchStatus = !statusFilter.value || user.status === statusFilter.value
    return matchQuery && matchRole && matchStatus
  })
})

function countByStatus(status) {
  return users.value.filter((u) => u.status === status).length
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function statusClass(status) {
  if (status === 'Aktif') return 'badge-green'
  if (status === 'Pending') return 'badge-amber'
  return 'badge-red'
}

function toggleSuspend(user) {
  user.status = user.status === 'Suspended' ? 'Aktif' : 'Suspended'
}

function resetFilters() {
  searchQuery.value = ''
  roleFilter.value = ''
  statusFilter.value = ''
}

function addStaff() {
  users.value.unshift({
    id: Date.now(),
    ...newUser.value,
    status: 'Aktif',
    joinedAt: '26 Nov 2026',
    lastActive: 'Baru ditambahkan',
    totalOrders: 0,
    storeName: null
  })
  newUser.value = { name: '', email: '', phone: '', role: 'Staff' }
  openAddModal.value = false
}

function exportCSV() {
  const headers = ['ID,Nama,Email,No HP,Peran,Status,Bergabung']
  const rows = filteredUsers.value.map(
    (u) => `${u.id},"${u.name}",${u.email},${u.phone},${u.role},${u.status},"${u.joinedAt}"`
  )
  const blob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pengguna-kriyaloka.csv'
  a.click()
}
</script>

<style scoped>
.user-management {
  padding: 24px;
  color: #1f1a17;
  font-family: inherit;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #8a3b12;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b625b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.btn-primary {
  background-color: #8a3b12;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #6f2e0d;
}

.btn-secondary {
  background-color: #ffffff;
  border-color: #e6ddd5;
  color: #3d352e;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: #ffffff;
  border: 1px solid #ece3da;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kpi-label {
  font-size: 13px;
  color: #6b625b;
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
}

.card {
  background: #ffffff;
  border: 1px solid #ece3da;
  border-radius: 12px;
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input,
.select-input {
  padding: 9px 12px;
  border: 1px solid #e2d8ce;
  border-radius: 8px;
  font-size: 13px;
  background: #fffdfb;
}

.search-input {
  min-width: 260px;
}

.filter-group {
  display: flex;
  gap: 10px;
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  text-align: left;
  padding: 12px;
  border-bottom: 1px solid #ece3da;
  color: #6b625b;
  font-weight: 600;
}

.data-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #f4ede6;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f5ebe1;
  color: #8a3b12;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.user-name {
  font-weight: 600;
}

.user-meta {
  font-size: 12px;
  color: #7c7269;
}

.role-badge {
  background: #f7f2ed;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge-green {
  background: #e6f4ea;
  color: #1e7e34;
}

.badge-amber {
  background: #fef3c7;
  color: #b45309;
}

.badge-red {
  background: #fee2e2;
  color: #b91c1c;
}

.text-right {
  text-align: right;
}

.text-green {
  color: #1e7e34;
}

.text-amber {
  color: #b45309;
}

.text-red {
  color: #b91c1c;
}

.btn-action {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 10px;
  color: #8a3b12;
}

.empty-row {
  text-align: center;
  padding: 32px;
  color: #6b625b;
}

.link-btn {
  background: none;
  border: none;
  color: #8a3b12;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
}

.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: flex-end;
  z-index: 50;
}

.drawer-panel {
  width: 380px;
  max-width: 100%;
  background: #ffffff;
  height: 100%;
  padding: 24px;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
}

.modal-box {
  margin: auto;
  width: 400px;
  max-width: 92%;
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ece3da;
  padding-bottom: 12px;
  margin-bottom: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.detail-group {
  margin-bottom: 14px;
}

.detail-group label {
  font-size: 12px;
  color: #7c7269;
  display: block;
}

.detail-group p {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 500;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>