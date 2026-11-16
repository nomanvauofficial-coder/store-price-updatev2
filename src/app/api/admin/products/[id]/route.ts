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
    const productId = Number(id)
    if (!Number.isInteger(productId)) {
      return NextResponse.json({ error: 'পণ্য পাওয়া যায়নি।' }, { status: 400 })
    }

    const body = await req.json()
    const data: {
      name?: string
      unit?: string
      categoryId?: number
      sortOrder?: number
      isActive?: boolean
    } = {}

    if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body?.unit === 'string' && body.unit.trim()) data.unit = body.unit.trim()
    if (Number.isInteger(Number(body?.categoryId))) data.categoryId = Number(body.categoryId)
    if (Number.isFinite(Number(body?.sortOrder))) data.sortOrder = Number(body.sortOrder)
    if (body?.isActive !== undefined) data.isActive = Boolean(body.isActive)

    const product = await db.product.update({ where: { id: productId }, data })
    return NextResponse.json({ ok: true, product })
  } catch (error) {
    console.error('PATCH /api/admin/products/[id] error:', error)
    return NextResponse.json({ error: 'পণ্য আপডেট করতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'অনুমতি নেই।' }, { status: 401 })
  }

  try {
    const { id } = await ctx.params
    const productId = Number(id)
    if (!Number.isInteger(productId)) {
      return NextResponse.json({ error: 'পণ্য পাওয়া যায়নি।' }, { status: 400 })
    }

    await db.product.delete({ where: { id: productId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/admin/products/[id] error:', error)
    return NextResponse.json({ error: 'পণ্য মুছতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}
