"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPriceBn } from "@/lib/bangla"
import { UNIT_OPTIONS, type AdminCategory, type AdminData } from "./types"

type Props = {
  data: AdminData
  reload: () => Promise<void>
}

type FormState = {
  name: string
  unit: string
  categoryId: string
  sortOrder: string
  isActive: boolean
}

// Resize to max 480px JPEG so images stay small (~30-60KB)
async function resizeImage(file: File, max = 480): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL("image/jpeg", 0.8)
}

const emptyForm: FormState = {
  name: "",
  unit: "কেজি",
  categoryId: "",
  sortOrder: "0",
  isActive: true,
}

export function ProductsTab({ data, reload }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategory["products"][number] | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<AdminCategory["products"][number] | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  // undefined = unchanged, null = remove, string = new image (data URL)
  const [imageData, setImageData] = useState<string | null | undefined>(undefined)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("শুধু ছবি বেছে নিন।")
      return
    }
    try {
      setImageData(await resizeImage(file))
    } catch {
      toast.error("ছবি পড়া যায়নি।")
    }
  }

  const previewSrc = imageData === undefined ? editing?.image ?? null : imageData

  useEffect(() => {
    if (dialogOpen) return
    setEditing(null)
  }, [dialogOpen])

  function openAdd() {
    setEditing(null)
    setImageData(undefined)
    setForm({
      ...emptyForm,
      categoryId: data.categories[0] ? String(data.categories[0].id) : "",
    })
    setDialogOpen(true)
  }

  function openEdit(p: AdminCategory["products"][number]) {
    setEditing(p)
    setImageData(undefined)
    setForm({
      name: p.name,
      unit: p.unit,
      categoryId: String(p.categoryId),
      sortOrder: String(p.sortOrder),
      isActive: p.isActive,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (saving) return
    if (!form.name.trim()) {
      toast.error("পণ্যের নাম দিন।")
      return
    }
    if (!form.categoryId) {
      toast.error("ক্যাটাগরি নির্বাচন করুন।")
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        unit: form.unit.trim() || "কেজি",
        categoryId: Number(form.categoryId),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      }
      const res = await fetch(
        editing ? `/api/admin/products/${editing.id}` : "/api/admin/products",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(json?.error ?? "সংরক্ষণ করা যায়নি।")
        return
      }
      const productId: number = editing ? editing.id : json?.product?.id
      if (productId && imageData !== undefined) {
        const imgRes =
          imageData === null
            ? await fetch(`/api/admin/products/${productId}/image`, { method: "DELETE" })
            : await fetch(`/api/admin/products/${productId}/image`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dataUrl: imageData }),
              })
        if (!imgRes.ok) {
          const j = await imgRes.json().catch(() => null)
          toast.error(j?.error ?? "ছবি সংরক্ষণ করা যায়নি।")
        }
      }
      toast.success(editing ? "পণ্য আপডেট হয়েছে।" : "নতুন পণ্য যোগ হয়েছে।")
      setDialogOpen(false)
      await reload()
    } catch {
      toast.error("সংরক্ষণ করতে সমস্যা হয়েছে।")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(
    p: AdminCategory["products"][number],
    isActive: boolean
  ) {
    setTogglingId(p.id)
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        toast.error(json?.error ?? "পরিবর্তন করা যায়নি।")
        return
      }
      toast.success(isActive ? "পণ্য সক্রিয় করা হয়েছে।" : "পণ্য নিষ্ক্রিয় করা হয়েছে।")
      await reload()
    } catch {
      toast.error("পরিবর্তন করতে সমস্যা হয়েছে।")
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    if (!deleting || deleteLoading) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${deleting.id}`, { method: "DELETE" })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(json?.error ?? "মুছতে সমস্যা হয়েছে।")
        return
      }
      toast.success("পণ্য মুছে ফেলা হয়েছে।")
      setDeleting(null)
      await reload()
    } catch {
      toast.error("মুছতে সমস্যা হয়েছে।")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          নতুন পণ্য যোগ করুন, নাম/একক বদলান অথবা মুছে ফেলুন।
        </p>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden />
          নতুন পণ্য
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>পণ্যের নাম</TableHead>
              <TableHead>ক্যাটাগরি</TableHead>
              <TableHead>একক</TableHead>
              <TableHead className="hidden sm:table-cell">ক্রম</TableHead>
              <TableHead>আজকের দাম</TableHead>
              <TableHead>সক্রিয়</TableHead>
              <TableHead className="text-right">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.categories.flatMap((cat) =>
              cat.products.map((p) => (
                <TableRow key={p.id} className={!p.isActive ? "opacity-60" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="h-9 w-9 shrink-0 rounded-md border object-cover" />
                      ) : (
                        <div className="h-9 w-9 shrink-0 rounded-md border bg-muted" />
                      )}
                      {p.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {cat.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="hidden sm:table-cell">{p.sortOrder}</TableCell>
                  <TableCell>
                    {p.todayPrice !== null ? formatPriceBn(p.todayPrice) : "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={p.isActive}
                      onCheckedChange={(v) => handleToggleActive(p, v)}
                      disabled={togglingId === p.id}
                      aria-label={`${p.name} সক্রিয়/নিষ্ক্রিয়`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(p)}
                        aria-label={`${p.name} সম্পাদনা`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleting(p)}
                        className="text-[var(--price-up)] hover:text-[var(--price-up)]"
                        aria-label={`${p.name} মুছুন`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {data.categories.every((c) => c.products.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  এখনো কোনো পণ্য নেই। নতুন পণ্য যোগ করুন।
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "পণ্য সম্পাদনা" : "নতুন পণ্য যোগ করুন"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "পণ্যের তথ্য বদলে সংরক্ষণ করুন।"
                : "পণ্যের নাম, একক ও ক্যাটাগরি দিন। দাম পরে 'আজকের দাম' ট্যাব থেকে দেবেন।"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>পণ্যের ছবি</Label>
              <div className="flex items-center gap-3">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="" className="h-20 w-20 rounded-lg border object-cover" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    <ImagePlus className="h-6 w-6" aria-hidden />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    {previewSrc ? "ছবি বদলান" : "ছবি বেছে নিন"}
                  </Button>
                  {previewSrc && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-[var(--price-up)]"
                      onClick={() => setImageData(null)}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      ছবি সরান
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-name">পণ্যের নাম</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="যেমন: সরু চাল"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-unit">একক</Label>
                <Input
                  id="p-unit"
                  list="unit-options"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="কেজি"
                />
                <datalist id="unit-options">
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-order">সাজানোর ক্রম</Label>
                <Input
                  id="p-order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ক্যাটাগরি</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {data.categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="p-active" className="cursor-pointer">
                সক্রিয় (ওয়েবসাইটে দেখা যাবে)
              </Label>
              <Switch
                id="p-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পণ্যটি মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" মুছলে এর দামের ইতিহাসও মুছে যাবে। এটি ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-[var(--price-up)] text-white hover:bg-[var(--price-up)]/90"
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "হ্যাঁ, মুছুন"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
