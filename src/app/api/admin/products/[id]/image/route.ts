import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const MAX_LEN = 300_000 // ~220KB; client resizes to a small JPEG first

export async function POST(req: NextRequest, ctx: Ctx) {
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
    const data = body?.dataUrl
    if (typeof data !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(data)) {
      return NextResponse.json({ error: 'ছবির ফরম্যাট ঠিক নয়।' }, { status: 400 })
    }
    if (data.length > MAX_LEN) {
      return NextResponse.json({ error: 'ছবি অনেক বড়।' }, { status: 413 })
    }
    const exists = await db.product.findUnique({ where: { id: productId } })
    if (!exists) return NextResponse.json({ error: 'পণ্য পাওয়া যায়নি।' }, { status: 404 })

    await db.productImage.upsert({
      where: { productId },
      create: { productId, data },
      update: { data },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('POST /api/admin/products/[id]/image error:', error)
    return NextResponse.json({ error: 'ছবি সংরক্ষণ করতে সমস্যা হয়েছে।' }, { status: 500 })
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
    await db.productImage.deleteMany({ where: { productId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/admin/products/[id]/image error:', error)
    return NextResponse.json({ error: 'ছবি মুছতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}
