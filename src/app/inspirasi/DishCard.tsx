'use client'

import { useEffect, useRef, useState } from 'react'
import { KATEGORI_EMOJI } from '@/lib/dishes'
import type { Dish } from '@/lib/dishes'

const KATEGORI_GRADIENT: Record<string, string> = {
  'Nasi':                  'from-amber-100 to-yellow-50',
  'Mie & Bihun':           'from-yellow-100 to-orange-50',
  'Soto & Sup':            'from-orange-100 to-red-50',
  'Ayam & Bebek':          'from-yellow-100 to-amber-50',
  'Daging':                'from-red-100 to-rose-50',
  'Ikan & Seafood':        'from-blue-100 to-cyan-50',
  'Sayur':                 'from-green-100 to-emerald-50',
  'Tahu Tempe Telur':      'from-amber-100 to-yellow-50',
  'Sambal':                'from-red-100 to-orange-50',
  'Sate':                  'from-orange-100 to-amber-50',
  'Khas Daerah':           'from-purple-100 to-indigo-50',
  'Camilan & Gorengan':    'from-yellow-100 to-amber-50',
  'Kue Tradisional':       'from-pink-100 to-rose-50',
  'Kue & Roti Modern':     'from-pink-100 to-purple-50',
  'Dessert':               'from-pink-100 to-rose-50',
  'Bubur & Sarapan':       'from-amber-100 to-orange-50',
  'Minuman Tradisional':   'from-teal-100 to-green-50',
  'Kopi':                  'from-amber-200 to-stone-100',
  'Teh & Minuman Segar':   'from-green-100 to-teal-50',
  'Internasional':         'from-blue-100 to-indigo-50',
  'Rumahan Sederhana':     'from-orange-100 to-amber-50',
}

// Wikipedia REST API — menangani redirect otomatis, lebih andal dari query API
async function wikiRest(name: string, lang: 'id' | 'en'): Promise<string | null> {
  try {
    const title = encodeURIComponent(name.replace(/ /g, '_'))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${title}`,
      { signal: controller.signal }
    )
    clearTimeout(timer)
    if (!res.ok) return null
    const data = await res.json()
    return data?.thumbnail?.source ?? data?.originalimage?.source ?? null
  } catch {
    return null
  }
}

async function fetchWikiImage(nama: string): Promise<string | null> {
  // Tahap 1: coba nama lengkap di Wikipedia Indonesia & Inggris secara paralel
  const [imgId, imgEn] = await Promise.all([
    wikiRest(nama, 'id'),
    wikiRest(nama, 'en'),
  ])
  if (imgId) return imgId
  if (imgEn) return imgEn

  // Tahap 2: coba 2 kata pertama (misal "Nasi Goreng" dari "Nasi Goreng Kampung")
  const words = nama.split(' ')
  if (words.length > 2) {
    const short2 = words.slice(0, 2).join(' ')
    const [imgId2, imgEn2] = await Promise.all([
      wikiRest(short2, 'id'),
      wikiRest(short2, 'en'),
    ])
    if (imgId2) return imgId2
    if (imgEn2) return imgEn2
  }

  // Tahap 3: coba 1 kata pertama (misal "Soto", "Rendang", "Bakso")
  if (words.length > 1) {
    const [imgId3, imgEn3] = await Promise.all([
      wikiRest(words[0], 'id'),
      wikiRest(words[0], 'en'),
    ])
    if (imgId3) return imgId3
    if (imgEn3) return imgEn3
  }

  return null
}

interface Props {
  dish: Dish
  onClick: () => void
}

export default function DishCard({ dish, onClick }: Props) {
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [fetchDone, setFetchDone] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetchDone) {
          setFetchDone(true)
          fetchWikiImage(dish.nama).then((src) => setImgSrc(src))
          observer.disconnect()
        }
      },
      { rootMargin: '400px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [dish.nama, fetchDone])

  const emoji = KATEGORI_EMOJI[dish.kategori] ?? '🍽️'
  const gradient = KATEGORI_GRADIENT[dish.kategori] ?? 'from-orange-100 to-amber-50'

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="group relative text-left bg-white hover:shadow-lg border border-orange-100 hover:border-orange-300 rounded-xl overflow-hidden transition-all duration-200 flex flex-col"
      title={`Generate resep ${dish.nama}`}
    >
      {/* Area gambar */}
      <div className={`relative h-28 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden flex-shrink-0`}>

        {/* Emoji — ditampilkan saat loading atau tidak ada gambar */}
        <span
          className={`absolute text-4xl transition-opacity duration-300 select-none ${
            imgSrc && imgLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          aria-hidden="true"
        >
          {emoji}
        </span>

        {/* Gambar dari Wikipedia */}
        {imgSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={dish.nama}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgSrc(null); setImgLoaded(false) }}
          />
        )}

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center z-10">
          <span className="opacity-0 group-hover:opacity-100 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 shadow-lg scale-90 group-hover:scale-100">
            ✨ Buat Resep
          </span>
        </div>
      </div>

      {/* Teks */}
      <div className="px-3 py-2 flex-1 flex flex-col justify-center">
        <p className="text-sm font-semibold text-gray-700 group-hover:text-orange-700 leading-snug line-clamp-2 transition-colors">
          {dish.nama}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">{dish.kategori}</p>
      </div>
    </button>
  )
}
