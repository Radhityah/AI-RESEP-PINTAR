import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL   || 'llama3.2'

const OLLAMA_OPTIONS = {
  temperature: 0.6,
  num_predict: 550,
  num_ctx: 2048,
  repeat_penalty: 1.1,
}

export async function POST(req: NextRequest) {
  try {
    const { bahan, nama_target } = await req.json()

    if (!nama_target && (!bahan || !Array.isArray(bahan) || bahan.length === 0)) {
      return NextResponse.json({ error: 'Masukkan bahan atau nama makanan/minuman' }, { status: 400 })
    }

    const bahanList = bahan?.join(', ') || ''

    // Prompt utama: AI mendeteksi sendiri apakah makanan/minuman/camilan/kue/dll
    // dari keyword, lalu menyesuaikan resep (porsi bisa "1 gelas" untuk minuman, dll)
    const prompt = nama_target && !bahanList
      ? `Kamu chef & barista Indonesia. Buat resep autentik untuk "${nama_target}".
Deteksi dulu jenisnya (makanan/minuman/camilan/kue/dessert/dll) dari kata kunci, lalu sesuaikan resepnya.
Contoh: "kopi" → minuman, porsi = "1 gelas"; "rendang" → makanan, porsi = "4 orang"; "donat" → kue, porsi = "10 buah".
Respond HANYA JSON, tanpa teks lain. Bahan & langkah = array of string BUKAN object:
{"nama_hidangan":"${nama_target}","deskripsi":"1-2 kalimat","waktu_memasak":"X menit","porsi":"sesuai jenis","bahan":["bahan1","bahan2"],"langkah":["langkah1","langkah2"],"tips":"tips singkat"}`

      : nama_target
      ? `Kamu chef & barista Indonesia. Buat resep "${nama_target}" menggunakan: ${bahanList} (tambah bahan pendukung yang dibutuhkan).
Deteksi jenisnya (makanan/minuman/camilan/dll) dan sesuaikan porsi & langkahnya.
Respond HANYA JSON, bahan & langkah = array of string:
{"nama_hidangan":"${nama_target}","deskripsi":"1-2 kalimat","waktu_memasak":"X menit","porsi":"sesuai jenis","bahan":["bahan1","bahan2"],"langkah":["langkah1","langkah2"],"tips":"tips singkat"}`

      : `Kamu chef & barista Indonesia. Dari bahan: ${bahanList}, buat satu resep terbaik.
Deteksi sendiri apakah ini bahan makanan, minuman, camilan, kue, dll — lalu sesuaikan resepnya.
Respond HANYA JSON, bahan & langkah = array of string:
{"nama_hidangan":"nama resep","deskripsi":"1-2 kalimat","waktu_memasak":"X menit","porsi":"sesuai jenis","bahan":["bahan1","bahan2"],"langkah":["langkah1","langkah2"],"tips":"tips singkat"}`

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json',
        options: OLLAMA_OPTIONS,
      }),
    })

    if (!response.ok) throw new Error(`Ollama error: ${response.status} ${response.statusText}`)

    const ollamaData = await response.json()
    const rawText = (ollamaData.response || '').trim()

    let recipe
    try {
      recipe = JSON.parse(rawText)
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) recipe = JSON.parse(jsonMatch[0])
      else throw new Error('Format resep dari AI tidak valid, coba lagi')
    }

    // Normalize bahan ke string
    if (Array.isArray(recipe.bahan)) {
      recipe.bahan = recipe.bahan.map((b: any) => {
        if (typeof b === 'string') return b
        if (typeof b === 'object' && b !== null) {
          const nameVal = b.nama || b.name || b.bahan || b.ingredient || b.item || ''
          const qtyVal  = b.takaran || b.jumlah || b.quantity || b.amount || b.ukuran || ''
          if (nameVal || qtyVal) return [nameVal, qtyVal].filter(Boolean).join(' ')
          return Object.values(b).filter((v): v is string => typeof v === 'string' && v !== '').join(' ')
        }
        return String(b)
      })
    }

    // Normalize langkah ke string
    if (Array.isArray(recipe.langkah)) {
      recipe.langkah = recipe.langkah.map((l: any) => {
        if (typeof l === 'string') return l
        if (typeof l === 'object' && l !== null) {
          return l.instruksi || l.langkah || l.step || l.deskripsi ||
            Object.values(l).filter((v): v is string => typeof v === 'string' && v !== '').join(' ')
        }
        return String(l)
      })
    }

    return NextResponse.json({ recipe })
  } catch (error: any) {
    console.error('Generate recipe error:', error)
    const isConnRefused = error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')
    if (isConnRefused) {
      return NextResponse.json({ error: 'Ollama tidak berjalan. Jalankan Ollama terlebih dahulu.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message || 'Gagal membuat resep' }, { status: 500 })
  }
}
