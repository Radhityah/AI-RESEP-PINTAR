import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDb()
    const recipe = await db
      .collection('recipes')
      .findOne({ _id: new ObjectId(id) })

    if (!recipe) {
      return NextResponse.json({ error: 'Resep tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ recipe })
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal mengambil resep' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDb()
    await db.collection('recipes').deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal menghapus resep' }, { status: 500 })
  }
}
