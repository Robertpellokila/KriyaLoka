import { defineStore } from "pinia";
import { supabase } from "../services/supabase.js";

let authSubscription = null;
let initializationPromise = null;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    profile: null,
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
  },

  actions: {
    // Mengambil profil dari tabel profiles
    async fetchProfile(userId) {
      if (!userId) {
        this.profile = null;
        return null;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        this.profile = null;
        throw error;
      }

      this.profile = data;
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
          }

          // Dengarkan perubahan status autentikasi
          if (!authSubscription) {
            const { data: listener } = supabase.auth.onAuthStateChange(
              (_event, session) => {
                this.user = session?.user ?? null;

                if (!this.user) {
                  this.profile = null;
                } else {
                  // Jalankan setelah callback auth selesai
                  Promise.resolve().then(() => {
                    this.fetchProfile(this.user.id).catch(console.error);
                  });
                }
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
    },

    // Memuat ulang profil
    async refreshProfile() {
      if (!this.user) return null;

      return this.fetchProfile(this.user.id);
    },
  },
});
