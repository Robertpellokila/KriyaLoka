import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

import HomeView from "../views/HomeView.vue";
import CatalogView from "../views/CatalogView.vue";
import ProductDetailView from "../views/ProductDetailView.vue";
import CartView from "../views/CartView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import ProfileView from "../views/ProfileView.vue";
import DashboardView from "../views/DashboardView.vue";
import NotFoundView from "../views/NotFoundView.vue";
import AdminDashboardView from "@/views/AdminDashboardView.vue";
import DashboardSectionView from "@/views/DashboardSectionView.vue";
import SellerDashboardView from "@/views/SellerDashboardView.vue";
import DashboardLayout from "@/layouts/DashboardLayout.vue";
import BuyerDashboardView from "@/views/BuyerDashboardView.vue";
import SellerStoreView from "@/views/SellerStoreView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/katalog",
    name: "catalog",
    component: CatalogView,
  },
  {
    path: "/produk/:id",
    name: "product-detail",
    component: ProductDetailView,
  },
  {
    path: "/keranjang",
    name: "cart",
    component: CartView,
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
    meta: { guestOnly: true },
  },
  {
    path: "/profil",
    name: "profile",
    component: ProfileView,
    meta: { requiresAuth: true },
  },

  // Dashboard pembeli

  {
    path: "/dashboard/pembeli",
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ["buyer"],
      hidePublicLayout: true,
    },
    children: [
      {
        path: "",
        name: "buyer-dashboard",
        component: BuyerDashboardView,
      },
      {
        path: "pesanan",
        name: "buyer-orders",
        component: DashboardSectionView,
        meta: {
          title: "Pesanan Saya",
          description: "Pantau seluruh pesanan belanja Anda.",
        },
      },
    ],
  },

  {
    path: "/dashboard/penjual",
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
      roles: ["seller"],
      hidePublicLayout: true,
    },
    children: [
      {
        path: "",
        name: "seller-dashboard",
        component: SellerDashboardView,
      },
      {
        path: "toko",
        name: "seller-store",
        component: SellerStoreView,
      },
      {
        path: "produk",
        name: "seller-products",
        component: DashboardSectionView,
        meta: {
          title: "Produk Saya",
          description: "Kelola katalog produk kerajinan Anda.",
        },
      },
      {
        path: "pesanan",
        name: "seller-orders",
        component: DashboardSectionView,
        meta: {
          title: "Pesanan Masuk",
          description: "Kelola pesanan yang diterima toko Anda.",
        },
      },
    ],
  },

  {
    path: "/dashboard/admin",
    name: "admin-dashboard",
    component: AdminDashboardView,
    meta: {
      requiresAuth: true,
      roles: ["super_admin"],
      hidePublicLayout: true,
    },
  },

  {
    path: "/akses-dibatasi",
    name: "restricted-account",
    component: DashboardSectionView,
    meta: {
      requiresAuth: true,
      hidePublicLayout: true,
      statusPage: true,
      title: "Akses Akun Dibatasi",
      description: "Silakan hubungi administrator KriyaLoka.",
    },
  },

  // Halaman akun ditolak atau ditangguhkan
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

const getDashboardPath = (role) => {
  const destinations = {
    buyer: "/dashboard/pembeli",
    seller: "/dashboard/penjual",
    super_admin: "/dashboard/admin",
  };

  return destinations[role] || "/";
};

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  try {
    await authStore.initialize();
  } catch (error) {
    console.error("Gagal memeriksa sesi:", error);

    if (to.meta.requiresAuth) {
      return {
        name: "login",
        query: { redirect: to.fullPath },
      };
    }
  }

  const isLoggedIn = authStore.isAuthenticated;
  const profile = authStore.profile;

  // Pengguna yang belum login tidak boleh membuka halaman privat
  if (to.meta.requiresAuth && !isLoggedIn) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  // Pengguna yang sudah login tidak perlu kembali ke login/register
  if (to.meta.guestOnly && isLoggedIn && profile) {
    return getDashboardPath(profile.role);
  }

  if (isLoggedIn && profile) {
    const status = profile.account_status;
    const role = profile.role;

    // Akun ditolak atau ditangguhkan
    if (
      ["rejected", "suspended"].includes(status) &&
      to.name !== "restricted-account"
    ) {
      return { name: "restricted-account" };
    }

    // Akun aktif tidak perlu membuka halaman pembatasan
    if (status === "active" && to.name === "restricted-account") {
      return getDashboardPath(role);
    }

    // Penjual yang belum diverifikasi hanya boleh membuka
    // dashboard penjual untuk melihat status verifikasinya.

    // Penjual pending boleh membuka dashboard dan melengkapi profil toko.
    // Fitur produk dan pesanan tetap menunggu persetujuan Super Admin.
    if (
      role === "seller" &&
      status === "pending" &&
      to.meta.requiresAuth &&
      !["seller-dashboard", "seller-store"].includes(to.name)
    ) {
      return { name: "seller-dashboard" };
    }

    // Cek kecocokan role dengan halaman tujuan
    if (to.meta.roles && !to.meta.roles.includes(role)) {
      return getDashboardPath(role);
    }
  }

  return true;
});

export default router;
