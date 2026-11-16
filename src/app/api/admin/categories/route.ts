import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'অনুমতি নেই।' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0

    if (!name) return NextResponse.json({ error: 'ক্যাটাগরির নাম দিন।' }, { status: 400 })

    const existing = await db.category.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: 'এই নামে ক্যাটাগরি আগেই আছে।' }, { status: 400 })
    }

    const category = await db.category.create({ data: { name, sortOrder } })
    return NextResponse.json({ ok: true, category })
  } catch (error) {
    console.error('POST /api/admin/categories error:', error)
    return NextResponse.json({ error: 'ক্যাটাগরি যোগ করতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}
