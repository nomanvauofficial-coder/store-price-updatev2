import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ADMIN_COOKIE, createToken, SESSION_COOKIE_OPTIONS, checkPassword, fallbackPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const password = body?.password

    if (typeof password !== 'string' || !password) {
      return NextResponse.json({ error: 'পাসওয়ার্ড দিন।' }, { status: 400 })
    }

    const setting = await db.setting.findUnique({ where: { key: 'adminPassword' } })
    const ok = setting ? checkPassword(password, setting.value) : checkPassword(password, fallbackPassword())

    if (!ok) {
      return NextResponse.json({ error: 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set(ADMIN_COOKIE, createToken(), SESSION_COOKIE_OPTIONS)
    return res
  } catch (error) {
    console.error('POST /api/admin/login error:', error)
    return NextResponse.json({ error: 'লগইন করতে সমস্যা হয়েছে।' }, { status: 500 })
  }
}
