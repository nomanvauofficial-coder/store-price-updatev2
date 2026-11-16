"use client"

import { Megaphone } from "lucide-react"

export function AnnouncementTicker({ message }: { message: string }) {
  if (!message) return null

  return (
    <div
      className="border-b border-[var(--chart-2)]/30 bg-[var(--chart-2)]/15 text-[var(--accent-foreground)]"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold">
          <Megaphone className="h-3.5 w-3.5" aria-hidden />
          বিজ্ঞপ্তি
        </span>
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee flex w-max whitespace-nowrap text-sm">
            <span className="pr-16">{message}</span>
            <span className="pr-16" aria-hidden="true">
              {message}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
