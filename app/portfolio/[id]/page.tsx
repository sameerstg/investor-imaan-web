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
import { Loader2, ChevronDown, ChevronUp, Download } from "lucide-react";
import { calculateNetWorth } from "@/utils/portfolio";
import { Trade } from "@prisma/client";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

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
  const [symbolSummary, setSymbolSummary] = useState<Record<string, { cost: number; quantity: number }>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "symbol" | "type">("date");
  const [isExporting, setIsExporting] = useState(false);

  const [symbol, setSymbol] = useState("");
  const [tradeDate, setTradeDate] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [fees, setFees] = useState(0);

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
    const summary: Record<string, { cost: number; quantity: number }> = {};
    trades.forEach((t) => {
      const cost = t.type === "BUY" ? t.quantity * t.price + t.fees : -(t.quantity * t.price - t.fees);
      const qty = t.type === "BUY" ? t.quantity : -t.quantity;
      summary[t.symbol] = {
        cost: (summary[t.symbol]?.cost || 0) + cost,
        quantity: (summary[t.symbol]?.quantity || 0) + qty,
      };
    });
    setSymbolSummary(summary);
  }, [trades]);

  useEffect(() => {
    fetchPortfolio();
  }, [params]);

  const openCreateModal = () => {
    setEditingTrade(null);
    setSymbol(selectedSymbol || "");
    setType("BUY");
    setQuantity(0);
    setPrice(0);
    setFees(0);
    setTradeDate(new Date().toISOString().slice(0, 16));
    setIsModalOpen(true);
  };

  const openEditModal = (trade: Trade) => {
    setEditingTrade(trade);
    setSymbol(trade.symbol);
    setType(trade.type);
    setQuantity(trade.quantity);
    setPrice(trade.price);
    setFees(trade.fees);
    setTradeDate(trade.tradeDate.toISOString().slice(0, 16));
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
      setEditingTrade(null);
      if (!keepOpen) {
        setSymbol(selectedSymbol || "");
        setQuantity(0);
        setPrice(0);
        setFees(0);
        setTradeDate(new Date().toISOString().slice(0, 16));
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
      if (selectedSymbol && confirmDelete.symbol === selectedSymbol &&
        trades.filter(t => t.symbol === selectedSymbol).length === 1) {
        setSelectedSymbol(null);
      }
    } catch (err) {
      console.error("Failed to delete trade:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSymbolTrades = (symbol: string) => {
    setSelectedSymbol(selectedSymbol === symbol ? null : symbol);
  };

  const sortTrades = (trades: Trade[]) => {
    return [...trades].sort((a, b) => {
      if (sortBy === "date") return new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime();
      if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
      if (sortBy === "type") return a.type.localeCompare(b.type);
      return 0;
    });
  };

  const exportToExcel = () => {
  setIsExporting(true);
  try {
    // Prepare data for export
    const exportData = trades.map((trade) => ({
      Symbol: trade.symbol,
      Type: trade.type,
      Quantity: trade.quantity,
      Price: trade.price.toFixed(2),
      Fees: trade.fees.toFixed(2),
      Total: (trade.quantity * trade.price).toFixed(2),
      "Trade Date": new Date(trade.tradeDate).toLocaleString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trades");

    // Auto-size columns (optional, for better readability)
    const colWidths = [
      { wch: 10 }, // Symbol
      { wch: 8 },  // Type
      { wch: 10 }, // Quantity
      { wch: 10 }, // Price
      { wch: 10 }, // Fees
      { wch: 12 }, // Total
      { wch: 20 }, // Trade Date
    ];
    worksheet["!cols"] = colWidths;

    // Generate file name
    const portfolioName = portfolio?.name.replace(/\s+/g, "_") || "Portfolio";
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `{portfolioName}_Trades_{date}.xlsx`;

    // Generate Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to export to Excel:", err);
  } finally {
    setIsExporting(false);
  }
};

  if (!id) return null;

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      {loading ? (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-10 w-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={openCreateModal}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
              aria-label="Create new trade"
            >
              + Create Trade
            </Button>
            <Button
              onClick={exportToExcel}
              size="lg"
              variant="outline"
              className="border-green-500 text-green-600 hover:bg-green-50 font-semibold"
              disabled={isExporting || trades.length === 0}
              aria-label="Export trades to Excel"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export to Excel
            </Button>
          </div>

          {/* Portfolio Header */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800">{portfolio?.name}</h1>
            <p className="text-gray-600 mt-1">{portfolio?.description}</p>
            <div className="mt-4 p-3 rounded bg-gray-100 text-gray-800 font-semibold">
              Net Worth: {networth.toFixed(2)}
            </div>
          </div>

          {/* Symbol Summary */}
          {Object.keys(symbolSummary).length > 0 && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Symbol Summary</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSummaryOpen(!isSummaryOpen)}
                  aria-label={isSummaryOpen ? "Collapse summary" : "Expand summary"}
                >
                  {isSummaryOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </div>
              {isSummaryOpen && (
                <ul className="space-y-2">
                  {Object.entries(symbolSummary).map(([symbol, { cost, quantity }]) => (
                    <li
                      key={symbol}
                      className={cn(
                        "grid grid-cols-2 items-center rounded-lg p-3 cursor-pointer transition-colors",
                        selectedSymbol === symbol ? "bg-blue-100" : "hover:bg-blue-50"
                      )}
                      onClick={() => toggleSymbolTrades(symbol)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">{symbol}</span>
                        <span className="text-sm text-gray-500">Quantity: {quantity}</span>
                      </div>
                      <div className="text-right">
                        <span className={cost >= 0 ? "text-green-600" : "text-red-600"}>
                          {cost.toFixed(2)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Trades Section */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold">
                {selectedSymbol ? `{selectedSymbol} Trades` : "All Trades"}
              </h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  className="border rounded p-2 text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "symbol" | "type")}
                >
                  <option value="date">Sort by Date</option>
                  <option value="symbol">Sort by Symbol</option>
                  <option value="type">Sort by Type</option>
                </select>
                {selectedSymbol && (
                  <Button variant="outline" onClick={() => setSelectedSymbol(null)}>
                    Show All Trades
                  </Button>
                )}
              </div>
            </div>

            {trades.length > 0 ? (
              <ul className="space-y-3">
                {sortTrades(trades)
                  .filter((t) => !selectedSymbol || t.symbol === selectedSymbol)
                  .map((t) => (
                    <li
                      key={t.id}
                      className="border rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs font-bold",
                            t.type === "BUY" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}
                        >
                          {t.type}
                        </span>
                        <span className="text-gray-700">
                          {t.quantity} {t.symbol} @ {t.price} (Fees: {t.fees}) (Total: {(t.quantity * t.price).toFixed(2)})
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(t)}
                          aria-label={`Edit trade for {t.symbol}`}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => confirmDeleteTrade(t)}
                          aria-label={`Delete trade for {t.symbol}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No trades found. Click "Create Trade" to add your first trade.
              </p>
            )}
          </div>
        </>
      )}

      {/* Modal for create/update */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTrade ? "Update Trade" : "Create New Trade"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className={symbol ? "" : "border-red-500"}
                aria-invalid={!symbol}
              />
              {!symbol && <p className="text-red-500 text-sm mt-1">Symbol is required</p>}
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
                className={quantity > 0 ? "" : "border-red-500"}
                aria-invalid={quantity <= 0}
              />
              {quantity <= 0 && <p className="text-red-500 text-sm mt-1">Quantity must be greater than 0</p>}
            </div>

            <div>
              <Label>Price</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className={price > 0 ? "" : "border-red-500"}
                aria-invalid={price <= 0}
              />
              {price <= 0 && <p className="text-red-500 text-sm mt-1">Price must be greater than 0</p>}
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
                className={tradeDate ? "" : "border-red-500"}
                aria-invalid={!tradeDate}
              />
              {!tradeDate && <p className="text-red-500 text-sm mt-1">Trade date is required</p>}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={() => handleSaveTrade()}
              disabled={!symbol || quantity <= 0 || price <= 0 || saving}
              aria-label={editingTrade ? "Update trade" : "Save trade"}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingTrade ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
            {!editingTrade && (
              <Button
                variant="secondary"
                onClick={() => handleSaveTrade(true)}
                disabled={!symbol || quantity <= 0 || price <= 0 || saving}
                aria-label="Save and create new trade"
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
              aria-label={`Delete trade for {confirmDelete?.symbol}`}
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