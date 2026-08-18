'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { RecipeData } from '@/lib/types'

// Helper: fetch + parse JSON dengan pesan error yang jelas jika backend mati
async function fetchJson(url: string, options: RequestInit): Promise<[Response, any]> {
  const res = await fetch(url, options)
  try {
    const data = await res.json()
    return [res, data]
  } catch {
    throw new Error(
      res.status === 0 || res.status >= 500
        ? 'Backend API tidak dapat dihubungi. Pastikan server Express berjalan di port 4000.'
        : `Server mengembalikan respons tidak valid (HTTP ${res.status})`
    )
  }
}

const MAKANAN_POPULER = [
  { nama: 'Nasi Goreng',  emoji: '🍳', color: 'bg-orange-400', bahan: ['nasi putih', 'telur', 'kecap manis', 'bawang putih', 'bawang merah', 'cabai'] },
  { nama: 'Ayam Goreng',  emoji: '🍗', color: 'bg-amber-400',  bahan: ['ayam', 'bawang putih', 'jahe', 'kunyit', 'garam', 'ketumbar'] },
  { nama: 'Mie Goreng',   emoji: '🍜', color: 'bg-yellow-400', bahan: ['mie telur', 'telur', 'kecap manis', 'bawang putih', 'sawi', 'tomat'] },
  { nama: 'Soto Ayam',    emoji: '🍲', color: 'bg-lime-400',   bahan: ['ayam', 'kunyit', 'jahe', 'serai', 'daun salam', 'bawang putih'] },
  { nama: 'Tempe Orek',   emoji: '🫘', color: 'bg-yellow-600', bahan: ['tempe', 'kecap manis', 'bawang merah', 'bawang putih', 'cabai', 'gula merah'] },
  { nama: 'Gado-gado',    emoji: '🥗', color: 'bg-green-400',  bahan: ['kacang tanah', 'tahu', 'tempe', 'kentang', 'bayam', 'timun'] },
  { nama: 'Bakso',        emoji: '🍡', color: 'bg-red-400',    bahan: ['daging sapi giling', 'tepung tapioka', 'bawang putih', 'garam', 'mie', 'bawang goreng'] },
  { nama: 'Rendang',      emoji: '🍖', color: 'bg-red-600',    bahan: ['daging sapi', 'santan', 'cabai merah', 'serai', 'jahe', 'lengkuas', 'kunyit'] },
]

const MAKANAN_DAERAH = [
  { nama: 'Gudeg',          emoji: '🫙', color: 'bg-amber-600',  daerah: 'Yogyakarta',         bahan: ['nangka muda', 'santan', 'telur', 'ayam', 'gula merah', 'daun salam'] },
  { nama: 'Rawon',          emoji: '🍛', color: 'bg-slate-600',  daerah: 'Jawa Timur',          bahan: ['daging sapi', 'kluwek', 'serai', 'daun salam', 'bawang merah', 'jahe'] },
  { nama: 'Pempek',         emoji: '🐟', color: 'bg-blue-400',   daerah: 'Palembang',           bahan: ['ikan tenggiri', 'tepung sagu', 'telur', 'bawang putih', 'garam', 'cuka'] },
  { nama: 'Coto Makassar',  emoji: '🥣', color: 'bg-orange-600', daerah: 'Sulawesi Selatan',    bahan: ['daging sapi', 'kacang tanah', 'serai', 'ketumbar', 'bawang merah', 'jahe'] },
  { nama: 'Sate Lilit',     emoji: '🍢', color: 'bg-green-500',  daerah: 'Bali',                bahan: ['ikan', 'kelapa parut', 'serai', 'cabai', 'daun jeruk', 'bawang putih'] },
  { nama: 'Tinutuan',       emoji: '🌽', color: 'bg-yellow-500', daerah: 'Manado',              bahan: ['beras', 'labu kuning', 'jagung', 'bayam', 'kangkung', 'ubi'] },
  { nama: 'Ayam Betutu',    emoji: '🐔', color: 'bg-red-500',    daerah: 'Bali',                bahan: ['ayam', 'serai', 'daun salam', 'jahe', 'lengkuas', 'kunyit', 'cabai'] },
  { nama: 'Papeda',         emoji: '🍚', color: 'bg-teal-400',   daerah: 'Maluku / Papua',      bahan: ['sagu', 'ikan', 'kunyit', 'jahe', 'serai', 'daun jeruk'] },
]

