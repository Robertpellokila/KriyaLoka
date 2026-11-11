import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [],
  }),

  getters: {
    totalItems: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0);
    },

    subtotal: (state) => {
      return state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );
    },
  },

  actions: {
    addItem(product, quantity = 1) {
      const existingItem = this.items.find((item) => item.id === product.id);

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        if (newQuantity > product.stock) {
          return {
            success: false,
            message: `Stok tersedia hanya ${product.stock} produk.`,
          };
        }

        existingItem.quantity = newQuantity;
      } else {
        if (quantity > product.stock) {
          return {
            success: false,
            message: `Stok tersedia hanya ${product.stock} produk.`,
          };
        }

        this.items.push({
          id: product.id,
          name: product.name,
          artisan: product.artisan,
          image: product.image,
          price: product.price,
          stock: product.stock,
          quantity,
        });
      }

      return {
        success: true,
        message: "Produk berhasil ditambahkan ke keranjang.",
      };
    },

    updateQuantity(productId, quantity) {
      const item = this.items.find((item) => item.id === productId);

      if (!item) return;

      if (quantity <= 0) {
        this.removeItem(productId);
        return;
      }

      item.quantity = Math.min(quantity, item.stock);
    },

    removeItem(productId) {
      this.items = this.items.filter((item) => item.id !== productId);
    },

    clearCart() {
      this.items = [];
    },
  },
});
