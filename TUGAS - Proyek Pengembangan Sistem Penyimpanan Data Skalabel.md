# TUGAS: Proyek Pengembangan Sistem Penyimpanan Data Skalabel

> **Mata Kuliah** : Sistem Basis Data Modern
> **Jenis Asesmen** : Proyek / Capstone (Kelompok — Manual Grading)
> **Sub-CPMK** : Sub-CPMK-3.2 (Level Kognitif C4 — Bloom's Taxonomy)
> **Deadline** : 19 Agustus 2026, 23.59

**Kelompok:** Kelompok 9

| No | Nama Anggota | NIM |
|---|---|---|
| 1 | RADHITYAH WALHIDAYAH | 105841102724 |
| 2 | Muhammad Abdul Farid | 105841100724 |
| 3 | Ibnu Arshysyahnan Mustafa | 105841101724 |
| 4 | Muliyadi. H | 105841102524 |

---

## 1. Deskripsi Singkat Project yang Telah Dipresentasikan

### ResepPintar — Platform Resep Masakan Berbasis AI dengan Sistem Penyimpanan Data Skalabel

**ResepPintar** adalah aplikasi web yang membantu pengguna membuat resep masakan dari bahan-bahan yang dimiliki, mencari resep berdasarkan nama makanan (dengan deteksi input ambigu), menyimpan koleksi resep pribadi beserta foto, serta berkonsultasi dengan AI (ChefBot) secara real-time. Project ini dirancang sebagai prototipe **sistem penyimpanan data yang skalabel dan adaptif**, mampu menangani volume data besar serta beradaptasi terhadap perubahan beban kerja dan teknologi.

### a. Desain Arsitektur Sistem Penyimpanan Skala Industri

Sistem dibangun dengan arsitektur **multi-tier terkontainerisasi** (5 container Docker) yang memisahkan setiap layanan sehingga masing-masing dapat di-scale secara independen:

```
Browser → Next.js 15 (Web FE, port 3000)
        → Express JS + Swagger (RESTful API, port 4000)
        → ┌ MongoDB  (port 27017)  → data resep (dokumen JSON)
          ├ MinIO    (port 9000)   → foto masakan (object storage S3-compatible)
          └ Ollama   (llama3.2)    → AI engine (server kampus + fallback lokal)
```

- **Frontend**: Next.js 15 (App Router) + React + TypeScript + Tailwind CSS
- **Backend**: RESTful API dengan Express JS, terdokumentasi lengkap dengan **Swagger/OpenAPI 3.0** (`http://localhost:4000/docs`)
- **Orkestrasi**: Docker Compose menjalankan seluruh layanan (MongoDB, MinIO, Ollama, API, Web) dengan satu perintah — pola yang sama dipakai industri untuk deployment yang portabel dan mudah direplikasi

### b. Penerapan Teknologi NoSQL dan Polyglot Persistence

Project ini menerapkan **polyglot persistence** — memakai jenis penyimpanan berbeda sesuai karakteristik data:

| Jenis Data | Teknologi | Alasan Pemilihan |
|---|---|---|
| Data resep (terstruktur fleksibel) | **MongoDB** (NoSQL Document Store) | Skema fleksibel — struktur resep dari AI bervariasi (array bahan, langkah, tips); dokumen JSON cocok tanpa migrasi skema |
| Foto masakan (unstructured/binary) | **MinIO** (Object Storage, S3-compatible) | Data biner besar tidak efisien di database; object storage memberi URL publik langsung dan skalabilitas horizontal |
| Konfigurasi & koneksi | Environment variables (.env) | Memisahkan konfigurasi dari kode (12-factor app) |

Koneksi MongoDB menggunakan **singleton pattern** agar satu koneksi di-reuse (efisiensi connection pooling), dan bucket MinIO dibuat otomatis dengan kebijakan akses **read-public / write-private**.

### c. Strategi Replikasi dan Partisi Data

- **MongoDB** dipilih karena dukungan bawaan untuk **replica set** (replikasi untuk high availability) dan **sharding** (partisi horizontal saat volume data tumbuh) — arsitektur container memungkinkan penambahan node MongoDB tanpa mengubah kode aplikasi.
- **MinIO** mendukung mode **distributed dengan erasure coding**, sehingga penyimpanan foto dapat direplikasi dan dipartisi ke banyak node saat kebutuhan meningkat.
- **Volume Docker terpisah** (`mongodb_data`, `minio_data`, `ollama_data`) memastikan persistensi data independen per layanan.

### d. Optimasi Penyimpanan dan Pemrosesan Data Adaptif

- **AI failover otomatis**: sistem mencoba server Ollama kampus (`https://ollama.if.unismuh.ac.id`) lebih dulu; jika tidak terjangkau, otomatis beralih ke Ollama lokal tanpa error di sisi pengguna — bentuk adaptasi terhadap perubahan kondisi infrastruktur.
- **Streaming response** pada AI Chat: token dikirim satu per satu via HTTP stream (ReadableStream API), sehingga pemrosesan terasa instan tanpa menunggu seluruh jawaban selesai.
- **Structured output** (`format: json`) memaksa AI selalu menghasilkan JSON valid untuk data resep, menjaga konsistensi data yang masuk ke MongoDB.
- **Pencarian real-time** pada koleksi resep dan **penghapusan berantai** (hapus resep di MongoDB sekaligus fotonya di MinIO) menjaga konsistensi antar penyimpanan.

### Fitur Utama Aplikasi

1. **Mode Dari Bahan** — AI menyarankan 3 masakan dari bahan yang dimiliki pengguna
2. **Mode Nama Makanan + Clarify** — deteksi input ambigu (mis. "soto" → 4 pilihan varian daerah)
3. **Simpan Resep & Upload Foto** — resep ke MongoDB, foto ke MinIO
4. **Koleksi Resep** — list, pencarian, detail, hapus, generate ulang, cetak
5. **AI Chat (ChefBot)** — chat streaming real-time dengan memori percakapan (8 pesan terakhir)

### Cara Menjalankan

```bash
cd resep-pintar
docker compose up -d --build
```

| Layanan | URL |
|---|---|
| Aplikasi Web | http://localhost:3000 |
| Swagger API Docs | http://localhost:4000/docs |
| MinIO Console | http://localhost:9001 |

---

## 2. Link Repo GitHub Project yang Telah Dipresentasikan

> 🔗 **https://github.com/Radhityah/AI-RESEP-PINTAR**

---

*File ini adalah jawaban untuk asesmen "Proyek Pengembangan Sistem Penyimpanan Data Skalabel" — deskripsi lengkap teknis project tersedia di `resep-pintar/DOKUMENTASI.md`.*