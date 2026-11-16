"use client"

import { useState } from "react"
import { Eye, EyeOff, Loader2, LockKeyhole, LogIn } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(json?.error ?? "লগইন ব্যর্থ হয়েছে।")
        return
      }
      toast.success("সফলভাবে লগইন হয়েছে।")
      onSuccess()
    } catch {
      toast.error("লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg bg-secondary/60 p-3 text-sm text-secondary-foreground">
        <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden />
        শুধুমাত্র দোকানের মালিক এই প্যানেলে ঢুকতে পারবেন।
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">পাসওয়ার্ড</Label>
        <div className="relative">
          <Input
            id="admin-password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="আপনার পাসওয়ার্ড লিখুন"
            autoComplete="current-password"
            className="pr-10"
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
          >
            {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>
      <Button type="submit" disabled={loading || !password} className="w-full gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
        লগইন করুন
      </Button>
    </form>
  )
}