interface Suggestion {
  nama: string
  deskripsi: string
  alasan: string
  bahan_terpakai?: string[]
  butuh_tambahan?: string[]
  kecocokan?: number
}

interface BahanAmbigu {
  bahan: string
  maksud: string[]
  catatan?: string
}

interface BahanTidakTerpakai {
  bahan: string
  alasan: string
}

interface SuggestInfo {
  ambigu: BahanAmbigu[]
  tidakTerpakai: BahanTidakTerpakai[]
  peringatan: string[]
}

interface ClarifyOption {
  nama: string
  deskripsi: string
  daerah?: string
}

export default function Home() {
  const [inputBahan, setInputBahan]   = useState('')
  const [bahanList, setBahanList]     = useState<string[]>([])
  const [activeTab, setActiveTab]     = useState<'populer' | 'daerah'>('populer')
  const [inputMode, setInputMode]     = useState<'bahan' | 'nama'>('bahan')
  const [namaMakanan, setNamaMakanan] = useState('')
  const [clarifyLoading, setClarifyLoading] = useState(false)
  const [clarifyOptions, setClarifyOptions] = useState<{ pesan: string; opsi: ClarifyOption[] } | null>(null)

  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestions, setSuggestions]       = useState<Suggestion[] | null>(null)
  const [suggestInfo, setSuggestInfo]       = useState<SuggestInfo | null>(null)

  const [loading, setLoading]   = useState(false)
  const [recipe, setRecipe]     = useState<RecipeData | null>(null)
  const [recipeButuhTambahan, setRecipeButuhTambahan] = useState<string[]>([])
  const [error, setError]       = useState('')

  const [photoFile, setPhotoFile]       = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── auto-generate dari halaman /inspirasi (?resep=Nama) ── */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const resep = params.get('resep')?.trim()
    if (resep) {
      window.history.replaceState({}, '', '/') // bersihkan URL
      setInputMode('nama')
      setNamaMakanan(resep)
      generateFromNameDirect(resep)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── helpers ── */
  const addBahan = () => {
    const trimmed = inputBahan.trim()
    if (trimmed && !bahanList.includes(trimmed)) {
      setBahanList((p) => [...p, trimmed])
      setInputBahan('')
    }
  }
  const removeBahan = (i: number) => setBahanList((p) => p.filter((_, idx) => idx !== i))
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addBahan() }
  }

  /* ── Step 1: tanya AI opsi masakan ── */
  const getSuggestions = async (listOverride?: string[]) => {
    const list = listOverride ?? bahanList
    if (list.length === 0) return
    setSuggestLoading(true)
    setError('')
    setSuggestions(null)
    setSuggestInfo(null)
    setRecipe(null)
    setSaved(false)
    setPhotoFile(null)
    setPhotoPreview(null)
    try {
      const [res, data] = await fetchJson('/api/suggest-dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bahan: list }),
      })
      if (!res.ok) throw new Error(data.error || 'Gagal mendapatkan saran')
      setSuggestions(data.suggestions || [])
      setSuggestInfo({
        ambigu: data.bahan_ambigu || [],
        tidakTerpakai: data.bahan_tidak_terpakai || [],
        peringatan: data.peringatan || [],
      })
    } catch (err: any) {
      setError(err.message || 'Gagal mendapatkan saran')
    } finally {
      setSuggestLoading(false)
    }
  }

  /* ── ganti bahan ambigu dengan maksud yang dikonfirmasi user, lalu minta saran ulang ── */
  const replaceBahan = (dari: string, jadi: string) => {
    const updated = bahanList.map((b) =>
      b.toLowerCase().trim() === dari.toLowerCase().trim() ? jadi : b
    )
    setBahanList(updated)
    getSuggestions(updated)
  }

  /* ── Step 2: generate resep dari pilihan ── */
  const generateRecipe = async (namaDish?: string) => {
    setLoading(true)
    setError('')
    setSuggestions(null)
    setSuggestInfo(null)
    try {
      const [res, data] = await fetchJson('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bahan: bahanList, nama_target: namaDish }),
      })
      if (!res.ok) throw new Error(data.error || 'Gagal membuat resep')
      setRecipe(data.recipe)
      setRecipeButuhTambahan(data.butuh_tambahan || [])
      setTimeout(() => document.getElementById('recipe-section')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err: any) {
      setError(err.message || 'Gagal membuat resep')
    } finally {
      setLoading(false)
    }
  }

  /* ── generate resep langsung dari nama makanan ── */
  const generateFromName = async () => {
    const nama = namaMakanan.trim()
    if (!nama) return

    // Reset state
    setClarifyOptions(null)
    setSuggestions(null)
    setSuggestInfo(null)
    setRecipe(null)
    setSaved(false)
    setPhotoFile(null)
    setPhotoPreview(null)
    setError('')

    // Step 1: cek apakah input ambigu
    setClarifyLoading(true)
    try {
      const [res, data] = await fetchJson('/api/clarify-dish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nama }),
      })
      if (!res.ok) throw new Error(data.error || 'Gagal menganalisis nama makanan')

      if (data.jenis === 'ambigu' && data.opsi?.length > 0) {
        // Tampilkan pilihan klarifikasi
        setClarifyOptions({ pesan: data.pesan || 'Kamu maksud masakan yang mana?', opsi: data.opsi })
        setClarifyLoading(false)
        return
      }

      // Jelas → langsung generate dengan nama yang sudah dikoreksi AI
      const namaFinal = data.nama || nama
      setClarifyLoading(false)
      await generateFromNameDirect(namaFinal)
    } catch (err: any) {
      setClarifyLoading(false)
      // Jika gagal clarify, langsung generate saja
      await generateFromNameDirect(nama)
    }
  }

  /* ── generate resep dari nama spesifik (setelah clarify) ── */
  const generateFromNameDirect = async (nama: string) => {
    setBahanList([])
    setLoading(true)
    setError('')
    try {
      const [res, data] = await fetchJson('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bahan: [], nama_target: nama }),
      })
      if (!res.ok) throw new Error(data.error || 'Gagal membuat resep')
      setRecipe(data.recipe)
      setRecipeButuhTambahan(data.butuh_tambahan || [])
      setTimeout(() => document.getElementById('recipe-section')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err: any) {
      setError(err.message || 'Gagal membuat resep')
    } finally {
      setLoading(false)
    }
  }

  /* ── klik kartu makanan populer / daerah ── */
  const generateFromFeatured = async (dish: { nama: string; bahan: string[] }) => {
    setBahanList(dish.bahan)
    setSuggestions(null)
    setSuggestInfo(null)
    setRecipe(null)
    setSaved(false)
    setPhotoFile(null)
    setPhotoPreview(null)
    setError('')
    setLoading(true)
    try {
      const [res, data] = await fetchJson('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bahan: dish.bahan, nama_target: dish.nama }),
      })
      if (!res.ok) throw new Error(data.error || 'Gagal membuat resep')
      setRecipe(data.recipe)
      setRecipeButuhTambahan(data.butuh_tambahan || [])
      setTimeout(() => document.getElementById('recipe-section')?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err: any) {
      setError(err.message || 'Gagal membuat resep')
    } finally {
      setLoading(false)
    }
  }

  /* ── upload foto + simpan ── */
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const saveRecipe = async () => {
    if (!recipe) return
    setSaving(true)
    setError('')
    try {
      let foto_url = null
      if (photoFile) {
        setUploading(true)
        const fd = new FormData()
        fd.append('photo', photoFile)
        const [up, ud] = await fetchJson('/api/upload-photo', { method: 'POST', body: fd })
        if (!up.ok) throw new Error(ud.error || 'Gagal upload foto')
        foto_url = ud.url
        setUploading(false)
      }
      const [sv, sd] = await fetchJson('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe, bahan_input: bahanList, foto_url }),
      })
      if (!sv.ok) throw new Error(sd.error || 'Gagal menyimpan resep')
      setSaved(true)
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan resep')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const resetAll = () => {
    setRecipe(null); setSuggestions(null); setSuggestInfo(null); setClarifyOptions(null); setSaved(false)
    setBahanList([]); setNamaMakanan(''); setPhotoFile(null); setPhotoPreview(null); setError('')
    setRecipeButuhTambahan([])
  }

  /* ── render ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍳</span>
            <div>
              <h1 className="text-xl font-bold text-orange-600">ResepPintar</h1>
              <p className="text-xs text-gray-400">Resep AI dari bahan yang kamu punya</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/inspirasi" className="text-sm text-indigo-600 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
              💡 1000+ Inspirasi
            </Link>
            <Link href="/chat" className="text-sm text-purple-600 font-medium border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
              🤖 AI Chat
            </Link>
            <Link href="/recipes" className="text-sm text-orange-600 font-medium border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors">
              📚 Koleksi Resep
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Inspirasi Resep ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">🌟 Inspirasi Resep</h2>
            <Link
              href="/inspirasi"
              className="text-xs text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              💡 Lihat 1000+ inspirasi lainnya →
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(['populer', 'daerah'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab === 'populer' ? '🔥 Makanan Populer' : '🗺️ Makanan Daerah'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(activeTab === 'populer' ? MAKANAN_POPULER : MAKANAN_DAERAH).map((dish) => (
              <button
                key={dish.nama}
                onClick={() => generateFromFeatured(dish)}
                disabled={loading || suggestLoading}
                className="group relative rounded-xl overflow-hidden text-left hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className={`${dish.color} h-24 flex items-center justify-center`}>
                  <span className="text-4xl group-hover:scale-110 transition-transform inline-block">{dish.emoji}</span>
                </div>
                <div className="bg-white p-2 border border-t-0 border-gray-100 rounded-b-xl">
                  <p className="font-semibold text-gray-800 text-xs leading-tight truncate">{dish.nama}</p>
                  {'daerah' in dish && (
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{String(dish.daerah)}</p>
                  )}
                </div>
                <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-10">
                  <span className="bg-white text-orange-600 text-xs font-bold px-2 py-1 rounded-lg shadow">
                    ✨ Buat Resep
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Step 1: Input ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
            Cara Generate Resep
          </h2>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setInputMode('bahan')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'bahan'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🧅 Dari Bahan
            </button>
            <button
              onClick={() => setInputMode('nama')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                inputMode === 'nama'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🍽️ Nama Makanan
            </button>
          </div>

          {inputMode === 'bahan' ? (
            <>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={inputBahan}
                  onChange={(e) => setInputBahan(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Contoh: telur, ayam, kecap..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                />
                <button
                  onClick={addBahan}
                  disabled={!inputBahan.trim()}
                  className="bg-orange-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  + Tambah
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">Tekan Enter atau koma untuk menambah bahan</p>

              {bahanList.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {bahanList.map((bahan, i) => (
                    <span key={i} className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1.5">
                      {bahan}
                      <button onClick={() => removeBahan(i)} className="text-orange-400 hover:text-orange-700 text-base leading-none" aria-label={`Hapus ${bahan}`}>×</button>
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => getSuggestions()}
                disabled={bahanList.length === 0 || suggestLoading || loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
              >
                {suggestLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI sedang menyarankan pilihan...
                  </>
                ) : '✨ Generate Resep dengan AI'}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">Ketik nama masakan apapun, AI akan buatkan resep lengkapnya</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={namaMakanan}
                  onChange={(e) => setNamaMakanan(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') generateFromName() }}
                  placeholder="Contoh: Soto Betawi, Opor Ayam, Pecel Lele..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mb-4">Tekan Enter untuk langsung generate</p>

              {/* Quick name suggestions */}
              <div className="flex flex-wrap gap-2 mb-4">
                {['Soto Betawi','Opor Ayam','Gulai Kambing','Pecel Lele','Capcay','Semur Daging','Lodeh','Tongseng'].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNamaMakanan(n)}
                    className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={generateFromName}
                disabled={!namaMakanan.trim() || loading || clarifyLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
              >
                {clarifyLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI sedang menganalisis...
                  </>
                ) : loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI sedang meracik resep...
                  </>
                ) : '🍽️ Generate Resep dari Nama'}
              </button>
            </>
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── Clarify Options (input nama ambigu) ── */}
        {clarifyOptions && !loading && (
          <section className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🤔</span>
                <h2 className="text-base font-semibold text-gray-800">{clarifyOptions.pesan}</h2>
              </div>
              <p className="text-sm text-gray-400 ml-9">Pilih salah satu agar resep yang dibuat lebih tepat dan akurat</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {clarifyOptions.opsi.map((opsi, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setClarifyOptions(null)
                    setNamaMakanan(opsi.nama)
                    generateFromNameDirect(opsi.nama)
                  }}
                  disabled={loading}
                  className="text-left bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-300 rounded-xl p-4 transition-all group disabled:opacity-40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-blue-700 group-hover:text-blue-900 text-sm mb-0.5">{opsi.nama}</p>
                      <p className="text-xs text-gray-500 leading-snug">{opsi.deskripsi}</p>
                      {opsi.daerah && (
                        <span className="inline-block mt-1.5 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          📍 {opsi.daerah}
                        </span>
                      )}
                    </div>
                    <span className="text-blue-300 group-hover:text-blue-500 text-lg flex-shrink-0">→</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setClarifyOptions(null)
                generateFromNameDirect(namaMakanan.trim())
              }}
              disabled={loading}
              className="w-full border border-dashed border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40"
            >
              🎲 Biarkan AI pilihkan yang terbaik dari "{namaMakanan}"
            </button>
          </section>
        )}

        {/* ── Konfirmasi bahan ambigu ── */}
        {suggestInfo && suggestInfo.ambigu.length > 0 && !loading && !suggestLoading && (
          <section className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🧐</span>
              <h2 className="text-base font-semibold text-gray-800">Ada bahan yang kurang jelas</h2>
            </div>
            <p className="text-sm text-gray-400 ml-9 mb-4">
              Konfirmasi maksudnya agar bahan ini ikut dipertimbangkan di saran resep
            </p>
            <div className="space-y-3">
              {suggestInfo.ambigu.map((a, i) => (
                <div key={i} className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong className="text-blue-700">&quot;{a.bahan}&quot;</strong>
                    {a.catatan && <span className="text-gray-500"> — {a.catatan}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {a.maksud.map((m, j) => (
                      <button
                        key={j}
                        onClick={() => replaceBahan(a.bahan, m)}
                        disabled={loading || suggestLoading}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40"
                      >
                        Maksudnya &quot;{m}&quot;
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setSuggestInfo((p) =>
                          p ? { ...p, ambigu: p.ambigu.filter((x) => x.bahan !== a.bahan) } : p
                        )
                      }
                      disabled={loading || suggestLoading}
                      className="text-xs text-blue-500 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-40"
                    >
                      Biarkan &quot;{a.bahan}&quot;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Peringatan & bahan tidak terpakai ── */}
        {suggestInfo && !loading && !suggestLoading &&
          (suggestInfo.peringatan.length > 0 || suggestInfo.tidakTerpakai.length > 0) && (
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
            {suggestInfo.peringatan.map((p, i) => (
              <p key={i} className="text-sm text-amber-800">⚠️ {p}</p>
            ))}
            {suggestInfo.tidakTerpakai.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1.5">
                  🧺 Bahan yang tidak dipakai di saran:
                </p>
                <ul className="space-y-1">
                  {suggestInfo.tidakTerpakai.map((t, i) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="flex-shrink-0 mt-0.5">•</span>
                      <span><strong>{t.bahan}</strong> — {t.alasan}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* ── Suggestion Picker ── */}
        {suggestions && suggestions.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-gray-800 mb-1">🤔 Mau masak apa hari ini?</h2>
              <p className="text-sm text-gray-400">
                AI punya <strong>{suggestions.length} saran masakan</strong> dari bahan yang kamu miliki,
                diurutkan dari % kecocokan tertinggi. Pilih salah satu!
              </p>
            </div>

            <div className="space-y-3 mb-4">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => generateRecipe(s.nama)}
                  disabled={loading}
                  className="w-full text-left bg-orange-50 hover:bg-orange-100 border border-orange-100 hover:border-orange-300 rounded-xl p-4 transition-all group disabled:opacity-40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="bg-orange-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="font-bold text-orange-700 group-hover:text-orange-900">{s.nama}</p>
                        {typeof s.kecocokan === 'number' && (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              s.kecocokan >= 70
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : s.kecocokan >= 40
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                          >
                            🎯 {s.kecocokan}% cocok
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 ml-7">{s.deskripsi}</p>
                      {s.alasan && (
                        <p className="text-xs text-gray-400 mt-1 ml-7">💡 {s.alasan}</p>
                      )}
                      {s.bahan_terpakai && s.bahan_terpakai.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-7">
                          {s.bahan_terpakai.map((b, j) => (
                            <span key={j} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">
                              ✓ {b}
                            </span>
                          ))}
                        </div>
                      )}
                      {s.butuh_tambahan && s.butuh_tambahan.length > 0 && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 mt-2 ml-7">
                          ⚠️ Resep ini butuh tambahan: <strong>{s.butuh_tambahan.join(', ')}</strong> — tidak ada di bahanmu
                        </p>
                      )}
                    </div>
                    <span className="text-orange-300 group-hover:text-orange-500 text-xl flex-shrink-0 mt-1">→</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => generateRecipe()}
              disabled={loading}
              className="w-full border border-dashed border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-600 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              🎲 Buat Kejutan — biarkan AI yang pilih
            </button>
          </section>
        )}

        {/* ── Saran kosong ── */}
        {suggestions && suggestions.length === 0 && !loading && !suggestLoading && (
          <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 text-center text-gray-400">
            <div className="text-4xl mb-3">🤷</div>
            <p className="text-sm font-medium mb-1">AI belum berhasil membuat saran dari bahan ini</p>
            <p className="text-xs mb-4">Coba periksa penulisan bahan di atas, lalu generate ulang</p>
            <button
              onClick={() => getSuggestions()}
              className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              🔄 Coba Lagi
            </button>
          </section>
        )}

        {/* Loading recipe */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 flex flex-col items-center gap-3 text-gray-400">
            <svg className="animate-spin h-8 w-8 text-orange-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm">AI sedang meracik resep...</p>
          </div>
        )}

        {/* ── Step 2: Resep ── */}
        {recipe && !loading && (
          <section id="recipe-section" className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                Resep AI untukmu
              </h2>
              <button
                onClick={() => getSuggestions()}
                disabled={loading || suggestLoading}
                className="text-xs text-orange-500 hover:text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-40"
              >
                🔄 Generate Ulang
              </button>
            </div>

            <div className="border-b border-orange-100 pb-4 mb-5">
              <h3 className="text-2xl font-bold text-orange-600 mb-1">{recipe.nama_hidangan}</h3>
              <p className="text-gray-500 text-sm">{recipe.deskripsi}</p>
              <div className="flex gap-2 mt-3">
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-lg">⏱ {recipe.waktu_memasak}</span>
                <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-lg">👥 {recipe.porsi}</span>
              </div>
            </div>

            {recipeButuhTambahan.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                <p className="text-sm text-red-700">
                  ⚠️ <span className="font-semibold">Resep ini menyebut bahan di luar inputmu:</span>{' '}
                  {recipeButuhTambahan.join(', ')}. Kamu perlu menyediakannya sendiri, atau generate ulang untuk alternatif lain.
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-5">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">🥕 Bahan-bahan</h4>
                <ul className="space-y-1.5">
                  {recipe.bahan.map((b, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">👨‍🍳 Cara Memasak</h4>
                <ol className="space-y-2">
                  {recipe.langkah.map((l, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="bg-orange-100 text-orange-600 rounded-full w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                      {l}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {recipe.tips && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-800"><span className="font-semibold">💡 Tips Chef:</span> {recipe.tips}</p>
              </div>
            )}
          </section>
        )}

        {/* ── Step 3: Upload Foto + Simpan ── */}
        {recipe && !saved && !loading && (
          <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
            <h2 className="text-base font-semibold text-gray-700 mb-1 flex items-center gap-2">
              <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
              Upload Foto & Simpan Resep
            </h2>
            <p className="text-xs text-gray-400 mb-4 ml-8">Upload foto hasil masakanmu (opsional)</p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-orange-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors mb-4"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="max-h-52 mx-auto rounded-lg object-cover" />
              ) : (
                <div className="text-gray-400">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-sm font-medium">Klik untuk upload foto masakan</p>
                  <p className="text-xs mt-1 text-gray-300">JPG, PNG, WebP • Maks 5MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" />
            {photoFile && <p className="text-xs text-green-600 mb-3">✓ {photoFile.name} siap diupload</p>}

            <button
              onClick={saveRecipe}
              disabled={saving}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {uploading ? 'Mengupload foto ke MinIO...' : 'Menyimpan ke MongoDB...'}
                </>
              ) : '💾 Simpan Resep'}
            </button>
          </section>
        )}

        {/* ── Success ── */}
        {saved && (
          <section className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-lg font-semibold text-green-800 mb-1">Resep Berhasil Disimpan!</h3>
            <p className="text-sm text-green-600 mb-5">Resepmu sudah tersimpan di koleksi</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/recipes" className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                Lihat Koleksi Resep
              </Link>
              <button onClick={resetAll} className="bg-white text-gray-700 border border-gray-200 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Buat Resep Baru
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
