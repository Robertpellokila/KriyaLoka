import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

import HomeView from "../views/HomeView.vue";
import CatalogView from "../views/CatalogView.vue";
import ProductDetailView from "../views/ProductDetailView.vue";
import CartView from "../views/CartView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import ProfileView from "../views/ProfileView.vue";
import NotFoundView from "../views/NotFoundView.vue";
import ProdukUnggulanView from "../views/ProdukUnggulanView.vue";
import KontakView from "../views/KontakView.vue";

import DashboardSectionView from "../views/DashboardSectionView.vue";
import BuyerDashboardView from "../views/BuyerDashboardView.vue";
import SellerDashboardView from "../views/SellerDashboardView.vue";
import SellerStoreView from "../views/SellerStoreView.vue";
import SellerProductFormView from "../views/SellerProductFormView.vue";
import SellerProductsView from "../views/SellerProductsView.vue";

import DashboardLayout from "../layouts/DashboardLayout.vue";
import AdminLayout from "../layouts/AdminLayout.vue";
import AuthLayout from "../layouts/AuthLayout.vue";

import AdminDashboardView from "../views/admin/AdminDashboardView.vue";
import AdminProductReviewView from "../views/admin/AdminProductReviewView.vue";
import SellerManagementView from "@/views/admin/SellerManagementView.vue";
import AdminSellerDetailView from "@/views/admin/AdminSellerDetailView.vue";
import AdminProductManagementView from "@/views/admin/AdminProductManagementView.vue";
import CheckoutView from "@/views/CheckoutView.vue";
import SellerPaymentMethodsView from "@/views/SellerPaymentMethodsView.vue";
import SellerOrdersView from "@/views/SellerOrdersView.vue";

