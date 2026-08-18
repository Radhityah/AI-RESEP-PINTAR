import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { SavedRecipe } from '@/lib/types'
import PrintButton from './PrintButton'

export const dynamic = 'force-dynamic'

// Detail resep diambil dari RESTful API backend (Express JS + Swagger)
const API_BASE = process.env.API_PROXY_URL || 'http://localhost:4000'

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let recipe: SavedRecipe | null = null
  try {
    const res = await fetch(`${API_BASE}/api/recipes/${id}`, { cache: 'no-store' })
    if (!res.ok) notFound()
    const data = await res.json()
    if (data.recipe) recipe = { ...data.recipe, _id: String(data.recipe._id) } as SavedRecipe
  } catch {
    notFound()
  }

  if (!recipe) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <header className="bg-white shadow-sm print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🍳</span>
            <h1 className="text-xl font-bold text-orange-600">ResepPintar</h1>
          </div>
          <Link
            href="/recipes"
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Kembali
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
          {recipe.foto_url && (
            <img
              src={recipe.foto_url}
              alt={recipe.nama_hidangan}
              className="w-full h-64 object-cover"
            />
          )}

          <div className="p-6 md:p-8">
            <div className="border-b border-orange-100 pb-5 mb-6">
              <h2 className="text-3xl font-bold text-orange-600 mb-2">{recipe.nama_hidangan}</h2>
              <p className="text-gray-500">{recipe.deskripsi}</p>
              <div className="flex gap-3 mt-4">
                <span className="text-sm bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-lg">
                  ⏱ {recipe.waktu_memasak}
                </span>
                <span className="text-sm bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-lg">
                  👥 {recipe.porsi}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div>
                <h3 className="font-bold text-gray-700 mb-4 text-base">🥕 Bahan-bahan</h3>
                <ul className="space-y-2">
                  {recipe.bahan.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <span className="text-orange-400 mt-1 flex-shrink-0">•</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-4 text-base">👨‍🍳 Cara Memasak</h3>
                <ol className="space-y-3">
                  {recipe.langkah.map((l, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-600">
                      <span className="bg-orange-100 text-orange-600 rounded-full w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {l}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {recipe.tips && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                <p className="text-amber-800">
                  <span className="font-semibold">💡 Tips Chef:</span> {recipe.tips}
                </p>
              </div>
            )}

            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-400 mb-3">Dibuat dari bahan:</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {recipe.bahan_input?.map((b, i) => (
                  <span key={i} className="text-sm bg-orange-100 text-orange-600 px-3 py-1 rounded-full">
                    {b}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 print:hidden">
                <PrintButton />
                <Link
                  href="/"
                  className="flex-1 text-center bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  ✨ Buat Resep Baru
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
