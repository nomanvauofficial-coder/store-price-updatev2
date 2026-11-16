"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Loader2,
  Moon,
  Package,
  RefreshCw,
  Search,
  SearchX,
  Settings,
  ShoppingBasket,
  Sun,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toBn, formatBanglaDate, formatBanglaTime } from "@/lib/bangla"
import { PriceCard, type BoardProduct } from "./price-card"
import { AnnouncementTicker } from "./ticker"

type BoardCategory = {
  id: number
  name: string
  products: BoardProduct[]
}

type BoardData = {
  today: string
  shopName: string
  announcement: string
  updatedAt: string | null
  categories: BoardCategory[]
}

export function PriceBoard({ onAdminClick }: { onAdminClick: () => void }) {
  const [data, setData] = useState<BoardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<number | "all">("all")

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      const res = await fetch("/api/products", { cache: "no-store" })
      if (!res.ok) throw new Error("failed")
      const json = (await res.json()) as BoardData
      setData(json)
      setError(null)
    } catch {
      setError("দামের তথ্য লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const timer = setInterval(() => fetchData(true), 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [fetchData])

  const filteredCategories = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.categories
      .filter((c) => activeCategory === "all" || c.id === activeCategory)
      .map((c) => ({
        ...c,
        products: q
          ? c.products.filter((p) => p.name.toLowerCase().includes(q))
          : c.products,
      }))
      .filter((c) => c.products.length > 0)
  }, [data, search, activeCategory])

  const stats = useMemo(() => {
    const all = data?.categories.flatMap((c) => c.products) ?? []
    return {
      total: all.length,
      up: all.filter((p) => p.change === "up").length,
      down: all.filter((p) => p.change === "down").length,
    }
  }, [data])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15">
              <ShoppingBasket className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight">
                {loading ? "মুদি ঘর" : (data?.shopName ?? "মুদি ঘর")}
              </p>
              <p className="text-xs opacity-80">প্রতিদিনের বাজার দর</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggleButton />
            <Button
              variant="ghost"
              size="sm"
              onClick={onAdminClick}
              className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
              aria-label="অ্যাডমিন প্যানেল"
            >
              <Settings className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">অ্যাডমিন</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Announcement ticker */}
      {data?.announcement ? <AnnouncementTicker message={data.announcement} /> : null}

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-secondary/50 to-background">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  {data ? formatBanglaDate(data.today) : "তারিখ লোড হচ্ছে..."}
                </p>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">আজকের মূল্য তালিকা</h1>
                <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                  প্রতিদিন সকালে দাম আপডেট করা হয় — দোকানে আসার আগেই জেনে নিন আজকের বাজার দর।
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatChip icon={<Package className="h-3.5 w-3.5" />} label={`মোট পণ্য ${toBn(stats.total)} টি`} />
                <StatChip
                  icon={<TrendingUp className="h-3.5 w-3.5" />}
                  label={`বেড়েছে ${toBn(stats.up)} টি`}
                  className="bg-[var(--price-up)]/10 text-[var(--price-up)]"
                />
                <StatChip
                  icon={<TrendingDown className="h-3.5 w-3.5" />}
                  label={`কমেছে ${toBn(stats.down)} টি`}
                  className="bg-[var(--price-down)]/10 text-[var(--price-down)]"
                />
                {data?.updatedAt && (
                  <StatChip
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label={`সর্বশেষ আপডেট ${formatBanglaTime(data.updatedAt)}`}
                    className="bg-muted text-muted-foreground"
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                  className="gap-1.5"
                >
                  {refreshing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  )}
                  রিফ্রেশ
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Search + category pills */}
        <section className="mx-auto max-w-6xl px-4 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="পণ্যের নাম লিখে খুঁজুন..."
                className="pl-9"
                aria-label="পণ্য খুঁজুন"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="ক্যাটাগরি">
              {loading
                ? null
                : [
                    { id: "all" as const, name: "সব" },
                    ...(data?.categories ?? []).map((c) => ({ id: c.id as number | "all", name: c.name })),
                  ].map((c) => {
                    const active = activeCategory === c.id
                    return (
                      <button
                        key={String(c.id)}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveCategory(c.id)}
                        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground hover:bg-secondary"
                        }`}
                      >
                        {c.name}
                      </button>
                    )
                  })}
            </div>
          </div>
        </section>

        {/* Price sections */}
        <section className="mx-auto max-w-6xl flex-1 px-4 py-6">
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={() => fetchData()} />
          ) : filteredCategories.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-8">
              {filteredCategories.map((cat) => (
                <div key={cat.id}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
                    <h2 className="text-lg font-semibold">{cat.name}</h2>
                    <Badge variant="outline" className="font-normal text-muted-foreground">
                      {toBn(cat.products.length)} টি পণ্য
                    </Badge>
                    <span className="hidden h-px flex-1 bg-border sm:block" aria-hidden />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cat.products.map((p, i) => (
                      <PriceCard key={p.id} product={p} index={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer — sticks to bottom, pushed down naturally on overflow */}
      <footer
        className="mt-auto border-t bg-card"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <p>
            © {toBn(new Date().getFullYear())} {data?.shopName ?? "মুদি ঘর"} — সব দাম দোকান কর্তৃক নির্ধারিত। প্রতিদিন সকালে আপডেট করা হয়।
          </p>
          <button
            onClick={onAdminClick}
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            অ্যাডমিন প্যানেল
          </button>
        </div>
      </footer>
    </div>
  )
}

function StatChip({
  icon,
  label,
  className = "",
}: {
  icon: React.ReactNode
  label: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </span>
  )
}

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="থিম পরিবর্তন করুন"
      className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
    >
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
      <Moon className="h-4 w-4 dark:hidden" aria-hidden />
    </Button>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2].map((sec) => (
        <div key={sec}>
          <Skeleton className="mb-3 h-6 w-40" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[132px] rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <AlertTriangle className="h-10 w-10 text-[var(--price-up)]" aria-hidden />
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button onClick={onRetry} size="sm" className="mt-1">
        আবার চেষ্টা করুন
      </Button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden />
      <p className="font-medium">কোনো পণ্য পাওয়া যায়নি</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        অন্য নামে খুঁজে দেখুন অথবা ক্যাটাগরি বদলে চেষ্টা করুন।
      </p>
    </div>
  )
}
