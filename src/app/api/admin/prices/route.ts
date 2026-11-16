import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/auth'
import { getTodayDate } from '@/lib/bangla'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'অনুমতি নেই।' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const entries = Array.isArray(body?.entries) ? body.entries : []

    if (entries.length === 0) {
      return NextResponse.json({ error: 'কোনো পরিবর্তন নেই।' }, { status: 400 })
    }

    const today = getTodayDate()
    let saved = 0

    for (const entry of entries) {
      const productId = Number(entry?.productId)
      if (!Number.isInteger(productId)) continue

      const product = await db.product.findUnique({ where: { id: productId } })
      if (!product) continue

      const hasPrice = entry?.price !== null && entry?.price !== undefined && entry?.price !== ''
      const price = hasPrice ? Number(entry.price) : null

      if (price === null) {
        // Remove today's price (product will disappear from today's board)
        await db.priceEntry.deleteMany({ where: { productId, date: today } })
      } else {
        if (!Number.isFinite(price) || price < 0) continue
        await db.priceEntry.upsert({
          where: { productId_date: { productId, date: today } },
          create: { productId, date: today, price },
          update: { price },
        })
      }
      saved++
    }

    return NextResponse.json({ ok: true, saved })
  } catch (error) {
    console.error('POST /api/admin/prices error:', error)
    return NextResponse.json({ error: 'দাম সংরক্ষণ করতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}
