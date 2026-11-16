"use client"

import { useEffect, useState } from "react"
import { KeyRound, Loader2, Megaphone, Save, Store } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { AdminData } from "./types"

type Props = {
  data: AdminData
  reload: () => Promise<void>
}

export function SettingsTab({ data, reload }: Props) {
  const [shopName, setShopName] = useState(data.shopName)
  const [shopSaving, setShopSaving] = useState(false)

  const [announcement, setAnnouncement] = useState(data.announcement)
  const [annSaving, setAnnSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [passSaving, setPassSaving] = useState(false)

  useEffect(() => {
    setShopName(data.shopName)
    setAnnouncement(data.announcement)
  }, [data])

  async function saveSettings(payload: Record<string, string>, setSaving: (v: boolean) => void, successMsg: string) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(json?.error ?? "সংরক্ষণ করা যায়নি।")
        return
      }
      toast.success(successMsg)
      await reload()
    } catch {
      toast.error("সংরক্ষণ করতে সমস্যা হয়েছে।")
    } finally {
      setSaving(false)
    }
  }

  function handlePasswordSave() {
    if (passSaving) return
    if (!currentPassword) {
      toast.error("বর্তমান পাসওয়ার্ড দিন।")
      return
    }
    if (password.trim().length < 4) {
      toast.error("পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের দিন।")
      return
    }
    if (password !== confirm) {
      toast.error("দুটি পাসওয়ার্ড মিলছে না।")
      return
    }
    saveSettings({ adminPassword: password.trim(), currentPassword }, setPassSaving, "পাসওয়ার্ড পরিবর্তন হয়েছে।")
    setCurrentPassword("")
    setPassword("")
    setConfirm("")
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Shop name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4 text-primary" aria-hidden />
            দোকানের নাম
          </CardTitle>
          <CardDescription>ওয়েবসাইটের হেডার ও ফুটারে এই নাম দেখা যাবে।</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="s-shop">দোকানের নাম</Label>
            <Input
              id="s-shop"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="যেমন: রহিম স্টোর"
            />
          </div>
          <Button
            onClick={() => saveSettings({ shopName: shopName.trim() }, setShopSaving, "দোকানের নাম সংরক্ষণ হয়েছে।")}
            disabled={shopSaving || shopName.trim() === data.shopName}
            className="gap-2"
          >
            {shopSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>

      {/* Announcement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-primary" aria-hidden />
            বিজ্ঞপ্তি / মূল্য সতর্কতা
          </CardTitle>
          <CardDescription>
            ওয়েবসাইটের উপরে চলমান বিজ্ঞপ্তি হিসেবে দেখানো হবে। খালি রাখলে বিজ্ঞপ্তি বন্ধ থাকবে।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="s-ann">বিজ্ঞপ্তির লেখা</Label>
            <Textarea
              id="s-ann"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="যেমন: আজ পেঁয়াজের দাম ৫ টাকা কমেছে..."
              rows={3}
            />
          </div>
          <Button
            onClick={() =>
              saveSettings({ announcement: announcement.trim() }, setAnnSaving, "বিজ্ঞপ্তি সংরক্ষণ হয়েছে।")
            }
            disabled={annSaving || announcement.trim() === data.announcement}
            className="gap-2"
          >
            {annSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" aria-hidden />
            পাসওয়ার্ড পরিবর্তন
          </CardTitle>
          <CardDescription>অ্যাডমিন প্যানেলে ঢোকার পাসওয়ার্ড বদলান।</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1 space-y-2">
              <Label htmlFor="s-cur">বর্তমান পাসওয়ার্ড</Label>
              <Input
                id="s-cur"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                dir="ltr"
                autoComplete="current-password"
              />
            </div>
            <div className="min-w-48 flex-1 space-y-2">
              <Label htmlFor="s-pass">নতুন পাসওয়ার্ড</Label>
              <Input
                id="s-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                autoComplete="new-password"
              />
            </div>
            <div className="min-w-48 flex-1 space-y-2">
              <Label htmlFor="s-confirm">আবার লিখুন</Label>
              <Input
                id="s-confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                dir="ltr"
                autoComplete="new-password"
              />
            </div>
            <Button
              onClick={handlePasswordSave}
              disabled={passSaving || !currentPassword || !password || !confirm}
              className="gap-2"
            >
              {passSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
              পাসওয়ার্ড বদলান
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
