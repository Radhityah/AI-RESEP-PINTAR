import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/minio'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File foto tidak ditemukan' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file harus JPG, PNG, atau WebP' },
        { status: 400 }
      )
    }

    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `masakan-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    const url = await uploadFile(buffer, filename, file.type)
    return NextResponse.json({ url })
  } catch (error: any) {
    console.error('Upload photo error:', error)
    return NextResponse.json({ error: 'Gagal mengupload foto ke MinIO' }, { status: 500 })
  }
}
