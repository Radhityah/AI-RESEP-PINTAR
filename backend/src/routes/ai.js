// ═══════════════════════════════════════════════════════════════
// Endpoint AI — generate resep, saran masakan, clarify, chat streaming
// Semua memakai Ollama (server kampus + fallback lokal)
// ═══════════════════════════════════════════════════════════════
const express = require('express')
const { ollamaGenerate, parseAiJson } = require('../ollama')
const { findMatchingDishes, dishRequirementViolated, isKnownDish } = require('../dishes-knowledge')

const router = express.Router()

const RECIPE_OPTIONS = { temperature: 0.6, num_predict: 550, num_ctx: 2048, repeat_penalty: 1.1 }

/* ── POST /api/generate-recipe ── */
router.post('/generate-recipe', async (req, res) => {
  try {
    const { bahan, nama_target } = req.body
    if (!nama_target && (!bahan || !Array.isArray(bahan) || bahan.length === 0)) {
      return res.status(400).json({ error: 'Masukkan bahan atau nama makanan/minuman' })
    }

    const bahanList = bahan?.join(', ') || ''

    const prompt = nama_target && !bahanList
      ? `Kamu chef & barista Indonesia. Buat resep autentik untuk "${nama_target}".
Deteksi dulu jenisnya (makanan/minuman/camilan/kue/dessert/dll) dari kata kunci, lalu sesuaikan resepnya.
Contoh: "kopi" → minuman, porsi = "1 gelas"; "rendang" → makanan, porsi = "4 orang"; "donat" → kue, porsi = "10 buah".
Respond HANYA JSON, tanpa teks lain. Bahan & langkah = array of string BUKAN object:
{"nama_hidangan":"${nama_target}","deskripsi":"1-2 kalimat","waktu_memasak":"X menit","porsi":"sesuai jenis","bahan":["bahan1","bahan2"],"langkah":["langkah1","langkah2"],"tips":"tips singkat"}`

      : nama_target
      ? `Kamu chef & barista Indonesia. Buat resep "${nama_target}" HANYA menggunakan bahan ini: ${bahanList}.
PENTING - ATURAN WAJIB:
- DILARANG KERAS menambahkan bahan lain yang tidak ada di daftar, termasuk bumbu dasar seperti garam, bawang, gula, minyak, dll — KECUALI memang ada di daftar.
- Semua item di array "bahan" dan semua bahan yang disebut di "langkah" HARUS berasal dari daftar di atas.
- Cek ulang sebelum menjawab: jika ada bahan di luar daftar, hapus atau ganti.
Deteksi jenisnya (makanan/minuman/camilan/dll) dan sesuaikan porsi & langkahnya.
Respond HANYA JSON, bahan & langkah = array of string:
{"nama_hidangan":"${nama_target}","deskripsi":"1-2 kalimat","waktu_memasak":"X menit","porsi":"sesuai jenis","bahan":["bahan1","bahan2"],"langkah":["langkah1","langkah2"],"tips":"tips singkat"}`

      : `Kamu chef Indonesia. Dari bahan: ${bahanList}
Kenali masakan tradisional Indonesia yang PALING TEPAT terbentuk dari kombinasi bahan di atas.
PENTING - ATURAN WAJIB:
- Kamu HANYA boleh menggunakan bahan yang ADA di dalam daftar di atas.
- DILARANG KERAS menambahkan bahan lain yang tidak disebutkan user, termasuk bumbu dasar seperti garam, bawang, gula, minyak, air, dll — KECUALI bahan tersebut memang ada di daftar.
- Jika masakan tradisional biasanya butuh bahan tambahan yang TIDAK ada di daftar, JANGAN buat resep itu. Cari alternatif resep lain yang benar-benar bisa dibuat 100% hanya dari bahan yang tersedia.
- Hidangan harus nyata dan lazim di Indonesia.
- Sebelum finalisasi jawaban, cek ulang: semua isi array "bahan" dan "langkah" hanya boleh menyebut bahan dari daftar.
Respond HANYA JSON, bahan & langkah = array of string:
{"nama_hidangan":"nama resep","deskripsi":"1-2 kalimat","waktu_memasak":"X menit","porsi":"sesuai jenis","bahan":["bahan1","bahan2"],"langkah":["langkah1","langkah2"],"tips":"tips singkat"}`

    const data = await ollamaGenerate({ prompt, format: 'json', options: RECIPE_OPTIONS })
    const recipe = parseAiJson(data.response)
    if (!recipe) return res.status(500).json({ error: 'Format resep dari AI tidak valid, coba lagi' })

    // Normalisasi bahan & langkah ke array of string
    if (Array.isArray(recipe.bahan)) {
      recipe.bahan = recipe.bahan.map((b) => {
        if (typeof b === 'string') return b
        if (b && typeof b === 'object') {
          const nameVal = b.nama || b.name || b.bahan || b.ingredient || b.item || ''
          const qtyVal = b.takaran || b.jumlah || b.quantity || b.amount || b.ukuran || ''
          if (nameVal || qtyVal) return [nameVal, qtyVal].filter(Boolean).join(' ')
          return Object.values(b).filter((v) => typeof v === 'string' && v !== '').join(' ')
        }
        return String(b)
      })
    }
    if (Array.isArray(recipe.langkah)) {
      recipe.langkah = recipe.langkah.map((l) => {
        if (typeof l === 'string') return l
        if (l && typeof l === 'object') {
          return l.instruksi || l.langkah || l.step || l.deskripsi ||
            Object.values(l).filter((v) => typeof v === 'string' && v !== '').join(' ')
        }
        return String(l)
      })
    }

    // Safety net: prompt saja tidak selalu dipatuhi model kecil.
    // Tandai item bahan resep yang tidak mengandung satu pun bahan input user
    // supaya UI bisa menampilkan warning "butuh tambahan", bukan diam-diam.
    let butuh_tambahan = []
    if (Array.isArray(bahan) && bahan.length > 0 && Array.isArray(recipe.bahan)) {
      butuh_tambahan = recipe.bahan.filter((item) => {
        const it = String(item).toLowerCase()
        return !bahan.some((b) => it.includes(b.toLowerCase().trim()))
      })
    }

    res.json({ recipe, butuh_tambahan })
  } catch (err) {
    console.error('Generate recipe error:', err)
    res.status(err.statusCode || 500).json({ error: err.message || 'Gagal membuat resep' })
  }
})

