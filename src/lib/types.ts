export interface RecipeData {
  nama_hidangan: string
  deskripsi: string
  waktu_memasak: string
  porsi: string
  bahan: string[]
  langkah: string[]
  tips: string
}

export interface SavedRecipe extends RecipeData {
  _id: string
  bahan_input: string[]
  foto_url: string | null
  created_at: string
}
