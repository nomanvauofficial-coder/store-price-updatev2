"use client"

import { motion } from "framer-motion"
import { Clock, Minus, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toBn, formatPriceBn, formatBanglaTime } from "@/lib/bangla"

export type BoardProduct = {
  id: number
  name: string
  unit: string
  image?: string | null
  todayPrice: number | null
  yesterdayPrice: number | null
  change: "up" | "down" | "same" | null
  updatedAt: string | null
}

export function PriceCard({ product, index }: { product: BoardProduct; index: number }) {
  const hasToday = product.todayPrice !== null
  const shownPrice = hasToday ? product.todayPrice : product.yesterdayPrice

  const diff =
    product.todayPrice !== null &&
    product.yesterdayPrice !== null &&
    product.change !== "same"
      ? Math.abs(product.todayPrice - product.yesterdayPrice)
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index, 11) * 0.035, ease: "easeOut" }}
      className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {product.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="mb-3 aspect-square w-full rounded-lg border bg-muted object-cover"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold leading-snug">{product.name}</h3>
        <Badge variant="secondary" className="shrink-0 font-normal">
          {product.unit}
        </Badge>
      </div>

      <div className="mt-3 flex items-end gap-1.5">
        {shownPrice !== null ? (
          <>
            <span className="text-3xl font-bold leading-none tracking-tight text-primary">
              {formatPriceBn(shownPrice)}
            </span>
            <span className="pb-0.5 text-xs text-muted-foreground">/ {product.unit}</span>
          </>
        ) : (
          <span className="text-lg font-medium text-muted-foreground">দাম দেওয়া হয়নি</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {hasToday && product.change === "up" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--price-up)]/10 px-2.5 py-1 text-xs font-medium text-[var(--price-up)]">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            ৳ {toBn(diff ?? 0)} বেড়েছে
          </span>
        )}
        {hasToday && product.change === "down" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--price-down)]/10 px-2.5 py-1 text-xs font-medium text-[var(--price-down)]">
            <TrendingDown className="h-3.5 w-3.5" aria-hidden />
            ৳ {toBn(diff ?? 0)} কমেছে
          </span>
        )}
        {hasToday && product.change === "same" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Minus className="h-3.5 w-3.5" aria-hidden />
            দাম অপরিবর্তিত
          </span>
        )}
        {!hasToday && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--chart-2)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent-foreground)]">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            গতকালের দাম
          </span>
        )}
        {hasToday && product.updatedAt && (
          <span className="text-[11px] text-muted-foreground">
            আপডেট: {formatBanglaTime(product.updatedAt)}
          </span>
        )}
      </div>
    </motion.div>
  )
}
