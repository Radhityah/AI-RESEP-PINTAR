import { NextRequest, NextResponse } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL   || 'llama3.2'

const TARGET_SUGGESTIONS = 3

// Bahan protein utama (daging/ikan/unggas/seafood) — wajib dipakai minimal di 1 saran
const PROTEIN_KEYWORDS = [
  'ayam', 'bebek', 'angsa', 'puyuh', 'kalkun',
  'daging', 'sapi', 'kambing', 'domba', 'kerbau', 'iga', 'buntut',
  'ikan', 'lele', 'nila', 'gurame', 'mujair', 'bandeng', 'kakap', 'patin',
  'tenggiri', 'tongkol', 'tuna', 'salmon', 'teri', 'kembung',
  'udang', 'cumi', 'sotong', 'kepiting', 'rajungan', 'kerang',
]

const norm = (s: string) => s.toLowerCase().trim()
const isMatch = (a: string, b: string) => {
  const x = norm(a); const y = norm(b)
  return x === y || x.includes(y) || y.includes(x)
}
const isProtein = (bahan: string) => {
  const n = norm(bahan)
  return PROTEIN_KEYWORDS.some((k) => n === k || n.includes(k))
}

interface Suggestion {
  nama: string
  deskripsi: string
  alasan: string
  bahan_terpakai: string[]
}
interface BahanAmbigu { bahan: string; maksud: string[]; catatan: string }
interface BahanTidakTerpakai { bahan: string; alasan: string }

interface Analysis {
  suggestions: Suggestion[]
  ambigu: BahanAmbigu[]
  tidakTerpakai: BahanTidakTerpakai[]
  uncovered: string[]        // bahan input yang tidak terpakai DAN tidak dijelaskan
  uncoveredProtein: string[] // protein utama yang tidak terpakai di saran manapun
}

function buildPrompt(bahan: string[], koreksi: string[] = []): string {
  const bahanList = bahan.join(', ')
  const proteinInput = bahan.filter(isProtein)

  let prompt = `Kamu chef & barista Indonesia. User punya bahan: ${bahanList}
Tentukan dulu jenisnya (makanan/minuman/camilan/kue/dessert/campuran), lalu sarankan TEPAT ${TARGET_SUGGESTIONS} resep yang beragam.

ATURAN WAJIB:
1. Berikan TEPAT ${TARGET_SUGGESTIONS} saran resep yang berbeda satu sama lain.
2. SETIAP bahan user harus masuk "bahan_terpakai" di minimal satu saran, ATAU dijelaskan di "bahan_ambigu" / "bahan_tidak_terpakai". DILARANG mengabaikan bahan tanpa keterangan.
3. "bahan_terpakai" hanya boleh berisi bahan dari daftar user, tulis persis seperti yang user ketik.${proteinInput.length > 0 ? `
4. Bahan protein utama (${proteinInput.join(', ')}) WAJIB menjadi bahan utama di minimal 1 saran.` : ''}
${proteinInput.length > 0 ? '5' : '4'}. Jika ada bahan ambigu/tidak jelas (contoh: "kunci" mungkin maksudnya bumbu "temu kunci"), masukkan ke "bahan_ambigu" dengan tebakan maksudnya.`

  if (koreksi.length > 0) {
    prompt += `

PERHATIAN — jawaban sebelumnya melanggar aturan, perbaiki sekarang:
${koreksi.map((k) => `- ${k}`).join('\n')}`
  }

  prompt += `

Respond HANYA JSON dengan struktur persis ini:
{"suggestions":[{"nama":"Nama Resep","deskripsi":"1 kalimat","alasan":"kenapa cocok","bahan_terpakai":["bahan dari daftar user"]}],"bahan_ambigu":[{"bahan":"bahan yang tidak jelas","maksud":["kemungkinan 1","kemungkinan 2"],"catatan":"1 kalimat"}],"bahan_tidak_terpakai":[{"bahan":"bahan","alasan":"kenapa tidak dipakai"}]}
"suggestions" harus berisi ${TARGET_SUGGESTIONS} item. "bahan_ambigu" dan "bahan_tidak_terpakai" boleh [] jika tidak ada.`

  return prompt
}

