<div align="center">

# MONO SERPENT

**Snake saku bergaya LCD monokrom—sederhana, responsif, dan siap dimainkan offline.**

[▶ Mainkan di browser](https://aldoprawiroa.github.io/Mono-Serpent/) · [Unduh Mono Serpent v2.0.1](https://github.com/aldoprawiroa/Mono-Serpent/releases/download/v2.0.1/Mono-Serpent-v2.0.1.zip) · [Lihat semua rilis](https://github.com/aldoprawiroa/Mono-Serpent/releases)

<br>

![Mono Serpent berjalan dengan tampilan LCD hijau monokrom](icons/mono-serpent.svg)

</div>

Mono Serpent adalah reinterpretasi Snake klasik yang mengambil rasa dari Snake dan Snake II pada ponsel Nokia era 3310. Ular bergerak kotak demi kotak, layar terhubung di keempat sisinya, dan tampilan LCD dibuat sederhana agar permainan tetap menjadi fokus.

Versi 2 menambahkan arena rintangan, makanan bonus, rekor lokal, beberapa warna LCD, getaran, pilihan bahasa, serta dukungan instalasi/offline. Patch v2.0.1 juga memastikan tombol Start yang sedang fokus tidak menahan kontrol keyboard. Game dibuat dengan HTML, CSS, JavaScript vanilla, dan Canvas—tanpa framework, akun, iklan, backend, atau aset eksternal.

## Mainkan

- **Langsung di web:** buka [Mono Serpent](https://aldoprawiroa.github.io/Mono-Serpent/).
- **Unduh dan main offline:** ambil [Mono-Serpent-v2.0.1.zip](https://github.com/aldoprawiroa/Mono-Serpent/releases/download/v2.0.1/Mono-Serpent-v2.0.1.zip), ekstrak, lalu buka `index.html`.
- **Pasang di Android:** buka versi web di browser yang mendukung PWA, lalu gunakan tombol **Install App** jika tersedia atau menu browser **Install app / Add to Home screen**.

File ZIP juga dapat dimainkan tanpa server. Jika browser membatasi file lokal, ekstrak arsip dan jalankan server statis dari folder tersebut:

```bash
python -m http.server 8000
```

Lalu buka <http://localhost:8000>. Tidak ada dependency atau proses build yang perlu dijalankan.

## Kontrol

| Perangkat | Kontrol |
| --- | --- |
| Keyboard | **Arrow Keys** atau **W A S D** untuk mengubah arah |
| Keyboard | **Enter** untuk mulai/ulang; **Space** atau **P** untuk jeda/lanjut |
| Layar sentuh | D-pad besar di bawah perangkat; tombol tengah menjeda atau melanjutkan |
| Layar sentuh | Usap papan permainan untuk mengubah arah |

Arah yang membalikkan gerakan 180° diabaikan. Permainan otomatis dijeda ketika tab atau jendela kehilangan fokus, sehingga ular tidak berjalan tanpa kontrol.

## Cara bermain

- Setiap makanan biasa memberi **10 poin** dan memanjangkan ular.
- Setiap lima makanan, level naik dan ular bergerak sedikit lebih cepat.
- Makanan bonus sesekali muncul dalam waktu terbatas; ambil untuk mendapat **30 poin**.
- Keluar melewati tepi akan membawa ular ke sisi berlawanan, seperti Snake II.
- Hindari tubuh sendiri dan rintangan. Penuhi seluruh papan pada mode Endless untuk menang.

### Mode

- **Endless:** papan terbuka tanpa dinding; fokus pada skor dan bertahan selama mungkin.
- **Obstacle:** pilih arena acak, Twin Gates, Slalom, atau Crossing. Menyentuh rintangan mengakhiri permainan.

Lima skor terbaik disimpan secara lokal untuk setiap mode. Rekor lama dari v1 ikut dibaca dan dimigrasikan. Skor, preferensi, serta pilihan bahasa tidak dikirim ke server.

## Bahasa dan tampilan

Antarmuka tersedia dalam 14 pilihan: English, Bahasa Indonesia, Deutsch, Русский, 日本語, 한국어, Français, Español, Português (Brasil), 简体中文, العربية, हिन्दी, Italiano, dan Türkçe. Bahasa العربية menggunakan arah teks kanan-ke-kiri.

Pilih warna layar **Sage**, **Moss**, **Gray**, atau **Amber**. Suara sintetis bergaya keypad dan getaran perangkat dapat dinyalakan atau dimatikan di pengaturan. Preferensi tersimpan di perangkat ini.

## Instalasi dan offline

Mono Serpent adalah situs statis dan Progressive Web App. Setelah dibuka melalui HTTPS dan tersedia di browser yang mendukungnya, aplikasi dapat dipasang dari browser dan shell game disimpan untuk dimainkan offline. File ZIP juga bisa dimainkan langsung; service worker hanya tersedia saat dijalankan melalui HTTPS atau server lokal.

## Struktur proyek

```text
.
├── index.html                     # Struktur game, pengaturan, dan kontrol
├── styles.css                     # Tampilan handset dan layout responsif
├── game.js                        # State, input, gerakan, skor, render, audio
├── locales.js                     # Katalog antarmuka 14 bahasa
├── service-worker.js              # Cache shell untuk penggunaan offline
├── manifest.webmanifest           # Metadata instalasi PWA
├── icons/                          # Ikon SVG dan PNG aplikasi
├── VERSION                         # Versi yang dikemas workflow rilis
├── RELEASE_NOTES.md                # Catatan rilis terbaru
└── .github/workflows/publish.yml   # Rilis ZIP dan deploy GitHub Pages
```

## Kompatibilitas

Diuji untuk layout portrait mulai dari lebar 320 px hingga desktop. Game bekerja pada browser modern di Android, iOS, dan desktop. Papan memakai grid tetap sehingga ukurannya dapat berubah tanpa mengubah aturan gerak.

Mono Serpent adalah tribute penggemar yang berdiri sendiri. Game ini tidak berafiliasi dengan atau didukung oleh Nokia, serta tidak menggunakan aset Nokia.
