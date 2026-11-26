<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import {
  Phone,
  Mail,
  MessageCircle,
  Send,
  Copy,
  Check,
  ArrowLeft,
  Clock,
  MapPin,
} from "lucide-vue-next";

const contactInfo = {
  whatsappDisplay: "+62 812-3456-7890",
  whatsappNumber: "6281234567890",
  email: "halo@kriyaloka.id",
  reportEmail: "laporan@kriyaloka.id",
  location: "Denpasar, Bali · Layanan Daring Seluruh Indonesia",
  hours: "Senin – Sabtu, 09.00 – 18.00 WITA",
};

const form = ref({
  name: "",
  contact: "",
  category: "Laporan",
  subject: "",
  message: "",
});

const copiedKey = ref("");
const submittedReport = ref(null);
const errorMsg = ref("");

function buildWhatsAppUrl(customText = "") {
  const text =
    customText ||
    "Halo Tim KriyaLoka, saya ingin menghubungi terkait layanan/produk.";
  return `https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function buildMailtoUrl(targetEmail, subject = "Pesan untuk KriyaLoka", body = "") {
  return `mailto:${targetEmail}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

async function copyText(value, key) {
  try {
    await navigator.clipboard.writeText(value);
    copiedKey.value = key;
    setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = "";
    }, 1800);
  } catch {
    errorMsg.value = "Gagal menyalin otomatis, silakan salin manual.";
  }
}

function handleSubmit() {
  errorMsg.value = "";

  if (!form.value.name.trim() || !form.value.message.trim()) {
    errorMsg.value = "Isi nama dan detail pesan/laporan terlebih dahulu.";
    return;
  }

  const ticketCode = `KL-${Math.floor(100000 + Math.random() * 900000)}`;
  const summaryLines = [
    `Kode: ${ticketCode}`,
    `Jenis: ${form.value.category}`,
    `Nama: ${form.value.name.trim()}`,
    form.value.contact.trim() ? `Kontak: ${form.value.contact.trim()}` : "",
    form.value.subject.trim() ? `Subjek: ${form.value.subject.trim()}` : "",
    `Detail:\n${form.value.message.trim()}`,
  ]
    .filter(Boolean)
    .join("\n");

  submittedReport.value = {
    ticketCode,
    category: form.value.category,
    name: form.value.name.trim(),
    waUrl: buildWhatsAppUrl(summaryLines),
    mailUrl: buildMailtoUrl(
      form.value.category === "Laporan"
        ? contactInfo.reportEmail
        : contactInfo.email,
      `[${form.value.category}] ${form.value.subject.trim() || ticketCode}`,
      summaryLines,
    ),
  };

  form.value.subject = "";
  form.value.message = "";
}
</script>

