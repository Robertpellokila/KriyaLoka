import { defineStore } from "pinia";
import { supabase } from "../services/supabase.js";

export const useAdminStore = defineStore("admin", {
  state: () => ({
    sellers: [],
    statistics: {
      totalUsers: 0,
      totalBuyers: 0,
      totalSellers: 0,
      pendingSellers: 0,
      activeSellers: 0,
      rejectedSellers: 0,
      suspendedSellers: 0,
    },
    loading: false,
    updating: false,
    error: null,
  }),

  getters: {
    pendingSellersList: (state) =>
      state.sellers.filter((seller) => seller.account_status === "pending"),
  },

  actions: {
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
        ]);

        const results = [
          usersResult,
          buyersResult,
          sellersResult,
          pendingResult,
          activeResult,
          rejectedResult,
          suspendedResult,
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
        };

        await this.fetchSellers();
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

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

      let storeProfiles = [];

      if (sellerIds.length > 0) {
        const { data, error: storeError } = await supabase
          .from("seller_profiles")
          .select("*")
          .in("id", sellerIds);

        if (storeError) throw storeError;

        storeProfiles = data ?? [];
      }

      const storeMap = new Map(storeProfiles.map((store) => [store.id, store]));

      this.sellers = (sellers ?? []).map((seller) => ({
        ...seller,
        store_profile: storeMap.get(seller.id) ?? null,
      }));
    },
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

    async updateSellerStatus(sellerId, newStatus) {
      const allowedStatuses = ["active", "rejected", "suspended"];

      if (!allowedStatuses.includes(newStatus)) {
        throw new Error("Status akun tidak valid.");
      }

      this.updating = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .update({
            account_status: newStatus,
          })
          .eq("id", sellerId)
          .eq("role", "seller")
          .select()
          .single();

        if (error) throw error;

        const index = this.sellers.findIndex(
          (seller) => seller.id === sellerId,
        );

        if (index !== -1) {
          this.sellers[index] = data;
        }

        await this.fetchDashboard();

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.updating = false;
      }
    },
  },
});
