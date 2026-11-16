"use client"

import { useState } from "react"
import { Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toBn } from "@/lib/bangla"
import type { AdminCategory, AdminData } from "./types"

type Props = {
  data: AdminData
  reload: () => Promise<void>
}

export function CategoriesTab({ data, reload }: Props) {
  const [newName, setNewName] = useState("")
  const [newOrder, setNewOrder] = useState("")
  const [adding, setAdding] = useState(false)

  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [editName, setEditName] = useState("")
  const [editSaving, setEditSaving] = useState(false)

  const [deleting, setDeleting] = useState<AdminCategory | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  async function handleAdd() {
    if (adding) return
    if (!newName.trim()) {
      toast.error("ক্যাটাগরির নাম দিন।")
      return
    }
    setAdding(true)
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          sortOrder: Number(newOrder) || data.categories.length + 1,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(json?.error ?? "যোগ করা যায়নি।")
        return
      }
      toast.success("ক্যাটাগরি যোগ হয়েছে।")
      setNewName("")
      setNewOrder("")
      await reload()
    } catch {
      toast.error("যোগ করতে সমস্যা হয়েছে।")
    } finally {
      setAdding(false)
    }
  }

  function openEdit(cat: AdminCategory) {
    setEditing(cat)
    setEditName(cat.name)
  }

  async function handleEditSave() {
    if (!editing || editSaving) return
    if (!editName.trim()) {
      toast.error("ক্যাটাগরির নাম দিন।")
      return
    }
    setEditSaving(true)
    try {
      const res = await fetch(`/api/admin/categories/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(json?.error ?? "আপডেট করা যায়নি।")
        return
      }
      toast.success("ক্যাটাগরি আপডেট হয়েছে।")
      setEditing(null)
      await reload()
    } catch {
      toast.error("আপডেট করতে সমস্যা হয়েছে।")
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting || deleteLoading) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/categories/${deleting.id}`, { method: "DELETE" })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        toast.error(json?.error ?? "মুছতে সমস্যা হয়েছে।")
        return
      }
      toast.success("ক্যাটাগরি মুছে ফেলা হয়েছে।")
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
      {/* Add form */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="c-name">নতুন ক্যাটাগরির নাম</Label>
          <Input
            id="c-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="যেমন: বেবি আইটেম"
          />
        </div>
        <Button onClick={handleAdd} disabled={adding} className="gap-2">
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
          যোগ করুন
        </Button>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ক্যাটাগরি</TableHead>
              <TableHead>পণ্য সংখ্যা</TableHead>
              <TableHead className="text-right">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    <Tags className="h-4 w-4 text-primary" aria-hidden />
                    {cat.name}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {toBn(cat.products.length)} টি পণ্য
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(cat)}
                      aria-label={`${cat.name} সম্পাদনা`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(cat)}
                      className="text-[var(--price-up)] hover:text-[var(--price-up)]"
                      aria-label={`${cat.name} মুছুন`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Rename dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>ক্যাটাগরির নাম বদলান</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="c-edit-name">নতুন নাম</Label>
            <Input
              id="c-edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              বাতিল
            </Button>
            <Button onClick={handleEditSave} disabled={editSaving} className="gap-2">
              {editSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ক্যাটাগরি মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" মুছে ফেলতে চান? ক্যাটাগরিতে পণ্য থাকলে আগে সেগুলো মুছতে হবে।
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