<template>
  <section class="kontak-wrap">
    <!-- Top Header -->
    <div class="kontak-top">
      <div>
        <span class="kontak-pill-eyebrow">
          <Phone :size="13" />
          PUSAT KONTAK &amp; LAPORAN
        </span>
        <h2>Kontak KriyaLoka</h2>
        <p>
          Kirim laporan atau pesan lewat form di bawah, atau hubungi tim kami
          langsung lewat WhatsApp dan Email.
        </p>
      </div>

      <RouterLink to="/" class="kontak-pill-btn">
        <ArrowLeft :size="15" />
        Kembali ke Beranda
      </RouterLink>
    </div>

    <!-- Bagian Atas: Form Laporan/Pesan + Jam & Area Layanan -->
    <div class="kontak-top-grid">
      <form class="form-card" @submit.prevent="handleSubmit">
        <div class="form-header">
          <span class="channel-tag-pill">Formulir</span>
          <h3>Kirim Laporan atau Pesan</h3>
          <p>
            Isi detail laporan atau pertanyaan kamu—bisa langsung diteruskan ke
            WhatsApp atau Email setelah dibuat.
          </p>
        </div>

        <div class="field-row">
          <label class="field">
            <span>Nama</span>
            <input
              v-model="form.name"
              type="text"
              placeholder="Nama lengkap kamu"
              required
            />
          </label>

          <label class="field">
            <span>Email / No. WhatsApp</span>
            <input
              v-model="form.contact"
              type="text"
              placeholder="contoh@email.com atau 08xx"
            />
          </label>
        </div>

        <div class="field">
          <span>Jenis Keperluan</span>
          <div class="pill-choice-group">
            <button
              v-for="item in ['Laporan', 'Pertanyaan', 'Kerja Sama']"
              :key="item"
              type="button"
              class="choice-pill"
              :class="{ active: form.category === item }"
              @click="form.category = item"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <label class="field">
          <span>Subjek / Judul</span>
          <input
            v-model="form.subject"
            type="text"
            placeholder="Contoh: Kendala pesanan #KL-102 atau laporan produk"
          />
        </label>

        <label class="field">
          <span>Detail Pesan / Laporan</span>
          <textarea
            v-model="form.message"
            rows="4"
            placeholder="Tuliskan kronologi, ID pesanan/produk, atau pesan kamu..."
            required
          ></textarea>
        </label>

        <p v-if="errorMsg" class="form-error">{{ errorMsg }}</p>

        <div class="form-submit-row">
          <button type="submit" class="pill-btn-primary">
            <Send :size="15" />
            Kirim &amp; Buat Ringkasan
          </button>
        </div>

        <div v-if="submittedReport" class="receipt-box">
          <div class="receipt-head">
            <strong>Ringkasan Siap Dikirim</strong>
            <span class="ticket-pill">{{ submittedReport.ticketCode }}</span>
          </div>
          <p>
            Tiket <b>{{ submittedReport.category }}</b> atas nama
            <b>{{ submittedReport.name }}</b> sudah disiapkan. Pilih jalur kirim
            cepat jika ingin langsung meneruskannya:
          </p>
          <div class="channel-actions">
            <a
              :href="submittedReport.waUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="pill-btn-primary"
            >
              Kirim via WA
            </a>
            <a :href="submittedReport.mailUrl" class="pill-btn-ghost">
              Kirim via Email
            </a>
          </div>
        </div>
      </form>

      <aside class="info-card">
        <span class="channel-tag-pill">Informasi</span>
        <h3>Jam &amp; Area Layanan</h3>

        <div class="info-item-pill">
          <Clock :size="16" />
          <div>
            <strong>Jam Operasional</strong>
            <span>{{ contactInfo.hours }}</span>
          </div>
        </div>

        <div class="info-item-pill">
          <MapPin :size="16" />
          <div>
            <strong>Domisili &amp; Jangkauan</strong>
            <span>{{ contactInfo.location }}</span>
          </div>
        </div>

        <div class="info-note">
          Untuk mempercepat proses <b>laporan</b>, sertakan nomor pesanan, nama
          toko/produk, dan kronologi singkat pada form di samping.
        </div>
      </aside>
    </div>

    <!-- Bagian Bawah: WhatsApp & Email -->
    <div class="kontak-bottom-channels">
      <!-- WhatsApp -->
      <article class="channel-card">
        <div class="channel-head">
          <span class="channel-icon-pill">
            <MessageCircle :size="17" />
          </span>
          <span class="channel-tag-pill">Respon Cepat</span>
        </div>

        <h3>WhatsApp</h3>
        <p class="channel-desc">
          Tanya bantuan pesanan, konfirmasi toko, atau koordinasi cepat dengan
          admin.
        </p>
        <div class="channel-value">{{ contactInfo.whatsappDisplay }}</div>

        <div class="channel-actions">
          <a
            :href="buildWhatsAppUrl()"
            target="_blank"
            rel="noopener noreferrer"
            class="pill-btn-primary"
          >
            Chat WA
          </a>
          <button
            type="button"
            class="pill-btn-ghost"
            @click="copyText(contactInfo.whatsappDisplay, 'wa')"
          >
            <Check v-if="copiedKey === 'wa'" :size="14" />
            <Copy v-else :size="14" />
            {{ copiedKey === "wa" ? "Tersalin" : "Salin" }}
          </button>
        </div>
      </article>

      <!-- Email -->
      <article class="channel-card">
        <div class="channel-head">
          <span class="channel-icon-pill">
            <Mail :size="17" />
          </span>
          <span class="channel-tag-pill">Resmi</span>
        </div>

        <h3>Email</h3>
        <p class="channel-desc">
          Cocok untuk keperluan administrasi, kerja sama pengrajin, atau
          lampiran dokumen.
        </p>
        <div class="channel-value">{{ contactInfo.email }}</div>

        <div class="channel-actions">
          <a
            :href="buildMailtoUrl(contactInfo.email)"
            class="pill-btn-primary"
          >
            Kirim Email
          </a>
          <button
            type="button"
            class="pill-btn-ghost"
            @click="copyText(contactInfo.email, 'email')"
          >
            <Check v-if="copiedKey === 'email'" :size="14" />
            <Copy v-else :size="14" />
            {{ copiedKey === "email" ? "Tersalin" : "Salin" }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.kontak-wrap {
  max-width: 1220px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  color: #3d2d24;
}

.kontak-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 26px;
}

