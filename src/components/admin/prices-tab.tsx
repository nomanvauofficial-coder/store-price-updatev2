"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toBn, formatPriceBn } from "@/lib/bangla"
import type { AdminData, AdminProduct } from "./types"

type Props = {
  data: AdminData
  reload: () => Promise<void>
}

export function PricesTab({ data, reload }: Props) {
  const [values, setValues] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const v: Record<number, string> = {}
    data.categories.forEach((c) =>
      c.products.forEach((p) => {
        v[p.id] = p.todayPrice !== null ? String(p.todayPrice) : ""
      })
    )
    setValues(v)
  }, [data])

  const dirty = useMemo(() => {
    return data.categories
      .flatMap((c) => c.products)
      .filter((p) => {
        const current = values[p.id]
        if (current === undefined) return false
        const original = p.todayPrice !== null ? String(p.todayPrice) : ""
        return current !== original
      })
  }, [data, values])

  function setValue(productId: number, value: string) {
    setValues((prev) => ({ ...prev, [productId]: value }))
  }

  async function handleSave() {
    if (dirty.length === 0 || saving) return
    setSaving(true)
    try {
      const entries = dirty.map((p) => {
        const raw = (values[p.id] ?? "").trim()
        return {
          productId: p.id,
          price: raw === "" ? null : Number(raw),
        }
      })
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(json?.error ?? "দাম সংরক্ষণ করা যায়নি।")
        return
      }
      toast.success(`${toBn(entries.length)} টি পণ্যের দাম সংরক্ষণ হয়েছে। ওয়েবসাইটে দেখা যাবে।`)
      await reload()
    } catch {
      toast.error("দাম সংরক্ষণ করতে সমস্যা হয়েছে।")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Save bar */}
      <div className="sticky top-[68px] z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm">
        <p className="text-sm text-muted-foreground">
          প্রতিটি পণ্যের আজকের দাম লিখুন। খালি রাখলে পণ্যটি আজকের তালিকা থেকে বাদ যাবে।
        </p>
        <Button onClick={handleSave} disabled={dirty.length === 0 || saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          সব সংরক্ষণ করুন{dirty.length > 0 ? ` (${toBn(dirty.length)})` : ""}
        </Button>
      </div>

      {data.categories.map((cat) => (
        <Card key={cat.id}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
              {cat.name}
              <Badge variant="outline" className="font-normal text-muted-foreground">
                {toBn(cat.products.length)} টি
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cat.products.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">এই ক্যাটাগরিতে কোনো পণ্য নেই।</p>
            ) : (
              cat.products.map((p) => (
                <PriceRow
                  key={p.id}
                  product={p}
                  value={values[p.id] ?? ""}
                  onChange={(v) => setValue(p.id, v)}
                />
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function PriceRow({
  product,
  value,
  onChange,
}: {
  product: AdminProduct
  value: string
  onChange: (v: string) => void
}) {
  const original = product.todayPrice !== null ? String(product.todayPrice) : ""
  const isDirty = value !== original
  const hasToday = product.todayPrice !== null

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 transition-colors sm:flex-nowrap ${
        isDirty ? "border-[var(--chart-2)] bg-[var(--chart-2)]/10" : "bg-background"
      } ${!product.isActive ? "opacity-60" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {product.name}
          {!product.isActive && (
            <Badge variant="outline" className="ml-2 font-normal text-muted-foreground">
              নিষ্ক্রিয়
            </Badge>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {product.unit} · গতকাল:{" "}
          {product.yesterdayPrice !== null ? formatPriceBn(product.yesterdayPrice) : "নেই"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {!hasToday && (
          <Badge variant="outline" className="bg-[var(--chart-2)]/15 font-normal text-[var(--accent-foreground)]">
            আজকের দাম দেওয়া হয়নি
          </Badge>
        )}
        <Input
          type="number"
          min="0"
          step="0.5"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="দাম"
          className="w-28"
          dir="ltr"
          aria-label={`${product.name} এর আজকের দাম`}
        />
        <span className="hidden text-xs text-muted-foreground sm:inline">৳</span>
      </div>
    </div>
  )
}
