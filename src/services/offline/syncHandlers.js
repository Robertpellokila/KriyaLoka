import { supabase } from "../supabase.js";
import { registerSyncHandler } from "./syncService.js";

// Memastikan operasi hanya dijalankan oleh pemilik data
const verifyUser = async (operation) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  if (!user || user.id !== operation.userId) {
    throw new Error("Sesi pengguna tidak valid untuk sinkronisasi.");
  }

  return user;
};

// Memeriksa ulang produk dan stok dari server
const verifyProductStock = async (productId, quantity) => {
  const { data: product, error } = await supabase
    .from("products")
    .select("id, stock, status")
    .eq("id", productId)
    .maybeSingle();

  if (error) throw error;

  if (!product || product.status !== "published") {
    throw new Error("Produk sudah tidak tersedia.");
  }

  if (quantity > Number(product.stock)) {
    throw new Error(`Stok tidak mencukupi. Stok tersedia: ${product.stock}.`);
  }

  return product;
};

// Menyimpan jumlah akhir produk di keranjang
const syncCartQuantity = async (payload, operation) => {
  const user = await verifyUser(operation);

  const productId = payload?.productId;
  const quantity = Number(payload?.quantity);

  if (!productId || !Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Data keranjang tidak valid.");
  }

  await verifyProductStock(productId, quantity);

  const { error } = await supabase.from("cart_items").upsert(
    {
      user_id: user.id,
      product_id: productId,
      quantity,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,product_id",
    },
  );

  if (error) throw error;
};

// Menghapus produk dari keranjang
const syncCartRemove = async (payload, operation) => {
  const user = await verifyUser(operation);

  const productId = payload?.productId;

  if (!productId) {
    throw new Error("Product ID tidak valid.");
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) throw error;
};

// Mendaftarkan seluruh handler keranjang
export const registerCartSyncHandlers = () => {
  registerSyncHandler("cart_set_quantity", syncCartQuantity);

  registerSyncHandler("cart_remove", syncCartRemove);
};

export default registerCartSyncHandlers;
