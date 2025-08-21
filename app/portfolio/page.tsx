"use client"

import { useEffect, useState } from "react"
import {
  getPortfolios,
  createPortfolio,
  deletePortfolio,
} from "@/methods/portfolio/portfolio"
import { useSession } from "next-auth/react"
import type { Portfolio, Trade } from "@prisma/client" // ✅ import types from Prisma schema
import Link from "next/link"

// Extend Portfolio type so trades are included
export type PortfolioWithTrades = Portfolio & { trades: Trade[] }

export default function PortfolioPage() {
  const { data: session } = useSession()
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [showForm, setShowForm] = useState(false)

  function calculateNetWorth(trades: Trade[]): number {
    return trades.reduce((acc, t) => {
      const signedQty = t.type === "BUY" ? t.quantity : -t.quantity
      return acc + signedQty * t.price - t.fees
    }, 0)
  }

  useEffect(() => {
    if (session?.user?.id) {
      getPortfolios(session.user.id).then(setPortfolios)
    } else {
      console.error("user id not found", session?.user)
    }
  }, [session])

  const handleCreate = async () => {
    if (!session?.user?.id || !name.trim()) return
    const newPortfolio = await createPortfolio(session.user.id, name, desc)
    // Fetch again so trades are included
    const updated = await getPortfolios(session.user.id)
    setPortfolios(updated)
    setName("")
    setDesc("")
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    await deletePortfolio(id)
    if (session?.user?.id) {
      const updated = await getPortfolios(session.user.id)
      setPortfolios(updated)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Your Portfolios</h1>

      <ul>
        {portfolios.map((p) => {
          const netWorth = calculateNetWorth(p.trades ?? [])
          return (
            <Link
              key={p.id}
              className="flex justify-between items-center border p-2 my-2 rounded"
              href={`/portfolio/${p.id}`}
            >
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-600">{p.description}</p>
                <p className="text-green-600 font-bold">
                  Net Worth: {netWorth.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="text-red-500 hover:underline"
              >
                Delete
              </button>
            </Link>
          )
        })}
      </ul>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-4 bg-blue-500 text-white px-3 py-1 rounded"
        >
          + Create New Portfolio
        </button>
      ) : (
        <div className="mt-4 border p-4 rounded">
          <h2 className="font-semibold mb-2">New Portfolio</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Portfolio name"
            className="border p-1 mr-2 mb-2 w-full"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description"
            className="border p-1 mr-2 mb-2 w-full"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-300 px-3 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
