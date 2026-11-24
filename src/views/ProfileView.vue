<script setup>
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useRouter } from "vue-router";

import {
  UserRound,
  LayoutDashboard,
  MapPin,
  Package,
  Heart,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  Clock,
  ShoppingBag,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Save,
  Download,
  Copy,
  Upload,
} from "lucide-vue-next";

import { useAuthStore } from "../stores/auth.js";
import { supabase } from "../services/supabase.js";
import AppToast from "@/components/ui/AppToast.vue";
import AppModal from "@/components/ui/AppModal.vue";
import ProfileSidebar from "@/components/profile/ProfileSidebar.vue";
import ProfileOverview from "@/components/profile/ProfileOverview.vue";
import ProfileInformation from "@/components/profile/ProfileInformation.vue";
import ProfileAddresses from "@/components/profile/ProfileAddresses.vue";
import ProfileOrders from "@/components/profile/ProfileOrders.vue";
import ProfileWishlist from "@/components/profile/ProfileWishlist.vue";
import ProfileReviews from "@/components/profile/ProfileReviews.vue";
import ProfileSettings from "@/components/profile/ProfileSettings.vue";

import "@/components/profile/profile.css";
// ==========================================
// STORE & ROUTER
// ==========================================

const authStore = useAuthStore();
const router = useRouter();

// ==========================================
// STATE
// ==========================================

const activeSection = ref("overview");
const mobileSidebarOpen = ref(false);

const loading = ref(true);
const saving = ref(false);
const loadingAddresses = ref(false);
const loadingOrders = ref(false);

const orders = ref([]);
const addresses = ref([]);

// ==========================================
// PAYMENT
// ==========================================

const paymentMethods = ref([]);
const loadingPaymentMethods = ref(false);
const selectingPayment = ref(false);

const selectedPaymentMethods = reactive({});

const showPaymentProofModal = ref(false);
const selectedSellerOrder = ref(null);

const paymentProofFile = ref(null);
const paymentProofPreview = ref("");
const paymentProofInput = ref(null);
const uploadingPaymentProof = ref(false);

// Nilai khusus untuk opsi "Bank Lainnya" pada dropdown bank pengirim
const OTHER_BANK = "__other__";

const bankOptions = [
  "BCA",
  "BRI",
  "BNI",
  "Mandiri",
  "BSI",
  "CIMB Niaga",
  "Permata",
  "Danamon",
  "BTN",
  "Bank Jago",
  "SeaBank",
  "Jenius (BTPN)",
  "GoPay",
  "OVO",
  "DANA",
  "ShopeePay",
];

const paymentProofForm = reactive({
  transfer_amount: "",
  transfer_date: "",
  sender_name: "",
  sender_bank: "",
  sender_bank_other: "",
  buyer_note: "",
});

const showAddressForm = ref(false);
const editingAddressId = ref(null);

const showDeleteAddressModal = ref(false);
const selectedAddressToDelete = ref(null);
const deletingAddress = ref(false);

const profileForm = reactive({
  full_name: "",
  phone_number: "",
});

const addressForm = reactive({
  label: "Rumah",
  recipient_name: "",
  phone_number: "",
  province: "",
  city: "",
  district: "",
  postal_code: "",
  address_line: "",
  address_notes: "",
  is_default: false,
});

// ==========================================
// NAVIGATION MENU
// ==========================================

const menuItems = [
  {
    id: "overview",
    label: "Ringkasan Akun",
    icon: LayoutDashboard,
  },
  {
    id: "profile",
    label: "Profil Saya",
    icon: UserRound,
  },
  {
    id: "addresses",
    label: "Alamat Pengiriman",
    icon: MapPin,
  },
  {
    id: "orders",
    label: "Pesanan Saya",
    icon: Package,
  },
  {
    id: "wishlist",
    label: "Wishlist",
    icon: Heart,
  },
  {
    id: "reviews",
    label: "Ulasan Saya",
    icon: Star,
  },
  {
    id: "settings",
    label: "Pengaturan Akun",
    icon: Settings,
  },
];

// ==========================================
// COMPUTED
// ==========================================

const currentSection = computed(() => {
  return (
    menuItems.find((item) => item.id === activeSection.value) || menuItems[0]
  );
});

const userProfile = computed(() => authStore.profile || {});

const userName = computed(() => {
  return (
    userProfile.value.full_name ||
    authStore.user?.user_metadata?.full_name ||
    "Pengguna KriyaLoka"
  );
});

const userEmail = computed(() => {
  return userProfile.value.email || authStore.user?.email || "-";
});

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase();
});

const totalOrder = computed(() => orders.value.length);

const activeOrderCount = computed(() => {
  const activeStatuses = [
    "awaiting_shipping_cost",
    "waiting_payment",
    "payment_review",
    "paid",
    "processing",
    "shipped",
  ];

  return orders.value.filter((order) => activeStatuses.includes(order.status))
    .length;
});

const completedOrderCount = computed(() => {
  return orders.value.filter((order) => order.status === "completed").length;
});

// ==========================================
// PROFILE SECTION COMPONENTS
// ==========================================

const sectionComponents = {
  overview: ProfileOverview,
  profile: ProfileInformation,
  addresses: ProfileAddresses,
  orders: ProfileOrders,
  wishlist: ProfileWishlist,
  reviews: ProfileReviews,
  settings: ProfileSettings,
};

const activeSectionComponent = computed(() => {
  return sectionComponents[activeSection.value] || ProfileOverview;
});

const activeSectionProps = computed(() => {
  const commonProps = {
    formatCurrency,
    formatDate,
    getOrderStatusLabel,
    getOrderStatusClass,
  };

  switch (activeSection.value) {
    case "overview":
      return {
        ...commonProps,
        userName: userName.value,
        userEmail: userEmail.value,
        userProfile: userProfile.value,
        totalOrder: totalOrder.value,
        activeOrderCount: activeOrderCount.value,
        completedOrderCount: completedOrderCount.value,
        addresses: addresses.value,
        orders: orders.value,
      };

    case "profile":
      return {
        profileForm,
        userEmail: userEmail.value,
        saving: saving.value,
      };

    case "addresses":
      return {
        addresses: addresses.value,
        addressForm,
        showAddressForm: showAddressForm.value,
        editingAddressId: editingAddressId.value,
        loadingAddresses: loadingAddresses.value,
        saving: saving.value,
      };

    case "orders":
      return {
        orders: orders.value,
        loadingOrders: loadingOrders.value,
        selectedPaymentMethods,
        selectingPayment: selectingPayment.value,
        ...commonProps,
        getSellerPayment,
        getPaymentStatusLabel,
        getPaymentStatusClass,
        canSelectPaymentMethod,
        getSelectedPaymentMethodId,
        getPaymentMethodSnapshot,
      };

    default:
      return {};
  }
});

