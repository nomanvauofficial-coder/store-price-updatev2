import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'অনুমতি নেই।' }, { status: 401 })
  }

  try {
    const { id } = await ctx.params
    const categoryId = Number(id)
    if (!Number.isInteger(categoryId)) {
      return NextResponse.json({ error: 'ক্যাটাগরি পাওয়া যায়নি।' }, { status: 400 })
    }

    const body = await req.json()
    const data: { name?: string; sortOrder?: number } = {}
    if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (Number.isFinite(Number(body?.sortOrder))) data.sortOrder = Number(body.sortOrder)

    const category = await db.category.update({ where: { id: categoryId }, data })
    return NextResponse.json({ ok: true, category })
  } catch (error) {
    console.error('PATCH /api/admin/categories/[id] error:', error)
    return NextResponse.json({ error: 'ক্যাটাগরি আপডেট করতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'অনুমতি নেই।' }, { status: 401 })
  }

  try {
    const { id } = await ctx.params
    const categoryId = Number(id)
    if (!Number.isInteger(categoryId)) {
      return NextResponse.json({ error: 'ক্যাটাগরি পাওয়া যায়নি।' }, { status: 400 })
    }

    const count = await db.product.count({ where: { categoryId } })
    if (count > 0) {
      return NextResponse.json(
        { error: 'এই ক্যাটাগরিতে পণ্য আছে। আগে পণ্যগুলো মুছুন বা সরান।' },
        { status: 400 }
      )
    }

    await db.category.delete({ where: { id: categoryId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/admin/categories/[id] error:', error)
    return NextResponse.json({ error: 'ক্যাটাগরি মুছতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}
