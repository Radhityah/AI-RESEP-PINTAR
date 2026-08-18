# AI-RESEP-PINTAR (ResepPintar)

> **Proyek Pengembangan Sistem Penyimpanan Data Skalabel** — Mata Kuliah Sistem Basis Data Modern
> **Kelompok 9**: Radhityah Walhidayah (105841102724) · Muhammad Abdul Farid (105841100724) · Ibnu Arshysyahnan Mustafa (105841101724) · Muliyadi. H (105841102524)

**ResepPintar** adalah platform resep masakan berbasis AI: membuat resep dari bahan yang dimiliki, mencari resep dari nama makanan (dengan deteksi input ambigu), menyimpan koleksi resep beserta foto, dan chat dengan AI (ChefBot).

## Stack Teknologi

| Komponen | Teknologi |
|---|---|
| Web Frontend | Next.js 15 (App Router) + React + TypeScript + Tailwind CSS |
| RESTful API | Express JS + Swagger (OpenAPI 3.0) |
| Database | MongoDB (NoSQL Document Store) |
| Penyimpanan Foto | MinIO (S3-compatible Object Storage) |
| AI Engine | Ollama (`llama3.2`) — server kampus + fallback lokal |
| Kontainerisasi | Docker Compose (5 container) |

## Cara Menjalankan

```bash
docker compose up -d --build
```

| Layanan | URL |
|---|---|
| Aplikasi Web | http://localhost:3000 |
| Swagger API Docs | http://localhost:4000/docs |
| MinIO Console | http://localhost:9001 |

## Dokumentasi

Penjelasan lengkap arsitektur, alur data, API, database, dan strategi penyimpanan skalabel ada di **[DOKUMENTASI.md](DOKUMENTASI.md)**.
