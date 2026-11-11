import { defineStore } from "pinia";
import { supabase } from "../services/supabase.js";

export const useSellerStore = defineStore("sellerStore", {
  state: () => ({
    profile: null,
    loading: false,
    saving: false,
    error: null,
  }),

  getters: {
    hasStore: (state) => Boolean(state.profile),
  },

  actions: {
    async fetchMyStore() {
      this.loading = true;
      this.error = null;

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("Silakan login terlebih dahulu.");

        const { data, error } = await supabase
          .from("seller_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        this.profile = data;
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async saveStore(formData) {
      this.saving = true;
      this.error = null;

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("Sesi login tidak ditemukan.");

        const payload = {
          id: user.id,
          store_name: formData.store_name.trim(),
          category: formData.category,
          description: formData.description.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          province: formData.province.trim() || null,
          city: formData.city.trim() || null,
          district: formData.district.trim() || null,
          postal_code: formData.postal_code.trim() || null,
          address: formData.address.trim(),
        };

        const { data, error } = await supabase
          .from("seller_profiles")
          .upsert(payload, { onConflict: "id" })
          .select()
          .single();

        if (error) throw error;

        this.profile = data;
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.saving = false;
      }
    },

    async uploadStoreImage(type, file) {
      if (!["logo", "banner"].includes(type)) {
        throw new Error("Jenis gambar tidak valid.");
      }

      if (!file) {
        throw new Error("Pilih gambar terlebih dahulu.");
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(file.type)) {
        throw new Error("Format gambar harus JPG, PNG, atau WEBP.");
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Ukuran gambar maksimal 2 MB.");
      }

      this.saving = true;
      this.error = null;

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) throw new Error("Silakan login terlebih dahulu.");

        const { data: account, error: accountError } = await supabase
          .from("profiles")
          .select("role, account_status")
          .eq("id", user.id)
          .single();

        if (accountError) throw accountError;

        if (
          account.role !== "seller" ||
          !["pending", "active"].includes(account.account_status)
        ) {
          throw new Error("Akun Anda belum diizinkan mengunggah gambar.");
        }

        // Pastikan draft profil toko sudah tersedia.
        let currentProfile = this.profile;

        if (!currentProfile) {
          const { data: existingProfile, error: fetchError } = await supabase
            .from("seller_profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (fetchError) throw fetchError;

          currentProfile = existingProfile;

          if (!currentProfile) {
            const { data: newProfile, error: insertError } = await supabase
              .from("seller_profiles")
              .insert({ id: user.id })
              .select()
              .single();

            if (insertError) throw insertError;

            currentProfile = newProfile;
          }

          this.profile = currentProfile;
        }

        const urlField = type === "logo" ? "logo_url" : "banner_url";

        const pathField = type === "logo" ? "logo_path" : "banner_path";

        const oldPath = currentProfile?.[pathField] || null;

        const extension =
          file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
              ? "webp"
              : "jpg";

        const filePath = `${user.id}/${type}-${Date.now()}.${extension}`;

        // Upload gambar.
        const { error: uploadError } = await supabase.storage
          .from("seller-assets")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("seller-assets")
          .getPublicUrl(filePath);

        const imageUrl = publicUrlData.publicUrl;

        // Simpan URL dan path ke profil toko.
        const { data, error: updateError } = await supabase
          .from("seller_profiles")
          .update({
            [urlField]: imageUrl,
            [pathField]: filePath,
          })
          .eq("id", user.id)
          .select()
          .single();

        if (updateError) {
          await supabase.storage.from("seller-assets").remove([filePath]);

          throw updateError;
        }

        this.profile = data;

        // Hapus gambar sebelumnya setelah gambar baru tersimpan.
        if (oldPath && oldPath !== filePath) {
          const { error: removeError } = await supabase.storage
            .from("seller-assets")
            .remove([oldPath]);

          if (removeError) {
            console.warn("Gambar lama belum berhasil dihapus:", removeError);
          }
        }

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.saving = false;
      }
    },
  },
});
