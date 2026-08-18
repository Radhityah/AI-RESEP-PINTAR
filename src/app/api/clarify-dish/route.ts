import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL   || 'llama3.2'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query tidak boleh kosong' }, { status: 400 })
    }

    const prompt = `Kamu chef & barista Indonesia. User mengetik: "${query.trim()}"

Tentukan dulu JENIS dari input ini (makanan/minuman/camilan/kue/dessert/dll), lalu tentukan apakah AMBIGU atau JELAS.

AMBIGU = terlalu umum, punya banyak variasi (contoh: "kopi","soto","ayam","nasi","es","teh","martabak","mie")
JELAS = sudah spesifik (contoh: "es kopi susu","soto betawi","nasi goreng kampung","kopi tubruk","donat glazur")

Jika AMBIGU: berikan 4 pilihan spesifik yang paling populer SESUAI JENIS yang terdeteksi.
Jika JELAS: kembalikan nama lengkap yang tepat.

Respond HANYA JSON:

Jika AMBIGU:
{"jenis":"ambigu","pesan":"Kamu maksud yang mana?","opsi":[{"nama":"Nama Spesifik 1","deskripsi":"1 kalimat","daerah":"asal/jenis"},{"nama":"Nama Spesifik 2","deskripsi":"1 kalimat","daerah":"asal/jenis"},{"nama":"Nama Spesifik 3","deskripsi":"1 kalimat","daerah":"asal/jenis"},{"nama":"Nama Spesifik 4","deskripsi":"1 kalimat","daerah":"asal/jenis"}]}

Jika JELAS:
{"jenis":"jelas","nama":"Nama Lengkap Tepat","deskripsi":"1 kalimat tentang ini"}`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json',
        options: { temperature: 0.5, num_predict: 400, num_ctx: 2048, repeat_penalty: 1.1 },
      }),
    })

    if (!response.ok) throw new Error(`Ollama error: ${response.status} ${response.statusText}`)

    const ollamaData = await response.json()
    const rawText = (ollamaData.response || '').trim()

    let result
    try {
      result = JSON.parse(rawText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      result = match ? JSON.parse(match[0]) : { jenis: 'jelas', nama: query.trim(), deskripsi: '' }
    }

    if (!result.jenis) result.jenis = 'jelas'
    if (result.jenis === 'ambigu' && (!result.opsi || result.opsi.length === 0)) {
      result.jenis = 'jelas'
      result.nama  = query.trim()
    }
    if (result.jenis === 'jelas' && !result.nama) result.nama = query.trim()

    return NextResponse.json(result)
  } catch (error: any) {
    const isConnRefused = error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')
    if (isConnRefused) {
      return NextResponse.json({ error: 'Ollama tidak berjalan. Jalankan Ollama terlebih dahulu.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message || 'Gagal menganalisis input' }, { status: 500 })
  }
}
