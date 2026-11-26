import { defineStore } from "pinia";
import { supabase } from "../services/supabase.js";
import { offlineDB } from "@/services/offline/database.js";

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

const PUBLIC_PRODUCT_CACHE_KEY = "public-products";

const MAX_CACHED_IMAGE_SIZE = 2 * 1024 * 1024;

const activeCachedImageUrls = new Set();

function revokeCachedImageUrls() {
  activeCachedImageUrls.forEach((url) => {
    URL.revokeObjectURL(url);
  });

  activeCachedImageUrls.clear();
}

// Menyimpan gambar utama setiap produk ke IndexedDB.
async function cachePrimaryProductImages(products) {
  const tasks = products.map(async (product) => {
    const imageUrl = product.product_images?.[0]?.image_url;

    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) return;

      const blob = await response.blob();

      // Hindari menyimpan gambar yang terlalu besar.
      if (
        !blob.type.startsWith("image/") ||
        blob.size > MAX_CACHED_IMAGE_SIZE
      ) {
        return;
      }

      await offlineDB.productImageCache.put({
        url: imageUrl,
        blob,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Gagal menyimpan cache gambar:", imageUrl, error);
    }
  });

  await Promise.allSettled(tasks);
}

// Membaca produk dari IndexedDB ketika offline.
async function getCachedPublicProducts(cacheKey) {
  const cached = await offlineDB.publicProductCache.get(cacheKey);

  if (!cached?.products?.length) {
    return null;
  }

  revokeCachedImageUrls();

  const products = await Promise.all(
    cached.products.map(async (product) => {
      const copiedProduct = {
        ...product,
        product_images: [...(product.product_images || [])],
      };

      const firstImage = copiedProduct.product_images[0];

      if (firstImage?.image_url) {
        const cachedImage = await offlineDB.productImageCache.get(
          firstImage.image_url,
        );

        if (cachedImage?.blob) {
          const localUrl = URL.createObjectURL(cachedImage.blob);

          activeCachedImageUrls.add(localUrl);

          copiedProduct.product_images[0] = {
            ...firstImage,
            image_url: localUrl,
          };
        }
      }

      return copiedProduct;
    }),
  );

  return products;
}

// Menyimpan seluruh gambar detail produk ke IndexedDB.
async function cacheProductDetailImages(product) {
  const images = product.product_images || [];

  const tasks = images.map(async (image) => {
    if (!image.image_url) return;

    try {
      const response = await fetch(image.image_url);

      if (!response.ok) return;

      const blob = await response.blob();

      if (
        !blob.type.startsWith("image/") ||
        blob.size > MAX_CACHED_IMAGE_SIZE
      ) {
        return;
      }

      await offlineDB.productImageCache.put({
        url: image.image_url,
        blob,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn(
        "Gagal menyimpan gambar detail produk:",
        image.image_url,
        error,
      );
    }
  });

  await Promise.allSettled(tasks);
}

// Membaca detail produk dari IndexedDB.

// Membaca detail produk dari cache detail atau cache katalog.
async function getCachedProductDetail(productId) {
  const cacheKey = `product-detail:${productId}`;

  // 1. Cari cache detail produk terlebih dahulu.
  const cachedDetail = await offlineDB.publicProductCache.get(cacheKey);

  let product = cachedDetail?.product || null;

  // 2. Jika belum ada, cari produk dari seluruh cache katalog.
  if (!product) {
    const catalogCaches = await offlineDB.publicProductCache.toArray();

    for (const cache of catalogCaches) {
      if (!Array.isArray(cache.products)) continue;

      const foundProduct = cache.products.find(
        (item) => String(item.id) === String(productId),
      );

      if (foundProduct) {
        product = foundProduct;
        break;
      }
    }
  }

  if (!product) {
    return null;
  }

  // Salin data agar cache asli tidak ikut berubah.
  const copiedProduct = {
    ...product,
    product_images: [...(product.product_images || [])],
  };

  // 3. Ganti URL gambar dengan Blob lokal jika tersedia.
  const images = await Promise.all(
    copiedProduct.product_images.map(async (image) => {
      if (!image.image_url) return image;

      try {
        const cachedImage = await offlineDB.productImageCache.get(
          image.image_url,
        );

        if (!cachedImage?.blob) {
          return image;
        }

        const localUrl = URL.createObjectURL(cachedImage.blob);

        activeCachedImageUrls.add(localUrl);

        return {
          ...image,
          image_url: localUrl,
        };
      } catch (error) {
        console.warn("Gagal membaca gambar lokal:", error);
        return image;
      }
    }),
  );

  copiedProduct.product_images = images.sort(
    (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
  );

  return copiedProduct;
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

      const cacheKey = [
        PUBLIC_PRODUCT_CACHE_KEY,
        options.category || "all",
        options.search?.trim() || "all",
        options.limit || "all",
      ].join(":");

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

        const normalizedProducts = (data || []).map((product) => ({
          ...product,
          product_images: (product.product_images || []).sort(
            (a, b) => a.sort_order - b.sort_order,
          ),
        }));

        // Simpan data katalog ke IndexedDB.
        await offlineDB.publicProductCache.put({
          key: cacheKey,
          products: normalizedProducts,
          updatedAt: new Date().toISOString(),
        });

        // Simpan gambar utama agar bisa ditampilkan offline.
        await cachePrimaryProductImages(normalizedProducts);

        this.publicProducts = normalizedProducts;

        return this.publicProducts;
      } catch (error) {
        console.warn(
          "Gagal mengambil produk dari Supabase. Mencoba cache lokal.",
          error,
        );

        try {
          const cachedProducts = await getCachedPublicProducts(cacheKey);

          if (cachedProducts) {
            this.publicProducts = cachedProducts;
            this.error = null;

            return this.publicProducts;
          }
        } catch (cacheError) {
          console.error("Gagal membaca cache produk:", cacheError);
        }

        this.error = error.message;

        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Mengambil detail satu produk.

    // Mengambil detail satu produk dengan dukungan offline.
    async fetchProductById(productId) {
      this.loading = true;
      this.error = null;

      const cacheKey = `product-detail:${productId}`;

      try {
        // Tetap mengambil data terbaru dari Supabase ketika online.
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

        const normalizedProduct = {
          ...data,
          product_images: (data.product_images || []).sort(
            (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
          ),
        };

        // Simpan informasi detail produk.
        await offlineDB.publicProductCache.put({
          key: cacheKey,
          product: normalizedProduct,
          updatedAt: new Date().toISOString(),
        });

        // Simpan seluruh gambar produk.
        await cacheProductDetailImages(normalizedProduct);

        this.currentProduct = normalizedProduct;

        return normalizedProduct;
      } catch (error) {
        console.warn(
          "Gagal mengambil detail dari Supabase. Mencoba cache lokal.",
          error,
        );

        try {
          const cachedProduct = await getCachedProductDetail(productId);

          if (cachedProduct) {
            this.currentProduct = cachedProduct;
            this.error = null;

            return cachedProduct;
          }
        } catch (cacheError) {
          console.error("Gagal membaca detail produk dari cache:", cacheError);
        }

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