const activeSectionEvents = {
  "change-section": changeSection,
  "go-catalog": () => router.push("/katalog"),
  "save-profile": saveProfile,

  "open-add": openAddAddressForm,
  "open-edit": openEditAddressForm,
  "close-form": closeAddressForm,
  "save-address": saveAddress,
  "set-default": setDefaultAddress,
  "delete-address": openDeleteAddressModal,

  refresh: fetchOrders,
  "select-payment": selectPaymentMethod,
  "download-qris": downloadQris,
  "copy-account-number": copyAccountNumber,
  "open-payment-proof": openPaymentProofModal,

  logout: handleLogout,
};

// ==========================================
// GLOBAL APP TOAST
// ==========================================

const toast = reactive({
  visible: false,
  type: "success",
  title: "",
  message: "",
});

function showMessage(text, type = "success") {
  const titles = {
    success: "Berhasil",
    error: "Terjadi Kesalahan",
    info: "Informasi",
  };

  toast.type = type;
  toast.title = titles[type] || "Informasi";
  toast.message = text;
  toast.visible = true;
}

function clearMessage() {
  toast.visible = false;
}

// ==========================================
// SECTION NAVIGATION
// ==========================================

function changeSection(section) {
  activeSection.value = section;
  mobileSidebarOpen.value = false;
  clearMessage();

  if (section === "addresses") {
    fetchAddresses();
  }

  if (section === "orders") {
    fetchOrders();
  }
}

// ==========================================
// INITIALIZE ACCOUNT
// ==========================================

async function initializeAccount() {
  loading.value = true;

  try {
    if (!authStore.isAuthenticated) {
      await authStore.initialize();
    }

    if (!authStore.isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (authStore.role !== "buyer") {
      const destinations = {
        seller: "/dashboard/penjual",
        super_admin: "/dashboard/admin",
      };

      router.replace(destinations[authStore.role] || "/");
      return;
    }

    await loadProfileForm();
    await Promise.all([fetchAddresses(), fetchOrders()]);
  } catch (error) {
    console.error("Gagal memuat halaman akun:", error);
    showMessage("Terjadi kesalahan saat memuat akun.", "error");
  } finally {
    loading.value = false;
  }
}

// ==========================================
// PROFILE
// ==========================================

function loadProfileForm() {
  profileForm.full_name = userProfile.value.full_name || "";
  profileForm.phone_number = userProfile.value.phone_number || "";
}

async function saveProfile() {
  if (!profileForm.full_name.trim()) {
    showMessage("Nama lengkap wajib diisi.", "error");
    return;
  }

  saving.value = true;
  clearMessage();

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileForm.full_name.trim(),
        phone_number: profileForm.phone_number.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", authStore.user.id);

    if (error) throw error;

    await authStore.refreshProfile();

    showMessage("Profil berhasil diperbarui.");
  } catch (error) {
    console.error("Gagal memperbarui profil:", error);
    showMessage(error.message || "Gagal memperbarui profil.", "error");
  } finally {
    saving.value = false;
  }
}

// ==========================================
// ADDRESSES
// ==========================================

function resetAddressForm() {
  editingAddressId.value = null;

  Object.assign(addressForm, {
    label: "Rumah",
    recipient_name: userName.value,
    phone_number: profileForm.phone_number || "",
    province: "",
    city: "",
    district: "",
    postal_code: "",
    address_line: "",
    address_notes: "",
    is_default: addresses.value.length === 0,
  });
}

function openAddAddressForm() {
  resetAddressForm();
  showAddressForm.value = true;
}

function openEditAddressForm(address) {
  editingAddressId.value = address.id;

  Object.assign(addressForm, {
    label: address.label || "Rumah",
    recipient_name: address.recipient_name || "",
    phone_number: address.phone_number || "",
    province: address.province || "",
    city: address.city || "",
    district: address.district || "",
    postal_code: address.postal_code || "",
    address_line: address.address_line || "",
    address_notes: address.address_notes || "",
    is_default: address.is_default || false,
  });

  showAddressForm.value = true;
}

function closeAddressForm() {
  showAddressForm.value = false;
  editingAddressId.value = null;
}

async function fetchAddresses() {
  if (!authStore.user?.id) return;

  loadingAddresses.value = true;

  try {
    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", authStore.user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    addresses.value = data || [];
  } catch (error) {
    console.error("Gagal mengambil alamat:", error);
    showMessage("Gagal memuat alamat pengiriman.", "error");
  } finally {
    loadingAddresses.value = false;
  }
}

