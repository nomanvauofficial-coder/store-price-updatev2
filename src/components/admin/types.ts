export type AdminProduct = {
  id: number
  name: string
  unit: string
  image: string | null
  sortOrder: number
  isActive: boolean
  categoryId: number
  todayPrice: number | null
  yesterdayPrice: number | null
}

export type AdminCategory = {
  id: number
  name: string
  products: AdminProduct[]
}

export type AdminData = {
  today: string
  yesterday: string
  shopName: string
  announcement: string
  categories: AdminCategory[]
}

export const UNIT_OPTIONS = ["কেজি", "গ্রাম", "লিটার", "পিস", "ডজন", "হালি", "প্যাকেট", "বস্তা"]