const routes = [
  // ==========================================
  // HALAMAN PUBLIK
  // ==========================================

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
    path: "/produk-unggulan",
    name: "featured-products",
    component: ProdukUnggulanView,
  },
  {
    path: "/kontak",
    name: "contact",
    component: KontakView,
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
    meta: {
      guestOnly: true,
      hidePublicLayout: true,
      authLayout: true,
    },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
    meta: {
      guestOnly: true,
      hidePublicLayout: true,
      authLayout: true,
    },
  },

  {
    path: "/profil",
    name: "profile",
    component: ProfileView,
    meta: { requiresAuth: true },
  },
  {
    path: "/checkout",
    name: "checkout",
    component: CheckoutView,
    meta: {
      requiresAuth: true,
      roles: ["buyer"],
    },
  },

  // ==========================================
  // AKUN PEMBELI
  // ==========================================

  {
    path: "/account",
    name: "buyer-account",
    component: ProfileView,
    meta: {
      requiresAuth: true,
      roles: ["buyer"],
    },
  },

  // Redirect dashboard pembeli lama
  {
    path: "/dashboard/pembeli",
    redirect: { name: "buyer-account" },
  },

  // Redirect halaman pesanan pembeli lama
  {
    path: "/dashboard/pembeli/pesanan",
    redirect: { name: "buyer-account" },
  },

  // ==========================================
  // DASHBOARD PENJUAL
  // ==========================================

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
        path: "pembayaran",
        name: "seller-payment-methods",
        component: SellerPaymentMethodsView,
        meta: {
          title: "Metode Pembayaran",
          description:
            "Kelola QRIS dan rekening bank untuk menerima pembayaran dari pembeli.",
        },
      },
      {
        path: "produk",
        name: "seller-products",
        component: SellerProductsView,
      },
      {
        path: "produk/tambah",
        name: "seller-product-create",
        component: SellerProductFormView,
      },
      {
        path: "produk/:id/edit",
        name: "seller-product-edit",
        component: SellerProductFormView,
      },
      {
        path: "pesanan",
        name: "seller-orders",
        component: SellerOrdersView,
        meta: {
          title: "Pesanan Masuk",
          description: "Kelola pesanan yang diterima toko Anda.",
        },
      },
    ],
  },

  // ==========================================
  // DASHBOARD SUPER ADMIN
  // ==========================================

  {
    path: "/dashboard/admin",
    component: AdminLayout,
    meta: {
      requiresAuth: true,
      roles: ["super_admin"],
      hidePublicLayout: true,
    },
    children: [
      {
        path: "",
        name: "admin-dashboard",
        component: AdminDashboardView,
        meta: {
          title: "Dashboard",
          breadcrumb: "KriyaLoka / Dashboard",
        },
      },
      {
        path: "sellers",
        name: "AdminSellerManagement",
        component: SellerManagementView,
        meta: {
          title: "Manajemen Penjual",
          breadcrumb: "KriyaLoka / Manajemen Penjual",
          description: "Kelola akun dan informasi penjual.",
        },
      },
      {
        path: "sellers/:sellerId",
        name: "AdminSellerDetail",
        component: AdminSellerDetailView,
        props: true,
        meta: {
          title: "Detail Penjual",
          breadcrumb: "KriyaLoka / Manajemen Penjual / Detail Penjual",
          description: "Informasi lengkap dan aktivitas penjual.",
        },
      },
      {
        path: "products",
        name: "AdminProductManagement",
        component: AdminProductManagementView,
        meta: {
          title: "Manajemen Produk",
          breadcrumb: "KriyaLoka / Manajemen Produk",
          description:
            "Kelola dan pantau seluruh produk yang terdaftar di KriyaLoka.",
        },
      },
      {
        path: "product-review",
        name: "AdminProductReview",
        component: AdminProductReviewView,
        meta: {
          title: "Review Produk",
          breadcrumb: "KriyaLoka / Admin / Review Produk",
        },
      },
      {
        path: "pengguna",
        name: "admin-users",
        component: DashboardSectionView,
        meta: {
          title: "Manajemen Pengguna",
          breadcrumb: "KriyaLoka / Manajemen Pengguna",
          description: "Kelola seluruh akun pengguna KriyaLoka.",
        },
      },
      {
        path: "pesanan",
        name: "admin-orders",
        component: DashboardSectionView,
        meta: {
          title: "Manajemen Pesanan",
          breadcrumb: "KriyaLoka / Manajemen Pesanan",
          description: "Pantau dan kelola transaksi marketplace.",
        },
      },
    ],
  },

  // ==========================================
  // AKUN DIBATASI
  // ==========================================

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

  // ==========================================
  // 404
  // ==========================================

  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/NotFoundView.vue"),
    meta: {
      hidePublicLayout: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,

  scrollBehavior() {
    return { top: 0 };
  },
});

// ==========================================
// REDIRECT BERDASARKAN ROLE
// ==========================================

const getDashboardPath = (role) => {
  const destinations = {
    buyer: "/account",
    seller: "/dashboard/penjual",
    super_admin: "/dashboard/admin",
  };

  return destinations[role] || "/";
};

// ==========================================
// NAVIGATION GUARD
// ==========================================

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

  // Pengguna belum login tidak boleh membuka halaman privat
  if (to.meta.requiresAuth && !isLoggedIn) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  // Pengguna yang sudah login tidak perlu membuka login/register
  if (to.meta.guestOnly && isLoggedIn && profile) {
    return getDashboardPath(profile.role);
  }

  if (isLoggedIn && profile) {
    const status = profile.account_status;
    const role = profile.role;

    // Akun ditangguhkan
    if (status === "suspended" && to.name !== "restricted-account") {
      return { name: "restricted-account" };
    }

    // Akun aktif tidak perlu membuka halaman pembatasan
    if (status === "active" && to.name === "restricted-account") {
      return getDashboardPath(role);
    }

    // Penjual pending hanya boleh membuka dashboard dan pengaturan toko
    if (
      role === "seller" &&
      status === "pending" &&
      to.meta.requiresAuth &&
      !["seller-dashboard", "seller-store"].includes(to.name)
    ) {
      return { name: "seller-dashboard" };
    }

    // Pemeriksaan role pengguna
    if (to.meta.roles && !to.meta.roles.includes(role)) {
      return getDashboardPath(role);
    }
  }

  return true;
});

export default router;
