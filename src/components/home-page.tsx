"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PriceBoard } from "@/components/price-board/price-board"
import { AdminDashboard } from "@/components/admin/dashboard"
import { LoginForm } from "@/components/admin/login-form"

export function HomePage() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [adminOpen, setAdminOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setAuthed(Boolean(j.authenticated)))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false))
  }, [])

  function handleAdminClick() {
    if (authed) setAdminOpen(true)
    else setLoginOpen(true)
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        লোড হচ্ছে...
      </div>
    )
  }

  if (adminOpen && authed) {
    return (
      <AdminDashboard
        onExit={() => setAdminOpen(false)}
        onLogout={() => {
          setAuthed(false)
          setAdminOpen(false)
        }}
      />
    )
  }

  return (
    <>
      <PriceBoard onAdminClick={handleAdminClick} />
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>অ্যাডমিন লগইন</DialogTitle>
            <DialogDescription>
              দাম নির্ধারণ করতে দোকানের মালিককে লগইন করতে হবে।
            </DialogDescription>
          </DialogHeader>
          <LoginForm
            onSuccess={() => {
              setLoginOpen(false)
              setAuthed(true)
              setAdminOpen(true)
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