async function saveAddress() {
  const requiredFields = [
    "recipient_name",
    "phone_number",
    "province",
    "city",
    "district",
    "postal_code",
    "address_line",
  ];

  const hasEmptyField = requiredFields.some(
    (field) => !String(addressForm[field] || "").trim(),
  );

  if (hasEmptyField) {
    showMessage("Lengkapi semua kolom alamat wajib.", "error");
    return;
  }

  saving.value = true;
  clearMessage();

  try {
    const payload = {
      user_id: authStore.user.id,
      label: addressForm.label.trim(),
      recipient_name: addressForm.recipient_name.trim(),
      phone_number: addressForm.phone_number.trim(),
      province: addressForm.province.trim(),
      city: addressForm.city.trim(),
      district: addressForm.district.trim(),
      postal_code: addressForm.postal_code.trim(),
      address_line: addressForm.address_line.trim(),
      address_notes: addressForm.address_notes.trim() || null,
      is_default: addressForm.is_default,
      updated_at: new Date().toISOString(),
    };

    // Jika alamat ini dijadikan default,
    // nonaktifkan default alamat yang sebelumnya.
    if (payload.is_default) {
      const { error: defaultError } = await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", authStore.user.id);

      if (defaultError) throw defaultError;
    }

    if (editingAddressId.value) {
      const { error } = await supabase
        .from("user_addresses")
        .update(payload)
        .eq("id", editingAddressId.value)
        .eq("user_id", authStore.user.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("user_addresses").insert(payload);

      if (error) throw error;
    }

    const wasEditing = Boolean(editingAddressId.value);

    closeAddressForm();
    await fetchAddresses();

    showMessage(
      wasEditing
        ? "Alamat berhasil diperbarui."
        : "Alamat berhasil ditambahkan.",
    );
  } catch (error) {
    console.error("Gagal menyimpan alamat:", error);
    showMessage(error.message || "Gagal menyimpan alamat.", "error");
  } finally {
    saving.value = false;
  }
}

function openDeleteAddressModal(address) {
  if (deletingAddress.value) return;

  selectedAddressToDelete.value = address;
  showDeleteAddressModal.value = true;
}

function closeDeleteAddressModal() {
  if (deletingAddress.value) return;

  showDeleteAddressModal.value = false;
  selectedAddressToDelete.value = null;
}

async function confirmDeleteAddress() {
  const address = selectedAddressToDelete.value;

  if (!address || deletingAddress.value) return;

  deletingAddress.value = true;

  try {
    const { error } = await supabase
      .from("user_addresses")
      .delete()
      .eq("id", address.id)
      .eq("user_id", authStore.user.id);

    if (error) throw error;

    showDeleteAddressModal.value = false;
    selectedAddressToDelete.value = null;

    await fetchAddresses();

    showMessage("Alamat berhasil dihapus.");
  } catch (error) {
    console.error("Gagal menghapus alamat:", error);

    showMessage(error.message || "Gagal menghapus alamat.", "error");
  } finally {
    deletingAddress.value = false;
  }
}

async function setDefaultAddress(addressId) {
  try {
    const { error: resetError } = await supabase
      .from("user_addresses")
      .update({ is_default: false })
      .eq("user_id", authStore.user.id);

    if (resetError) throw resetError;

    const { error } = await supabase
      .from("user_addresses")
      .update({ is_default: true })
      .eq("id", addressId)
      .eq("user_id", authStore.user.id);

    if (error) throw error;

    await fetchAddresses();
    showMessage("Alamat utama berhasil diubah.");
  } catch (error) {
    console.error("Gagal mengubah alamat utama:", error);
    showMessage("Gagal mengubah alamat utama.", "error");
  }
}

// ==========================================
// ORDERS
// ==========================================

async function fetchOrders() {
  if (!authStore.user?.id) return;

  loadingOrders.value = true;

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        subtotal,
        shipping_cost,
        grand_total,
        created_at,
        seller_orders (
          id,
          seller_id,
          seller_order_number,
          status,
          courier_name,
          courier_service,
          courier_tracking_number,
          shipped_at,
          delivered_at,
          subtotal,
          shipping_cost,
          total_amount,
          internal_tracking_number,
          order_items (
            id,
            product_name,
            product_slug,
            product_category,
            product_image_url,
            unit_price,
            quantity,
            weight_grams,
            subtotal
          ),
          payments (
            id,
            seller_order_id,
            seller_payment_method_id,
            payment_method_type,
            payment_method_snapshot,
            amount,
            status,
            rejection_note,
            paid_at,
            verified_at,
            payment_proofs (
              id,
              image_path,
              transfer_amount,
              transfer_date,
              sender_name,
              sender_bank,
              buyer_note,
              verification_status,
              verification_note,
              created_at,
              reviewed_at
            )
          )
        )
      `,
      )
      .eq("buyer_id", authStore.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const orderData = data || [];

    // Normalisasi relasi pembayaran menjadi satu objek.
    // Constraint UNIQUE seller_order_id memastikan maksimal satu payment.
    for (const order of orderData) {
      for (const sellerOrder of order.seller_orders || []) {
        const paymentRelation = sellerOrder.payments;

        sellerOrder.payment = Array.isArray(paymentRelation)
          ? paymentRelation[0] || null
          : paymentRelation || null;

        sellerOrder.paymentMethods = [];
      }
    }

    orders.value = orderData;

    // Ambil metode pembayaran aktif milik seluruh seller
    // yang terdapat pada daftar pesanan buyer.
    await fetchSellerPaymentMethods();
  } catch (error) {
    console.error("Gagal mengambil pesanan:", error);
    showMessage("Gagal memuat pesanan.", "error");
  } finally {
    loadingOrders.value = false;
  }
}

async function fetchSellerPaymentMethods() {
  const sellerIds = [
    ...new Set(
      orders.value.flatMap((order) =>
        (order.seller_orders || []).map((sellerOrder) => sellerOrder.seller_id),
      ),
    ),
  ];

  if (!sellerIds.length) {
    paymentMethods.value = [];
    return;
  }

  loadingPaymentMethods.value = true;

  try {
    const { data, error } = await supabase
      .from("seller_payment_methods")
      .select(
        `
        id,
        seller_id,
        method_type,
        display_name,
        qris_image_url,
        bank_name,
        account_number,
        account_holder,
        is_active,
        sort_order
      `,
      )
      .in("seller_id", sellerIds)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    paymentMethods.value = data || [];

    // Pasangkan metode pembayaran dengan pesanan masing-masing seller.
    for (const order of orders.value) {
      for (const sellerOrder of order.seller_orders || []) {
        sellerOrder.paymentMethods = paymentMethods.value.filter(
          (method) => method.seller_id === sellerOrder.seller_id,
        );
      }
    }
  } catch (error) {
    console.error("Gagal mengambil metode pembayaran:", error);
    showMessage("Gagal memuat metode pembayaran seller.", "error");
  } finally {
    loadingPaymentMethods.value = false;
  }
}

function getSellerPayment(sellerOrder) {
  return sellerOrder.payment || null;
}

function getLatestPaymentProof(sellerOrder) {
  const payment = getSellerPayment(sellerOrder);

  if (!payment?.payment_proofs?.length) {
    return null;
  }

  return [...payment.payment_proofs].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  )[0];
}

function getPaymentStatusLabel(status) {
  const labels = {
    pending: "Menunggu Pembayaran",
    proof_submitted: "Menunggu Verifikasi",
    verified: "Pembayaran Terverifikasi",
    rejected: "Bukti Ditolak",
    expired: "Pembayaran Kedaluwarsa",
    refunded: "Dana Dikembalikan",
  };

  return labels[status] || status || "Belum Memilih Metode";
}

function getPaymentStatusClass(status) {
  const classes = {
    pending: "status-warning",
    proof_submitted: "status-info",
    verified: "status-success",
    rejected: "status-danger",
    expired: "status-danger",
    refunded: "status-neutral",
  };

  return classes[status] || "status-neutral";
}

async function selectPaymentMethod(sellerOrder, methodId) {
  if (!methodId) return;

  selectingPayment.value = true;

  try {
    const { error } = await supabase.rpc("select_seller_order_payment_method", {
      p_seller_order_id: sellerOrder.id,
      p_seller_payment_method_id: methodId,
    });

    if (error) throw error;

    showMessage("Metode pembayaran berhasil dipilih.", "success");

    await fetchOrders();
  } catch (error) {
    console.error("Gagal memilih metode pembayaran:", error);
    showMessage(error.message || "Gagal memilih metode pembayaran.", "error");
  } finally {
    selectingPayment.value = false;
  }
}

async function downloadQris(sellerOrder) {
  const snapshot = getPaymentMethodSnapshot(sellerOrder);
  const imageUrl = snapshot.qris_image_url;

  if (!imageUrl) {
    showMessage("Gambar QRIS tidak tersedia.", "error");
    return;
  }

  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error("Gagal mengambil gambar QRIS.");
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `QRIS-${sellerOrder.seller_order_number || "KriyaLoka"}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);

    showMessage("QRIS berhasil diunduh.", "success");
  } catch (error) {
    console.error("Gagal mengunduh QRIS:", error);
    showMessage("Gagal mengunduh QRIS. Silakan coba lagi.", "error");
  }
}

