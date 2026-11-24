import { defineStore } from "pinia";
import { supabase } from "@/services/supabase.js";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    error: null,
  }),

  getters: {
    totalItems: (state) => {
      return state.items.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0,
      );
    },

    subtotal: (state) => {
      return state.items.reduce(
        (total, item) =>
          total + Number(item.price || 0) * Number(item.quantity || 0),
        0,
      );
    },
  },

  actions: {
    async getUserId() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user) throw new Error("Silakan login terlebih dahulu.");

      return user.id;
    },

    // Ambil keranjang buyer dari Supabase
    async fetchCart() {
      this.loading = true;
      this.error = null;

      try {
        const userId = await this.getUserId();

        const { data, error } = await supabase
          .from("cart_items")
          .select(
            `
            id,
            user_id,
            product_id,
            quantity,
            product:products (
              id,
              name,
              price,
              stock,
              status,
              product_images (
                image_url,
                sort_order
              )
            )
          `,
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        this.items = (data || [])
          .filter((row) => row.product)
          .map((row) => {
            const images = [...(row.product.product_images || [])].sort(
              (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
            );

            return {
              id: row.product.id,
              cartItemId: row.id,
              name: row.product.name,
              artisan: "Pengrajin KriyaLoka",
              image:
                images[0]?.image_url ||
                "https://placehold.co/300x300/F3EBDD/943C14?text=KriyaLoka",
              price: Number(row.product.price || 0),
              stock: Number(row.product.stock || 0),
              quantity: Number(row.quantity || 1),
              status: row.product.status,
            };
          });

        return {
          success: true,
          items: this.items,
        };
      } catch (error) {
        this.error = error.message;
        console.error("Gagal mengambil keranjang:", error);

        return {
          success: false,
          message: error.message,
        };
      } finally {
        this.loading = false;
      }
    },

    // Tambahkan produk ke keranjang Supabase
    async addItem(product, quantity = 1) {
      this.saving = true;

      try {
        const userId = await this.getUserId();

        const requestedQuantity = Number(quantity);

        if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
          return {
            success: false,
            message: "Jumlah produk tidak valid.",
          };
        }

        // Ambil data produk terbaru dari database
        const { data: latestProduct, error: productError } = await supabase
          .from("products")
          .select("id, name, price, stock, status")
          .eq("id", product.id)
          .maybeSingle();

        if (productError) throw productError;

        if (!latestProduct || latestProduct.status !== "published") {
          return {
            success: false,
            message: "Produk tidak tersedia untuk dibeli.",
          };
        }

        const stock = Number(latestProduct.stock || 0);

        if (stock <= 0) {
          return {
            success: false,
            message: "Stok produk sedang habis.",
          };
        }

        // Periksa apakah produk sudah ada di keranjang
        const { data: existingItem, error: existingError } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", userId)
          .eq("product_id", product.id)
          .maybeSingle();

        if (existingError) throw existingError;

        const newQuantity =
          Number(existingItem?.quantity || 0) + requestedQuantity;

        if (newQuantity > stock) {
          return {
            success: false,
            message: `Stok tersedia hanya ${stock} produk.`,
          };
        }

        let saveError;

        if (existingItem) {
          const { error } = await supabase
            .from("cart_items")
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id)
            .eq("user_id", userId);

          saveError = error;
        } else {
          const { error } = await supabase.from("cart_items").insert({
            user_id: userId,
            product_id: product.id,
            quantity: requestedQuantity,
          });

          saveError = error;
        }

        if (saveError) throw saveError;

        await this.fetchCart();

        return {
          success: true,
          message: "Produk berhasil ditambahkan ke keranjang.",
        };
      } catch (error) {
        console.error("Gagal menambahkan produk ke keranjang:", error);

        return {
          success: false,
          message: error.message || "Gagal menambahkan produk.",
        };
      } finally {
        this.saving = false;
      }
    },

    // Perbarui jumlah produk
    async updateQuantity(productId, quantity) {
      try {
        const userId = await this.getUserId();
        const newQuantity = Number(quantity);

        if (!Number.isInteger(newQuantity)) {
          return {
            success: false,
            message: "Jumlah produk tidak valid.",
          };
        }

        if (newQuantity <= 0) {
          return await this.removeItem(productId);
        }

        const item = this.items.find((item) => item.id === productId);

        if (!item) {
          return {
            success: false,
            message: "Produk tidak ditemukan di keranjang.",
          };
        }

        if (newQuantity > item.stock) {
          return {
            success: false,
            message: `Stok tersedia hanya ${item.stock} produk.`,
          };
        }

        const { error } = await supabase
          .from("cart_items")
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("product_id", productId);

        if (error) throw error;

        await this.fetchCart();

        return {
          success: true,
          message: "Jumlah produk berhasil diperbarui.",
        };
      } catch (error) {
        console.error("Gagal memperbarui keranjang:", error);

        return {
          success: false,
          message: error.message || "Gagal memperbarui jumlah produk.",
        };
      }
    },

    // Hapus satu produk
    async removeItem(productId) {
      try {
        const userId = await this.getUserId();

        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);

        if (error) throw error;

        this.items = this.items.filter((item) => item.id !== productId);

        return {
          success: true,
          message: "Produk berhasil dihapus dari keranjang.",
        };
      } catch (error) {
        console.error("Gagal menghapus produk:", error);

        return {
          success: false,
          message: error.message || "Gagal menghapus produk.",
        };
      }
    },

    // Kosongkan seluruh keranjang buyer
    async clearCart() {
      try {
        const userId = await this.getUserId();

        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId);

        if (error) throw error;

        this.items = [];

        return {
          success: true,
          message: "Keranjang berhasil dikosongkan.",
        };
      } catch (error) {
        console.error("Gagal mengosongkan keranjang:", error);

        return {
          success: false,
          message: error.message || "Gagal mengosongkan keranjang.",
        };
      }
    },

    // Reset state saat logout
    resetCart() {
      this.items = [];
      this.error = null;
      this.loading = false;
      this.saving = false;
    },
  },
});
