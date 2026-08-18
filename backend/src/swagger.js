// ═══════════════════════════════════════════════════════════════
// Spesifikasi OpenAPI 3.0 — ditampilkan via Swagger UI di /docs
// ═══════════════════════════════════════════════════════════════

const RecipeSchema = {
  type: 'object',
  properties: {
    nama_hidangan: { type: 'string', example: 'Rendang Daging Sapi' },
    deskripsi: { type: 'string', example: 'Masakan khas Minangkabau yang kaya rempah.' },
    waktu_memasak: { type: 'string', example: '3 jam' },
    porsi: { type: 'string', example: '4 orang' },
    bahan: { type: 'array', items: { type: 'string' }, example: ['1 kg daging sapi', '500 ml santan kental'] },
    langkah: { type: 'array', items: { type: 'string' }, example: ['Haluskan bumbu', 'Masak santan hingga mendidih'] },
    tips: { type: 'string', example: 'Masak dengan api kecil agar bumbu meresap.' },
  },
}

const ErrorSchema = {
  type: 'object',
  properties: { error: { type: 'string', example: 'Pesan error' } },
}

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ResepPintar RESTful API',
    version: '1.0.0',
    description:
      'RESTful API untuk platform ResepPintar — generate resep dengan AI (Ollama), ' +
      'penyimpanan resep di **MongoDB**, dan penyimpanan foto di **MinIO**.\n\n' +
      'AI Engine: `https://ollama.if.unismuh.ac.id/api/generate` (fallback otomatis ke Ollama lokal).',
    contact: { name: 'ResepPintar' },
  },
  servers: [{ url: 'http://localhost:4000', description: 'Server development' }],
  tags: [
    { name: 'AI', description: 'Endpoint AI — Ollama (generate resep, saran, clarify, chat)' },
    { name: 'Recipes', description: 'CRUD resep — MongoDB' },
    { name: 'Upload', description: 'Upload foto — MinIO' },
    { name: 'Health', description: 'Status layanan' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Cek status API beserta koneksi MongoDB, MinIO, dan Ollama',
        responses: {
          200: {
            description: 'Status layanan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    mongodb: { type: 'string', example: 'connected' },
                    ollama: { type: 'string', example: 'https://ollama.if.unismuh.ac.id' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/generate-recipe': {
      post: {
        tags: ['AI'],
        summary: 'Generate resep lengkap dengan AI',
        description: 'Buat resep dari daftar bahan, nama hidangan, atau keduanya. AI otomatis mendeteksi jenis (makanan/minuman/camilan/kue) dan menyesuaikan porsi.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  bahan: { type: 'array', items: { type: 'string' }, example: ['ayam', 'santan', 'serai'] },
                  nama_target: { type: 'string', example: 'Opor Ayam' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Resep berhasil dibuat',
            content: { 'application/json': { schema: { type: 'object', properties: { recipe: RecipeSchema } } } },
          },
          400: { description: 'Input tidak valid', content: { 'application/json': { schema: ErrorSchema } } },
          503: { description: 'Ollama tidak dapat dihubungi', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },

    '/api/suggest-dishes': {
      post: {
        tags: ['AI'],
        summary: 'Saran 3 masakan dari bahan yang dimiliki',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bahan'],
                properties: {
                  bahan: { type: 'array', items: { type: 'string' }, example: ['telur', 'nasi', 'kecap'] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: '3 saran masakan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    suggestions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          nama: { type: 'string', example: 'Nasi Goreng Kampung' },
                          deskripsi: { type: 'string' },
                          alasan: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Bahan kosong', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },

    '/api/clarify-dish': {
      post: {
        tags: ['AI'],
        summary: 'Deteksi apakah nama hidangan ambigu',
        description: 'Contoh: "soto" → ambigu, AI memberi 4 pilihan (Soto Betawi, Soto Madura, ...). "soto betawi" → jelas.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: { query: { type: 'string', example: 'soto' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Hasil analisis (jenis: "ambigu" dengan opsi[], atau "jelas" dengan nama)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jenis: { type: 'string', enum: ['ambigu', 'jelas'] },
                    pesan: { type: 'string' },
                    opsi: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          nama: { type: 'string' }, deskripsi: { type: 'string' }, daerah: { type: 'string' },
                        },
                      },
                    },
                    nama: { type: 'string' },
                    deskripsi: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/chat': {
      post: {
        tags: ['AI'],
        summary: 'Chat dengan AI (respons streaming teks)',
        description: 'Respons berupa stream `text/plain` token per token (seperti ChatGPT), bukan JSON.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Apa pengganti santan yang lebih sehat?' },
                  history: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        role: { type: 'string', enum: ['user', 'assistant'] },
                        content: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Stream teks jawaban AI', content: { 'text/plain': { schema: { type: 'string' } } } },
          400: { description: 'Pesan kosong', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },

    '/api/recipes': {
      get: {
        tags: ['Recipes'],
        summary: 'Ambil semua resep tersimpan (maks 50, terbaru dulu)',
        responses: {
          200: {
            description: 'Daftar resep',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { recipes: { type: 'array', items: RecipeSchema } } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Recipes'],
        summary: 'Simpan resep baru ke MongoDB',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipe', 'bahan_input'],
                properties: {
                  recipe: RecipeSchema,
                  bahan_input: { type: 'array', items: { type: 'string' }, example: ['ayam', 'santan'] },
                  foto_url: { type: 'string', nullable: true, example: 'http://localhost:9000/resep-pintar/masakan-123.jpg' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Resep tersimpan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    id: { type: 'string', example: '66a9f0c2e13b7a0012345678' },
                  },
                },
              },
            },
          },
          400: { description: 'Data tidak lengkap', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },

    '/api/recipes/{id}': {
      get: {
        tags: ['Recipes'],
        summary: 'Ambil detail satu resep',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'MongoDB ObjectId' }],
        responses: {
          200: { description: 'Detail resep', content: { 'application/json': { schema: { type: 'object', properties: { recipe: RecipeSchema } } } } },
          404: { description: 'Resep tidak ditemukan', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
      delete: {
        tags: ['Recipes'],
        summary: 'Hapus resep',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Berhasil dihapus',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' } } } } },
          },
        },
      },
    },

    '/api/upload-photo': {
      post: {
        tags: ['Upload'],
        summary: 'Upload foto masakan ke MinIO',
        description: 'Format: JPG / PNG / WebP, maksimal 5MB. Mengembalikan URL publik foto.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['photo'],
                properties: { photo: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'URL foto di MinIO',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { url: { type: 'string', example: 'http://localhost:9000/resep-pintar/masakan-123.jpg' } },
                },
              },
            },
          },
          400: { description: 'File tidak valid', content: { 'application/json': { schema: ErrorSchema } } },
        },
      },
    },
  },
}

module.exports = swaggerSpec