async function copyAccountNumber(sellerOrder) {
  const snapshot = getPaymentMethodSnapshot(sellerOrder);
  const accountNumber = snapshot.account_number;

  if (!accountNumber) {
    showMessage("Nomor rekening tidak tersedia.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(accountNumber);
    showMessage("Nomor rekening berhasil disalin.", "success");
  } catch (error) {
    console.error("Gagal menyalin nomor rekening:", error);
    showMessage(
      "Tidak dapat menyalin nomor rekening. Silakan salin secara manual.",
      "error",
    );
  }
}

function getSelectedPaymentMethodId(sellerOrder) {
  return (
    selectedPaymentMethods[sellerOrder.id] ||
    sellerOrder.payment?.seller_payment_method_id ||
    ""
  );
}

function getPaymentMethodSnapshot(sellerOrder) {
  return sellerOrder.payment?.payment_method_snapshot || {};
}

function canSelectPaymentMethod(sellerOrder) {
  const payment = getSellerPayment(sellerOrder);

  return (
    sellerOrder.status === "waiting_payment" &&
    (!payment || ["pending", "rejected"].includes(payment.status))
  );
}

// ==========================================
// PAYMENT PROOF (UPLOAD + PREVIEW)
// ==========================================

function clearPaymentProofPreview() {
  if (paymentProofPreview.value) {
    URL.revokeObjectURL(paymentProofPreview.value);
  }

  paymentProofPreview.value = "";
}

function removePaymentProofFile() {
  paymentProofFile.value = null;
  clearPaymentProofPreview();

  if (paymentProofInput.value) {
    paymentProofInput.value.value = "";
  }
}

function formatFileSize(bytes) {
  if (!bytes) return "";

  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function openPaymentProofModal(sellerOrder) {
  const payment = getSellerPayment(sellerOrder);

  if (!payment || !["pending", "rejected"].includes(payment.status)) {
    showMessage("Pembayaran belum dapat menerima bukti.", "error");
    return;
  }

  selectedSellerOrder.value = sellerOrder;

  removePaymentProofFile();

  paymentProofForm.transfer_amount = payment.amount || "";
  paymentProofForm.transfer_date = "";
  paymentProofForm.sender_name = "";
  paymentProofForm.sender_bank = "";
  paymentProofForm.sender_bank_other = "";
  paymentProofForm.buyer_note = "";

  showPaymentProofModal.value = true;
}

function handlePaymentProofFile(event) {
  const file = event.target.files?.[0];

  if (!file) {
    removePaymentProofFile();
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    showMessage("Format bukti pembayaran harus JPG, PNG, atau WEBP.", "error");
    removePaymentProofFile();
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showMessage("Ukuran gambar maksimal 5 MB.", "error");
    removePaymentProofFile();
    return;
  }

  clearPaymentProofPreview();

  paymentProofFile.value = file;
  paymentProofPreview.value = URL.createObjectURL(file);
}

async function submitPaymentProof() {
  const sellerOrder = selectedSellerOrder.value;

  if (!sellerOrder) return;

  const payment = getSellerPayment(sellerOrder);

  if (!payment?.id) {
    showMessage("Data pembayaran tidak ditemukan.", "error");
    return;
  }

  if (!paymentProofFile.value) {
    showMessage("Silakan pilih gambar bukti pembayaran.", "error");
    return;
  }

  if (
    !paymentProofForm.transfer_amount ||
    Number(paymentProofForm.transfer_amount) <= 0
  ) {
    showMessage("Nominal transfer harus lebih dari 0.", "error");
    return;
  }

  const senderBank =
    paymentProofForm.sender_bank === OTHER_BANK
      ? paymentProofForm.sender_bank_other.trim()
      : paymentProofForm.sender_bank;

  if (paymentProofForm.sender_bank === OTHER_BANK && !senderBank) {
    showMessage("Tuliskan nama bank pengirim.", "error");
    return;
  }

  uploadingPaymentProof.value = true;

  try {
    const file = paymentProofFile.value;

    const extensionMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensionMap[file.type];

    const fileName = `${crypto.randomUUID()}.${extension}`;

    const imagePath = `${authStore.user.id}/${payment.id}/${fileName}`;

    // Upload gambar ke private storage
    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(imagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Simpan informasi bukti pembayaran melalui RPC
    const { error: submitError } = await supabase.rpc("submit_payment_proof", {
      p_seller_order_id: sellerOrder.id,
      p_image_path: imagePath,
      p_transfer_amount: Number(paymentProofForm.transfer_amount),
      p_transfer_date: paymentProofForm.transfer_date
        ? new Date(`${paymentProofForm.transfer_date}T00:00:00`).toISOString()
        : null,
      p_sender_name: paymentProofForm.sender_name.trim() || null,
      p_sender_bank: senderBank || null,
      p_buyer_note: paymentProofForm.buyer_note.trim() || null,
    });

    if (submitError) throw submitError;

    showPaymentProofModal.value = false;

    showMessage(
      "Bukti pembayaran berhasil dikirim. Menunggu verifikasi seller.",
      "success",
    );

    await fetchOrders();
  } catch (error) {
    console.error("Gagal mengirim bukti pembayaran:", error);

    showMessage(error.message || "Gagal mengirim bukti pembayaran.", "error");
  } finally {
    uploadingPaymentProof.value = false;
  }
}

// Bersihkan file & preview setiap kali modal ditutup
watch(showPaymentProofModal, (open) => {
  if (!open) {
    removePaymentProofFile();
  }
});

onBeforeUnmount(() => {
  clearPaymentProofPreview();
});

// ==========================================
// ORDER STATUS
// ==========================================

function getOrderStatusLabel(status) {
  const labels = {
    awaiting_shipping_cost: "Menunggu Ongkir",
    waiting_payment: "Menunggu Pembayaran",
    payment_review: "Verifikasi Pembayaran",
    paid: "Sudah Dibayar",
    processing: "Diproses",
    shipped: "Dikirim",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };

  return labels[status] || status;
}

function getOrderStatusClass(status) {
  const classes = {
    awaiting_shipping_cost: "status-warning",
    waiting_payment: "status-warning",
    payment_review: "status-info",
    paid: "status-info",
    processing: "status-info",
    shipped: "status-info",
    completed: "status-success",
    cancelled: "status-danger",
  };

  return classes[status] || "status-neutral";
}

// ==========================================
// FORMATTERS
// ==========================================

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

// ==========================================
// LOGOUT
// ==========================================

async function handleLogout() {
  try {
    await authStore.logout();
    router.replace("/login");
  } catch (error) {
    console.error("Gagal logout:", error);
    showMessage("Gagal keluar dari akun.", "error");
  }
}

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(() => {
  initializeAccount();
});
</script>

<template>
  <div class="account-page">
    <AppToast
      v-model="toast.visible"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="3500"
    />

    <!-- ==================================
         MODAL: UPLOAD BUKTI PEMBAYARAN
    =================================== -->
    <AppModal
      v-model="showPaymentProofModal"
      size="lg"
      title="Upload Bukti Pembayaran"
      description="Lengkapi informasi transfer dan unggah bukti pembayaran untuk pesanan seller ini."
      confirm-text="Kirim Bukti Pembayaran"
      cancel-text="Batal"
      variant="info"
      :loading="uploadingPaymentProof"
      :close-on-overlay="false"
      @confirm="submitPaymentProof"
    >
      <div class="payment-proof-form">
        <div class="payment-proof-row">
          <div class="payment-proof-field">
            <label>Nominal Transfer (Rp)</label>

            <input
              v-model="paymentProofForm.transfer_amount"
              type="number"
              min="1"
              placeholder="Contoh: 150000"
            />
          </div>

          <div class="payment-proof-field">
            <label>Tanggal Transfer</label>

            <input v-model="paymentProofForm.transfer_date" type="date" />
          </div>
        </div>

        <div class="payment-proof-row">
          <div class="payment-proof-field">
            <label>Nama Pengirim</label>

            <input
              v-model="paymentProofForm.sender_name"
              type="text"
              placeholder="Nama sesuai rekening pengirim"
            />
          </div>

          <div class="payment-proof-field">
            <label>Bank Pengirim</label>

            <select v-model="paymentProofForm.sender_bank">
              <option value="">Pilih bank</option>

              <option v-for="bank in bankOptions" :key="bank" :value="bank">
                {{ bank }}
              </option>

              <option :value="OTHER_BANK">Bank Lainnya</option>
            </select>
          </div>
        </div>

        <div
          v-if="paymentProofForm.sender_bank === OTHER_BANK"
          class="payment-proof-field"
        >
          <label>Nama Bank Lainnya</label>

          <input
            v-model="paymentProofForm.sender_bank_other"
            type="text"
            placeholder="Tuliskan nama bank"
          />
        </div>

        <div class="payment-proof-field">
          <label>Foto Bukti Pembayaran</label>

          <input
            ref="paymentProofInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            @change="handlePaymentProofFile"
          />

          <small>Format JPG, PNG, atau WEBP. Maksimal 5 MB.</small>

          <div v-if="paymentProofPreview" class="payment-proof-preview">
            <img :src="paymentProofPreview" alt="Preview bukti pembayaran" />

            <div class="payment-proof-preview-meta">
              <span class="payment-proof-file-name">
                {{ paymentProofFile?.name }}
              </span>

              <small>{{ formatFileSize(paymentProofFile?.size) }}</small>

              <button
                type="button"
                class="payment-proof-remove"
                @click="removePaymentProofFile"
              >
                <Trash2 :size="14" />
                Hapus gambar
              </button>
            </div>
          </div>
        </div>

        <div class="payment-proof-field">
          <label>Catatan (Opsional)</label>

          <textarea
            v-model="paymentProofForm.buyer_note"
            rows="3"
            placeholder="Tambahkan catatan jika diperlukan..."
          ></textarea>
        </div>
      </div>
    </AppModal>

    <!-- ==================================
         MODAL: HAPUS ALAMAT
    =================================== -->
    <AppModal
      v-model="showDeleteAddressModal"
      title="Hapus Alamat?"
      :description="
        selectedAddressToDelete
          ? `Apakah kamu yakin ingin menghapus alamat ${selectedAddressToDelete.label} milik ${selectedAddressToDelete.recipient_name}? Tindakan ini tidak dapat dibatalkan.`
          : 'Apakah kamu yakin ingin menghapus alamat ini?'
      "
      confirm-text="Ya, Hapus"
      cancel-text="Batal"
      variant="danger"
      :loading="deletingAddress"
      @confirm="confirmDeleteAddress"
      @cancel="closeDeleteAddressModal"
    />
    <!-- ==================================
         PAGE HEADER
    =================================== -->

    <section class="account-heading">
      <div>
        <span class="eyebrow">AKUN SAYA</span>
        <h1>Selamat datang, {{ userName }}</h1>
        <p>Kelola profil, alamat, dan aktivitas belanjamu di KriyaLoka.</p>
      </div>

      <button
        class="mobile-sidebar-toggle"
        @click="mobileSidebarOpen = !mobileSidebarOpen"
      >
        <Menu v-if="!mobileSidebarOpen" :size="19" />
        <X v-else :size="19" />
        Menu Akun
      </button>
    </section>

    <!-- ==================================
         LOADING
    =================================== -->

    <div v-if="loading" class="account-loading">
      <RefreshCw class="spin" :size="28" />
      <p>Menyiapkan halaman akun...</p>
    </div>

    <div v-else class="account-layout">
      <!-- ==================================
           SIDEBAR
      =================================== -->

      <Transition name="sidebar">
        <ProfileSidebar
          :menu-items="menuItems"
          :active-section="activeSection"
          :user-name="userName"
          :user-email="userEmail"
          :user-initial="userInitial"
          :mobile-open="mobileSidebarOpen"
          @change-section="changeSection"
          @logout="handleLogout"
        />
      </Transition>

      <!-- ==================================
           MAIN CONTENT
      =================================== -->

      <main class="account-content">
        <div class="content-heading">
          <div>
            <span class="eyebrow">KRIYALOKA ACCOUNT</span>
            <h2>{{ currentSection.label }}</h2>
          </div>

          <span class="content-date">
            <Clock :size="15" />
            {{ formatDate(new Date()) }}
          </span>
        </div>

        <component
          :is="activeSectionComponent"
          v-bind="activeSectionProps"
          v-on="activeSectionEvents"
        />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ========================================
   PAGE
======================================== */

.account-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 42px 24px 80px;
  color: #382b24;
}

.account-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 30px;
}

.eyebrow {
  display: inline-block;
  color: #a36a4b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.8px;
  margin-bottom: 9px;
}

.account-heading h1 {
  margin: 0;
  font-size: clamp(25px, 3vw, 34px);
  line-height: 1.2;
  letter-spacing: -1px;
}

.account-heading p {
  margin: 9px 0 0;
  color: #8b7b70;
  font-size: 14px;
}
/* ========================================
   LAYOUT
======================================== */

.account-layout {
  display: grid;
  grid-template-columns: 265px minmax(0, 1fr);
  align-items: start;
  gap: 25px;
}

/* ========================================
   SIDEBAR
======================================== */

.account-sidebar {
  position: sticky;
  top: 110px;
  padding: 20px 15px;
  background: #fff;
  border: 1px solid #eee4db;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(48, 31, 20, 0.035);
}

.account-user-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 11px;
  padding: 2px 3px 17px;
}

