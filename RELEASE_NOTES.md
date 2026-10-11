# Mono Serpent v2.0.2

Patch lanjutan V2 yang membuat pembaruan web langsung tersedia meski browser sudah menyimpan versi offline sebelumnya.

## Perbaikan

- Aset CSS, JavaScript, manifest, dan service worker menggunakan cache versi yang diperbarui.
- Service worker mengambil aset dari jaringan terlebih dahulu saat online, menyimpannya untuk offline, dan memakai cache saat jaringan terputus.
- Kontrol keyboard tetap berfungsi ketika fokus browser berada pada tombol Start; papan game dapat difokuskan dan menampilkan focus ring.

## Termasuk fitur V2

- Mode Endless dan Obstacle dengan arena Random, Twin Gates, Slalom, dan Crossing.
- Makanan bonus terbatas waktu, level bertahap, wrap-around, serta kemenangan saat papan penuh.
- Lima rekor lokal per mode dan migrasi high score v1.
- Pilihan 14 bahasa, empat palet LCD, suara sintetis, dan getaran opsional.
- PWA yang dapat dipasang, cache offline, D-pad, swipe, Arrow Keys/WASD, pause/resume, serta pause otomatis saat halaman kehilangan fokus.

## Memainkan

- **Web:** https://aldoprawiroa.github.io/Mono-Serpent/
- **Offline:** unduh `Mono-Serpent-v2.0.2.zip`, ekstrak, lalu buka `index.html`.
