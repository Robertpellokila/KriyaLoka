<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <RouterLink to="/" class="brand footer-logo">
          <span class="brand-symbol">K</span>
          <span class="brand-name">Kriya<span>Loka</span></span>
        </RouterLink>

        <p>
          Merayakan karya, budaya, dan kreativitas pengrajin lokal Bali. Temukan
          cerita di balik setiap mahakarya.
        </p>
      </div>

      <div class="footer-column">
        <h3>Jelajahi</h3>
        <RouterLink to="/">Beranda</RouterLink>
        <RouterLink to="/katalog">Katalog Produk</RouterLink>
        <a href="/#pengrajin">Cerita Pengrajin</a>
      </div>

      <div class="footer-column">
        <h3>Bantuan</h3>
        <a href="#">Cara Berbelanja</a>
        <a href="#">Pengiriman</a>
        <a href="#">Kebijakan Privasi</a>
      </div>

      <div class="footer-column">
        <h3>Hubungi Kami</h3>
        <p>Bali, Indonesia</p>
        <a href="mailto:halo@kriyaloka.id">halo@kriyaloka.id</a>
      </div>
    </div>

    <div class="container footer-bottom">
      <p>
        © {{ new Date().getFullYear() }} KriyaLoka. Dibuat dengan bangga untuk
        karya lokal.
      </p>
      <span>Mahakarya Bali, Cerita Indonesia.</span>
    </div>
  </footer>
</template>