.user-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 43px;
  height: 43px;
  background: #f4e6dc;
  color: #943c14;
  border-radius: 50%;
  font-size: 19px;
  font-weight: 800;
}

.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  gap: 4px;
}

.user-info strong {
  overflow: hidden;
  color: #382b24;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info span {
  overflow: hidden;
  color: #96877d;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.buyer-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  color: #55734c;
  background: #edf4e9;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.sidebar-divider {
  height: 1px;
  margin: 12px 0;
  background: #f0e8e1;
}

.account-menu {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  min-height: 45px;
  padding: 0 12px;
  color: #76665c;
  background: transparent;
  border: 0;
  border-radius: 9px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-item:hover {
  color: #943c14;
  background: #fbf4ef;
}

.menu-item.active {
  color: #943c14;
  background: #f8eee6;
  font-weight: 750;
}

.menu-chevron {
  margin-left: auto;
}

.logout-button {
  color: #a54b3c;
}

.logout-button:hover {
  color: #a33225;
  background: #fff0ed;
}

/* ========================================
   CONTENT
======================================== */

.account-content {
  min-width: 0;
}

.content-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 20px;
}

.content-heading h2 {
  margin: 0;
  color: #382b24;
  font-size: 23px;
  letter-spacing: -0.5px;
}

.content-date {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #95867b;
  font-size: 11px;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ========================================
   WELCOME
======================================== */

.welcome-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  min-height: 215px;
  padding: 30px;
  color: #fff;
  background: linear-gradient(115deg, #783719, #a6532c);
  border-radius: 15px;
}

.welcome-card > div:first-child {
  position: relative;
  z-index: 1;
  max-width: 460px;
}

.welcome-card span {
  color: #f2c9ac;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

.welcome-card h3 {
  max-width: 400px;
  margin: 12px 0 9px;
  font-size: 25px;
  line-height: 1.25;
  letter-spacing: -0.7px;
}

.welcome-card p {
  max-width: 390px;
  margin: 0 0 20px;
  color: #f3ddd0;
  font-size: 12px;
  line-height: 1.7;
}

.welcome-decoration {
  display: grid;
  place-items: center;
  width: 135px;
  height: 135px;
  margin-right: 20px;
  color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 50%;
  transform: rotate(-12deg);
}

/* ========================================
   BUTTONS
======================================== */

.primary-button,
.secondary-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 39px;
  padding: 0 15px;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary-button {
  color: #fff;
  background: #943c14;
  border-color: #943c14;
}

.primary-button:hover {
  background: #7d3210;
  border-color: #7d3210;
  transform: translateY(-1px);
}

.welcome-card .primary-button {
  color: #783719;
  background: #fff;
  border-color: #fff;
}

.welcome-card .primary-button:hover {
  background: #f9e9dd;
}

.secondary-button {
  color: #715b4e;
  background: #fff;
  border-color: #e9ddd3;
}

.secondary-button:hover {
  color: #943c14;
  border-color: #cda58e;
}

.danger-button {
  color: #fff;
  background: #a64032;
}

.danger-button:hover {
  background: #8e3025;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* ========================================
   STAT CARDS
======================================== */

.overview-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 17px 14px;
  background: #fff;
  border: 1px solid #eee4db;
  border-radius: 12px;
}

.stat-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 39px;
  height: 39px;
  border-radius: 10px;
}

.stat-icon.brown {
  color: #943c14;
  background: #f8eee6;
}

.stat-icon.orange {
  color: #a86a2e;
  background: #fff3e4;
}

.stat-icon.green {
  color: #55734c;
  background: #edf4e9;
}

.stat-icon.cream {
  color: #88734b;
  background: #f5f0e4;
}

.stat-card > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.stat-card span {
  color: #96877d;
  font-size: 10px;
  line-height: 1.3;
}

.stat-card strong {
  color: #382b24;
  font-size: 21px;
}

/* ========================================
   PANEL
======================================== */

.panel-card {
  min-width: 0;
  padding: 21px;
  background: #fff;
  border: 1px solid #eee4db;
  border-radius: 13px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 17px;
}

.panel-heading h3,
.section-toolbar h3,
.section-intro h3,
.logout-panel h3 {
  margin: 0;
  color: #382b24;
  font-size: 14px;
}

.panel-heading p,
.section-toolbar p,
.section-intro p,
.logout-panel p {
  margin: 6px 0 0;
  color: #99897e;
  font-size: 11px;
  line-height: 1.6;
}

.text-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  color: #943c14;
  background: transparent;
  border: 0;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.text-button:hover {
  color: #68290e;
}

/* ========================================
   INFORMATION
======================================== */

.information-list {
  display: flex;
  flex-direction: column;
}

.information-list > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid #f2ebe5;
}

