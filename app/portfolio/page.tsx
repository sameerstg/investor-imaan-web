"use client"

import { useEffect, useState } from "react"
import {
  getPortfolios,
  createPortfolio,
  deletePortfolio,
  updatePortfolio,
} from "@/methods/portfolio/portfolio"
import { useSession } from "next-auth/react"
import type { Portfolio, Trade } from "@prisma/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { calculateTotalCost } from "@/utils/portfolio"


export default function PortfolioPage() {
  const { data: session } = useSession()
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // For editing
  const [editingPortfolio, setEditingPortfolio] = useState<any | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchPortfolios = async () => {
    if (!session?.user?.id) return
    setLoading(true)
    try {
      const data = await getPortfolios(session.user.id)
      setPortfolios(data as any[])
    } catch (err) {
      console.error("Failed to fetch portfolios:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetchPortfolios()
    }
  }, [session])

  const handleCreate = async () => {
    if (!session?.user?.id || !name.trim()) return
    setCreating(true)
    try {
      await createPortfolio(session.user.id, name, desc)
      await fetchPortfolios()
      setName("")
      setDesc("")
      setShowForm(false)
    } catch (err) {
      console.error("Failed to create portfolio:", err)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deletePortfolio(id)
      await fetchPortfolios()
    } catch (err) {
      console.error("Failed to delete portfolio:", err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpdate = async () => {
    if (!editingPortfolio) return
    setUpdating(true)
    try {
      await updatePortfolio(editingPortfolio.id, {
        name: editingPortfolio.name,
        description: editingPortfolio.description ?? "",
      })
      await fetchPortfolios()
      setEditingPortfolio(null)
    } catch (err) {
      console.error("Failed to update portfolio:", err)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Your Portfolios</h1>

      {/* Portfolio list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center border p-3 rounded">
              <div className="space-y-2 w-full">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <Skeleton className="h-6 w-12 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {portfolios.map((p) => {
            const totalCost = calculateTotalCost(p.Trade)
            console.log(JSON.stringify(p))
            return (
              <div
                key={p.id}
                className="flex flex-col justify-between border p-3 rounded hover:shadow-sm transition"
              >
                <Link href={`/portfolio/${p.id}`} className="flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-gray-600">{p.description}</p>
                  <p className="text-sm font-medium mt-2">
                    Total Cost:{" "}
                    {totalCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </Link>
                <div className="flex gap-2 mt-2 self-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPortfolio(p)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                  >
                    {deletingId === p.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Portfolio Section */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="mt-6 w-full sm:w-auto"
        >
          + Create New Portfolio
        </Button>
      ) : (
        <div className="mt-6 border p-4 rounded space-y-3">
          <h2 className="font-semibold mb-2">New Portfolio</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Portfolio name"
            className="border p-2 rounded w-full"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description"
            className="border p-2 rounded w-full"
          />
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={creating}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Edit Portfolio Modal */}
      <Dialog
        open={!!editingPortfolio}
        onOpenChange={(open) => !open && setEditingPortfolio(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Portfolio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Name</Label>
              <Input
                value={editingPortfolio?.name || ""}
                onChange={(e) =>
                  setEditingPortfolio((prev:any) =>
                    prev ? { ...prev, name: e.target.value } : prev
                  )
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={editingPortfolio?.description || ""}
                onChange={(e) =>
                  setEditingPortfolio((prev:any) =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