async function askOllama(prompt: string): Promise<any> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.6, num_predict: 600, num_ctx: 2048, repeat_penalty: 1.1 },
    }),
  })

  if (!response.ok) throw new Error(`Ollama error: ${response.status} ${response.statusText}`)

  const ollamaData = await response.json()
  const rawText = (ollamaData.response || '').trim()

  try {
    return JSON.parse(rawText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : { suggestions: [] }
  }
}

function analyze(result: any, bahan: string[]): Analysis {
  const suggestions: Suggestion[] = (Array.isArray(result?.suggestions) ? result.suggestions : [])
    .filter((s: any) => s && typeof s.nama === 'string' && s.nama.trim())
    .slice(0, TARGET_SUGGESTIONS)
    .map((s: any) => ({
      nama: s.nama.trim(),
      deskripsi: typeof s.deskripsi === 'string' ? s.deskripsi : '',
      alasan: typeof s.alasan === 'string' ? s.alasan : '',
      bahan_terpakai: (Array.isArray(s.bahan_terpakai) ? s.bahan_terpakai : [])
        .filter((b: any) => typeof b === 'string' && b.trim()),
    }))

  // Hanya terima entri ambigu/tidak-terpakai yang benar-benar merujuk bahan input user
  const ambigu: BahanAmbigu[] = (Array.isArray(result?.bahan_ambigu) ? result.bahan_ambigu : [])
    .filter((a: any) => a && typeof a.bahan === 'string' && bahan.some((b) => isMatch(b, a.bahan)))
    .map((a: any) => ({
      bahan: a.bahan.trim(),
      maksud: (Array.isArray(a.maksud) ? a.maksud : []).filter((m: any) => typeof m === 'string' && m.trim()),
      catatan: typeof a.catatan === 'string' ? a.catatan : '',
    }))

  const tidakTerpakai: BahanTidakTerpakai[] = (Array.isArray(result?.bahan_tidak_terpakai) ? result.bahan_tidak_terpakai : [])
    .filter((t: any) => t && typeof t.bahan === 'string' && bahan.some((b) => isMatch(b, t.bahan)))
    .map((t: any) => ({
      bahan: t.bahan.trim(),
      alasan: typeof t.alasan === 'string' && t.alasan.trim() ? t.alasan : 'Tidak cocok dengan kombinasi resep yang disarankan',
    }))

  const coveredBySuggestion = (b: string) =>
    suggestions.some(
      (s) =>
        s.bahan_terpakai.some((t) => isMatch(t, b)) ||
        `${s.nama} ${s.deskripsi} ${s.alasan}`.toLowerCase().includes(norm(b))
    )
  const explained = (b: string) =>
    ambigu.some((a) => isMatch(a.bahan, b)) || tidakTerpakai.some((t) => isMatch(t.bahan, b))

  const uncovered = bahan.filter((b) => !coveredBySuggestion(b) && !explained(b))
  // Protein utama tidak boleh cuma "dijelaskan" — harus benar-benar dipakai,
  // kecuali sedang menunggu konfirmasi user karena ambigu
  const uncoveredProtein = bahan.filter(
    (b) => isProtein(b) && !coveredBySuggestion(b) && !ambigu.some((a) => isMatch(a.bahan, b))
  )

  return { suggestions, ambigu, tidakTerpakai, uncovered, uncoveredProtein }
}