/* ── POST /api/suggest-dishes ── */

// Bahan utama yang sering dihalusinasi AI — saran yang menyebut salah satu
// dari ini padahal tidak ada di daftar bahan user akan dibuang.
const BAHAN_UTAMA = [
  'kambing', 'domba', 'sapi', 'ayam', 'bebek', 'ikan', 'udang', 'cumi',
  'kepiting', 'kerang', 'telur', 'tahu', 'tempe', 'nasi', 'beras', 'mie',
  'bihun', 'bakso', 'sosis', 'keju', 'cokelat', 'coklat', 'martabak',
  'es krim', 'roti', 'kentang', 'jagung', 'kurma', 'kelapa', 'santan',
  'susu', 'kopi', 'teh', 'alpukat', 'mangga', 'pisang', 'durian', 'jeruk',
  'apel', 'anggur', 'semangka', 'melon', 'stroberi', 'nanas', 'wortel',
  'brokoli', 'bayam', 'kangkung', 'terong', 'labu', 'singkong', 'ubi',
  'krupuk', 'kerupuk', 'kluwek', 'nangka',
]

// Bumbu & bahan pendukung yang sering diselipkan AI padahal tidak diminta user.
// Aplikasi ini berprinsip "resep dari bahan yang kamu PUNYA" — bumbu dasar pun
// tidak boleh ditambahkan diam-diam jika tidak ada di input user.
const BUMBU_TAMBAHAN = [
  'bawang', 'garam', 'gula', 'minyak', 'merica', 'lada', 'kecap', 'penyedap',
  'kaldu', 'cabai', 'cabe', 'jahe', 'kunyit', 'lengkuas', 'laos', 'serai', 'sereh',
  'ketumbar', 'kemiri', 'terasi', 'santan', 'tepung', 'cuka', 'madu', 'mentega',
  'margarin', 'air', 'es batu', 'daun salam', 'daun jeruk', 'seledri', 'tomat', 'timun',
]

// Semua kata bahan yang dikenali validator (bahan utama + bumbu)
const SEMUA_KATA_BAHAN = [...new Set([...BAHAN_UTAMA, ...BUMBU_TAMBAHAN])]

// Kembalikan daftar bahan yang disebut di teks tapi TIDAK ada di bahan user
function bahanTakTersedia(text, bahanUser) {
  const t = (text || '').toLowerCase()
  return SEMUA_KATA_BAHAN.filter((kw) => {
    if (!new RegExp(`\\b${kw}\\b`).test(t)) return false
    return !bahanUser.some((b) => b.toLowerCase().trim().includes(kw))
  })
}

