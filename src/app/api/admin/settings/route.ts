import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isAdmin, hashPassword, checkPassword, fallbackPassword, ADMIN_COOKIE, createToken, SESSION_COOKIE_OPTIONS } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'অনুমতি নেই।' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const updates: { key: string; value: string }[] = []
    let passwordChanged = false

    if (typeof body?.shopName === 'string' && body.shopName.trim()) {
      updates.push({ key: 'shopName', value: body.shopName.trim() })
    }

    if (typeof body?.announcement === 'string') {
      updates.push({ key: 'announcement', value: body.announcement.trim() })
    }

    if (typeof body?.adminPassword === 'string' && body.adminPassword.trim()) {
      const newPassword = body.adminPassword.trim()
      if (newPassword.length < 4) {
        return NextResponse.json(
          { error: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' },
          { status: 400 }
        )
      }
      const current = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
      const stored = await db.setting.findUnique({ where: { key: 'adminPassword' } })
      const okCurrent = stored ? checkPassword(current, stored.value) : checkPassword(current, fallbackPassword())
      if (!okCurrent) {
        return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ড ভুল।' }, { status: 401 })
      }
      updates.push({ key: 'adminPassword', value: hashPassword(newPassword) })
      passwordChanged = true
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'কোনো পরিবর্তন নেই।' }, { status: 400 })
    }

    for (const u of updates) {
      await db.setting.upsert({
        where: { key: u.key },
        create: { key: u.key, value: u.value },
        update: { value: u.value },
      })
    }

    const res = NextResponse.json({ ok: true })
    if (passwordChanged) res.cookies.set(ADMIN_COOKIE, createToken(), SESSION_COOKIE_OPTIONS)
    return res
  } catch (error) {
    console.error('POST /api/admin/settings error:', error)
    return NextResponse.json({ error: 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}
