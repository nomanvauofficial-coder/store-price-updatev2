const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']

const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
]

const BN_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার']

/** Convert latin digits in any number/string to Bangla digits */
export function toBn(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)])
}

/** Format a price in Bangla digits with taka symbol */
export function formatPriceBn(price: number): string {
  const rounded = Math.round(price * 100) / 100
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
  return `৳ ${toBn(text)}`
}

/** YYYY-MM-DD string for today in Asia/Dhaka */
export function getTodayDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date())
}

/** YYYY-MM-DD string for yesterday in Asia/Dhaka */
export function getYesterdayDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(
    new Date(Date.now() - 86400000)
  )
}

/** "শুক্রবার, ১৫ নভেম্বর ২০২৬" from YYYY-MM-DD */
export function formatBanglaDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return dateStr
  const dt = new Date(Date.UTC(y, m - 1, d, 6, 0, 0)) // midday Dhaka reference
  return `${BN_DAYS[dt.getUTCDay()]}, ${toBn(d)} ${BN_MONTHS[m - 1]} ${toBn(y)}`
}

function dhakaTimeParts(date: Date): { hour: number; minute: number } {
  const shifted = new Date(date.getTime() + 6 * 3600 * 1000) // UTC+6
  return { hour: shifted.getUTCHours(), minute: shifted.getUTCMinutes() }
}

function periodName(hour: number): string {
  if (hour >= 4 && hour < 6) return 'ভোর'
  if (hour >= 6 && hour < 12) return 'সকাল'
  if (hour >= 12 && hour < 16) return 'দুপুর'
  if (hour >= 16 && hour < 18) return 'বিকাল'
  if (hour >= 18 && hour < 20) return 'সন্ধ্যা'
  return 'রাত'
}

/** "দুপুর ১:০৫" from an ISO datetime (12-hour Bangla style) */
export function formatBanglaTime(iso: string): string {
  const { hour, minute } = dhakaTimeParts(new Date(iso))
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const mm = String(minute).padStart(2, '0')
  return `${periodName(hour)} ${toBn(hour12)}:${toBn(mm)}`
}

/** Bangla period of current Dhaka time (e.g. "সকাল") */
export function currentDhakaPeriod(): string {
  const { hour } = dhakaTimeParts(new Date())
  return periodName(hour)
}