// Bumbu dapur dasar — selalu ikut klaster utama, tidak pernah dipisah
const BUMBU_DASAR = ['garam', 'gula', 'air', 'minyak', 'merica', 'lada', 'kecap', 'penyedap', 'bawang']
const isBumbuDasar = (b) => {
  const bn = b.toLowerCase().trim()
  return BUMBU_DASAR.some((k) => bn.includes(k))
}

// Protein utama (daging/ikan/unggas/seafood) — tidak boleh dipisahkan dari
// klaster utama dan WAJIB dipakai minimal di 1 saran resep.
const PROTEIN_UTAMA = [
  'ayam', 'bebek', 'angsa', 'puyuh', 'kalkun',
  'daging', 'sapi', 'kambing', 'domba', 'kerbau', 'iga', 'buntut',
  'ikan', 'lele', 'nila', 'gurame', 'mujair', 'bandeng', 'kakap', 'patin',
  'tenggiri', 'tongkol', 'tuna', 'salmon', 'teri', 'kembung',
  'udang', 'cumi', 'sotong', 'kepiting', 'rajungan', 'kerang',
]
const isProteinUtama = (b) => {
  const bn = b.toLowerCase().trim()
  return PROTEIN_UTAMA.some((k) => bn === k || bn.includes(k))
}

// Bahan yang sering diketik singkat dan ambigu — jangan dibuang diam-diam,
// tampilkan konfirmasi ke user (frontend menampilkan tombol pilihan maksud).
const KAMUS_AMBIGU = {
  'kunci': { maksud: ['temu kunci'], catatan: 'Kemungkinan maksudnya bumbu dapur "temu kunci"' },
  'temu': { maksud: ['temu kunci', 'temulawak'], catatan: 'Nama rempah "temu" kurang spesifik' },
  'daun': { maksud: ['daun salam', 'daun jeruk', 'daun bawang'], catatan: 'Daun apa yang dimaksud?' },
}

