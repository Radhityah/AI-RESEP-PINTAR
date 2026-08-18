# ResepPintar — Dokumentasi Lengkap

> Platform resep masakan berbasis AI yang berjalan sepenuhnya **lokal** di komputer.  
> Tidak membutuhkan internet untuk fitur AI, tidak ada biaya API.

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Stack Teknologi](#2-stack-teknologi)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Struktur File](#4-struktur-file)
5. [Cara Menjalankan](#5-cara-menjalankan)
6. [Konfigurasi (.env.local)](#6-konfigurasi-envlocal)
7. [Fitur & Cara Kerja](#7-fitur--cara-kerja)
   - [7.1 Mode Dari Bahan](#71-mode-dari-bahan)
   - [7.2 Mode Nama Makanan + Clarify Ambigu](#72-mode-nama-makanan--clarify-ambigu)
   - [7.3 Simpan Resep & Upload Foto](#73-simpan-resep--upload-foto)
   - [7.4 Koleksi Resep](#74-koleksi-resep)
   - [7.5 AI Chat (ChefBot)](#75-ai-chat-chefbot)
8. [API Routes (Backend)](#8-api-routes-backend)
9. [Database — MongoDB](#9-database--mongodb)
10. [Penyimpanan Foto — MinIO](#10-penyimpanan-foto--minio)
11. [AI Engine — Ollama](#11-ai-engine--ollama)
12. [Alur Data Keseluruhan](#12-alur-data-keseluruhan)

---

## 1. Gambaran Umum

**ResepPintar** adalah aplikasi web yang membantu pengguna:
- Membuat resep masakan dari **bahan-bahan yang dimiliki**
- Mencari resep berdasarkan **nama makanan** (dengan deteksi input ambigu)
- **Menyimpan dan mengelola** koleksi resep pribadi beserta foto
- **Berkonsultasi** dengan AI tentang makanan, nutrisi, maupun topik lainnya

Semua fitur AI ditenagai oleh **Ollama** yang berjalan lokal — artinya privat, gratis, dan tidak membutuhkan koneksi internet.

---

## 2. Stack Teknologi

| Komponen | Teknologi | Keterangan |
|---|---|---|
| **Web FE** | Next.js 15 (App Router) + ReactJS | Antarmuka pengguna |
| **RESTful API** | Express JS + **Swagger** | Backend API — dokumentasi di `/docs` |
| **Bahasa** | TypeScript (FE) / JavaScript (API) | |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **AI Engine** | Ollama — `https://ollama.if.unismuh.ac.id` | Server kampus, fallback otomatis ke lokal |
| **Database** | MongoDB | Menyimpan data resep |
| **Penyimpanan Foto** | MinIO | S3-compatible storage |
| **Kontainerisasi** | Docker Compose | MongoDB + MinIO + Ollama + API + Web |

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                              │
│         http://localhost:3000                           │
│  ┌────────┐ ┌────────────┐ ┌────────┐ ┌─────────────┐  │
│  │Beranda │ │  Koleksi   │ │AI Chat │ │  Inspirasi  │  │
│  │  (/)   │ │ (/recipes) │ │(/chat) │ │(/inspirasi) │  │
│  └───┬────┘ └─────┬──────┘ └───┬────┘ └──────┬──────┘  │
└──────┴────────────┴──────┬─────┴─────────────┴─────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│      Next.js FE — proxy semua /api/* ke backend         │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│     RESTful API — Express JS + Swagger (port 4000)      │
│     📖 Dokumentasi API: http://localhost:4000/docs      │
│  /api/suggest-dishes    /api/generate-recipe            │
│  /api/clarify-dish      /api/chat                       │
│  /api/recipes           /api/upload-photo               │
└──────────┬──────────────────┬────────────────┬──────────┘
           │                  │                │
    ┌──────┴──────┐    ┌──────┴──────┐  ┌──────┴───────────┐
    │   MongoDB   │    │    MinIO    │  │      Ollama      │
    │  port 27017 │    │  port 9000  │  │ ollama.if.unismuh│
    │ (data resep)│    │  (foto)     │  │ .ac.id → lokal   │
    └─────────────┘    └─────────────┘  └──────────────────┘
```

**Penjelasan singkat:**
- **Browser** mengirim request ke Next.js (FE)
- **Next.js** mem-proxy semua request `/api/*` ke RESTful API backend
- **Express JS API** (dokumentasi **Swagger** di `/docs`) menghubungkan ke Ollama, MongoDB, dan MinIO
- **Ollama** — memakai server kampus `https://ollama.if.unismuh.ac.id/api/generate`; jika tidak bisa dihubungi, otomatis fallback ke Ollama lokal (`localhost:11434`)
- **MongoDB** menyimpan data resep, **MinIO** menyimpan foto masakan
- Semua layanan bisa dijalankan sekaligus dengan **Docker Compose**

---

## 4. Struktur File

```
resep-pintar/
├── .env.local                        ← Konfigurasi koneksi (API, MongoDB, MinIO, Ollama)
├── DOKUMENTASI.md                    ← File ini
├── docker-compose.yml                ← Jalankan semua layanan dengan Docker
├── Dockerfile                        ← Image Docker untuk Web FE (Next.js)
├── package.json
│
├── backend/                          ← RESTful API — Express JS + Swagger
│   ├── package.json
│   ├── Dockerfile                    ← Image Docker untuk API
│   └── src/
│       ├── index.js                  ← Entry point Express + Swagger UI (/docs)
│       ├── swagger.js                ← Spesifikasi OpenAPI 3.0 semua endpoint
│       ├── db.js                     ← Koneksi MongoDB
│       ├── minio.js                  ← Client MinIO + upload
│       ├── ollama.js                 ← Ollama kampus + fallback otomatis
│       └── routes/
│           ├── recipes.js            ← CRUD resep (GET/POST/DELETE)
│           ├── ai.js                 ← generate-recipe, suggest, clarify, chat
│           └── upload.js             ← Upload foto ke MinIO
│
└── src/
    ├── app/
    │   ├── layout.tsx                ← Layout global (font, metadata)
    │   ├── globals.css               ← CSS global
    │   │
    │   ├── page.tsx                  ← Halaman utama: generate resep
    │   │
    │   ├── chat/
    │   │   └── page.tsx              ← Halaman AI Chat (/chat)
    │   │
    │   ├── recipes/
    │   │   ├── page.tsx              ← Koleksi resep tersimpan (/recipes)
    │   │   └── [id]/
    │   │       ├── page.tsx          ← Detail satu resep (/recipes/:id)
    │   │       └── PrintButton.tsx   ← Komponen tombol cetak
    │   │
    │   └── api/                      ← Semua backend endpoint
    │       ├── suggest-dishes/
    │       │   └── route.ts          ← POST: saran masakan dari bahan
    │       ├── clarify-dish/
    │       │   └── route.ts          ← POST: deteksi input nama ambigu
    │       ├── generate-recipe/
    │       │   └── route.ts          ← POST: generate resep lengkap
    │       ├── chat/
    │       │   └── route.ts          ← POST: AI chat dengan streaming
    │       ├── upload-photo/
    │       │   └── route.ts          ← POST: upload foto ke MinIO
    │       └── recipes/
    │           ├── route.ts          ← GET (list) + POST (simpan resep)
    │           └── [id]/
    │               └── route.ts      ← GET (detail) + DELETE (hapus)
    │
    └── lib/
        ├── types.ts                  ← Interface TypeScript bersama
        ├── mongodb.ts                ← Koneksi MongoDB (singleton pattern)
        └── minio.ts                  ← Client MinIO + fungsi upload
```

---

## 5. Cara Menjalankan

### 🐳 Opsi A — Docker Compose (direkomendasikan)

Prasyarat: **Docker Desktop** terinstall dan berjalan.

```bash
cd "Downloads/DATA DHITZZ/AI PAK MUHIDDIN/resep-pintar"
docker compose up -d --build
```

Satu perintah ini menjalankan **5 container** sekaligus:
MongoDB, MinIO, Ollama, API (Express+Swagger), dan Web (Next.js).

Untuk menghentikan: `docker compose down`

### 💻 Opsi B — Manual (tanpa Docker)

**Step 1 — Jalankan layanan database + API:**
```
Klik dua kali: start-resep-pintar.bat
```
Script ini otomatis menjalankan:
- MongoDB di port **27017**
- MinIO di port **9000** (console admin: port **9001**)
- RESTful API (Express + Swagger) di port **4000**

**Step 2 — (Opsional) Jalankan Ollama lokal sebagai fallback:**
```
Buka aplikasi Ollama — AI utama memakai server kampus
```

**Step 3 — Jalankan Next.js:**
```bash
cd "Downloads/DATA DHITZZ/AI PAK MUHIDDIN/resep-pintar"
npm run dev
```

**Step 4 — Buka browser:**
```
http://localhost:3000
```

### URL Layanan

| Layanan | URL | Keterangan |
|---|---|---|
| Aplikasi web | http://localhost:3000 | Halaman utama |
| **Swagger API Docs** | **http://localhost:4000/docs** | **Dokumentasi RESTful API** |
| AI Chat | http://localhost:3000/chat | Halaman chat |
| Inspirasi 1000+ | http://localhost:3000/inspirasi | 1.243 ide hidangan |
| Koleksi Resep | http://localhost:3000/recipes | Koleksi tersimpan |
| MongoDB | mongodb://localhost:27017 | Koneksi database |
| MinIO API | http://localhost:9000 | Storage foto |
| MinIO Console | http://localhost:9001 | Admin panel MinIO |
| Ollama kampus | https://ollama.if.unismuh.ac.id | AI engine utama |
| Ollama lokal | http://localhost:11434 | AI engine fallback |

---

## 6. Konfigurasi (.env.local)

```env
# MongoDB — database untuk menyimpan resep
MONGODB_URI=mongodb://localhost:27017/resep-pintar

# MinIO — penyimpanan foto masakan
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=resep-pintar
MINIO_USE_SSL=false

# URL publik MinIO (dipakai browser untuk menampilkan foto)
NEXT_PUBLIC_MINIO_URL=http://localhost:9000

# Ollama — AI engine lokal
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

> **Penting:** Semua nilai di atas adalah konfigurasi lokal. Jangan diubah kecuali ada perubahan instalasi.

---

## 7. Fitur & Cara Kerja

### 7.1 Mode Dari Bahan

Pengguna memasukkan bahan-bahan yang dimiliki, AI menyarankan masakan yang bisa dibuat.

**Alur:**

```
1. User ketik bahan (contoh: ayam, santan, cabai)
   → Tambah ke daftar bahan

2. Klik "Cari Resep"
   → POST /api/suggest-dishes
   → Ollama menganalisis bahan dan mengembalikan 3 saran masakan
      Format: [{ nama, deskripsi, alasan }]

3. User klik salah satu saran
   → POST /api/generate-recipe { bahan[], nama_target }
   → Ollama membuat resep lengkap dalam JSON:
      { nama_hidangan, deskripsi, waktu_memasak, porsi,
        bahan[], langkah[], tips }

4. Resep ditampilkan lengkap di halaman
```

**Normalisasi bahan:** AI kadang mengembalikan bahan sebagai objek `{nama, takaran}` bukan string. Sistem otomatis mengkonversinya ke string yang mudah dibaca.

---

### 7.2 Mode Nama Makanan + Clarify Ambigu

Pengguna mengetik nama masakan yang diinginkan. Jika terlalu umum, AI meminta klarifikasi.

**Alur:**

```
1. User pilih tab "Nama Makanan"
   → Ketik nama (contoh: "soto")

2. Klik "Generate Resep dari Nama"
   → POST /api/clarify-dish { query: "soto" }
   → AI menentukan: AMBIGU atau JELAS?

   AMBIGU (contoh: "soto", "ayam", "nasi"):
   → Tampilkan 4 kartu pilihan dengan deskripsi + asal daerah
      ┌─────────────┐  ┌─────────────┐
      │ Soto Betawi │  │ Soto Madura │
      │ Jakarta     │  │ Madura      │
      └─────────────┘  └─────────────┘
      ┌─────────────┐  ┌─────────────┐
      │Soto B.Kikin │  │ Soto Pandan │
      │ Jakarta     │  │ Sumatera    │
      └─────────────┘  └─────────────┘
   → User pilih satu → generate resep spesifik

   JELAS (contoh: "rendang", "nasi goreng"):
   → Langsung POST /api/generate-recipe
```

**Quick pick chips:** Tersedia 8 nama makanan populer sebagai shortcut (Soto Betawi, Opor Ayam, dll) dan tombol "Biarkan AI pilihkan" jika pengguna tidak mau memilih.

---

### 7.3 Simpan Resep & Upload Foto

Setelah resep di-generate, pengguna bisa menyimpannya ke koleksi.

**Alur:**

```
1. (Opsional) User upload foto masakan
   → Klik area upload → pilih file JPG/PNG/WebP (maks 5MB)
   → POST /api/upload-photo (multipart/form-data)
   → File diupload ke MinIO
   → Dapat URL publik: http://localhost:9000/resep-pintar/{filename}

2. Klik "Simpan Resep"
   → POST /api/recipes
   → Data disimpan ke MongoDB dengan struktur:
      {
        ...data resep,
        bahan_input: [...],   ← bahan asli yang diketik user
        foto_url: "...",      ← URL foto (atau null)
        created_at: "..."     ← waktu penyimpanan
      }
```

---

### 7.4 Koleksi Resep

Halaman `/recipes` menampilkan semua resep yang telah disimpan.

**Fitur:**
- **List resep** dengan foto (jika ada), nama, waktu memasak, porsi
- **Pencarian** real-time berdasarkan nama masakan
- **Detail resep** — klik kartu untuk lihat resep lengkap dengan semua bahan dan langkah
- **Hapus resep** — menghapus data di MongoDB sekaligus foto di MinIO
- **Generate ulang** — membuat ulang resep dengan nama yang sama (variasi baru dari AI)
- **Cetak** — tombol print untuk mencetak resep

---

### 7.5 AI Chat (ChefBot)

Halaman `/chat` — chat bebas dengan AI yang bisa menjawab apapun.

**Kemampuan AI:**
- Resep dan tips memasak Indonesia & internasional
- Informasi nutrisi dan kandungan gizi
- Substitusi/pengganti bahan masakan
- Sejarah dan asal-usul masakan
- Pertanyaan umum (sains, sejarah, teknologi, dll)
- Percakapan santai

**Teknologi streaming:**

```
Tanpa streaming (sebelumnya):
  User kirim → tunggu 30-60 detik → seluruh jawaban muncul sekaligus

Dengan streaming (sekarang):
  User kirim → teks muncul kata per kata dalam hitungan detik
               (seperti ChatGPT / Claude)
```

**Cara kerja streaming:**
1. API route memanggil Ollama dengan `stream: true`
2. Ollama mengirim token satu per satu via HTTP stream
3. Browser membaca stream dengan `ReadableStream API`
4. Setiap token langsung dirender ke bubble chat

**Memory percakapan:** 8 pesan terakhir dikirim ke AI setiap request, sehingga AI mengingat konteks percakapan sebelumnya.

---

## 8. API Routes (Backend)

RESTful API dibangun dengan **Express JS** dan terdokumentasi lengkap dengan **Swagger** (OpenAPI 3.0).

> 📖 **Buka dokumentasi interaktif: http://localhost:4000/docs** — semua endpoint bisa dicoba langsung dari browser (Try it out).

Next.js FE mem-proxy semua request `/api/*` ke backend ini (lihat `next.config.js`).

| Method | Endpoint | Input | Output | Fungsi |
|---|---|---|---|---|
| POST | `/api/suggest-dishes` | `{ bahan[] }` | `{ suggestions[] }` | Saran masakan dari bahan |
| POST | `/api/clarify-dish` | `{ query }` | `{ jenis, opsi[] / nama }` | Deteksi input ambigu |
| POST | `/api/generate-recipe` | `{ bahan[], nama_target }` | `{ recipe }` | Generate resep lengkap |
| POST | `/api/chat` | `{ message, history[] }` | `ReadableStream` | Chat AI dengan streaming |
| POST | `/api/upload-photo` | `FormData (file)` | `{ url }` | Upload foto ke MinIO |
| GET | `/api/recipes` | `?search=...` | `{ recipes[] }` | List semua resep tersimpan |
| POST | `/api/recipes` | `{ recipe, bahan_input, foto_url }` | `{ id }` | Simpan resep baru |
| GET | `/api/recipes/[id]` | — | `{ recipe }` | Detail satu resep |
| DELETE | `/api/recipes/[id]` | — | `{ success }` | Hapus resep + foto |

---

## 9. Database — MongoDB

**Koneksi:** `mongodb://localhost:27017/resep-pintar`

**Collection:** `recipes`

**Struktur dokumen:**

```json
{
  "_id": "ObjectId(...)",
  "nama_hidangan": "Rendang Daging Sapi",
  "deskripsi": "Masakan khas Minangkabau yang kaya rempah...",
  "waktu_memasak": "3 jam",
  "porsi": "4-5 orang",
  "bahan": [
    "1 kg daging sapi, potong dadu",
    "500 ml santan kental",
    "10 buah cabai merah keriting",
    "..."
  ],
  "langkah": [
    "Haluskan semua bumbu: bawang merah, bawang putih...",
    "Masak santan dengan api sedang sambil diaduk...",
    "..."
  ],
  "tips": "Masak dengan api kecil agar bumbu meresap sempurna.",
  "bahan_input": ["daging sapi", "santan", "cabai"],
  "foto_url": "http://localhost:9000/resep-pintar/rendang-abc123.jpg",
  "created_at": "2026-07-31T10:30:00.000Z"
}
```

**Singleton pattern:** File `src/lib/mongodb.ts` memastikan hanya ada **satu koneksi** MongoDB yang dibuat dan di-reuse, menghindari koneksi baru setiap hot-reload saat development.

---

## 10. Penyimpanan Foto — MinIO

**URL:** `http://localhost:9000`  
**Admin Console:** `http://localhost:9001` (login: `minioadmin` / `minioadmin`)  
**Bucket:** `resep-pintar`

MinIO adalah **S3-compatible object storage** yang berjalan lokal. Cara kerjanya identik dengan Amazon S3 tapi gratis dan offline.

**Kebijakan akses (Bucket Policy):**
- **Read:** Public — siapapun bisa melihat foto via URL langsung
- **Write:** Private — hanya server Next.js yang bisa mengupload

**Format URL foto:**
```
http://localhost:9000/resep-pintar/{nama-file}
contoh: http://localhost:9000/resep-pintar/nasi-goreng-1722420600000.jpg
```

Bucket dibuat **otomatis** jika belum ada saat pertama kali foto diupload.

---

## 11. AI Engine — Ollama

**Server utama:** `https://ollama.if.unismuh.ac.id` (server kampus, sesuai ketentuan tugas)
**Fallback otomatis:** `http://localhost:11434` (Ollama lokal) — dipakai jika server kampus tidak dapat dihubungi
**Model:** `llama3.2` (3.2B parameter)

Urutan failover diatur di `backend/src/ollama.js`: API mencoba server kampus lebih dulu; jika gagal (timeout / tidak terjangkau), otomatis beralih ke Ollama lokal tanpa error di sisi pengguna.

### Endpoint yang Digunakan

Semua fitur AI menggunakan satu endpoint: `POST /api/generate`

### Perbedaan Penggunaan per Fitur

| Fitur | `stream` | `format` | Alasan |
|---|---|---|---|
| Saran masakan | `false` | `json` | Butuh JSON terstruktur |
| Clarify ambigu | `false` | `json` | Butuh JSON terstruktur |
| Generate resep | `false` | `json` | Butuh JSON terstruktur |
| AI Chat | `true` | *(plain text)* | Streaming real-time |

**Mengapa JSON untuk resep?**  
Data resep harus terstruktur (array bahan, array langkah, field waktu, dll). Dengan `format: 'json'`, Ollama **memaksa** model selalu menghasilkan JSON valid — tidak ada teks bebas yang mencemari data.

**Mengapa streaming untuk chat?**  
Chat adalah teks bebas — tidak butuh struktur khusus. Streaming membuat pengalaman terasa instan karena teks muncul kata per kata, tanpa menunggu seluruh jawaban selesai diproses.

### Parameter AI yang Digunakan

```json
{
  "temperature": 0.7,    // Kreativitas (0=deterministic, 1=sangat kreatif)
  "top_p": 0.9,          // Sampling diversity
  "num_predict": 800,    // Maksimal token output
  "num_ctx": 4096,       // Ukuran context window
  "repeat_penalty": 1.1  // Mencegah AI mengulang kata-kata
}
```

---

## 12. Alur Data Keseluruhan

### Generate Resep dari Bahan (End-to-End)

```
User                  Browser              Next.js API          Ollama
 │                       │                     │                   │
 │── ketik bahan ────────▶│                     │                   │
 │── klik Cari Resep ───▶│                     │                   │
 │                       │── POST /suggest ───▶│                   │
 │                       │                     │── POST /generate ▶│
 │                       │                     │◀─ 3 saran JSON ───│
 │                       │◀── { suggestions } ─│                   │
 │◀── tampil 3 saran ────│                     │                   │
 │── pilih saran ────────▶│                     │                   │
 │                       │── POST /generate ──▶│                   │
 │                       │                     │── POST /generate ▶│
 │                       │                     │◀─ resep JSON ─────│
 │                       │◀── { recipe } ──────│                   │
 │◀── tampil resep ───────│                     │                   │
```

### AI Chat Streaming (End-to-End)

```
User                  Browser              Next.js API          Ollama
 │                       │                     │                   │
 │── ketik pesan ────────▶│                     │                   │
 │── tekan Enter ────────▶│                     │                   │
 │                       │── POST /chat ───────▶│                   │
 │                       │  (message + history) │── stream: true ──▶│
 │                       │                     │◀─ token "Hai" ────│
 │                       │◀── chunk "Hai" ──────│                   │
 │◀── "Hai" muncul ───────│                     │                   │
 │                       │                     │◀─ token " ini" ───│
 │                       │◀── chunk " ini" ─────│                   │
 │◀── "Hai ini" ──────────│                     │                   │
 │                       │                     │◀─ ... (done) ─────│
 │◀── jawaban lengkap ────│                     │                   │
```

---

*Dokumentasi ini dibuat secara otomatis berdasarkan kode program ResepPintar.*  
*Terakhir diperbarui: Juli 2026*