.information-list > div:last-child {
  border-bottom: 0;
}

.information-list span {
  color: #99897e;
  font-size: 11px;
}

.information-list strong {
  overflow-wrap: anywhere;
  color: #55453b;
  font-size: 11px;
  text-align: right;
}

/* ========================================
   ADDRESS SUMMARY
======================================== */

.default-address strong {
  display: inline-block;
  padding: 5px 9px;
  color: #943c14;
  background: #f8eee6;
  border-radius: 6px;
  font-size: 11px;
}

.default-address p {
  margin: 10px 0 4px;
  color: #58483e;
  font-size: 12px;
  line-height: 1.6;
}

.default-address small {
  color: #95867b;
  font-size: 10px;
}

.empty-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  color: #a18f82;
  text-align: center;
}

.empty-mini p {
  margin: 9px 0;
  font-size: 11px;
}

/* ========================================
   TABLE
======================================== */

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

th {
  padding: 11px 12px;
  color: #9b8b7f;
  background: #fbf8f5;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
}

td {
  padding: 13px 12px;
  color: #655449;
  border-bottom: 1px solid #f1eae4;
  font-size: 11px;
}

td:first-child {
  color: #943c14;
  font-weight: 700;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 9px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.status-warning {
  color: #93611c;
  background: #fff4dd;
}

.status-info {
  color: #416d9b;
  background: #eaf3fc;
}

.status-success {
  color: #4c7547;
  background: #edf5e9;
}

.status-danger {
  color: #a13d31;
  background: #fff0ed;
}

.status-neutral {
  color: #71665e;
  background: #f2efec;
}

/* ========================================
   SECTION INTRO & FORMS
======================================== */

.section-intro {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 23px;
}

.large-section-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 47px;
  height: 47px;
  color: #943c14;
  background: #f8eee6;
  border-radius: 12px;
}

