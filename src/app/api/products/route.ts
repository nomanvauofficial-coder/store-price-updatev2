import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getTodayDate, getYesterdayDate } from '@/lib/bangla'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const today = getTodayDate()
    const yesterday = getYesterdayDate()

    const [shopNameSetting, announcementSetting, categories] = await Promise.all([
      db.setting.findUnique({ where: { key: 'shopName' } }),
      db.setting.findUnique({ where: { key: 'announcement' } }),
      db.category.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        include: {
          products: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            include: {
              image: { select: { updatedAt: true } },
              prices: {
                where: { date: { in: [today, yesterday] } },
                orderBy: { date: 'desc' },
              },
            },
          },
        },
      }),
    ])

    let updatedAt: string | null = null

    const shaped = categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        products: cat.products
          .map((p) => {
            const todayEntry = p.prices.find((e) => e.date === today)
            const yesterdayEntry = p.prices.find((e) => e.date === yesterday)

            // Hide products that have no recent price at all
            if (!todayEntry && !yesterdayEntry) return null

            if (todayEntry?.updatedAt) {
              if (!updatedAt || todayEntry.updatedAt > updatedAt) updatedAt = todayEntry.updatedAt.toISOString()
            }

            let change: 'up' | 'down' | 'same' | null = null
            if (todayEntry && yesterdayEntry) {
              if (todayEntry.price > yesterdayEntry.price) change = 'up'
              else if (todayEntry.price < yesterdayEntry.price) change = 'down'
              else change = 'same'
            }

            return {
              id: p.id,
              name: p.name,
              unit: p.unit,
              image: p.image ? `/api/products/${p.id}/image?v=${p.image.updatedAt.getTime()}` : null,
              todayPrice: todayEntry ? todayEntry.price : null,
              yesterdayPrice: yesterdayEntry ? yesterdayEntry.price : null,
              change,
              updatedAt: todayEntry ? todayEntry.updatedAt.toISOString() : null,
            }
          })
          .filter((p): p is NonNullable<typeof p> => p !== null),
      }))
      .filter((cat) => cat.products.length > 0)

    return NextResponse.json({
      today,
      shopName: shopNameSetting?.value ?? 'মুদি ঘর',
      announcement: announcementSetting?.value ?? '',
      updatedAt,
      categories: shaped,
    }, {
      // CDN keeps the answer for 20s, so most visitors get it instantly
      headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=120' },
    })
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json(
      { error: 'দামের তথ্য লোড করতে সমস্যা হয়েছে।' },
      { status: 500 }
    )
  }
}
