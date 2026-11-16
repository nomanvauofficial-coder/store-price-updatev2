import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const productId = Number(id)
  if (!Number.isInteger(productId)) return new NextResponse(null, { status: 404 })

  const img = await db.productImage.findUnique({ where: { productId } })
  if (!img) return new NextResponse(null, { status: 404 })

  const m = /^data:(image\/[a-z]+);base64,([\s\S]*)$/.exec(img.data)
  if (!m) return new NextResponse(null, { status: 404 })

  return new NextResponse(Buffer.from(m[2], 'base64'), {
    headers: {
      'Content-Type': m[1],
      // URL carries ?v=<updatedAt>, so it is safe to cache for a long time
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
