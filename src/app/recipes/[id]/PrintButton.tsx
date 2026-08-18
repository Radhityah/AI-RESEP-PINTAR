'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
    >
      🖨️ Print Resep
    </button>
  )
}
