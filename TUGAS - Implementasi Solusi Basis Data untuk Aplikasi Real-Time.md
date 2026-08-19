# TUGAS: Implementasi Solusi Basis Data untuk Aplikasi Real-Time

> **Mata Kuliah** : Sistem Basis Data Modern (Pertemuan ke-14)
> **Jenis Asesmen** : Proyek / Capstone (Kelompok — Manual Grading)
> **Sub-CPMK** : Sub-CPMK-3.3 (Level Kognitif C3 — Mengimplementasikan)
> **Deadline** : 19 Agustus 2026, 23.59

**Kelompok:** Kelompok 7

| No | Nama Anggota | NIM |
|---|---|---|
| 1 | RADHITYAH WALHIDAYAH | 105841102724 |
| 2 | Muhammad Abdul Farid | 105841100724 |
| 3 | Ibnu Arshysyahnan Mustafa | 105841101724 |
| 4 | Muliyadi. H | 105841102524 |

---

## 1. Deskripsi Singkat Project yang Telah Dipresentasikan

### ResepPintar — Implementasi Basis Data untuk Aplikasi Resep Berbasis AI Real-Time

**ResepPintar** adalah aplikasi web resep masakan berbasis AI yang mengimplementasikan solusi basis data untuk kebutuhan **aplikasi real-time**: pengguna membuat resep dari bahan yang dimiliki, mencari resep dari nama makanan, menyimpan koleksi resep beserta foto, dan mengobrol dengan AI (ChefBot) yang jawabannya muncul kata per kata secara langsung.

### a. Analisis Kebutuhan

Studi kasus menuntut sistem yang mampu memberikan **respons cepat dan data yang konsisten**:

1. Jawaban AI harus tampil **seketika** (tidak menunggu 30–60 detik hingga jawaban selesai diproses)
2. Pencarian koleksi resep harus terasa **instan** saat pengguna mengetik
3. Foto yang di-upload harus **langsung dapat diakses** melalui URL publik
4. Data resep dan foto harus selalu **konsisten** — tidak boleh ada foto yatim tanpa resep
5. Layanan AI harus **selalu tersedia** meski salah satu server tidak dapat dihubungi

### b. Pemilihan Teknologi

| Kebutuhan | Teknologi Terpilih | Alasan |
|---|---|---|
| Data resep fleksibel, baca-tulis cepat | **MongoDB** (NoSQL Document Store) | Dokumen JSON tanpa skema kaku, latensi baca/tulis rendah |
| Penyimpanan foto dengan akses langsung | **MinIO** (S3-compatible Object Storage) | URL publik instan (read-public), upload privat |
| Respons AI real-time | **Ollama** (`llama3.2`) dengan HTTP streaming | Token dikirim satu per satu, terasa instan |
| API konsisten & terdokumentasi | **Express JS + Swagger** (OpenAPI 3.0) | RESTful API teruji, dokumentasi interaktif di `/docs` |
| Deployment konsisten antar mesin | **Docker Compose** (5 container) | Semua layanan berjalan identik dengan satu perintah |

### c. Implementasi Solusi Basis Data Real-Time

- **Streaming respons AI (real-time)** — endpoint `/api/chat` memanggil Ollama dengan `stream: true`; token diteruskan ke browser lewat `ReadableStream API` dan dirender kata per kata ke bubble chat, seperti ChatGPT/Claude. Memori percakapan (8 pesan terakhir) disertakan di tiap request agar konteks tetap konsisten.
- **Koneksi database cepat & hemat** — koneksi MongoDB memakai **singleton pattern** (satu koneksi di-reuse, tanpa overhead koneksi baru per request), menjaga waktu respons API tetap rendah.
- **Pencarian real-time** — halaman koleksi memfilter resep langsung saat pengguna mengetik, didukung query MongoDB berdasarkan nama masakan.
- **Konsistensi data lintas penyimpanan** — menyimpan resep menulis dokumen ke MongoDB berikut `foto_url` dari MinIO; menghapus resep menjalankan **penghapusan berantai** (dokumen MongoDB + objek foto MinIO dihapus bersamaan) sehingga tidak ada data yatim.
- **Upload foto langsung tersedia** — file diunggah ke bucket MinIO (dibuat otomatis, kebijakan read-public/write-private) dan URL publiknya langsung dapat dipakai browser tanpa proses tambahan.
- **Ketersediaan layanan (failover otomatis)** — API mencoba server Ollama kampus (`https://ollama.if.unismuh.ac.id`) lebih dulu; jika gagal, otomatis beralih ke Ollama lokal tanpa error di sisi pengguna — respons tetap cepat dan konsisten meski infrastruktur berubah.
- **Output AI terstruktur** — fitur resep memakai `format: json` agar jawaban AI selalu berupa JSON valid sebelum disimpan ke MongoDB, menjaga konsistensi struktur data.

### d. Hasil

Solusi yang dibangun aplikatif dan berjalan nyata: seluruh sistem (MongoDB, MinIO, Ollama, RESTful API, Web) dijalankan dengan satu perintah `docker compose up -d --build`, aplikasi diakses di `http://localhost:3000`, dan dokumentasi API interaktif tersedia di `http://localhost:4000/docs`.

---

## 2. Link Repo GitHub Project yang Telah Dipresentasikan

> 🔗 **https://github.com/Radhityah/AI-RESEP-PINTAR**

---

*File ini adalah jawaban untuk asesmen "Implementasi Solusi Basis Data untuk Aplikasi Real-Time" — deskripsi teknis lengkap tersedia di `DOKUMENTASI.md` pada repo yang sama.*
