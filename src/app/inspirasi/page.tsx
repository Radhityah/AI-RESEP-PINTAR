'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ALL_DISHES, CATEGORIES, KATEGORI_EMOJI, TOTAL_DISHES, type Dish } from '@/lib/dishes'
import DishCard from './DishCard'

const PAGE_SIZE = 60

export default function InspirasiPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState<string>('Semua')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [randomPick, setRandomPick] = useState<Dish | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ALL_DISHES.filter((d) => {
      if (kategori !== 'Semua' && d.kategori !== kategori) return false
      if (q && !d.nama.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, kategori])

  const visible = filtered.slice(0, limit)

  const goGenerate = (nama: string) => {
    router.push(`/?resep=${encodeURIComponent(nama)}`)
  }

  const pickRandom = () => {
    const pool = filtered.length > 0 ? filtered : ALL_DISHES
    setRandomPick(pool[Math.floor(Math.random() * pool.length)])
  }

  const changeKategori = (k: string) => {
    setKategori(k)
    setLimit(PAGE_SIZE)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">💡</span>
            <div>
              <h1 className="text-xl font-bold text-orange-600">Inspirasi Hidangan</h1>
              <p className="text-xs text-gray-400">{TOTAL_DISHES.toLocaleString('id-ID')} pilihan — klik untuk generate resep AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm text-orange-600 font-medium border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors">
              ← Beranda
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Search + Random */}
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setLimit(PAGE_SIZE) }}
                placeholder={`Cari di ${TOTAL_DISHES.toLocaleString('id-ID')} hidangan... (contoh: ayam, kopi, kue)`}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
              />
            </div>
            <button
              onClick={pickRandom}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all whitespace-nowrap"
            >
              🎲 Acak
            </button>
          </div>

          {/* Random pick result */}
          {randomPick && (
            <div className="mt-4 bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-purple-400 mb-0.5">🎲 Hasil acak untukmu:</p>
                <p className="font-bold text-purple-700 truncate">
                  {KATEGORI_EMOJI[randomPick.kategori]} {randomPick.nama}
                </p>
                <p className="text-xs text-gray-400">{randomPick.kategori}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={pickRandom}
                  className="text-xs text-purple-500 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  🔄 Lagi
                </button>
                <button
                  onClick={() => goGenerate(randomPick.nama)}
                  className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  ✨ Buat Resep
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Category filter */}
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => changeKategori('Semua')}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                kategori === 'Semua'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              ⭐ Semua ({TOTAL_DISHES.toLocaleString('id-ID')})
            </button>
            {CATEGORIES.map((k) => (
              <button
                key={k}
                onClick={() => changeKategori(k)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  kategori === k
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {KATEGORI_EMOJI[k]} {k}
              </button>
            ))}
          </div>
        </section>

        {/* Result count */}
        <p className="text-xs text-gray-400 px-1">
          Menampilkan <strong className="text-gray-600">{visible.length.toLocaleString('id-ID')}</strong> dari{' '}
          <strong className="text-gray-600">{filtered.length.toLocaleString('id-ID')}</strong> hidangan
          {kategori !== 'Semua' && <> di kategori <strong className="text-orange-500">{kategori}</strong></>}
          {search.trim() && <> untuk pencarian &quot;<strong className="text-orange-500">{search.trim()}</strong>&quot;</>}
        </p>

        {/* Dish grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-sm font-medium mb-1">Tidak ditemukan di daftar inspirasi</p>
            <p className="text-xs mb-4">Tapi tenang — AI tetap bisa membuatkan resepnya!</p>
            <button
              onClick={() => goGenerate(search.trim())}
              className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              ✨ Generate Resep &quot;{search.trim()}&quot; dengan AI
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {visible.map((d) => (
                <DishCard
                  key={d.nama}
                  dish={d}
                  onClick={() => goGenerate(d.nama)}
                />
              ))}
            </div>

            {visible.length < filtered.length && (
              <button
                onClick={() => setLimit((p) => p + PAGE_SIZE)}
                className="w-full bg-white border border-dashed border-orange-200 text-orange-500 hover:bg-orange-50 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                ⬇️ Tampilkan {Math.min(PAGE_SIZE, filtered.length - visible.length)} lagi
                ({(filtered.length - visible.length).toLocaleString('id-ID')} tersisa)
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