.account-form {
  display: flex;
  flex-direction: column;
  gap: 19px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.form-field.full {
  grid-column: 1 / -1;
}

.form-field label {
  color: #655449;
  font-size: 11px;
  font-weight: 700;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  min-width: 0;
  padding: 12px 13px;
  color: #493a30;
  background: #fff;
  border: 1px solid #e9ded4;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  font-size: 12px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  border-color: #b97954;
  box-shadow: 0 0 0 3px rgba(148, 60, 20, 0.07);
}

.form-field input:disabled {
  color: #99897e;
  background: #f7f4f1;
  cursor: not-allowed;
}

.form-field textarea {
  resize: vertical;
  line-height: 1.6;
}

.form-field small {
  color: #9b8b7f;
  font-size: 10px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  padding-top: 5px;
}

/* ========================================
   ADDRESS SECTION
======================================== */

.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.address-form-card {
  border-color: #e5c7b5;
}

.close-form-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #806e61;
  background: #f8f4f0;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.default-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #66564c;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.default-checkbox input {
  accent-color: #943c14;
}

.address-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.address-card {
  min-width: 0;
  padding: 19px;
  background: #fff;
  border: 1px solid #eee4db;
  border-radius: 12px;
}

.address-card.is-default {
  border-color: #d9ad94;
  box-shadow: 0 0 0 2px rgba(148, 60, 20, 0.035);
}

.address-card-header,
.address-label,
.address-recipient,
.address-actions {
  display: flex;
  align-items: center;
}

.address-card-header {
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 17px;
}

.address-label {
  gap: 8px;
  color: #943c14;
}

.address-label strong {
  color: #493a30;
  font-size: 12px;
}

.default-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 7px;
  color: #55734c;
  background: #edf4e9;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 700;
}

.address-recipient {
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.address-recipient strong {
  color: #493a30;
  font-size: 12px;
}

.address-recipient span {
  color: #8d7d72;
  font-size: 10px;
}

.address-line,
.address-region {
  color: #6e5d52;
  font-size: 11px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.address-line {
  margin: 12px 0 3px;
}

.address-region {
  margin: 0;
  color: #9a897e;
}

.address-notes {
  padding: 9px;
  color: #8c725d;
  background: #faf6f1;
  border-radius: 6px;
  font-size: 10px;
  line-height: 1.6;
}

.address-actions {
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #f0e8e1;
}

.small-action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  color: #8b5b3f;
  background: transparent;
  border: 0;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.small-action:hover {
  color: #943c14;
}

.small-action.danger {
  color: #a44b3d;
}

/* ========================================
   ORDERS
======================================== */

.order-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.order-card {
  padding: 19px;
  background: #fff;
  border: 1px solid #eee4db;
  border-radius: 12px;
}

.order-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0e8e1;
}

.order-number {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.order-number span,
.order-card-info span {
  color: #9a897e;
  font-size: 10px;
}

.order-number strong {
  color: #943c14;
  font-size: 12px;
}

.order-card-info {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding-top: 15px;
}

.order-card-info > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-card-info strong {
  color: #5e4c40;
  font-size: 11px;
}

.order-card-info .order-total {
  color: #943c14;
  font-size: 12px;
}

/* ========================================
   EMPTY STATE
======================================== */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: 30px;
  color: #a18f82;
  background: #fff;
  border: 1px dashed #e6d9ce;
  border-radius: 13px;
  text-align: center;
}

.empty-state h3 {
  margin: 14px 0 7px;
  color: #493a30;
  font-size: 16px;
}

.empty-state p {
  max-width: 360px;
  margin: 0 0 17px;
  color: #96867a;
  font-size: 11px;
  line-height: 1.7;
}

.empty-state.compact {
  min-height: 160px;
  border: 0;
}

.empty-state.compact p {
  margin: 9px 0;
}

.feature-placeholder {
  min-height: 330px;
}

.placeholder-icon {
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  color: #943c14;
  background: #f8eee6;
  border-radius: 50%;
}

.coming-soon {
  margin-top: 17px;
  color: #a36a4b;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.7px;
}

/* ========================================
   SETTINGS
======================================== */

.settings-list {
  display: flex;
  flex-direction: column;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 16px 0;
  border-bottom: 1px solid #f0e8e1;
}

.setting-item:last-child {
  border-bottom: 0;
}

.setting-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 39px;
  height: 39px;
  color: #943c14;
  background: #f8eee6;
  border-radius: 10px;
}

.setting-item > div:nth-child(2) {
  flex: 1;
  min-width: 0;
}

.setting-item strong {
  color: #4d3d32;
  font-size: 12px;
}

.setting-item p {
  margin: 5px 0 0;
  color: #9a897e;
  font-size: 10px;
  line-height: 1.5;
}

.setting-note {
  color: #7b8a67;
  font-size: 10px;
  white-space: nowrap;
}

.logout-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  border-color: #f0d9d3;
}

/* ========================================
   LOADING
======================================== */

.account-loading,
.loading-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #947b6b;
  font-size: 12px;
}

.account-loading {
  min-height: 350px;
  flex-direction: column;
}

