import { defineStore } from "pinia";
import { supabase } from "../services/supabase.js";

const PRODUCT_BUCKET = "product-assets";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PRODUCT_IMAGES = 5;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EDITABLE_PRODUCT_STATUSES = ["draft", "rejected"];

// Membuat slug dari nama produk.
function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Mengubah nama file agar aman untuk Storage.
function sanitizeFileName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
}

export const useProductStore = defineStore("product", {
  state: () => ({
    products: [],
    publicProducts: [],
    currentProduct: null,

    loading: false,
    saving: false,
    error: null,
  }),

  getters: {
    totalProducts: (state) => state.products.length,

    draftProducts: (state) =>
      state.products.filter((product) => product.status === "draft"),

    pendingReviewProducts: (state) =>
      state.products.filter((product) => product.status === "pending_review"),

    publishedProducts: (state) =>
      state.products.filter((product) => product.status === "published"),

    rejectedProducts: (state) =>
      state.products.filter((product) => product.status === "rejected"),

    archivedProducts: (state) =>
      state.products.filter((product) => product.status === "archived"),
  },

  actions: {
    // Mengambil identitas pengguna yang sedang login.
    async getCurrentUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (!user) {
        throw new Error("Silakan login terlebih dahulu.");
      }

      return user;
    },

    // Memastikan akun merupakan seller aktif.
    async ensureActiveSeller(userId) {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, role, account_status")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (profile.role !== "seller" || profile.account_status !== "active") {
        throw new Error("Hanya penjual aktif yang dapat mengelola produk.");
      }

      return profile;
    },

    // Mengambil semua produk milik seller.
    async fetchMyProducts(options = {}) {
      this.loading = true;
      this.error = null;

      try {
        const user = await this.getCurrentUser();

        let query = supabase
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
          .eq("seller_id", user.id)
          .order("created_at", { ascending: false });

        if (options.status) {
          query = query.eq("status", options.status);
        }

        const { data, error } = await query;

        if (error) throw error;

        this.products = (data || []).map((product) => ({
          ...product,
          product_images: (product.product_images || []).sort(
            (a, b) => a.sort_order - b.sort_order,
          ),
        }));

        return this.products;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Mengambil katalog produk publik.
    async fetchPublicProducts(options = {}) {
      this.loading = true;
      this.error = null;

      try {
        let query = supabase
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
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (options.category) {
          query = query.eq("category", options.category);
        }

        if (options.search?.trim()) {
          query = query.ilike("name", `%${options.search.trim()}%`);
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        this.publicProducts = (data || []).map((product) => ({
          ...product,
          product_images: (product.product_images || []).sort(
            (a, b) => a.sort_order - b.sort_order,
          ),
        }));

        return this.publicProducts;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Mengambil detail satu produk.
    async fetchProductById(productId) {
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await supabase
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
          .eq("id", productId)
          .single();

        if (error) throw error;

        data.product_images = (data.product_images || []).sort(
          (a, b) => a.sort_order - b.sort_order,
        );

        this.currentProduct = data;

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Membuat produk baru dengan status draft dari database.
    async createProduct(formData) {
      this.saving = true;
      this.error = null;

      try {
        const user = await this.getCurrentUser();

        await this.ensureActiveSeller(user.id);

        const payload = {
          seller_id: user.id,
          name: formData.name.trim(),
          slug: `${createSlug(formData.name)}-${Date.now()}`,
          description: formData.description.trim(),
          category: formData.category.trim(),
          price: Number(formData.price),
          stock: Number(formData.stock),
          weight_grams: Number(formData.weight_grams),
        };

        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;

        this.currentProduct = data;

        this.products.unshift({
          ...data,
          product_images: [],
        });

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.saving = false;
      }
    },

    // Mengubah informasi produk.
    async updateProduct(productId, formData) {
      this.saving = true;
      this.error = null;

      try {
        const user = await this.getCurrentUser();

        await this.ensureActiveSeller(user.id);

        const existingProduct = this.products.find(
          (product) => product.id === productId,
        );

        if (
          existingProduct &&
          !EDITABLE_PRODUCT_STATUSES.includes(existingProduct.status)
        ) {
          throw new Error(
            "Produk hanya dapat diedit jika berstatus draft atau ditolak.",
          );
        }

        const payload = {};

        if (formData.name !== undefined) {
          const name = formData.name.trim();

          if (name.length < 3) {
            throw new Error("Nama produk minimal 3 karakter.");
          }

          payload.name = name;
          payload.slug = `${createSlug(name)}-${Date.now()}`;
        }

        if (formData.description !== undefined) {
          const description = formData.description.trim();

          if (description.length < 10) {
            throw new Error("Deskripsi minimal 10 karakter.");
          }

          payload.description = description;
        }

        if (formData.category !== undefined) {
          const category = formData.category.trim();

          if (category.length < 2) {
            throw new Error("Kategori minimal 2 karakter.");
          }

          payload.category = category;
        }

        if (formData.price !== undefined) {
          const price = Number(formData.price);

          if (!Number.isFinite(price) || price < 0) {
            throw new Error("Harga produk tidak valid.");
          }

          payload.price = price;
        }

        if (formData.stock !== undefined) {
          const stock = Number(formData.stock);

          if (!Number.isInteger(stock) || stock < 0) {
            throw new Error("Stok produk tidak valid.");
          }

          payload.stock = stock;
        }

        if (formData.weight_grams !== undefined) {
          const weight = Number(formData.weight_grams);

          if (!Number.isInteger(weight) || weight < 0) {
            throw new Error("Berat produk tidak valid.");
          }

          payload.weight_grams = weight;
        }

        if (Object.keys(payload).length === 0) {
          throw new Error("Tidak ada perubahan produk.");
        }

        const { data, error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productId)
          .eq("seller_id", user.id)
          .select()
          .single();

        if (error) throw error;

        const index = this.products.findIndex(
          (product) => product.id === productId,
        );

        if (index !== -1) {
          this.products[index] = {
            ...this.products[index],
            ...data,
          };
        }

        if (this.currentProduct?.id === productId) {
          this.currentProduct = {
            ...this.currentProduct,
            ...data,
          };
        }

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.saving = false;
      }
    },

    // Mengunggah beberapa foto produk.
    async uploadProductImages(productId, files) {
      this.saving = true;
      this.error = null;

      const uploadedPaths = [];

      try {
        const user = await this.getCurrentUser();

        await this.ensureActiveSeller(user.id);

        const selectedFiles = Array.from(files || []);

        if (selectedFiles.length === 0) {
          throw new Error("Pilih minimal satu foto produk.");
        }

        const { data: product, error: productError } = await supabase
          .from("products")
          .select("id, seller_id, status")
          .eq("id", productId)
          .eq("seller_id", user.id)
          .single();

        if (productError) throw productError;

        if (!EDITABLE_PRODUCT_STATUSES.includes(product.status)) {
          throw new Error(
            "Foto hanya dapat diubah pada produk draft atau ditolak.",
          );
        }

        const { count, error: countError } = await supabase
          .from("product_images")
          .select("id", { count: "exact", head: true })
          .eq("product_id", productId);

        if (countError) throw countError;

        if ((count || 0) + selectedFiles.length > MAX_PRODUCT_IMAGES) {
          throw new Error(
            `Maksimal ${MAX_PRODUCT_IMAGES} foto untuk setiap produk.`,
          );
        }

        for (const file of selectedFiles) {
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            throw new Error("Semua foto harus berformat JPG, PNG, atau WEBP.");
          }

          if (file.size > MAX_IMAGE_SIZE) {
            throw new Error("Ukuran setiap foto maksimal 5 MB.");
          }
        }

        const imagePayloads = [];

        for (let index = 0; index < selectedFiles.length; index++) {
          const file = selectedFiles[index];

          const extension =
            file.type === "image/png"
              ? "png"
              : file.type === "image/webp"
                ? "webp"
                : "jpg";

          const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));

          const filePath =
            `${user.id}/${product.id}/` +
            `${Date.now()}-${index}-${safeName}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from(PRODUCT_BUCKET)
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type,
            });

          if (uploadError) throw uploadError;

          uploadedPaths.push(filePath);

          const { data: publicUrlData } = supabase.storage
            .from(PRODUCT_BUCKET)
            .getPublicUrl(filePath);

          imagePayloads.push({
            product_id: productId,
            image_url: publicUrlData.publicUrl,
            image_path: filePath,
            sort_order: (count || 0) + index,
          });
        }

        const { data: images, error: insertError } = await supabase
          .from("product_images")
          .insert(imagePayloads)
          .select();

        if (insertError) throw insertError;

        if (this.currentProduct?.id === productId) {
          this.currentProduct.product_images = [
            ...(this.currentProduct.product_images || []),
            ...images,
          ].sort((a, b) => a.sort_order - b.sort_order);
        }

        const productIndex = this.products.findIndex(
          (item) => item.id === productId,
        );

        if (productIndex !== -1) {
          this.products[productIndex].product_images = [
            ...(this.products[productIndex].product_images || []),
            ...images,
          ].sort((a, b) => a.sort_order - b.sort_order);
        }

        return images;
      } catch (error) {
        // Bersihkan file jika penyimpanan database gagal.
        if (uploadedPaths.length > 0) {
          const { error: cleanupError } = await supabase.storage
            .from(PRODUCT_BUCKET)
            .remove(uploadedPaths);

          if (cleanupError) {
            console.warn("Gagal membersihkan file upload:", cleanupError);
          }
        }

        this.error = error.message;
        throw error;
      } finally {
        this.saving = false;
      }
    },

    // Menghapus satu foto produk.
    async deleteProductImage(imageId) {
      this.saving = true;
      this.error = null;

      try {
        const user = await this.getCurrentUser();

        await this.ensureActiveSeller(user.id);

        const { data: image, error: fetchError } = await supabase
          .from("product_images")
          .select(
            `
            id,
            product_id,
            image_path,
            products!inner (
              id,
              seller_id,
              status
            )
          `,
          )
          .eq("id", imageId)
          .eq("products.seller_id", user.id)
          .single();

        if (fetchError) throw fetchError;

        if (!EDITABLE_PRODUCT_STATUSES.includes(image.products.status)) {
          throw new Error(
            "Foto hanya dapat dihapus pada produk draft atau ditolak.",
          );
        }

        const { error: removeError } = await supabase.storage
          .from(PRODUCT_BUCKET)
          .remove([image.image_path]);

        if (removeError) throw removeError;

        const { error: deleteError } = await supabase
          .from("product_images")
          .delete()
          .eq("id", imageId)
          .eq("product_id", image.product_id);

        if (deleteError) throw deleteError;

        if (this.currentProduct?.id === image.product_id) {
          this.currentProduct.product_images =
            this.currentProduct.product_images.filter(
              (item) => item.id !== imageId,
            );
        }

        const product = this.products.find(
          (item) => item.id === image.product_id,
        );

        if (product) {
          product.product_images = product.product_images.filter(
            (item) => item.id !== imageId,
          );
        }

        return true;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.saving = false;
      }
    },

    // Mengajukan produk kepada Super Admin untuk direview.
    async submitProductForReview(productId) {
      this.saving = true;
      this.error = null;

      try {
        const user = await this.getCurrentUser();

        await this.ensureActiveSeller(user.id);

        const { data, error } = await supabase.rpc(
          "submit_product_for_review",
          {
            p_product_id: productId,
          },
        );

        if (error) throw error;

        const updatedProduct = Array.isArray(data) ? data[0] : data;

        const index = this.products.findIndex(
          (product) => product.id === productId,
        );

        if (index !== -1) {
          this.products[index] = {
            ...this.products[index],
            ...updatedProduct,
          };
        }

        if (this.currentProduct?.id === productId) {
          this.currentProduct = {
            ...this.currentProduct,
            ...updatedProduct,
          };
        }

        return updatedProduct;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.saving = false;
      }
    },

    // Arsipkan produk melalui RPC.
    async archiveProduct(productId) {
      this.saving = true;
      this.error = null;

      try {
        const user = await this.getCurrentUser();

        await this.ensureActiveSeller(user.id);

        const { data, error } = await supabase.rpc("archive_my_product", {
          p_product_id: productId,
        });

        if (error) throw error;

        const updatedProduct = Array.isArray(data) ? data[0] : data;

        const index = this.products.findIndex(
          (product) => product.id === productId,
        );

        if (index !== -1) {
          this.products[index] = {
            ...this.products[index],
            ...updatedProduct,
          };
        }

        if (this.currentProduct?.id === productId) {
          this.currentProduct = {
            ...this.currentProduct,
            ...updatedProduct,
          };
        }

        return updatedProduct;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.saving = false;
      }
    },

    // Membersihkan detail produk yang sedang dibuka.
    clearCurrentProduct() {
      this.currentProduct = null;
    },

    // Membersihkan error.
    clearError() {
      this.error = null;
    },
  },
});
