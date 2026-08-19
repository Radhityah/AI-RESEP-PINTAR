# TUGAS: Evaluasi Kinerja Sistem Basis Data dalam Solusi Industri

> **Mata Kuliah** : Sistem Basis Data Modern (Pertemuan ke-15)
> **Jenis Asesmen** : Proyek / Capstone (Kelompok — Manual Grading)
> **Sub-CPMK** : Sub-CPMK-3.4 — Mengevaluasi kinerja sistem basis data secara kritis
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

### ResepPintar — Evaluasi Kinerja Sistem Basis Data pada Aplikasi Resep Berbasis AI

**ResepPintar** adalah aplikasi web resep masakan berbasis AI dengan penyimpanan poliglot: **MongoDB** (NoSQL document store) untuk data resep dan **MinIO** (object storage S3-compatible) untuk foto, dilayani **RESTful API Express JS + Swagger** dan frontend **Next.js 15**, seluruhnya berjalan dalam **5 container Docker Compose**. Dalam pengembangannya, kinerja sistem basis data dievaluasi secara kritis dan hasil evaluasinya dipakai untuk memperbaiki desain — sesuai fokus asesmen ini.

### a. Metode dan Metrik Evaluasi

Evaluasi dilakukan dengan menguji langsung alur nyata aplikasi (end-to-end) memakai metrik:

| Metrik | Yang Diukur |
|---|---|
| **Waktu respons (latency)** | Lama permintaan API hingga data tampil di browser |
| **Perceived latency** | Lama pengguna menunggu sampai *mulai* melihat hasil (khusus fitur AI) |
| **Efisiensi koneksi** | Jumlah koneksi database yang dibuat per permintaan |
| **Ketersediaan (availability)** | Perilaku sistem saat salah satu layanan tidak dapat dihubungi |
| **Konsistensi data** | Ada/tidaknya data yatim antara MongoDB dan MinIO |

### b. Masalah Kinerja yang Teridentifikasi dan Solusinya

| Masalah Hasil Evaluasi | Solusi yang Diimplementasikan | Dampak |
|---|---|---|
| Jawaban AI chat baru tampil setelah 30–60 detik (menunggu seluruh teks selesai) | **HTTP streaming** (`stream: true` + ReadableStream API) — token dirender kata per kata | Perceived latency turun dari puluhan detik menjadi hitungan detik |
| Koneksi MongoDB baru dibuat berulang kali (terutama saat hot-reload development) | **Singleton pattern** pada modul koneksi — satu koneksi di-reuse | Waktu respons API stabil, tanpa overhead handshake berulang |
| Menyimpan foto (binary besar) di database membebani ukuran dan kinerja query | **Offload ke MinIO** — database hanya menyimpan `foto_url` | Dokumen MongoDB tetap kecil, query koleksi resep tetap cepat |
| Server AI kampus kadang tidak terjangkau → fitur AI mati total | **Failover otomatis** ke Ollama lokal (diatur di `backend/src/ollama.js`) | Layanan tetap tersedia tanpa error di sisi pengguna |
| Output AI berupa teks bebas kadang merusak struktur data resep | **`format: json`** — Ollama dipaksa menghasilkan JSON valid | Data yang masuk MongoDB selalu konsisten strukturnya |
| Menghapus resep menyisakan foto yatim di storage | **Penghapusan berantai** — dokumen MongoDB dan objek MinIO dihapus bersamaan | Konsistensi lintas penyimpanan terjaga |

### c. Kesesuaian dengan Konteks Industri

Pola yang dievaluasi dan diterapkan di project ini adalah pola yang sama dengan praktik industri: pemisahan data terstruktur (NoSQL) dari objek biner (object storage), connection pooling, streaming untuk menekan perceived latency, failover demi ketersediaan, serta containerization untuk lingkungan yang konsisten. Dari evaluasi juga teridentifikasi peluang peningkatan lanjutan yang relevan dengan materi **In-Memory Database**: menambahkan lapisan cache in-memory (mis. Redis) untuk hasil pencarian dan resep yang sering diakses, guna menekan beban baca MongoDB pada skala trafik industri.

---

## 2. Link Repo GitHub Project yang Telah Dipresentasikan

> 🔗 **https://github.com/Radhityah/AI-RESEP-PINTAR**

---

*File ini adalah jawaban untuk asesmen "Evaluasi Kinerja Sistem Basis Data dalam Solusi Industri" — deskripsi teknis lengkap tersedia di `DOKUMENTASI.md` pada repo yang sama.*
