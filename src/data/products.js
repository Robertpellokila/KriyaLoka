
export const categories = [
  {
    id: 1,
    name: 'Kerajinan Kayu',
    description: 'Karya ukir dan dekorasi kayu',
    icon: '🪵',
    slug: 'kerajinan-kayu',
    count: '24 Produk',
  },
  {
    id: 2,
    name: 'Tenun & Tekstil',
    description: 'Kain tradisional dan aksesori',
    icon: '🧵',
    slug: 'tenun-tekstil',
    count: '18 Produk',
  },
  {
    id: 3,
    name: 'Keramik',
    description: 'Peralatan dan dekorasi keramik',
    icon: '🏺',
    slug: 'keramik',
    count: '16 Produk',
  },
  {
    id: 4,
    name: 'Aksesori',
    description: 'Perhiasan dan aksesori handmade',
    icon: '📿',
    slug: 'aksesori',
    count: '32 Produk',
  },
  {
    id: 5,
    name: 'Dekorasi Rumah',
    description: 'Sentuhan seni untuk hunian',
    icon: '🏡',
    slug: 'dekorasi-rumah',
    count: '21 Produk',
  },
  {
    id: 6,
    name: 'Anyaman',
    description: 'Karya anyaman tradisional',
    icon: '🧺',
    slug: 'anyaman',
    count: '14 Produk',
  },
]

export const products = [
  {
    id: 1,
    name: 'Patung Garuda Ukiran Kayu',
    artisan: 'Made Art Studio',
    location: 'Gianyar, Bali',
    price: 450000,
    originalPrice: 550000,
    rating: 4.9,
    sold: 28,
    stock: 12,
    category: 'Kerajinan Kayu',
    badge: 'Terlaris',
    image:
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900',
    gallery: [
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900',
      'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=900',
      'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=900',
    ],
    description:
      'Patung Garuda ini merupakan karya kerajinan yang terinspirasi dari kekayaan seni dan budaya Bali. Dibuat dengan detail ukiran yang dikerjakan secara teliti oleh pengrajin lokal.',
    details: [
      { label: 'Material', value: 'Kayu pilihan' },
      { label: 'Teknik', value: 'Ukir manual' },
      { label: 'Asal', value: 'Gianyar, Bali' },
      { label: 'Jenis Produk', value: 'Dekorasi' },
      { label: 'Pengerjaan', value: 'Handmade' },
    ],
    artisanBio:
      'Made Art Studio merupakan usaha kerajinan lokal dari Gianyar yang berfokus pada karya seni ukir dan dekorasi bernuansa budaya Bali.',
  },
  {
    id: 2,
    name: 'Tas Anyaman Rotan Natural',
    artisan: 'Bali Woven Craft',
    location: 'Ubud, Bali',
    price: 285000,
    originalPrice: null,
    rating: 4.8,
    sold: 42,
    stock: 8,
    category: 'Anyaman',
    badge: 'Pilihan',
    image:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900',
    gallery: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=900',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=900',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=900',
    ],
    description:
      'Tas anyaman dengan tampilan natural yang cocok digunakan untuk aktivitas sehari-hari. Menghadirkan karakter kerajinan tradisional dengan gaya yang mudah dipadukan.',
    details: [
      { label: 'Material', value: 'Rotan' },
      { label: 'Teknik', value: 'Anyaman manual' },
      { label: 'Asal', value: 'Ubud, Bali' },
      { label: 'Jenis Produk', value: 'Tas' },
      { label: 'Pengerjaan', value: 'Handmade' },
    ],
    artisanBio:
      'Bali Woven Craft mengembangkan produk anyaman dengan memanfaatkan keterampilan pengrajin lokal dan material alami.',
  },
  {
    id: 3,
    name: 'Vas Keramik Handmade',
    artisan: 'Tanah Studio',
    location: 'Denpasar, Bali',
    price: 175000,
    originalPrice: null,
    rating: 4.9,
    sold: 19,
    stock: 15,
    category: 'Keramik',
    badge: null,
    image:
      'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=900',
    gallery: [
      'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=900',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=900',
      'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=900',
    ],
    description:
      'Vas keramik handmade dengan bentuk sederhana dan sentuhan artistik. Cocok sebagai elemen dekorasi untuk mempercantik ruang keluarga maupun ruang kerja.',
    details: [
      { label: 'Material', value: 'Keramik' },
      { label: 'Teknik', value: 'Pembentukan dan finishing manual' },
      { label: 'Asal', value: 'Denpasar, Bali' },
      { label: 'Jenis Produk', value: 'Dekorasi rumah' },
      { label: 'Pengerjaan', value: 'Handmade' },
    ],
    artisanBio:
      'Tanah Studio menghadirkan produk keramik dengan pendekatan artistik dan desain yang mengutamakan karakter material.',
  },
  {
    id: 4,
    name: 'Kalung Manik Etnik',
    artisan: 'Nusa Beads',
    location: 'Klungkung, Bali',
    price: 125000,
    originalPrice: 150000,
    rating: 4.7,
    sold: 35,
    stock: 20,
    category: 'Aksesori',
    badge: 'Diskon',
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900',
    gallery: [
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900',
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=900',
    ],
    description:
      'Kalung manik dengan karakter etnik yang dapat melengkapi penampilan. Setiap detail dirangkai dengan teliti untuk menghasilkan aksesori yang unik.',
    details: [
      { label: 'Material', value: 'Manik-manik pilihan' },
      { label: 'Teknik', value: 'Rangkai manual' },
      { label: 'Asal', value: 'Klungkung, Bali' },
      { label: 'Jenis Produk', value: 'Aksesori' },
      { label: 'Pengerjaan', value: 'Handmade' },
    ],
    artisanBio:
      'Nusa Beads merupakan usaha aksesori lokal yang berfokus pada produk manik dengan sentuhan desain etnik.',
  },
]
