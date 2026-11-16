import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function dhakaDate(offsetDays = 0): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
  }).format(new Date(Date.now() + offsetDays * 86400000))
}

const TODAY = dhakaDate(0)
const YESTERDAY = dhakaDate(-1)

const categories: { name: string; products: { name: string; unit: string; today: number; yesterday: number }[] }[] = [
  {
    name: 'চাল ও আটা',
    products: [
      { name: 'সরু চাল', unit: 'কেজি', yesterday: 78, today: 80 },
      { name: 'মিনিকেট চাল', unit: 'কেজি', yesterday: 88, today: 85 },
      { name: 'পাইজ চাল', unit: 'কেজি', yesterday: 70, today: 70 },
      { name: 'আটা', unit: 'কেজি', yesterday: 45, today: 48 },
      { name: 'ময়দা', unit: 'কেজি', yesterday: 55, today: 55 },
    ],
  },
  {
    name: 'ডাল',
    products: [
      { name: 'মসুর ডাল', unit: 'কেজি', yesterday: 130, today: 135 },
      { name: 'মুগ ডাল', unit: 'কেজি', yesterday: 145, today: 140 },
      { name: 'ছোলা', unit: 'কেজি', yesterday: 85, today: 88 },
      { name: 'বুট ডাল', unit: 'কেজি', yesterday: 92, today: 90 },
    ],
  },
  {
    name: 'তেল ও ঘি',
    products: [
      { name: 'সয়াবিন তেল', unit: 'লিটার', yesterday: 180, today: 175 },
      { name: 'সরিষা তেল', unit: 'লিটার', yesterday: 255, today: 250 },
      { name: 'ভেজিটেবল ঘি', unit: 'কেজি', yesterday: 320, today: 320 },
    ],
  },
  {
    name: 'মসলা',
    products: [
      { name: 'দেশি পেঁয়াজ', unit: 'কেজি', yesterday: 60, today: 55 },
      { name: 'রসুন (চাইনা)', unit: 'কেজি', yesterday: 175, today: 180 },
      { name: 'আদা', unit: 'কেজি', yesterday: 120, today: 125 },
      { name: 'হলুদ গুঁড়ো', unit: 'কেজি', yesterday: 240, today: 240 },
      { name: 'মরিচ গুঁড়ো', unit: 'কেজি', yesterday: 285, today: 280 },
      { name: 'জিরা', unit: 'কেজি', yesterday: 420, today: 430 },
    ],
  },
  {
    name: 'সবজি',
    products: [
      { name: 'আলু', unit: 'কেজি', yesterday: 32, today: 30 },
      { name: 'বেগুন', unit: 'কেজি', yesterday: 40, today: 45 },
      { name: 'টমেটো', unit: 'কেজি', yesterday: 70, today: 60 },
      { name: 'পটল', unit: 'কেজি', yesterday: 45, today: 42 },
      { name: 'ঝিঙা', unit: 'কেজি', yesterday: 80, today: 85 },
      { name: 'ফুলকপি', unit: 'পিস', yesterday: 40, today: 35 },
      { name: 'শশা', unit: 'কেজি', yesterday: 50, today: 55 },
    ],
  },
  {
    name: 'মাছ ও মাংস',
    products: [
      { name: 'রুই মাছ', unit: 'কেজি', yesterday: 320, today: 320 },
      { name: 'ইলিশ মাছ', unit: 'পিস', yesterday: 750, today: 700 },
      { name: 'ব্রয়লার মুরগি', unit: 'কেজি', yesterday: 170, today: 165 },
      { name: 'দেশি মুরগি', unit: 'কেজি', yesterday: 420, today: 430 },
      { name: 'গরুর মাংস', unit: 'কেজি', yesterday: 750, today: 750 },
    ],
  },
  {
    name: 'দুধ ও ডিম',
    products: [
      { name: 'ফার্মের ডিম', unit: 'হালি (৪টি)', yesterday: 46, today: 48 },
      { name: 'গরুর দুধ', unit: 'লিটার', yesterday: 80, today: 80 },
      { name: 'টক দই', unit: 'কেজি', yesterday: 160, today: 155 },
    ],
  },
  {
    name: 'ফল',
    products: [
      { name: 'কমলা', unit: 'কেজি', yesterday: 170, today: 160 },
      { name: 'আপেল', unit: 'কেজি', yesterday: 220, today: 230 },
      { name: 'সাগরকলা', unit: 'ডজন', yesterday: 95, today: 90 },
    ],
  },
  {
    name: 'অন্যান্য',
    products: [
      { name: 'চিনি', unit: 'কেজি', yesterday: 125, today: 120 },
      { name: 'লবণ', unit: 'কেজি', yesterday: 40, today: 40 },
      { name: 'বেকিং পাউডার', unit: 'প্যাকেট', yesterday: 30, today: 32 },
    ],
  },
]

async function main() {
  const existing = await prisma.category.count()
  if (existing > 0) {
    console.log('Seed skipped: data already exists.')
    return
  }

  for (let c = 0; c < categories.length; c++) {
    const cat = categories[c]
    const category = await prisma.category.create({
      data: { name: cat.name, sortOrder: c + 1 },
    })

    for (let p = 0; p < cat.products.length; p++) {
      const item = cat.products[p]
      const product = await prisma.product.create({
        data: {
          name: item.name,
          unit: item.unit,
          categoryId: category.id,
          sortOrder: p + 1,
        },
      })

      await prisma.priceEntry.createMany({
        data: [
          { productId: product.id, date: YESTERDAY, price: item.yesterday },
          { productId: product.id, date: TODAY, price: item.today },
        ],
      })
    }
  }

  await prisma.setting.createMany({
    data: [
      { key: 'shopName', value: 'মুদি ঘর' },
      { key: 'announcement', value: 'আজ পেঁয়াজ, টমেটো ও সয়াবিন তেলের দাম কমেছে। প্রতিদিন সকাল ৮টায় নতুন দাম আপডেট করা হয়।' },
    ],
  })

  console.log(`Seed done: TODAY=${TODAY}, YESTERDAY=${YESTERDAY}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
