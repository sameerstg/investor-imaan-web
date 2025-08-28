"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPortfolioById } from "@/methods/portfolio/portfolio";
import { Trade } from "@prisma/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { deleteTrade } from "@/methods/trade/trade";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTrade } from "@/methods/trade/trade";
import { Loader2 } from "lucide-react";

interface Prop {
  params: { id: string };
}

interface TradeInput {
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  fees: number;
  tradeDate: string;
}

interface EditFormInput {
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  fees: number;
  tradeDate: string; // Keep as string for form handling
}

export default function AllTradesPage({ params }: Prop) {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<Trade | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormInput>({
    symbol: "",
    type: "BUY",
    quantity: 0,
    price: 0,
    fees: 0,
    tradeDate: new Date().toISOString().slice(0, 16),
  });
  const [sortField, setSortField] = useState<'symbol' | 'date'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const tradesPerPage = 20;
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    getPortfolioById(params.id)
      .then((port) => {
        setPortfolio(port);
        setTrades(port?.Trade || []);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const filteredAndSortedTrades = useMemo(() => {
    // First filter by search term
    const filtered = searchTerm
      ? trades.filter(trade =>
          trade.symbol.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : trades;

    // Then sort the filtered results
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'symbol') {
        comparison = a.symbol.localeCompare(b.symbol);
      } else if (sortField === 'date') {
        comparison = new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime();
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [trades, searchTerm, sortField, sortDirection]);

  const handleSort = useCallback((field: 'symbol' | 'date') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  }, [sortField]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when search changes
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const totalPages = Math.ceil(filteredAndSortedTrades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const endIndex = startIndex + tradesPerPage;
  const paginatedTrades = filteredAndSortedTrades.slice(startIndex, endIndex);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const getSortIcon = (field: 'symbol' | 'date') => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleDelete = async (trade: Trade) => {
    setDeleting(true);
    try {
      await deleteTrade(trade.id);
      setTrades((prev) => prev.filter((t) => t.id !== trade.id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete trade:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingTrade) return;
    setIsEditing(true);
    try {
      const updated = await updateTrade(editingTrade.id, {
        ...editForm,
        tradeDate: new Date(editForm.tradeDate), // Convert string to Date here
      });
      setTrades((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      setEditingTrade(null);
    } catch (error) {
      console.error("Failed to update trade:", error);
    } finally {
      setIsEditing(false);
    }
  };

  const openEditDialog = (trade: Trade) => {
    setEditingTrade(trade);
    setEditForm({
      symbol: trade.symbol,
      type: trade.type as "BUY" | "SELL",
      quantity: trade.quantity,
      price: trade.price,
      fees: trade.fees,
      tradeDate: new Date(trade.tradeDate).toISOString().slice(0, 16),
    });
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold ">
          All Trades {portfolio?.name ? `- ${portfolio.name}` : ""}
        </h1>
        <Link href={`/portfolio/${params.id}`} passHref>
          <Button
            variant="outline"
            className="border-gray-400  hover:bg-gray-100 font-semibold"
            aria-label="Go to portfolio summary"
          >
            Back to Portfolio
          </Button>
        </Link>
      </div>
      
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by symbol..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200"
              >
                ×
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
          <Button
            variant={sortField === 'symbol' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('symbol')}
            className="flex items-center gap-2"
          >
            Symbol {getSortIcon('symbol')}
          </Button>
          <Button
            variant={sortField === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('date')}
            className="flex items-center gap-2"
          >
            Date {getSortIcon('date')}
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {paginatedTrades.length > 0 ? (
            <>
              <ul className="space-y-3">
                {paginatedTrades.map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      "border rounded-lg p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4",
                      "transition-colors",
                      "bg-gray-50 hover:bg-gray-100",
                      "dark:bg-gray-800 dark:hover:bg-gray-700",
                      "border-gray-200 dark:border-gray-700"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs font-bold",
                          t.type === "BUY"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        )}
                      >
                        {t.type}
                      </span>
                      <span className="text-gray-700 dark:text-gray-100">
                        {t.quantity} {t.symbol} @ {t.price} (Fees: {t.fees}) (Total:{" "}
                        {(t.quantity * t.price).toFixed(2)})
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(t.tradeDate).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(t)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(t)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredAndSortedTrades.length)} of {filteredAndSortedTrades.length} trades
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      Previous
                    </Button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={cn(
                              "px-3 py-1 border rounded-lg text-sm font-medium",
                              currentPage === page
                                ? "bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-400"
                                : " border-gray-300 dark:border-gray-600 hover:bg-gray-100 hover:dark:bg-gray-700"
                            )}
                            aria-label={`Go to page ${page}`}
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>
                    <Button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium  hover:bg-gray-100 hover:dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-4">
              {searchTerm 
                ? `No trades found for "${searchTerm}"`
                : "No trades found."
              }
            </p>
          )}
        </>
      )}

      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleting}
            >
              {deleting ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!editingTrade}
        onOpenChange={(open) => !open && setEditingTrade(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Symbol</Label>
              <Input
                value={editForm.symbol}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    symbol: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full border rounded-md p-2"
                value={editForm.type}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    type: e.target.value as "BUY" | "SELL",
                  }))
                }
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={editForm.quantity}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Price</Label>
              <Input
                type="number"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Fees</Label>
              <Input
                type="number"
                value={editForm.fees}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    fees: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label>Trade Date & Time</Label>
              <Input
                type="datetime-local"
                value={editForm.tradeDate}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    tradeDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTrade(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isEditing}>
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
