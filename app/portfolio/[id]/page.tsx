"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createTrade, deleteTrade, updateTrade } from "@/methods/trade/trade";
import { getPortfolioById } from "@/methods/portfolio/portfolio";
import { Loader2 } from "lucide-react";
import { calculateNetWorth } from "@/utils/portfolio";
import { Trade } from "@prisma/client";

type PortfolioWithTrades = {
  id: string;
  name: string;
  description: string;
  trades?: Trade[];
};

interface Prop {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: Prop) {
  const [id, setId] = useState<null | string>(null);
  const [portfolio, setPortfolio] = useState<PortfolioWithTrades | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Trade | null>(null);
  const [networth, setNetworth] = useState(0);

  const [symbol, setSymbol] = useState("");
  const [tradeDate, setTradeDate] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [fees, setFees] = useState(0);
  const [symbolSummary, setSymbolSummary] = useState<Record<string, number>>({});

  const fetchPortfolio = async () => {
    setLoading(true);
    const i = (await params).id;
    setId(i);

    try {
      const port = await getPortfolioById(i);
      if (port) {
        setPortfolio(port as PortfolioWithTrades);
        setTrades(port?.Trade || []);
      }
    } catch (err) {
      console.error("Failed to fetch portfolio:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setNetworth(calculateNetWorth(trades as any));
    const summary: Record<string, number> = {};
    trades.forEach((t) => {
      const cost = t.type === "BUY"
        ? t.quantity * t.price + t.fees
        : -(t.quantity * t.price - t.fees);

      summary[t.symbol] = (summary[t.symbol] || 0) + cost;
    });
    setSymbolSummary(summary);
  }, [trades]);

  useEffect(() => {
    fetchPortfolio();
  }, [params]);

  const openCreateModal = () => {
    setEditingTrade(null);
    setSymbol("");
    setType("BUY");
    setQuantity(0);
    setPrice(0);
    setFees(0);
    setTradeDate(new Date().toISOString().slice(0, 16)); // default to now
    setIsModalOpen(true);
  };

  const openEditModal = (trade: Trade) => {
    setEditingTrade(trade);
    setSymbol(trade.symbol);
    setType(trade.type);
    setQuantity(trade.quantity);
    setPrice(trade.price);
    setFees(trade.fees);
    setTradeDate(trade.tradeDate.toISOString().slice(0, 16)); // for datetime-local
    setIsModalOpen(true);
  };

  const handleSaveTrade = async (keepOpen = false) => {
    if (!symbol || quantity <= 0 || price <= 0 || !tradeDate) return;
    if (!id) return;

    setSaving(true);
    try {
      let updatedTrade: Trade;
      if (editingTrade) {
        updatedTrade = await updateTrade(editingTrade.id, {
          symbol,
          type,
          quantity,
          price,
          fees,
          tradeDate: new Date(tradeDate),
        });
        setTrades(trades.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
      } else {
        updatedTrade = await createTrade(id, {
          symbol,
          type,
          quantity,
          price,
          fees,
          tradeDate: new Date(tradeDate),
        });
        setTrades([...trades, updatedTrade]);
      }

      // reset form
      setEditingTrade(null);
      if (!keepOpen)
        setSymbol("");
      setQuantity(0);
      setPrice(0);
      setFees(0);
      setTradeDate(new Date().toISOString().slice(0, 16));

      // close modal only if not keepOpen
      if (!keepOpen) {
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save trade:", err);
    } finally {
      setSaving(false);
    }
  };


  const confirmDeleteTrade = (trade: Trade) => {
    setConfirmDelete(trade);
  };

  const handleDeleteTrade = async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      await deleteTrade(confirmDelete.id);
      setTrades(trades.filter((t) => t.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Failed to delete trade:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!id) return null;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="mt-4">
            <Skeleton className="h-5 w-32" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between border p-3 rounded">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <h1 className="text-xl font-bold">{portfolio?.name}</h1>
          <p className="text-gray-600">{portfolio?.description}</p>
          <div className="mt-2 p-3 rounded bg-gray-100 text-gray-800 font-semibold">
            Net Worth: {networth.toFixed(2)}
          </div>
          {/* Symbol Summary */}
          {Object.keys(symbolSummary).length > 0 && (
            <div className="mt-3 p-3 rounded bg-blue-50">
              <h3 className="font-semibold mb-2">Symbol Cost Summary</h3>
              <ul className="space-y-1">
                {Object.entries(symbolSummary).map(([symbol, total]) => (
                  <li
                    key={symbol}
                    className="flex flex-row justify-between items-center border-2 rounded px-3 py-2"
                  >
                    <span className="font-medium">{symbol}</span>
                    <span className={total >= 0 ? "text-green-700" : "text-red-700"}>
                      {total.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h2 className="text-lg font-semibold">Trades</h2>
            <Button variant="outline" onClick={openCreateModal}>
              + Create Trade
            </Button>
          </div>

          {trades.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {trades.map((t) => (
                <li
                  key={t.id}
                  className="border p-3 rounded flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${t.type === "BUY"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {t.type}
                    </span>
                    <span>
                      {t.quantity} {t.symbol} @ {t.price} (Fees: {t.fees})
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(t.tradeDate).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(t)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => confirmDeleteTrade(t)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-gray-500">
              No trades found. Click "Create Trade" to add your first trade.
            </p>
          )}
        </>
      )}

      {/* Modal for create/update */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTrade ? "Update Trade" : "Create New Trade"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-2">
            <div>
              <Label>Symbol</Label>
              <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
            </div>

            <div>
              <Label>Type</Label>
              <select
                className="border rounded p-2 w-full"
                value={type}
                onChange={(e) => setType(e.target.value as "BUY" | "SELL")}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>

            <div>
              <Label>Price</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>

            <div>
              <Label>Fees</Label>
              <Input
                type="number"
                value={fees}
                onChange={(e) => setFees(Number(e.target.value))}
              />
            </div>

            <div>
              <Label>Trade Date & Time</Label>
              <Input
                type="datetime-local"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => handleSaveTrade()}
              disabled={!symbol || quantity <= 0 || price <= 0 || saving}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingTrade ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
            {/* Save & Create New */}
            {!editingTrade && (
              <Button
                variant="secondary"
                onClick={() => handleSaveTrade(true)} // pass a flag to keep modal open
                disabled={!symbol || quantity <= 0 || price <= 0 || saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save & Create New"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{confirmDelete?.symbol}</span> trade?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrade}
              disabled={deletingId === confirmDelete?.id}
            >
              {deletingId === confirmDelete?.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