.kontak-pill-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: #f3e7dc;
  color: #943c14;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
}

.kontak-top h2 {
  margin: 10px 0 4px;
  font-family: Georgia, serif;
  font-size: 28px;
  font-weight: 600;
}

.kontak-top p {
  margin: 0;
  color: #85766a;
  font-size: 13px;
}

.kontak-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid #e6ddd3;
  background: #ffffff;
  color: #493328;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}

.kontak-pill-btn:hover {
  border-color: #943c14;
  color: #943c14;
}

.kontak-top-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 18px;
  align-items: start;
  margin-bottom: 24px;
}

.kontak-bottom-channels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.channel-card,
.form-card,
.info-card {
  border-radius: 22px;
  border: 1px solid #ece5dd;
  background: #ffffff;
  padding: 22px;
}

.channel-card {
  display: flex;
  flex-direction: column;
}

.channel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}

.channel-icon-pill {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: #f8eee6;
  color: #943c14;
}

.channel-tag-pill {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 5px 12px;
  border-radius: 999px;
  background: #fbf7f2;
  border: 1px solid #ece4da;
  color: #943c14;
  font-size: 11px;
  font-weight: 700;
}

.channel-card h3,
.form-header h3,
.info-card h3 {
  margin: 8px 0 6px;
  font-family: Georgia, serif;
  font-size: 18px;
  font-weight: 600;
}

.channel-desc,
.form-header p {
  margin: 0 0 14px;
  color: #76665c;
  font-size: 13px;
  line-height: 1.5;
}

.channel-value {
  padding: 9px 14px;
  border-radius: 999px;
  background: #fbf7f2;
  border: 1px solid #ece4da;
  color: #33251e;
  font-size: 12.5px;
  font-weight: 700;
  margin-bottom: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.channel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.pill-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid #943c14;
  background: #943c14;
  color: #fffaf2;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.pill-btn-primary:hover {
  background: #7d3210;
  border-color: #7d3210;
}

.pill-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 15px;
  border-radius: 999px;
  border: 1px solid #e6ddd3;
  background: #fbf7f2;
  color: #493328;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}

.pill-btn-ghost:hover {
  border-color: #943c14;
  color: #943c14;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.field > span {
  font-size: 12px;
  font-weight: 700;
  color: #493328;
}

.field input,
.field textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 16px;
  border-radius: 16px;
  border: 1px solid #e6ddd3;
  background: #fbf7f2;
  color: #33251e;
  font: inherit;
  font-size: 13px;
  outline: none;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.field input:focus,
.field textarea:focus {
  border-color: #943c14;
  background: #ffffff;
}

.pill-choice-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.choice-pill {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid #e6ddd3;
  background: #fbf7f2;
  color: #5a483d;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.choice-pill.active {
  border-color: #943c14;
  background: #943c14;
  color: #fffaf2;
}

.form-error {
  margin: 0 0 12px;
  color: #b42318;
  font-size: 12px;
  font-weight: 600;
}

.form-submit-row {
  display: flex;
  justify-content: flex-start;
}

.receipt-box {
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: #fbf7f2;
  border: 1px solid #e6ddd3;
}

.receipt-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.ticket-pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: #943c14;
  color: #fffaf2;
  font-size: 11px;
  font-weight: 700;
}

.receipt-box p {
  margin: 0 0 12px;
  font-size: 12.5px;
  color: #5a483d;
  line-height: 1.5;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: #fbf7f2;
  border: 1px solid #ece4da;
  color: #943c14;
}

.info-item-pill div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-item-pill strong {
  font-size: 12.5px;
  color: #33251e;
}

.info-item-pill span {
  font-size: 12px;
  color: #76665c;
}

.info-note {
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8eee6;
  color: #5a483d;
  font-size: 12.5px;
  line-height: 1.5;
}

@media (max-width: 960px) {
  .kontak-top-grid,
  .kontak-bottom-channels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>