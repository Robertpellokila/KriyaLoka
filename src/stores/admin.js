import { defineStore } from "pinia";
import { supabase } from "../services/supabase.js";

export const useAdminStore = defineStore("admin", {
  state: () => ({
    sellers: [],
    pendingProducts: [],
    allProducts: [],
    productReviewHistory: [],

    statistics: {
      totalUsers: 0,
      totalBuyers: 0,
      totalSellers: 0,
      pendingSellers: 0,
      activeSellers: 0,
      rejectedSellers: 0,
      suspendedSellers: 0,
      pendingProducts: 0,
    },

    loading: false,
    updating: false,
    loadingAllProducts: false,
    loadingProductHistory: false,
    error: null,
  }),

  getters: {
    pendingSellersList: (state) =>
      state.sellers.filter((seller) => seller.account_status === "pending"),

    pendingProductsList: (state) => state.pendingProducts,
  },

  actions: {
    // Mengambil statistik dashboard admin.
    async fetchDashboard() {
      this.loading = true;
      this.error = null;

      try {
        const [
          usersResult,
          buyersResult,
          sellersResult,
          pendingResult,
          activeResult,
          rejectedResult,
          suspendedResult,
          pendingProductsResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true }),

          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "buyer"),

          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "seller"),

          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "seller")
            .eq("account_status", "pending"),

          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "seller")
            .eq("account_status", "active"),

          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "seller")
            .eq("account_status", "rejected"),

          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "seller")
            .eq("account_status", "suspended"),

          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending_review"),
        ]);

        const results = [
          usersResult,
          buyersResult,
          sellersResult,
          pendingResult,
          activeResult,
          rejectedResult,
          suspendedResult,
          pendingProductsResult,
        ];

        const failed = results.find((result) => result.error);

        if (failed) throw failed.error;

        this.statistics = {
          totalUsers: usersResult.count ?? 0,
          totalBuyers: buyersResult.count ?? 0,
          totalSellers: sellersResult.count ?? 0,
          pendingSellers: pendingResult.count ?? 0,
          activeSellers: activeResult.count ?? 0,
          rejectedSellers: rejectedResult.count ?? 0,
          suspendedSellers: suspendedResult.count ?? 0,
          pendingProducts: pendingProductsResult.count ?? 0,
        };

        await Promise.all([this.fetchSellers(), this.fetchPendingProducts()]);
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Mengambil daftar seller beserta profil toko dan statistik produk.
    async fetchSellers() {
      const { data: sellers, error } = await supabase
        .from("profiles")
        .select(
          `
      id,
      full_name,
      email,
      phone_number,
      role,
      account_status,
      created_at
    `,
        )
        .eq("role", "seller")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const sellerIds = (sellers ?? []).map((seller) => seller.id);

      // Jika belum ada seller, kosongkan state.
      if (sellerIds.length === 0) {
        this.sellers = [];
        return [];
      }

      // Mengambil profil toko seluruh seller.
      const { data: storeProfiles, error: storeError } = await supabase
        .from("seller_profiles")
        .select("*")
        .in("id", sellerIds);

      if (storeError) throw storeError;

      // Mengambil statistik produk dari database view.
      const { data: productStats, error: statsError } = await supabase
        .from("seller_product_stats")
        .select(
          `
      seller_id,
      total_products,
      pending_products,
      approved_products,
      rejected_products
    `,
        )
        .in("seller_id", sellerIds);

      if (statsError) throw statsError;

      // Membuat mapping agar pencarian data lebih efisien.
      const storeMap = new Map(
        (storeProfiles ?? []).map((store) => [store.id, store]),
      );

      const statsMap = new Map(
        (productStats ?? []).map((stats) => [stats.seller_id, stats]),
      );

      // Menggabungkan seluruh data seller.
      this.sellers = (sellers ?? []).map((seller) => {
        const stats = statsMap.get(seller.id);

        const store = storeMap.get(seller.id) ?? null;

        return {
          ...seller,

          store_profile: store,

          verified_at: store?.verified_at ?? null,
          verified_by: store?.verified_by ?? null,
          verification_note: store?.verification_note ?? null,
          is_verified: Boolean(store?.verified_at),

          total_products: stats?.total_products ?? 0,
          pending_products: stats?.pending_products ?? 0,
          approved_products: stats?.approved_products ?? 0,
          rejected_products: stats?.rejected_products ?? 0,
        };
      });

      return this.sellers;
    },

    async fetchAllProducts() {
      this.loadingAllProducts = true;
      this.error = null;

      try {
        const { data: products, error } = await supabase
          .from("products")
          .select(
            `
        *,
        product_images (
          id,
          image_url,
          image_path,
          sort_order
        )
      `,
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        const productList = products ?? [];

        if (productList.length === 0) {
          this.allProducts = [];
          return [];
        }

        const sellerIds = [
          ...new Set(productList.map((product) => product.seller_id)),
        ];

        const { data: sellerAccounts, error: sellerError } = await supabase
          .from("profiles")
          .select(
            `
        id,
        full_name,
        email,
        phone_number
      `,
          )
          .in("id", sellerIds);

        if (sellerError) throw sellerError;

        const { data: storeProfiles, error: storeError } = await supabase
          .from("seller_profiles")
          .select(
            `
        id,
        store_name,
        category,
        contact_phone,
        city,
        province,
        address,
        logo_url
      `,
          )
          .in("id", sellerIds);

        if (storeError) throw storeError;

        const accountMap = new Map(
          (sellerAccounts ?? []).map((seller) => [seller.id, seller]),
        );

        const storeMap = new Map(
          (storeProfiles ?? []).map((store) => [store.id, store]),
        );

        this.allProducts = productList.map((product) => ({
          ...product,

          product_images: (product.product_images ?? []).sort(
            (a, b) => a.sort_order - b.sort_order,
          ),

          seller: accountMap.get(product.seller_id) ?? null,

          store_profile: storeMap.get(product.seller_id) ?? null,
        }));

        return this.allProducts;
      } catch (error) {
        this.error = error.message || "Gagal mengambil data produk.";
        throw error;
      } finally {
        this.loadingAllProducts = false;
      }
    },

    // Mengambil produk yang menunggu review.
    async fetchPendingProducts() {
      const { data: products, error } = await supabase
        .from("products")
        .select(
          `
          *,
          product_images (
            id,
            image_url,
            image_path,
            sort_order
          )
        `,
        )
        .eq("status", "pending_review")
        .order("submitted_at", { ascending: true });

      if (error) throw error;

      const productList = products ?? [];

      if (productList.length === 0) {
        this.pendingProducts = [];
        return [];
      }

      const sellerIds = [
        ...new Set(productList.map((product) => product.seller_id)),
      ];

      const { data: sellerAccounts, error: sellerError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          email,
          phone_number
        `,
        )
        .in("id", sellerIds);

      if (sellerError) throw sellerError;

      const { data: storeProfiles, error: storeError } = await supabase
        .from("seller_profiles")
        .select(
          `
          id,
          store_name,
          category,
          contact_phone,
          city,
          province,
          address,
          logo_url
        `,
        )
        .in("id", sellerIds);

      if (storeError) throw storeError;

      const accountMap = new Map(
        (sellerAccounts ?? []).map((seller) => [seller.id, seller]),
      );

      const storeMap = new Map(
        (storeProfiles ?? []).map((store) => [store.id, store]),
      );

      this.pendingProducts = productList.map((product) => ({
        ...product,

        product_images: (product.product_images ?? []).sort(
          (a, b) => a.sort_order - b.sort_order,
        ),

        seller: accountMap.get(product.seller_id) ?? null,

        store_profile: storeMap.get(product.seller_id) ?? null,
      }));

      return this.pendingProducts;
    },

    // Mengambil seluruh riwayat review suatu produk.
    async fetchProductReviewHistory(productId) {
      if (!productId) {
        throw new Error("ID produk tidak ditemukan.");
      }

      this.loadingProductHistory = true;
      this.error = null;
      this.productReviewHistory = [];

      try {
        const { data, error } = await supabase
          .from("product_review_history")
          .select(
            `
            id,
            product_id,
            actor_id,
            action,
            note,
            changes,
            product_snapshot,
            created_at
          `,
          )
          .eq("product_id", productId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        this.productReviewHistory = data ?? [];

        return this.productReviewHistory;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loadingProductHistory = false;
      }
    },

    // Menghapus riwayat produk dari state.
    clearProductReviewHistory() {
      this.productReviewHistory = [];
    },

    // Menyetujui atau menolak pengajuan seller.
    async reviewSeller(sellerId, decision, note = null) {
      if (!["approved", "rejected"].includes(decision)) {
        throw new Error("Keputusan verifikasi tidak valid.");
      }

      if (decision === "rejected" && !note?.trim()) {
        throw new Error("Alasan penolakan wajib diisi.");
      }

      this.updating = true;
      this.error = null;

      try {
        const { error } = await supabase.rpc("review_seller_application", {
          p_seller_id: sellerId,
          p_decision: decision,
          p_note: note?.trim() || null,
        });

        if (error) throw error;

        await this.fetchDashboard();

        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.updating = false;
      }
    },

    // Menyetujui atau menolak produk.
    async reviewProduct(productId, decision, note = null) {
      if (!["approved", "rejected"].includes(decision)) {
        throw new Error("Keputusan review produk tidak valid.");
      }

      if (decision === "rejected" && !note?.trim()) {
        throw new Error("Alasan penolakan produk wajib diisi.");
      }

      this.updating = true;
      this.error = null;

      try {
        const { data, error } = await supabase.rpc("review_product", {
          p_product_id: productId,
          p_decision: decision,
          p_note: note?.trim() || null,
        });

        if (error) throw error;

        const reviewedProduct = Array.isArray(data) ? data[0] : data;

        this.pendingProducts = this.pendingProducts.filter(
          (product) => product.id !== productId,
        );

        await this.fetchPendingProducts();

        return reviewedProduct;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.updating = false;
      }
    },

    // Mengubah status akun seller.
    // Aktivasi kembali dan penangguhan hanya untuk seller terverifikasi.
    async updateSellerStatus(sellerId, newStatus, note = null) {
      if (!["active", "suspended"].includes(newStatus)) {
        throw new Error("Perubahan status seller tidak valid.");
      }

      const cleanNote = String(note ?? "").trim();

      if (newStatus === "suspended" && !cleanNote) {
        throw new Error("Alasan penangguhan wajib diisi.");
      }

      this.updating = true;
      this.error = null;

      try {
        const { error } = await supabase.rpc("update_seller_account_status", {
          p_seller_id: sellerId,
          p_new_status: newStatus,
          p_note: cleanNote || null,
        });

        if (error) throw error;

        await this.fetchDashboard();

        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.updating = false;
      }
    },
  },
});