router.post('/suggest-dishes', async (req, res) => {
  try {
    const { bahan } = req.body
    if (!bahan || !Array.isArray(bahan) || bahan.length === 0) {
      return res.status(400).json({ error: 'Bahan tidak boleh kosong' })
    }

    // ── Tahap 0a: deteksi bahan ambigu ─────────────────────────
    // Bahan yang tidak jelas maksudnya TIDAK dibuang diam-diam:
    // dikembalikan ke frontend untuk dikonfirmasi user, sisanya tetap diproses.
    const bahanAmbigu = []
    for (const b of bahan) {
      const entri = KAMUS_AMBIGU[b.toLowerCase().trim()]
      if (entri) bahanAmbigu.push({ bahan: b, maksud: entri.maksud, catatan: entri.catatan })
    }
    const bahanJelas = bahan.filter((b) => !bahanAmbigu.some((a) => a.bahan === b))
    if (bahanJelas.length === 0) {
      return res.json({
        suggestions: [],
        bahan_ambigu: bahanAmbigu,
        bahan_tidak_terpakai: [],
        peringatan: ['Semua bahan yang dimasukkan kurang jelas — konfirmasi dulu maksudnya.'],
      })
    }

    // ── Tahap 0b: klusterisasi bahan ───────────────────────────
    // Pisahkan bahan yang tidak setema (mis. alpukat di antara bahan gurih)
    // sebelum generate resep, supaya tidak dipaksakan masuk saran utama.
    let bahanUtama = bahanJelas
    let terpisah = []

    // Bahan yang dipakai masakan ber-skor tinggi di knowledge base dilindungi:
    // tidak boleh dipisahkan dari klaster utama (mis. kurma pada Nasi Kebuli).
    const matchesAwal = findMatchingDishes(bahanJelas, 5).filter((m) => m.score >= 0.35)
    const dilindungi = new Set()
    for (const m of matchesAwal.slice(0, 3)) {
      for (const b of bahanJelas) {
        const bn = b.toLowerCase().trim()
        if (m.matchedIngredients.some((kw) => bn.includes(kw) || kw.includes(bn))) dilindungi.add(b)
      }
    }
    // Protein utama juga dilindungi: memisahkan protein = membuang bahan
    // terpenting user, dan protein wajib dipertimbangkan minimal di 1 saran.
    const perluDiputuskan = bahanJelas.filter(
      (b) => !dilindungi.has(b) && !isBumbuDasar(b) && !isProteinUtama(b)
    )

    // Usulan pemisahan dikumpulkan di map (bahan asli → alasan) supaya bebas duplikat
    const terpisahMap = new Map()

    // (a) Heuristik deterministik: buah/dessert di tengah tema masakan gurih.
    //     Tidak bergantung AI, jadi hasilnya selalu konsisten.
    const BUAH_DESSERT = ['alpukat', 'mangga', 'pisang', 'stroberi', 'strawberry',
      'durian', 'semangka', 'melon', 'anggur', 'apel', 'pepaya', 'cokelat', 'coklat', 'es krim']
    const PROTEIN_GURIH = ['kambing', 'domba', 'sapi', 'ayam', 'bebek', 'ikan',
      'udang', 'cumi', 'kepiting', 'kerang', 'telur', 'tahu', 'tempe']
    const temaGurih = bahanJelas.some((b) => PROTEIN_GURIH.some((k) => b.toLowerCase().includes(k)))
    if (temaGurih) {
      for (const b of perluDiputuskan) {
        if (BUAH_DESSERT.some((k) => b.toLowerCase().includes(k))) {
          terpisahMap.set(b, `${b} termasuk buah/dessert, tidak setema dengan bahan masakan gurih lainnya`)
        }
      }
    }

    // (b) AI klusterisasi (1 panggilan Ollama terpisah) untuk bahan yang belum
    //     terputuskan heuristik — hasilnya divalidasi ketat.
    const belumDiputuskan = perluDiputuskan.filter((b) => !terpisahMap.has(b))
    if (bahanJelas.length >= 3 && belumDiputuskan.length > 0) {
      try {
        const promptKluster = `Kamu ahli kuliner Indonesia. Tugasmu HANYA mengelompokkan bahan, BUKAN membuat resep.
Bahan: ${bahanJelas.join(', ')}.

Kelompokkan berdasarkan tema masakan yang cocok dimasak BERSAMA (kategori: protein hewani, rempah/bumbu gurih, karbohidrat, sayuran, buah/dessert/minuman).
- "klaster_utama" = kelompok terbesar bahan yang saling cocok jadi satu masakan.
- "klaster_terpisah" = bahan yang TIDAK setema dengan klaster utama (contoh: buah dessert di antara bahan gurih), sertakan alasan singkat.
- Bumbu dapur dasar (garam, gula, air, minyak, bawang) selalu masuk klaster_utama.
- Jika semua bahan setema, "klaster_terpisah" = [].

Respond HANYA JSON:
{"klaster_utama":["bahan"],"klaster_terpisah":[{"bahan":["bahan"],"alasan":"1 kalimat singkat"}]}`

        const dataK = await ollamaGenerate({
          prompt: promptKluster, format: 'json',
          options: { temperature: 0.1, num_predict: 300, num_ctx: 1024, repeat_penalty: 1.1 },
        })
        const hasilK = parseAiJson(dataK.response, {})

        // Validasi: hanya bahan input yang boleh dipisah; bahan yang dilindungi
        // knowledge base, bumbu dasar, dan protein utama dipaksa tetap di klaster utama
        const cariBahanAsli = (x) => bahanJelas.find((b) => b.toLowerCase().trim() === String(x).toLowerCase().trim())
        for (const grp of (hasilK.klaster_terpisah || [])) {
          if (!grp) continue
          const alasan = typeof grp.alasan === 'string' && grp.alasan
            ? grp.alasan
            : 'Tidak setema dengan bahan utama lainnya'
          const items = (Array.isArray(grp.bahan) ? grp.bahan : [grp.bahan])
            .map(cariBahanAsli)
            .filter(Boolean)
            .filter((b) => !dilindungi.has(b) && !isBumbuDasar(b) && !isProteinUtama(b))
          for (const b of items) {
            if (!terpisahMap.has(b)) terpisahMap.set(b, alasan)
          }
        }
      } catch (e) {
        // klusterisasi AI gagal → cukup pakai hasil heuristik
        console.error('Klusterisasi AI gagal:', e.message)
      }
    }

    // Terapkan pemisahan (klaster terpisah tidak boleh menelan semua bahan)
    if (terpisahMap.size > 0 && terpisahMap.size < bahanJelas.length) {
      bahanUtama = bahanJelas.filter((b) => !terpisahMap.has(b))
      terpisah = [...terpisahMap].map(([b, alasan]) => ({ bahan: [b], alasan }))
    }

    // Saran resep terpisah untuk tiap klaster minoritas (dari knowledge base,
    // ambang longgar karena bahannya sedikit — mis. alpukat → Jus Alpukat)
    const saranTerpisah = []
    for (const grp of terpisah) {
      const m = findMatchingDishes(grp.bahan, 1)[0]
      if (!m) continue
      if (saranTerpisah.some((s) => s.nama === m.nama)) continue
      saranTerpisah.push({
        nama: m.nama,
        deskripsi: `${m.nama} bisa dibuat terpisah dari ${grp.bahan.join(', ')}.`,
        alasan: `Menggunakan ${grp.bahan.join(', ')} yang tidak setema dengan bahan utama`,
        dari_bahan: grp.bahan,
      })
    }

    // ── Tahap 1: match kuat knowledge base = saran pasti ───────
    // Deterministik: masakan nyata yang bahannya benar-benar cocok,
    // langsung dipakai tanpa lewat AI supaya tidak bisa ngawur.
    const semuaMatch = findMatchingDishes(bahanUtama, 10, 0.1)

    const kbSuggestion = (m) => {
      // Tampilkan bahan versi ketikan user, bukan keyword knowledge base
      // (mis. user ketik "bawang" jangan ditampilkan "bawang bombai")
      const bahanUser = bahanUtama.filter((b) => {
        const bn = b.toLowerCase().trim()
        return m.matchedIngredients.some((kw) => bn.includes(kw) || kw.includes(bn))
      })
      const tampil = bahanUser.length > 0 ? bahanUser : m.matchedIngredients
      return {
        nama: m.nama,
        deskripsi: `${m.nama} cocok dibuat dari ${tampil.slice(0, 4).join(', ')} yang kamu punya.`,
        alasan: `Menggunakan ${tampil.join(', ')} dari bahanmu`,
        skor: m.score, // skor knowledge base — dipakai untuk hitung % kecocokan
      }
    }

    const valid = []

    // ── Tahap 1b: pilih 3 masakan KB dengan cakupan bahan terluas ──
    // Greedy: slot berikutnya memprioritaskan masakan yang memakai bahan
    // yang BELUM tercakup saran sebelumnya, supaya tidak ada bahan yang
    // terabaikan hanya karena masakan sejenis mendominasi skor.
    const cocokDenganMatch = (m, b) => {
      const bn = b.toLowerCase().trim()
      return m.matchedIngredients.some((kw) => bn.includes(kw) || kw.includes(bn))
    }
    const tercakup = new Set()
    const kandidat = [...semuaMatch]
    while (valid.length < 3 && kandidat.length > 0) {
      let terbaik = null
      let kunciTerbaik = [-1, -1]
      for (const m of kandidat) {
        const baru = bahanUtama.filter((b) => cocokDenganMatch(m, b) && !tercakup.has(b)).length
        if (baru > kunciTerbaik[0] || (baru === kunciTerbaik[0] && m.score > kunciTerbaik[1])) {
          terbaik = m
          kunciTerbaik = [baru, m.score]
        }
      }
      if (!terbaik) break
      valid.push(kbSuggestion(terbaik))
      bahanUtama.filter((b) => cocokDenganMatch(terbaik, b)).forEach((b) => tercakup.add(b))
      kandidat.splice(kandidat.indexOf(terbaik), 1)
    }

    // ── Tahap 2: AI hanya mengisi slot yang masih kosong ───────
    // Maksimal 2 percobaan: saran yang menyebut bahan di luar daftar user
    // ditolak validator, lalu percobaan kedua diberi feedback penolakannya.
    let ditolak = []
    let aiTerakhir = []
    for (let percobaan = 0; percobaan < 2 && valid.length < 3; percobaan++) {
      const sudahDisarankan = valid.length > 0
        ? `\nJANGAN menyarankan lagi (sudah ada): ${valid.map((s) => s.nama).join('; ')}.`
        : ''
      const feedbackDitolak = ditolak.length > 0
        ? `\nSaran kamu sebelumnya DITOLAK karena memakai bahan di luar daftar: ${ditolak
            .map((d) => `"${d.nama}" (menyebut ${d.tambahan.join(', ')})`)
            .join('; ')}. JANGAN ulangi kesalahan ini.`
        : ''

      const proteinDiUtama = bahanUtama.filter(isProteinUtama)
      const prompt = `Kamu chef & barista Indonesia. Bahan yang TERSEDIA (dan HANYA ini): ${bahanUtama.join(', ')}.
${sudahDisarankan}${feedbackDitolak}

PENTING - ATURAN WAJIB:
- Kamu HANYA boleh menggunakan bahan yang ADA di dalam daftar bahan di atas.
- DILARANG KERAS menambahkan bahan lain yang tidak disebutkan user, termasuk bumbu dasar seperti garam, bawang, gula, minyak, cabai, santan, dll — KECUALI bahan tersebut memang ada di daftar.
- Jika resep tradisional biasanya butuh bahan tambahan yang TIDAK ada di daftar, JANGAN buat resep itu. Cari alternatif resep lain yang benar-benar bisa dibuat 100% hanya dari bahan yang tersedia.
- Gunakan HANYA nama masakan/minuman Indonesia yang NYATA dan dikenal luas (yang lazim dijual di warung/restoran). DILARANG mengarang nama gabungan bahan seperti "Nasi Kelapa Es" atau "Gula Air Manis".
- Sebelum finalisasi jawaban, cek ulang: apakah SEMUA bahan yang disebutkan di nama, deskripsi, dan alasan benar-benar ada di daftar? Jika tidak, perbaiki atau ganti dengan resep lain.

Berikan TEPAT 3 saran masakan/minuman yang:
1. Cukup pakai SEBAGIAN bahan yang saling cocok — JANGAN memaksakan semua bahan jadi satu hidangan
2. Jika sebagian bahan membentuk masakan/minuman tradisional yang dikenal luas, WAJIB gunakan nama asli masakan itu (jangan mengarang nama baru)
3. Merupakan hidangan NYATA yang lazim dijual/dimasak di Indonesia
4. "alasan" berisi daftar bahan dari daftar user yang dipakai, bukan angka atau skor${proteinDiUtama.length > 0 ? `
5. Bahan protein (${proteinDiUtama.join(', ')}) WAJIB menjadi bahan utama minimal di 1 saran` : ''}

Respond HANYA JSON tanpa komentar:
{"suggestions":[{"nama":"Nama Masakan 1","deskripsi":"1 kalimat","alasan":"bahan yang digunakan dari daftar"},{"nama":"Nama Masakan 2","deskripsi":"1 kalimat","alasan":"bahan yang digunakan"},{"nama":"Nama Masakan 3","deskripsi":"1 kalimat","alasan":"bahan yang digunakan"}]}`

      const data = await ollamaGenerate({
        prompt, format: 'json',
        options: { temperature: 0.3, num_predict: 400, num_ctx: 2048, repeat_penalty: 1.2 },
      })

      const result = parseAiJson(data.response, { suggestions: [] })
      const aiSuggestions = (result.suggestions || [])
        .filter((s) => s && s.nama)
        .map((s) => ({
          ...s,
          alasan: Array.isArray(s.alasan) ? s.alasan.join(', ') : s.alasan,
          deskripsi: Array.isArray(s.deskripsi) ? s.deskripsi.join(' ') : s.deskripsi,
        }))
      aiTerakhir = aiSuggestions

      // ── Tahap 3: validasi ketat setiap saran AI ──────────────
      ditolak = []
      for (const s of aiSuggestions) {
        if (valid.length >= 3) break
        // buang jika nama masakan tidak dikenal (AI mengarang / halusinasi)
        if (!isKnownDish(s.nama)) {
          ditolak.push({ nama: s.nama, tambahan: ['nama masakan tidak dikenal — gunakan nama masakan Indonesia yang nyata'] })
          continue
        }
        // buang jika menyebut bahan APA PUN (termasuk bumbu) di luar daftar user
        const tambahan = bahanTakTersedia(`${s.nama} ${s.deskripsi || ''} ${s.alasan || ''}`, bahanUtama)
        if (tambahan.length > 0) {
          ditolak.push({ nama: s.nama, tambahan })
          continue
        }
        // buang jika menyebut masakan dikenal yang bahan wajibnya tidak ada
        // (mis. "Gudeg Ayam" tanpa nangka, "Bolu" tanpa tepung)
        if (dishRequirementViolated(s.nama, bahanUtama)) continue
        // buang duplikat dari saran yang sudah ada
        const dup = valid.some((v) => {
          const a = v.nama.toLowerCase(); const b = s.nama.toLowerCase()
          return a.includes(b) || b.includes(a)
        })
        if (dup) continue
        valid.push(s)
      }
    }

    // Jika semua tersaring dan knowledge base kosong, pakai hasil AI yang
    // namanya masakan NYATA saja — saran bermasalah TIDAK disembunyikan:
    // Tahap 5 menandainya dengan "butuh_tambahan" supaya user tahu.
    if (valid.length === 0) valid.push(...aiTerakhir.filter((s) => isKnownDish(s.nama)))

    // ── Tahap 4: jaminan protein utama ─────────────────────────
    // Protein (daging/ikan/unggas) yang tidak masuk saran manapun = bug.
    // Coba 1 panggilan korektif khusus per protein; kalau tetap gagal, laporkan.
    const teksSaran = (s) => `${s.nama} ${s.deskripsi || ''} ${s.alasan || ''}`.toLowerCase()
    const dipakaiDiSaran = (b) => valid.slice(0, 3).some((s) => teksSaran(s).includes(b.toLowerCase().trim()))
    const peringatan = []
    const proteinHilang = bahanUtama.filter((b) => isProteinUtama(b) && !dipakaiDiSaran(b))
    let slotGanti = 2
    for (const p of proteinHilang) {
      try {
        const promptProtein = `Kamu chef Indonesia. Berikan TEPAT 1 masakan Indonesia NYATA berbahan utama ${p}.
Hanya boleh memakai bahan dari daftar ini: ${bahanUtama.join(', ')}.
DILARANG KERAS menambahkan bahan lain apa pun — termasuk bumbu dasar (garam, bawang, gula, minyak) — yang tidak ada di daftar itu.
Jika masakan tradisional butuh bahan di luar daftar, pilih masakan lain yang 100% bisa dibuat dari daftar.
Gunakan nama masakan asli yang lazim di Indonesia.
Respond HANYA JSON: {"nama":"Nama Masakan","deskripsi":"1 kalimat","alasan":"bahan yang dipakai, termasuk ${p}"}`
        const dataP = await ollamaGenerate({
          prompt: promptProtein, format: 'json',
          options: { temperature: 0.3, num_predict: 200, num_ctx: 1024, repeat_penalty: 1.2 },
        })
        const sp = parseAiJson(dataP.response)
        if (!sp || !sp.nama) continue
        const saranP = {
          nama: sp.nama,
          deskripsi: Array.isArray(sp.deskripsi) ? sp.deskripsi.join(' ') : (sp.deskripsi || ''),
          alasan: Array.isArray(sp.alasan) ? sp.alasan.join(', ') : (sp.alasan || ''),
        }
        const layak = teksSaran(saranP).includes(p.toLowerCase().trim()) &&
          isKnownDish(saranP.nama) &&
          bahanTakTersedia(teksSaran(saranP), bahanUtama).length === 0 &&
          !dishRequirementViolated(saranP.nama, bahanUtama) &&
          !valid.some((v) => v.nama.toLowerCase() === saranP.nama.toLowerCase())
        if (!layak) continue
        if (valid.length >= 3) {
          valid[slotGanti] = saranP
          if (slotGanti > 1) slotGanti--
        } else {
          valid.push(saranP)
        }
      } catch (e) {
        console.error('Saran korektif protein gagal:', e.message)
      }
    }

    // ── Tahap 5: tidak ada bahan yang hilang diam-diam ─────────
    // Setiap bahan input harus terpakai di minimal 1 saran ATAU
    // dijelaskan eksplisit ke user (ambigu / tidak terpakai / peringatan).
    const suggestionsFinal = valid.slice(0, 3).map((s) => {
      // Badge ✓ hijau di UI — diturunkan dari teks saran supaya selalu sinkron
      // dengan bahan yang benar-benar disebutkan
      const bahanTerpakai = bahanUtama.filter((b) => teksSaran(s).includes(b.toLowerCase().trim()))
      // Safety net: bahan yang disebut saran tapi TIDAK ada di input user
      const butuhTambahan = [...new Set(bahanTakTersedia(teksSaran(s), bahan))]

      // % kecocokan resep dengan bahan user:
      //   55% bobot kelengkapan bahan khas resep (skor knowledge base),
      //   45% bobot cakupan (berapa banyak bahan user yang dipakai resep ini),
      //   penalti 15 poin per bahan tambahan yang tidak dimiliki user.
      const cakupan = bahanUtama.length > 0 ? bahanTerpakai.length / bahanUtama.length : 0
      const skorSig = typeof s.skor === 'number' ? s.skor : cakupan
      let kecocokan = Math.round(Math.min(1, 0.55 * skorSig + 0.45 * cakupan) * 100)
      kecocokan = Math.max(5, kecocokan - butuhTambahan.length * 15)

      const { skor, ...tanpaSkor } = s
      return { ...tanpaSkor, bahan_terpakai: bahanTerpakai, butuh_tambahan: butuhTambahan, kecocokan }
    })
    // Urutkan dari kecocokan tertinggi — saran teratas = paling sesuai bahanmu
    suggestionsFinal.sort((a, b) => b.kecocokan - a.kecocokan)

    const bahanTidakTerpakai = terpisah.map((grp) => {
      const sp = saranTerpisah.find((s) => s.dari_bahan.join() === grp.bahan.join())
      return {
        bahan: grp.bahan.join(', '),
        alasan: sp ? `${grp.alasan}. Bisa dibuat terpisah menjadi: ${sp.nama}.` : grp.alasan,
      }
    })
    for (const b of bahanJelas) {
      const terpakai = suggestionsFinal.some((s) =>
        s.bahan_terpakai.some((t) => t.toLowerCase().trim() === b.toLowerCase().trim()))
      const dijelaskan = bahanTidakTerpakai.some((t) =>
        t.bahan.toLowerCase().includes(b.toLowerCase().trim()))
      if (!terpakai && !dijelaskan) {
        bahanTidakTerpakai.push({
          bahan: b,
          alasan: isBumbuDasar(b)
            ? 'Bahan pelengkap dasar — tidak disebut eksplisit di saran, tapi bisa dipakai sesuai kebutuhan di resep mana pun.'
            : 'Tidak terpakai di saran manapun — kemungkinan tidak dikenali AI. Periksa penulisannya atau coba generate ulang.',
        })
      }
    }
    for (const p of bahanUtama.filter((b) => isProteinUtama(b) && !dipakaiDiSaran(b))) {
      peringatan.push(
        `Bahan protein utama "${p}" belum berhasil masuk ke saran manapun — seharusnya jadi pertimbangan utama. Coba generate ulang.`
      )
    }
    if (suggestionsFinal.length < 3) {
      peringatan.push(
        `AI hanya memberikan ${suggestionsFinal.length} dari 3 saran yang ditargetkan — kombinasi bahan yang valid mungkin terbatas. Coba generate ulang untuk variasi lain.`
      )
    }

    res.json({
      suggestions: suggestionsFinal,
      bahan_ambigu: bahanAmbigu,
      bahan_tidak_terpakai: bahanTidakTerpakai,
      peringatan,
      klaster: {
        utama: bahanUtama,
        terpisah,
        saran_terpisah: saranTerpisah,
      },
    })
  } catch (err) {
    console.error('Suggest dishes error:', err)
    res.status(err.statusCode || 500).json({ error: err.message || 'Gagal mendapatkan saran' })
  }
})

