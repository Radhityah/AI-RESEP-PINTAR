'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { SavedRecipe } from '@/lib/types'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/recipes')
      .then((r) => r.json())
      .then((d) => setRecipes(d.recipes || []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = recipes.filter(
    (r) =>
      r.nama_hidangan.toLowerCase().includes(search.toLowerCase()) ||
      r.bahan_input?.some((b) => b.toLowerCase().includes(search.toLowerCase()))
  )

  const deleteRecipe = async (id: string, nama: string) => {
    if (!confirm(`Hapus resep "${nama}"?`)) return
    setDeleting(id)
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    setRecipes((prev) => prev.filter((r) => r._id !== id))
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍳</span>
            <div>
              <h1 className="text-xl font-bold text-orange-600">ResepPintar</h1>
              <p className="text-xs text-gray-400">Koleksi Resep Masakan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/chat"
              className="text-sm text-purple-600 font-medium border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              🤖 AI Chat
            </Link>
            <Link
              href="/"
              className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              + Buat Resep Baru
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            📚 Koleksi Resep {!loading && `(${recipes.length})`}
          </h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Cari nama atau bahan..."
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 w-full sm:w-64"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <svg className="animate-spin h-8 w-8 text-orange-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Memuat resep...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-16 text-center">
            {search ? (
              <>
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Resep tidak ditemukan</h3>
                <p className="text-gray-400 text-sm">
                  Tidak ada resep dengan kata kunci &quot;{search}&quot;
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Resep</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Buat resep pertamamu dengan memasukkan bahan-bahan yang kamu punya!
                </p>
                <Link
                  href="/"
                  className="bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Buat Resep Sekarang
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((recipe) => (
              <div
                key={recipe._id}
                className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <Link href={`/recipes/${recipe._id}`} className="block">
                  {recipe.foto_url ? (
                    <img
                      src={recipe.foto_url}
                      alt={recipe.nama_hidangan}
                      className="w-full h-44 object-cover hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center hover:opacity-90 transition-opacity">
                      <span className="text-5xl">🍳</span>
                    </div>
                  )}
                </Link>

                <div className="p-4 flex flex-col flex-1">
                  <Link href={`/recipes/${recipe._id}`} className="block mb-1 hover:text-orange-600 transition-colors">
                    <h3 className="font-bold text-gray-800 truncate">{recipe.nama_hidangan}</h3>
                  </Link>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">{recipe.deskripsi}</p>

                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg">
                      ⏱ {recipe.waktu_memasak}
                    </span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-lg">
                      👥 {recipe.porsi}
                    </span>
                  </div>

                  <div className="border-t border-gray-50 pt-3 mb-3">
                    <div className="flex flex-wrap gap-1">
                      {recipe.bahan_input?.slice(0, 4).map((b, i) => (
                        <span key={i} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                          {b}
                        </span>
                      ))}
                      {(recipe.bahan_input?.length ?? 0) > 4 && (
                        <span className="text-xs text-gray-300">+{recipe.bahan_input.length - 4}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-xs text-gray-300">
                      {new Date(recipe.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <button
                      onClick={() => deleteRecipe(recipe._id, recipe.nama_hidangan)}
                      disabled={deleting === recipe._id}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      {deleting === recipe._id ? '...' : '🗑 Hapus'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