.loading-inline {
  min-height: 130px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ========================================
   MOBILE SIDEBAR
======================================== */

.mobile-sidebar-toggle {
  display: none;
  align-items: center;
  gap: 7px;
  padding: 10px 12px;
  color: #943c14;
  background: #f8eee6;
  border: 1px solid #eaded3;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

/* ========================================
   RESPONSIVE
======================================== */

@media (max-width: 1050px) {
  .account-layout {
    grid-template-columns: 225px minmax(0, 1fr);
    gap: 17px;
  }

  .overview-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .order-card-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .account-page {
    padding: 30px 17px 55px;
  }

  .account-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .mobile-sidebar-toggle {
    display: inline-flex;
  }

  .account-layout {
    display: block;
  }

  .account-sidebar {
    display: none;
    position: static;
    margin-bottom: 18px;
  }

  .account-sidebar.mobile-open {
    display: block;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .address-grid {
    grid-template-columns: 1fr;
  }

  .content-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .account-page {
    padding-right: 13px;
    padding-left: 13px;
  }

  .account-heading h1 {
    font-size: 25px;
  }

  .welcome-card {
    min-height: 190px;
    padding: 22px;
  }

  .welcome-card h3 {
    font-size: 21px;
  }

  .welcome-decoration {
    position: absolute;
    right: -38px;
    bottom: -30px;
    width: 120px;
    height: 120px;
    margin: 0;
  }

  .welcome-decoration svg {
    width: 55px;
  }

  .overview-stats {
    gap: 8px;
  }

  .stat-card {
    padding: 13px 10px;
    gap: 8px;
  }

  .stat-icon {
    width: 33px;
    height: 33px;
  }

  .stat-card span {
    font-size: 9px;
  }

  .stat-card strong {
    font-size: 18px;
  }

  .panel-card {
    padding: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field.full {
    grid-column: auto;
  }

  .section-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .section-toolbar .primary-button {
    width: 100%;
  }

  .order-card-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .order-card-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .logout-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .logout-panel button {
    width: 100%;
  }

  .setting-item {
    flex-wrap: wrap;
  }

  .setting-item > div:nth-child(2) {
    flex-basis: calc(100% - 55px);
  }

  .setting-item .text-button,
  .setting-note {
    margin-left: 52px;
  }
}

.seller-order-group {
  padding: 18px 0;
  border-bottom: 1px solid #eee5d9;
}

.seller-order-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 13px;
}

.order-product {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
}

.order-product-image,
.order-product-placeholder {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 10px;
  object-fit: cover;
  background: #f3eee5;
}

.order-product-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #943c14;
}

.order-product-details {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.order-product-details strong {
  font-size: 14px;
  color: #33291f;
}

.order-product-details span,
.order-product-details small {
  font-size: 12px;
  color: #897d70;
}

.order-product-subtotal {
  font-size: 13px;
  color: #943c14;
  white-space: nowrap;
}

.seller-order-total {
  display: flex;
  justify-content: space-between;
  padding-top: 12px;
  font-size: 13px;
  color: #75685b;
}

.seller-payment-section {
  margin-top: 20px;
  padding: 18px;
  border: 1px solid #e7dfd2;
  border-radius: 14px;
  background: #faf8f3;
}

.seller-payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.seller-payment-header h4 {
  margin: 0;
  color: #39452e;
  font-size: 15px;
}

.payment-status-badge {
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.payment-status-badge.status-warning {
  background: #fff0cf;
  color: #94631a;
}

.payment-status-badge.status-info {
  background: #e3edf8;
  color: #315c85;
}

.payment-status-badge.status-success {
  background: #e0efdf;
  color: #38633b;
}

.payment-status-badge.status-danger {
  background: #f8e2df;
  color: #a04439;
}

.payment-status-badge.status-neutral {
  background: #ece9e2;
  color: #69665f;
}

.seller-payment-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e7dfd2;
}

.payment-summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #716d63;
  font-size: 13px;
}

.payment-summary-row strong {
  color: #39452e;
}

.payment-total-row {
  padding-top: 10px;
  border-top: 1px dashed #d8cdbb;
  color: #39452e;
  font-weight: 700;
}

.payment-total-row strong {
  color: #a85f3d;
  font-size: 16px;
}

.payment-method-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;
}

.payment-method-selector label {
  color: #39452e;
  font-size: 13px;
  font-weight: 600;
}

.payment-method-select {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #d8cdbb;
  border-radius: 9px;
  background: #fff;
  color: #39452e;
  font: inherit;
}

.payment-action-button {
  padding: 11px 16px;
  border: none;
  border-radius: 9px;
  background: #a85f3d;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.payment-action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.payment-empty-message,
.payment-instruction-note {
  color: #81796d;
  font-size: 12px;
  line-height: 1.6;
}

.payment-method-detail {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid #e7dfd2;
  border-radius: 12px;
  background: white;
}

.payment-method-detail h5 {
  margin: 0 0 12px;
  color: #39452e;
  font-size: 14px;
}

.payment-qris-image {
  display: block;
  width: 100%;
  max-width: 240px;
  margin: 14px auto;
  object-fit: contain;
  border-radius: 8px;
}

.payment-bank-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-bank-info div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.payment-bank-info span {
  color: #81796d;
  font-size: 12px;
}

.payment-bank-info strong {
  color: #39452e;
  font-size: 14px;
}

.payment-info-message,
.payment-success-message,
.payment-rejected-message {
  margin-top: 16px;
  padding: 12px;
  border-radius: 9px;
  font-size: 13px;
  line-height: 1.6;
}

.payment-info-message {
  background: #eaf0f7;
  color: #315c85;
}

.payment-success-message {
  background: #e5f0e3;
  color: #38633b;
}

.payment-rejected-message {
  background: #f8e8e5;
  color: #a04439;
}

.payment-rejected-message p {
  margin: 5px 0 0;
}

.payment-qris-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.payment-secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 9px 14px;
  border: 1px solid #d8c9a8;
  border-radius: 8px;
  background: #f5efe3;
  color: #4f5b2a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.payment-secondary-button:hover {
  background: #e9dfcc;
}

.payment-copy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 0.5px solid black;
  padding: 5px;
  border-radius: 10px;
}

.payment-copy-row strong {
  min-width: 0;
  color: #39452e;
  font-size: 14px;
  word-break: break-all;
}

.payment-copy-button {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2d8c7;
  border-radius: 50%;
  background: #f5efe3;
  color: #4f5b2a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-copy-button:hover {
  background: #4f5b2a;
  color: #fff;
  border-color: #4f5b2a;
}

.payment-bank-info .payment-account-number .payment-copy-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.payment-bank-info .payment-account-number .payment-copy-row strong {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.payment-bank-info
  .payment-account-number
  .payment-copy-row
  .payment-copy-button {
  flex-shrink: 0;
  margin-left: auto;
}

.payment-proof-action {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e7dfd2;
}

.payment-proof-button {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 9px;
  background: #a85f3d;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.payment-proof-button:hover {
  background: #8f4d30;
}

/* ========================================
   MODAL: UPLOAD BUKTI PEMBAYARAN
======================================== */

.payment-proof-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-proof-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.payment-proof-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.payment-proof-field label {
  color: #39452e;
  font-size: 13px;
  font-weight: 600;
}

.payment-proof-field input,
.payment-proof-field select,
.payment-proof-field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid #d8cdbb;
  border-radius: 9px;
  background: #fff;
  color: #39452e;
  font: inherit;
  font-size: 13px;
}

.payment-proof-field input:focus,
.payment-proof-field select:focus,
.payment-proof-field textarea:focus {
  outline: none;
  border-color: #a85f3d;
  box-shadow: 0 0 0 3px rgba(168, 95, 61, 0.1);
}

.payment-proof-field textarea {
  resize: vertical;
  min-height: 80px;
}

.payment-proof-field small {
  color: #81796d;
  font-size: 11px;
}

.payment-proof-file-name {
  color: #4f5b2a;
  font-size: 12px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.payment-proof-preview {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  margin-top: 6px;
  padding: 12px;
  border: 1px dashed #d8cdbb;
  border-radius: 12px;
  background: #faf8f3;
}

.payment-proof-preview img {
  width: 140px;
  max-height: 180px;
  flex-shrink: 0;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e7dfd2;
}

.payment-proof-preview-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.payment-proof-remove {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  color: #a04439;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 560px) {
  .payment-proof-row {
    grid-template-columns: 1fr;
  }

  .payment-proof-preview {
    flex-direction: column;
  }

  .payment-proof-preview img {
    width: 100%;
  }
}
</style>