function buildKoreksi(a: Analysis, bahan: string[]): string[] {
  const koreksi: string[] = []
  if (a.suggestions.length < TARGET_SUGGESTIONS) {
    koreksi.push(`Kamu hanya memberi ${a.suggestions.length} saran. WAJIB tepat ${TARGET_SUGGESTIONS} saran.`)
  }
  if (a.uncoveredProtein.length > 0) {
    koreksi.push(`Bahan protein utama (${a.uncoveredProtein.join(', ')}) tidak dipakai di saran manapun. WAJIB jadikan bahan utama di minimal 1 saran.`)
  }
  const nonProteinMissing = a.uncovered.filter((b) => !a.uncoveredProtein.some((p) => isMatch(p, b)))
  if (nonProteinMissing.length > 0) {
    koreksi.push(`Bahan (${nonProteinMissing.join(', ')}) hilang tanpa keterangan. Pakai di salah satu saran, atau jelaskan di "bahan_ambigu"/"bahan_tidak_terpakai".`)
  }
  return koreksi
}

export async function POST(req: NextRequest) {
  try {
    const { bahan } = await req.json()
    if (!bahan || !Array.isArray(bahan) || bahan.length === 0) {
      return NextResponse.json({ error: 'Bahan tidak boleh kosong' }, { status: 400 })
    }
    const bahanInput: string[] = bahan
      .filter((b: any) => typeof b === 'string' && b.trim())
      .map((b: string) => b.trim())
    if (bahanInput.length === 0) {
      return NextResponse.json({ error: 'Bahan tidak boleh kosong' }, { status: 400 })
    }

    // Percobaan pertama
    let analysis = analyze(await askOllama(buildPrompt(bahanInput)), bahanInput)

    // Satu retry korektif jika ada aturan yang dilanggar
    const koreksi = buildKoreksi(analysis, bahanInput)
    if (koreksi.length > 0) {
      try {
        const retry = analyze(await askOllama(buildPrompt(bahanInput, koreksi)), bahanInput)
        const retryBetter =
          retry.suggestions.length >= analysis.suggestions.length &&
          retry.uncovered.length + retry.uncoveredProtein.length <
            analysis.uncovered.length + analysis.uncoveredProtein.length
        if (retryBetter || retry.suggestions.length > analysis.suggestions.length) analysis = retry
      } catch {
        // retry gagal → pakai hasil pertama, kekurangan tetap dilaporkan di bawah
      }
    }

    // Setelah retry, TIDAK ADA bahan yang boleh hilang diam-diam:
    // semua yang masih tak tercakup dilaporkan eksplisit ke user
    const peringatan: string[] = []
    const tidakTerpakai = [...analysis.tidakTerpakai]

    for (const b of analysis.uncovered) {
      if (!tidakTerpakai.some((t) => isMatch(t.bahan, b))) {
        tidakTerpakai.push({
          bahan: b,
          alasan: 'AI tidak menggunakan bahan ini dan tidak memberi penjelasan — kemungkinan tidak dikenali. Periksa penulisannya atau coba generate ulang.',
        })
      }
    }
    for (const b of analysis.uncoveredProtein) {
      peringatan.push(
        `Bahan protein utama "${b}" tidak berhasil dimasukkan ke saran manapun. Ini seharusnya jadi pertimbangan utama — coba generate ulang.`
      )
      if (!tidakTerpakai.some((t) => isMatch(t.bahan, b))) {
        tidakTerpakai.push({ bahan: b, alasan: 'Protein utama yang gagal dimasukkan AI ke saran. Coba generate ulang.' })
      }
    }
    if (analysis.suggestions.length < TARGET_SUGGESTIONS) {
      peringatan.push(
        `AI hanya memberikan ${analysis.suggestions.length} dari ${TARGET_SUGGESTIONS} saran yang ditargetkan. Kombinasi bahan yang valid mungkin terbatas — coba generate ulang untuk variasi lain.`
      )
    }

    return NextResponse.json({
      suggestions: analysis.suggestions,
      bahan_ambigu: analysis.ambigu,
      bahan_tidak_terpakai: tidakTerpakai,
      peringatan,
    })
  } catch (error: any) {
    const isConnRefused = error.cause?.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')
    if (isConnRefused) {
      return NextResponse.json({ error: 'Ollama tidak berjalan. Jalankan Ollama terlebih dahulu.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message || 'Gagal mendapatkan saran' }, { status: 500 })
  }
}
