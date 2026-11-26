import { defineStore } from "pinia";
import { supabase } from "@/services/supabase.js";

import { offlineDB } from "@/services/offline/database.js";
import { queueService } from "@/services/offline/queueService.js";

const CART_PLACEHOLDER =
  "https://placehold.co/300x300/F3EBDD/943C14?text=KriyaLoka";

// Mengambil keranjang lokal milik pengguna
const getLocalCart = async (userId) => {
  const rows = await offlineDB.cartItems
    .where("userId")
    .equals(userId)
    .toArray();

  return rows.map((row) => ({
    id: row.productId,
    cartItemId: row.cartItemId || null,
    name: row.name,
    artisan: row.artisan || "Pengrajin KriyaLoka",
    image: row.image || CART_PLACEHOLDER,
    price: Number(row.price || 0),
    stock: Number(row.stock || 0),
    quantity: Number(row.quantity || 1),
    status: row.status,
    isOffline: true,
  }));
};

// Menyimpan satu produk ke keranjang lokal
const saveLocalCartItem = async (userId, item) => {
  const existing = await offlineDB.cartItems
    .where("[userId+productId]")
    .equals([userId, item.productId])
    .first();

  const data = {
    userId,
    productId: item.productId,
    cartItemId: item.cartItemId || null,
    name: item.name,
    artisan: item.artisan || "Pengrajin KriyaLoka",
    image: item.image || CART_PLACEHOLDER,
    price: Number(item.price || 0),
    stock: Number(item.stock || 0),
    quantity: Number(item.quantity || 1),
    status: item.status,
    updatedAt: new Date().toISOString(),
  };

  if (existing) {
    await offlineDB.cartItems.update(existing.id, data);
  } else {
    await offlineDB.cartItems.add(data);
  }
};

