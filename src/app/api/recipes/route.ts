import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
  try {
    const db = await getDb()
    const recipes = await db
      .collection('recipes')
      .find({})
      .sort({ created_at: -1 })
      .limit(50)
      .toArray()
    return NextResponse.json({ recipes })
  } catch (error: any) {
    console.error('Get recipes error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data resep' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { recipe, bahan_input, foto_url } = await req.json()

    if (!recipe || !bahan_input) {
      return NextResponse.json({ error: 'Data recipe tidak lengkap' }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.collection('recipes').insertOne({
      ...recipe,
      bahan_input,
      foto_url: foto_url || null,
      created_at: new Date(),
    })

    return NextResponse.json({ success: true, id: result.insertedId.toString() })
  } catch (error: any) {
    console.error('Save recipe error:', error)
    return NextResponse.json({ error: 'Gagal menyimpan resep ke MongoDB' }, { status: 500 })
  }
}
