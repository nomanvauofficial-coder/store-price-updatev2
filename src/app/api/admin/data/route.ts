import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin } from '@/lib/auth'
import { getTodayDate, getYesterdayDate } from '@/lib/bangla'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'অনুমতি নেই।' }, { status: 401 })
  }

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

    const shaped = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      products: cat.products.map((p) => {
        const todayEntry = p.prices.find((e) => e.date === today)
        const yesterdayEntry = p.prices.find((e) => e.date === yesterday)
        return {
          id: p.id,
          name: p.name,
          unit: p.unit,
          image: p.image ? `/api/products/${p.id}/image?v=${p.image.updatedAt.getTime()}` : null,
          sortOrder: p.sortOrder,
          isActive: p.isActive,
          categoryId: p.categoryId,
          todayPrice: todayEntry ? todayEntry.price : null,
          yesterdayPrice: yesterdayEntry ? yesterdayEntry.price : null,
        }
      }),
    }))

    return NextResponse.json({
      today,
      yesterday,
      shopName: shopNameSetting?.value ?? 'মুদি ঘর',
      announcement: announcementSetting?.value ?? '',
      categories: shaped,
    })
  } catch (error) {
    console.error('GET /api/admin/data error:', error)
    return NextResponse.json({ error: 'ডেটা লোড করতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}
