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
import { createTrade, deleteTrade, updateTrade } from "@/methods/trade/trade";
import { getPortfolioById } from "@/methods/portfolio/portfolio";

// Trade type
type Trade = {
  id: string;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  fees: number;
};

// Portfolio type
type PortfolioWithTrades = {
  id: string;
  name: string;
  description: string;
  trades?: Trade[];
};

type Props = {
  portfolioId: string; // pass this from the server page component
};

export default function PortfolioDetailPageClient({ portfolioId }: Props) {
  const [portfolio, setPortfolio] = useState<PortfolioWithTrades | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [fees, setFees] = useState(0);

  // Fetch portfolio by ID
  const fetchPortfolio = async () => {
    try {
      const port = await getPortfolioById(portfolioId);
      if (port) {
        setPortfolio(port as PortfolioWithTrades);
        setTrades(port?.Trade || []);
      }
    } catch (err) {
      console.error("Failed to fetch portfolio:", err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [portfolioId]);

  const openCreateModal = () => {
    setEditingTrade(null);
    setSymbol("");
    setType("BUY");
    setQuantity(0);
    setPrice(0);
    setFees(0);
    setIsModalOpen(true);
  };

  const openEditModal = (trade: Trade) => {
    setEditingTrade(trade);
    setSymbol(trade.symbol);
    setType(trade.type);
    setQuantity(trade.quantity);
    setPrice(trade.price);
    setFees(trade.fees);
    setIsModalOpen(true);
  };

  const handleSaveTrade = async () => {
    if (!symbol || quantity <= 0 || price <= 0) return;

    try {
      let updatedTrade: Trade;
      if (editingTrade) {
        updatedTrade = await updateTrade(editingTrade.id, {
          symbol,
          type,
          quantity,
          price,
          fees,
        });
        setTrades(trades.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
      } else {
        updatedTrade = await createTrade(portfolioId, {
          symbol,
          type,
          quantity,
          price,
          fees,
        });
        setTrades([...trades, updatedTrade]);
      }

      setIsModalOpen(false);
      setEditingTrade(null);
      setSymbol("");
      setQuantity(0);
      setPrice(0);
      setFees(0);
    } catch (err) {
      console.error("Failed to save trade:", err);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    try {
      await deleteTrade(id);
      setTrades(trades.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete trade:", err);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{portfolio?.name}</h1>
      <p className="text-gray-600">{portfolio?.description}</p>

      <div className="mt-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Trades</h2>
        <Button variant="outline" onClick={openCreateModal}>
          + Create Trade
        </Button>
      </div>

      {/* Trades List */}
      {trades.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {trades.map((t) => (
            <li
              key={t.id}
              className="border p-2 rounded flex justify-between items-center"
            >
              <div>
                {t.type} {t.quantity} {t.symbol} @ {t.price} (Fees: {t.fees})
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditModal(t)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteTrade(t.id)}
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
                className="border rounded p-1 w-full"
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
          </div>

          <DialogFooter>
            <Button
              onClick={handleSaveTrade}
              disabled={!symbol || quantity <= 0 || price <= 0}
            >
              {editingTrade ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
