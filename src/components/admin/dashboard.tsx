"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ClipboardList,
  Eye,
  Loader2,
  LogOut,
  Package,
  Settings,
  ShoppingBasket,
  Tags,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatBanglaDate, toBn } from "@/lib/bangla"
import { PricesTab } from "./prices-tab"
import { ProductsTab } from "./products-tab"
import { CategoriesTab } from "./categories-tab"
import { SettingsTab } from "./settings-tab"
import type { AdminData } from "./types"

type Props = {
  onExit: () => void
  onLogout: () => void
}

export function AdminDashboard({ onExit, onLogout }: Props) {
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/data", { cache: "no-store" })
      if (res.status === 401) {
        onLogout()
        return
      }
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("ডেটা লোড করা যায়নি। আবার চেষ্টা করুন।")
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  useEffect(() => {
    reload()
  }, [reload])

  const summary = useMemo(() => {
    const all = data?.categories.flatMap((c) => c.products) ?? []
    const active = all.filter((p) => p.isActive)
    const priced = active.filter((p) => p.todayPrice !== null).length
    return {
      total: active.length,
      priced,
      remaining: active.length - priced,
    }
  }, [data])

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
    } finally {
      toast.success("লগআউট হয়েছে।")
      onLogout()
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Admin header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
              <ShoppingBasket className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-base font-bold leading-tight">
                {data?.shopName ?? "মুদি ঘর"} — অ্যাডমিন প্যানেল
              </p>
              <p className="text-xs opacity-80">
                {data ? formatBanglaDate(data.today) : "লোড হচ্ছে..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            >
              <Eye className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">সাইট দেখুন</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-primary-foreground hover:bg-destructive/80 hover:text-white"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">লগআউট</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {/* Summary */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            <Package className="h-3.5 w-3.5" aria-hidden />
            সক্রিয় পণ্য {toBn(summary.total)} টি
          </Badge>
          <Badge variant="secondary" className="gap-1.5 bg-[var(--price-down)]/10 px-3 py-1.5 text-[var(--price-down)]">
            <ClipboardList className="h-3.5 w-3.5" aria-hidden />
            আজকের দাম দেওয়া হয়েছে {toBn(summary.priced)} টি
          </Badge>
          {summary.remaining > 0 && (
            <Badge className="animate-soft-pulse gap-1.5 bg-[var(--price-up)]/10 px-3 py-1.5 text-[var(--price-up)]">
              বাকি আছে {toBn(summary.remaining)} টি
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ডেটা লোড হচ্ছে...
          </div>
        ) : (
          <Tabs defaultValue="prices">
            <TabsList className="mb-4 flex w-full gap-1 overflow-x-auto sm:w-auto">
              <TabsTrigger value="prices" className="gap-1.5">
                <ClipboardList className="h-4 w-4" aria-hidden />
                আজকের দাম
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-1.5">
                <Package className="h-4 w-4" aria-hidden />
                পণ্য
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-1.5">
                <Tags className="h-4 w-4" aria-hidden />
                ক্যাটাগরি
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5">
                <Settings className="h-4 w-4" aria-hidden />
                সেটিংস
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prices">
              {data && <PricesTab data={data} reload={reload} />}
            </TabsContent>
            <TabsContent value="products">
              {data && <ProductsTab data={data} reload={reload} />}
            </TabsContent>
            <TabsContent value="categories">
              {data && <CategoriesTab data={data} reload={reload} />}
            </TabsContent>
            <TabsContent value="settings">
              {data && <SettingsTab data={data} reload={reload} />}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer
        className="mt-auto border-t bg-card py-4 text-center text-xs text-muted-foreground"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        শুধুমাত্র দোকানের মালিকের জন্য — এখান থেকে প্রতিদিনের দাম নির্ধারণ করুন।
      </footer>
    </div>
  )
}
