import { defineStore } from "pinia";
import { supabase } from "../services/supabase.js";

let authSubscription = null;
let initializationPromise = null;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    profile: null,
    sellerProfile: null,
    loading: false,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,

    role: (state) => state.profile?.role ?? null,

    accountStatus: (state) => state.profile?.account_status ?? null,

    isBuyer: (state) => state.profile?.role === "buyer",

    isSeller: (state) => state.profile?.role === "seller",

    isSuperAdmin: (state) => state.profile?.role === "super_admin",

    isSellerApproved: (state) =>
      state.profile?.role === "seller" &&
      state.profile?.account_status === "active",

    isSellerRejected: (state) =>
      state.profile?.role === "seller" &&
      state.profile?.account_status === "rejected",

    sellerVerificationNote: (state) =>
      state.sellerProfile?.verification_note ?? null,
  },

  actions: {
    // Mengambil profil utama dari tabel profiles
    async fetchProfile(userId) {
      if (!userId) {
        this.profile = null;
        this.sellerProfile = null;
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        this.profile = null;
        this.sellerProfile = null;
        throw error;
      }

      this.profile = data;

      // Jika akun merupakan seller, ambil profil seller
      if (data.role === "seller") {
        await this.fetchSellerProfile(userId);
      } else {
        this.sellerProfile = null;
      }

      return data;
    },

    // Mengambil informasi tambahan seller
    async fetchSellerProfile(userId) {
      if (!userId) {
        this.sellerProfile = null;
        return null;
      }

      const { data, error } = await supabase
        .from("seller_profiles")
        .select("id, verification_note, verified_at, verified_by")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        this.sellerProfile = null;
        throw error;
      }

      this.sellerProfile = data;

      return data;
    },

    // Memeriksa sesi ketika aplikasi pertama kali dibuka
    async initialize() {
      if (this.initialized) return;

      if (initializationPromise) {
        return initializationPromise;
      }

      initializationPromise = (async () => {
        this.loading = true;

        try {
          const { data, error } = await supabase.auth.getSession();

          if (error) throw error;

          this.user = data.session?.user ?? null;

          if (this.user) {
            await this.fetchProfile(this.user.id);
          } else {
            this.profile = null;
            this.sellerProfile = null;
          }

          // Dengarkan perubahan status autentikasi
          if (!authSubscription) {
            const { data: listener } = supabase.auth.onAuthStateChange(
              (_event, session) => {
                const user = session?.user ?? null;

                this.user = user;

                if (!user) {
                  this.profile = null;
                  this.sellerProfile = null;
                  return;
                }

                // Jalankan setelah callback auth selesai
                Promise.resolve()
                  .then(() => {
                    return this.fetchProfile(user.id);
                  })
                  .catch(console.error);
              },
            );

            authSubscription = listener.subscription;
          }

          this.initialized = true;
        } finally {
          this.loading = false;
          initializationPromise = null;
        }
      })();

      return initializationPromise;
    },

    // Registrasi akun baru
    async register({ fullName, email, password, phoneNumber, role }) {
      if (!["buyer", "seller"].includes(role)) {
        throw new Error("Role pendaftaran tidak valid.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,

        options: {
          emailRedirectTo: window.location.origin,

          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            role,
          },
        },
      });

      if (error) throw error;

      if (data.session?.user) {
        this.user = data.session.user;
        await this.fetchProfile(data.session.user.id);
      }

      return data;
    },

    // Login
    async login({ email, password }) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      this.user = data.user;
      await this.fetchProfile(data.user.id);

      return this.profile;
    },

    // Logout
    async logout() {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      this.user = null;
      this.profile = null;
      this.sellerProfile = null;
    },

    // Memuat ulang profil
    async refreshProfile() {
      if (!this.user) return null;

      return this.fetchProfile(this.user.id);
    },

    // Memuat ulang informasi seller
    async refreshSellerProfile() {
      if (!this.user || this.profile?.role !== "seller") {
        this.sellerProfile = null;
        return null;
      }

      return this.fetchSellerProfile(this.user.id);
    },
  },
});