/* ── POST /api/clarify-dish ── */
router.post('/clarify-dish', async (req, res) => {
  try {
    const query = (req.body.query || '').trim()
    if (!query) return res.status(400).json({ error: 'Query tidak boleh kosong' })

    const prompt = `Kamu chef & barista Indonesia. User mengetik: "${query}"

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

    const data = await ollamaGenerate({
      prompt, format: 'json',
      options: { temperature: 0.5, num_predict: 400, num_ctx: 2048, repeat_penalty: 1.1 },
    })

    const result = parseAiJson(data.response, { jenis: 'jelas', nama: query, deskripsi: '' })
    if (!result.jenis) result.jenis = 'jelas'
    if (result.jenis === 'ambigu' && (!result.opsi || result.opsi.length === 0)) {
      result.jenis = 'jelas'
      result.nama = query
    }
    if (result.jenis === 'jelas' && !result.nama) result.nama = query

    res.json(result)
  } catch (err) {
    console.error('Clarify dish error:', err)
    res.status(err.statusCode || 500).json({ error: err.message || 'Gagal menganalisis input' })
  }
})

/* ── POST /api/chat — streaming token per token ── */
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong' })
    }

    const recentHistory = (history || []).slice(-8)
    const systemPrompt = `Kamu asisten AI pintar "ChefBot" di platform ResepPintar. Jawab dalam Bahasa Indonesia, ringkas dan tepat.
- Makanan: resep, tips memasak, nutrisi, substitusi bahan, asal-usul masakan
- Umum: sains, sejarah, teknologi, budaya, pertanyaan random
- Jawab langsung tanpa basa-basi. Jika tidak tahu, katakan terus terang.`

    let conversationText = `SYSTEM: ${systemPrompt}\n\n`
    for (const msg of recentHistory) {
      conversationText += msg.role === 'user' ? `USER: ${msg.content}\n` : `ASSISTANT: ${msg.content}\n`
    }
    conversationText += `USER: ${message.trim()}\nASSISTANT:`

    const ollamaRes = await ollamaGenerate({
      prompt: conversationText,
      options: { temperature: 0.7, top_p: 0.9, num_predict: 800, num_ctx: 4096, repeat_penalty: 1.1 },
    }, true)

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Accel-Buffering', 'no')

    const reader = ollamaRes.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value, { stream: true }).split('\n').filter((l) => l.trim())
        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            if (json.response) res.write(json.response)
            if (json.done) return res.end()
          } catch { /* skip baris JSON rusak */ }
        }
      }
    } finally {
      res.end()
    }
  } catch (err) {
    console.error('Chat error:', err)
    if (!res.headersSent) {
      res.status(err.statusCode || 500).json({ error: err.message || 'Gagal menghubungi AI' })
    } else {
      res.end()
    }
  }
})

module.exports = router
