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
  Trash2,
  Clock,
  RefreshCw,
  ChevronLeft,
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

const loading = ref(true);
const saving = ref(false);
const loadingAddresses = ref(false);
const loadingOrders = ref(false);

const orders = ref([]);
const addresses = ref([]);

// ==========================================
// MOBILE NAVIGATION (menu → detail)
// ==========================================

const MOBILE_QUERY = "(max-width: 760px)";

const isMobile = ref(false);
const mobileShowContent = ref(false);

let mediaQuery = null;

function syncMobile(event) {
  isMobile.value = event.matches;

  // Saat layar melebar ke desktop, sidebar & konten tampil bersamaan.
  if (!event.matches) {
    mobileShowContent.value = false;
  }
}

function backToMenu() {
  mobileShowContent.value = false;
  window.scrollTo({ top: 0 });
}

// Menu daftar tampil di mobile selama detail belum dibuka.
const showMenuList = computed(
  () => !isMobile.value || !mobileShowContent.value,
);
const showContent = computed(() => !isMobile.value || mobileShowContent.value);

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

// ==========================================
// ADDRESS & PROFILE FORMS
// ==========================================

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
  { id: "overview", label: "Ringkasan Akun", icon: LayoutDashboard },
  { id: "profile", label: "Profil Saya", icon: UserRound },
  { id: "addresses", label: "Alamat Pengiriman", icon: MapPin },
  { id: "orders", label: "Pesanan Saya", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "reviews", label: "Ulasan Saya", icon: Star },
  { id: "settings", label: "Pengaturan Akun", icon: Settings },
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
  clearMessage();

  if (isMobile.value) {
    mobileShowContent.value = true;
    window.scrollTo({ top: 0 });
  }

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

    loadProfileForm();
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
  mediaQuery = window.matchMedia(MOBILE_QUERY);
  syncMobile(mediaQuery);
  mediaQuery.addEventListener("change", syncMobile);

  initializeAccount();
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener("change", syncMobile);
  clearPaymentProofPreview();
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
         (di mobile hanya tampil di layar daftar menu)
    =================================== -->
    <section v-show="showMenuList" class="account-heading">
      <div>
        <span class="eyebrow">AKUN SAYA</span>
        <h1>Halo, {{ userName }}</h1>
        <p>Kelola profil, alamat, dan pesananmu di KriyaLoka.</p>
      </div>
    </section>

    <!-- ==================================
         LOADING
    =================================== -->
    <div v-if="loading" class="account-loading">
      <RefreshCw class="spin" :size="28" />
      <p>Menyiapkan halaman akun...</p>
    </div>

    <div v-else class="account-layout">
      <!-- SIDEBAR / DAFTAR MENU -->
      <ProfileSidebar
        v-show="showMenuList"
        :menu-items="menuItems"
        :active-section="activeSection"
        :user-name="userName"
        :user-email="userEmail"
        :user-initial="userInitial"
        @change-section="changeSection"
        @logout="handleLogout"
      />

      <!-- KONTEN -->
      <main v-show="showContent" class="account-content">
        <button
          v-if="isMobile"
          type="button"
          class="mobile-back"
          @click="backToMenu"
        >
          <ChevronLeft :size="20" />
          Akun Saya
        </button>

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
