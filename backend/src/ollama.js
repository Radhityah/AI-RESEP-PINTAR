// ═══════════════════════════════════════════════════════════════
// Helper Ollama dengan failover otomatis:
//   1. Server kampus  : https://ollama.if.unismuh.ac.id  (sesuai tugas)
//   2. Fallback lokal : http://localhost:11434
// Jika server pertama gagal/tidak bisa dihubungi, otomatis coba berikutnya.
// ═══════════════════════════════════════════════════════════════

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'

const BASES = [
  process.env.OLLAMA_BASE_URL || 'https://ollama.if.unismuh.ac.id',
  ...(process.env.OLLAMA_FALLBACK_URL || 'http://localhost:11434').split(','),
].map((s) => s.trim()).filter((v, i, a) => v && a.indexOf(v) === i)

/**
 * Panggil POST /api/generate di server Ollama yang tersedia.
 * @param {object} payload  body request (tanpa model — diisi otomatis)
 * @param {boolean} stream  true = kembalikan Response mentah untuk streaming
 */
async function ollamaGenerate(payload, stream = false) {
  let lastError = null

  for (const base of BASES) {
    try {
      const res = await fetch(`${base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_MODEL, ...payload, stream }),
        // Non-stream: 60 dtk cukup untuk llama3.2 — jika server menggantung,
        // cepat pindah ke fallback daripada membuat request user timeout.
        signal: AbortSignal.timeout(stream ? 300000 : 60000),
      })
      if (!res.ok) {
        lastError = new Error(`Ollama ${base} error: ${res.status} ${res.statusText}`)
        continue
      }
      console.log(`[Ollama] OK via ${base}`)
      return stream ? res : await res.json()
    } catch (err) {
      lastError = err
      console.warn(`[Ollama] Gagal via ${base}: ${err.message} — coba server berikutnya...`)
    }
  }

  const e = new Error('Semua server Ollama tidak dapat dihubungi. Pastikan Ollama berjalan.')
  e.cause = lastError
  e.statusCode = 503
  throw e
}

/** Parse JSON dari respons AI, dengan fallback regex jika ada teks pengganggu */
function parseAiJson(rawText, fallback = null) {
  const text = (rawText || '').trim()
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch { /* lanjut ke fallback */ }
    }
    return fallback
  }
}

module.exports = { ollamaGenerate, parseAiJson, OLLAMA_MODEL, BASES }
