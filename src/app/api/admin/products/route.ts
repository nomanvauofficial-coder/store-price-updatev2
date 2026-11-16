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
    const unit = typeof body?.unit === 'string' && body.unit.trim() ? body.unit.trim() : 'কেজি'
    const categoryId = Number(body?.categoryId)
    const sortOrder = Number.isFinite(Number(body?.sortOrder)) ? Number(body.sortOrder) : 0
    const isActive = body?.isActive === undefined ? true : Boolean(body.isActive)

    if (!name) return NextResponse.json({ error: 'পণ্যের নাম দিন।' }, { status: 400 })
    if (!Number.isInteger(categoryId)) {
      return NextResponse.json({ error: 'ক্যাটাগরি নির্বাচন করুন।' }, { status: 400 })
    }

    const category = await db.category.findUnique({ where: { id: categoryId } })
    if (!category) return NextResponse.json({ error: 'ক্যাটাগরি পাওয়া যায়নি।' }, { status: 400 })

    const product = await db.product.create({
      data: { name, unit, categoryId, sortOrder, isActive },
    })

    return NextResponse.json({ ok: true, product })
  } catch (error) {
    console.error('POST /api/admin/products error:', error)
    return NextResponse.json({ error: 'পণ্য যোগ করতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}
