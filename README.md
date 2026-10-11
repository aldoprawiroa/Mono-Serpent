<div align="center">

# MONO SERPENT

**Game Snake ringan dengan nuansa LCD monokrom ponsel klasik.**

[▶ Mainkan Mono Serpent](https://aldoprawiroa.github.io/Mono-Serpent/) · [Unduh v1.0.0](https://github.com/aldoprawiroa/Mono-Serpent/releases/download/v1.0.0/Mono-Serpent-v1.0.0.zip) · [Semua rilis](https://github.com/aldoprawiroa/Mono-Serpent/releases)

</div>

Mono Serpent adalah reinterpretasi Snake klasik untuk browser: ular bergerak per kotak, makanan menambah skor dan panjang, tepi layar saling terhubung, dan tabrakan dengan tubuh sendiri mengakhiri permainan. Bentuk layar, warna LCD, tombol arah, serta beep singkatnya mengambil inspirasi dari game ponsel monokrom era 3310.

Tidak ada framework, akun, iklan, koneksi server, atau aset eksternal. Game bisa langsung dimainkan di halaman web, atau diunduh sebagai ZIP statis dan dimainkan secara offline.

## Cara bermain

1. Buka [Mono Serpent](https://aldoprawiroa.github.io/Mono-Serpent/) atau unduh ZIP dari [rilis v1.0.0](https://github.com/aldoprawiroa/Mono-Serpent/releases/download/v1.0.0/Mono-Serpent-v1.0.0.zip).
2. Tekan **START GAME**. Pada desktop, tekan **Enter** juga bisa digunakan untuk mulai atau mengulang.
3. Arahkan ular untuk mengambil makanan. Setiap makanan menambah 10 poin dan satu ruas tubuh.
4. Ular muncul kembali dari sisi seberang saat melewati tepi layar. Hindari menabrak tubuh sendiri.

| Perangkat | Kontrol |
| --- | --- |
| Keyboard | **Arrow Keys** atau **W A S D** untuk bergerak |
| Keyboard | **Space** atau **P** untuk pause/resume; **Enter** untuk mulai/ulang |
| Layar sentuh | D-pad di bawah layar game; tombol tengah untuk pause/resume |
| Layar sentuh | Swipe pada papan game sebagai kontrol tambahan |

Game otomatis dijeda saat tab atau jendela kehilangan fokus. High score dan pilihan suara disimpan lokal di browser/perangkat ini, tanpa dikirim ke server. Suara memakai Web Audio dan baru aktif setelah interaksi pemain; tombol **SOUND ON/OFF** tersedia di layar.

## Level dan progres

- Skor bertambah **10 poin** per makanan.
- Kecepatan naik satu level setiap lima makanan.
- Ular membungkus sisi papan, seperti mode Snake II.
- Memenuhi seluruh papan menghasilkan kemenangan.
- High score bertahan setelah browser ditutup selama penyimpanan lokal tersedia.

## Mainkan atau jalankan secara lokal

Untuk bermain offline, unduh ZIP v1.0.0 di bagian atas, ekstrak, lalu buka `index.html` di browser modern. Jika browser membatasi file lokal, jalankan server statis dari folder hasil ekstrak:

```bash
python -m http.server 8000
```

Kemudian buka <http://localhost:8000>. Proyek ini tidak memerlukan instalasi dependency atau proses build. Saat halaman GitHub Pages aktif, setiap perubahan pada branch `main` akan dicoba deploy otomatis oleh workflow Actions.

## Berkas proyek

```text
.
├── index.html                 # Markup game dan kontrol
├── styles.css                 # Tampilan LCD dan layout responsif
├── game.js                    # Aturan game, input, canvas, audio, dan skor
├── RELEASE_NOTES.md           # Catatan rilis v1.0.0
└── .github/workflows/publish.yml  # Publikasi Pages dan aset rilis
```

## Kompatibilitas

Dirancang untuk browser modern di Android, iOS, dan desktop. Layout memprioritaskan layar portrait, kontrol sentuh memiliki target besar, dan papan tetap berbasis grid pada ukuran layar berbeda.

Mono Serpent adalah tribute penggemar yang berdiri sendiri. Game ini tidak berafiliasi dengan atau didukung oleh Nokia dan tidak menggunakan aset Nokia.