// Menyimpan seluruh keranjang hasil fetch Supabase
const cacheCart = async (userId, items) => {
  await offlineDB.transaction("rw", offlineDB.cartItems, async () => {
    await offlineDB.cartItems.where("userId").equals(userId).delete();

    if (items.length) {
      await offlineDB.cartItems.bulkAdd(
        items.map((item) => ({
          userId,
          productId: item.id,
          cartItemId: item.cartItemId,
          name: item.name,
          artisan: item.artisan,
          image: item.image,
          price: item.price,
          stock: item.stock,
          quantity: item.quantity,
          status: item.status,
          updatedAt: new Date().toISOString(),
        })),
      );
    }
  });
};

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
    // Mengambil ID pengguna dari sesi lokal Supabase.
    // getSession() dapat membaca sesi yang tersimpan saat offline.
    async getUserId() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session?.user) {
        throw new Error("Silakan login terlebih dahulu.");
      }

      return session.user.id;
    },

    // Ambil keranjang buyer dari Supabase atau IndexedDB
    async fetchCart() {
      this.loading = true;
      this.error = null;

      try {
        const userId = await this.getUserId();

        // Jika offline, gunakan IndexedDB
        if (!navigator.onLine) {
          this.items = await getLocalCart(userId);

          return {
            success: true,
            items: this.items,
            offline: true,
          };
        }

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

        const mappedItems = (data || [])
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
              image: images[0]?.image_url || CART_PLACEHOLDER,
              price: Number(row.product.price || 0),
              stock: Number(row.product.stock || 0),
              quantity: Number(row.quantity || 1),
              status: row.product.status,
              isOffline: false,
            };
          });

        this.items = mappedItems;

        // Perbarui cache lokal
        await cacheCart(userId, mappedItems);

        return {
          success: true,
          items: this.items,
        };
      } catch (error) {
        this.error = error.message;
        console.error("Gagal mengambil keranjang:", error);

        // Jika koneksi terputus ketika request berlangsung,
        // coba tampilkan cache lokal.
        if (!navigator.onLine) {
          try {
            const userId = await this.getUserId();
            this.items = await getLocalCart(userId);

            return {
              success: true,
              items: this.items,
              offline: true,
            };
          } catch (localError) {
            this.error = localError.message;
          }
        }

        return {
          success: false,
          message: this.error,
        };
      } finally {
        this.loading = false;
      }
    },

    // Tambahkan produk ke keranjang
    async addItem(product, quantity = 1) {
      this.saving = true;

      try {
        const userId = await this.getUserId();
        const requestedQuantity = Number(quantity);

        if (!product?.id) {
          return {
            success: false,
            message: "Data produk tidak valid.",
          };
        }

        if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
          return {
            success: false,
            message: "Jumlah produk tidak valid.",
          };
        }

        // MODE OFFLINE
        if (!navigator.onLine) {
          if (product.status !== "published") {
            return {
              success: false,
              message: "Produk tidak tersedia untuk dibeli.",
            };
          }

          const stock = Number(product.stock || 0);

          if (stock <= 0) {
            return {
              success: false,
              message: "Stok produk sedang habis.",
            };
          }

          const existing = await offlineDB.cartItems
            .where("[userId+productId]")
            .equals([userId, product.id])
            .first();

          const newQuantity =
            Number(existing?.quantity || 0) + requestedQuantity;

          if (newQuantity > stock) {
            return {
              success: false,
              message: `Stok tersedia hanya ${stock} produk.`,
            };
          }

          const item = {
            productId: product.id,
            cartItemId: existing?.cartItemId || null,
            name: product.name,
            artisan: product.artisan || "Pengrajin KriyaLoka",
            image:
              product.image ||
              product.image_url ||
              product.product_images?.[0]?.image_url ||
              CART_PLACEHOLDER,
            price: Number(product.price || 0),
            stock,
            quantity: newQuantity,
            status: product.status,
          };

          await saveLocalCartItem(userId, item);

          await queueService.enqueueLatest({
            userId,
            type: "cart_set_quantity",
            payload: {
              productId: product.id,
              quantity: newQuantity,
            },
          });

          this.items = await getLocalCart(userId);

          return {
            success: true,
            offline: true,
            message: "Produk disimpan di keranjang offline.",
          };
        }

        // MODE ONLINE: ambil data produk terbaru
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
        console.error("Gagal menambahkan produk:", error);

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

        // MODE OFFLINE
        if (!navigator.onLine) {
          await saveLocalCartItem(userId, {
            ...item,
            productId,
            quantity: newQuantity,
          });

          await queueService.enqueueLatest({
            userId,
            type: "cart_set_quantity",
            payload: {
              productId,
              quantity: newQuantity,
            },
          });

          this.items = await getLocalCart(userId);

          return {
            success: true,
            offline: true,
            message: "Jumlah produk diperbarui secara offline.",
          };
        }

        // MODE ONLINE
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

        // MODE OFFLINE
        if (!navigator.onLine) {
          await offlineDB.cartItems
            .where("[userId+productId]")
            .equals([userId, productId])
            .delete();

          await queueService.enqueueLatest({
            userId,
            type: "cart_remove",
            payload: { productId },
          });

          this.items = await getLocalCart(userId);

          return {
            success: true,
            offline: true,
            message: "Produk dihapus dari keranjang offline.",
          };
        }

        // MODE ONLINE
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);

        if (error) throw error;

        await offlineDB.cartItems
          .where("[userId+productId]")
          .equals([userId, productId])
          .delete();

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

        // MODE OFFLINE
        if (!navigator.onLine) {
          const localItems = await getLocalCart(userId);

          for (const item of localItems) {
            await queueService.enqueueLatest({
              userId,
              type: "cart_remove",
              payload: {
                productId: item.id,
              },
            });
          }

          await offlineDB.cartItems.where("userId").equals(userId).delete();

          this.items = [];

          return {
            success: true,
            offline: true,
            message: "Keranjang dikosongkan secara offline.",
          };
        }

        // MODE ONLINE
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", userId);

        if (error) throw error;

        await offlineDB.cartItems.where("userId").equals(userId).delete();

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

    // Reset state Pinia saat logout.
    // Data IndexedDB tidak dihapus di sini agar tidak menghapus
    // data offline secara tidak sengaja.
    resetCart() {
      this.items = [];
      this.error = null;
      this.loading = false;
      this.saving = false;
    },
  },
});
