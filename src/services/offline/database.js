import Dexie from "dexie";

export const offlineDB = new Dexie("KriyaLokaOfflineDB");

offlineDB.version(3).stores({
  cartItems: "++id, userId, productId, [userId+productId]",
  wishlistItems: "++id, userId, productId, [userId+productId]",

  pendingProducts: "localId, userId, syncStatus, updatedAt",

  syncQueue:
    "++id, &operationId, userId, type, status, createdAt, [userId+status]",

  pendingImages: "++id, localProductId, userId, syncStatus",
  productIdMappings: "localId, serverId, userId",

  // Cache katalog publik
  publicProductCache: "key, updatedAt",

  // Cache gambar produk
  productImageCache: "url, updatedAt",
});

export default offlineDB;
