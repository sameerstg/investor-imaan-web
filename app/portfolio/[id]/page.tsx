"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
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
import { GetDayDataCached, GetDayDataRealtime } from "@/methods/stockPrice";
import { Loader2, Download, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import { Trade } from "@prisma/client";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { debounce } from "lodash";
import pLimit from "p-limit";
import Link from "next/link";
import StockChart from "@/components/StockChart";
import TimeSeriesChart from "@/components/TimeSeriesChart"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement, 
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Define TimeSeriesData interface
interface TimeSeriesData {
  timestamp: number;
  price: number;
  volume: number;
  high?: number;
  low?: number;
}

type PortfolioWithTrades = {
  id: string;
  name: string;
  description: string;
  trades?: Trade[];
};

interface Prop {
  params: Promise<{ id: string }>;
}

interface SymbolSummaryItemProps {
  symbol: string;
  cost: number;
  quantity: number;
  avgBuyPrice: number;
  realizedProfit: number;
  currentPrice: number | null;
  isLoadingPrice: boolean;
  selectedSymbol: string | null;
  visibleCharts: Record<string, boolean>;
  toggleChart: (symbol: string) => void;
}

const SymbolSummaryItem = memo(({ symbol, cost, quantity, avgBuyPrice, realizedProfit, currentPrice, isLoadingPrice, selectedSymbol, visibleCharts, toggleChart }: SymbolSummaryItemProps) => {
  const unrealizedProfit = currentPrice && quantity > 0 ? currentPrice * quantity - cost : 0;
  const totalProfit = unrealizedProfit + realizedProfit;
  const percentProfit = cost !== 0 ? (totalProfit / Math.abs(cost)) * 100 : 0;

  let avgPriceColor = "text-gray-800";
  let ArrowIcon = null;
  if (currentPrice !== null && quantity > 0) {
    if (avgBuyPrice > currentPrice) {
      avgPriceColor = "text-red-600";
      ArrowIcon = <ArrowDown className="inline w-4 h-4 ml-1 text-red-600" />;
    } else if (avgBuyPrice < currentPrice) {
      avgPriceColor = "text-green-600";
      ArrowIcon = <ArrowUp className="inline w-4 h-4 ml-1 text-green-600" />;
    }
  }

  return (
    <>
      <li className={cn(
        "grid grid-cols-6 items-center rounded-lg p-3 transition-colors", // Changed to 6 columns
        selectedSymbol === symbol ? "bg-blue-100" : "hover:bg-blue-50"
      )}>
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{symbol}</span>
          <span className="text-sm text-gray-500">Quantity: {quantity}</span>
        </div>
        <div className="text-right">
          <span className={avgPriceColor}>
            {avgBuyPrice.toFixed(2)}
            {ArrowIcon}
          </span>
          <span className="block text-sm text-gray-500">Avg Buy Price</span>
        </div>
        <div className="text-right">
          {isLoadingPrice ? (
            <div className="flex items-center justify-end gap-2">
              <span className="text-gray-800">{currentPrice ? currentPrice.toFixed(2) : "N/A"}</span>
              <Loader2 className="text-gray-800 w-4 h-4 animate-spin" />
            </div>
          ) : (
            <span className="text-gray-800">{currentPrice ? currentPrice.toFixed(2) : "N/A"}</span>
          )}
          <span className="block text-sm text-gray-500">Current Price</span>
        </div>
        <div className="text-right">
          <span className={cost >= 0 ? "text-green-600" : "text-red-600"}>{cost.toFixed(2)}</span>
          <span className="block text-sm text-gray-500">Cost</span>
        </div>
        <div className="text-right">
          <span className={totalProfit >= 0 ? "text-green-600" : "text-red-600"}>
            {totalProfit.toFixed(2)}
            <span className="ml-1 text-xs">
              ({percentProfit >= 0 ? "+" : ""}
              {percentProfit.toFixed(2)}%)
            </span>
          </span>
          <span className="block text-sm text-gray-500">Total Profit</span>
        </div>
        <div className="text-right">
          <button
            onClick={() => toggleChart(symbol)}
            className="text-gray-500 hover:text-blue-800 focus:outline-none"
            aria-label={visibleCharts[symbol] ? `Hide chart for ${symbol}` : `Show chart for ${symbol}`}
          >
            <svg
              className={`w-5 h-5 transfo transition-transfo ${visibleCharts[symbol] ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </li>
      {visibleCharts[symbol] && (
        <li className="py-4">
          <StockChart symbol={symbol} companyName={symbol} />
        </li>
      )}
    </>
  );
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Page({ params }: Prop) {
  const [id, setId] = useState<null | string>(null);
  const [portfolio, setPortfolio] = useState<PortfolioWithTrades | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confiDelete, setConfiDelete] = useState<Trade | null>(null);
  const [symbolSummary, setSymbolSummary] = useState<
    Record<string, { cost: number; quantity: number; avgBuyPrice: number; realizedProfit: number }>
  >({});
  const [currentPrices, setCurrentPrices] = useState<Record<string, { price: number | null; loading: boolean }>>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [tradeDate, setTradeDate] = useState("");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [fees, setFees] = useState(0);
  const [visibleCharts, setVisibleCharts] = useState<Record<string, boolean>>({});
  const [pnlData, setPnlData] = useState<{ date: string; pnl: number }[]>([]);

  const toggleChart = useCallback((symbol: string) => {
    setVisibleCharts(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  }, []);

  // Fetch current price for a single symbol
  const fetchCurrentPrice = useCallback(async (symbol: string): Promise<{ symbol: string; price: number | null }> => {
    const limit = pLimit(5); // Limit to 5 concurrent requests
    try {
      const cachedData = await limit(() => GetDayDataCached(symbol));
      if (cachedData?.length) {
        return { symbol, price: cachedData[cachedData.length - 1].price };
      }
      const realTimeData : any = await limit(() => GetDayDataRealtime(symbol));
      return { symbol, price: realTimeData.length ? realTimeData[realTimeData.length - 1].price : null };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return { symbol, price: null }; // Return null to keep old price
    }
  }, []);

  // Fetch prices for all symbols in summary (debounced)
  const fetchAllPrices = useCallback(
    debounce(async () => {
      const symbols = Object.keys(symbolSummary);
      if (symbols.length === 0) return;

      // Set loading state without resetting prices
      setCurrentPrices((prev) => {
        const newPrices = { ...prev };
        symbols.forEach((symbol) => {
          newPrices[symbol] = {
            price: newPrices[symbol]?.price || null, // Preserve existing price
            loading: true,
          };
        });
        return newPrices;
      });

      const results = await Promise.all(symbols.map((symbol) => fetchCurrentPrice(symbol)));

      // Update only with successful fetches
      setCurrentPrices((prev) => {
        const newPrices = { ...prev };
        results.forEach(({ symbol, price }) => {
          newPrices[symbol] = {
            price: price !== null ? price : prev[symbol]?.price || null, // Keep old price if fetch fails
            loading: false,
          };
        });
        return newPrices;
      });
    }, 1000*60),
    [symbolSummary, fetchCurrentPrice]
  );

  const fetchPortfolio = useCallback(async () => {
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
  }, [params]);

  // Modify the summary calculation with null checks
  const { summary, totalCost, totalPnL } = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { summary: {}, totalCost: 0, totalPnL: 0 };
    }

    const summary: Record<string, { cost: number; quantity: number; avgBuyPrice: number; realizedProfit: number }> = {};
    const buyTrades: Record<string, { totalCost: number; totalQuantity: number }> = {};

    trades.forEach((t) => {
      if (!t) return; // Skip if trade is undefined
      const cost = t.type === "BUY" ? t.quantity * t.price + t.fees : -(t.quantity * t.price - t.fees);
      const qty = t.type === "BUY" ? t.quantity : -t.quantity;

      if (t.type === "BUY") {
        buyTrades[t.symbol] = {
          totalCost: (buyTrades[t.symbol]?.totalCost || 0) + (t.quantity * t.price + t.fees),
          totalQuantity: (buyTrades[t.symbol]?.totalQuantity || 0) + t.quantity,
        };
      }

      const avgBuyPrice = buyTrades[t.symbol]?.totalQuantity
        ? buyTrades[t.symbol].totalCost / buyTrades[t.symbol].totalQuantity
        : 0;
      const realizedProfit = t.type === "SELL" ? (t.price - avgBuyPrice) * t.quantity - t.fees : 0;

      summary[t.symbol] = {
        cost: (summary[t.symbol]?.cost || 0) + cost,
        quantity: (summary[t.symbol]?.quantity || 0) + qty,
        avgBuyPrice,
        realizedProfit: (summary[t.symbol]?.realizedProfit || 0) + realizedProfit,
      };
    });

    let totalCost = 0;
    let totalPnL = 0;

    if (Object.keys(summary).length > 0) {
      Object.entries(summary).forEach(([symbol, { cost, quantity, realizedProfit }]) => {
        const currentPrice = currentPrices[symbol]?.price;
        if (currentPrice && quantity > 0) {
          totalPnL += (currentPrice * quantity - cost) + realizedProfit;
        } else {
          totalPnL += realizedProfit;
        }
        totalCost += cost;
      });
    }

    return { summary, totalCost, totalPnL };
  }, [trades, currentPrices]);

  // Calculate overall PnL percentage
  const totalPnLPercent = totalCost !== 0 ? (totalPnL / Math.abs(totalCost)) * 100 : 0;

  const calculatePnLHistory = useCallback(() => {
    const pnlHistory: { date: string; pnl: number }[] = [];
    let runningPnL = 0;
    
    // Sort trades by date
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime()
    );

    const holdings: Record<string, { quantity: number; totalCost: number }> = {};

    sortedTrades.forEach(trade => {
      const date = new Date(trade.tradeDate).toISOString().split('T')[0];
      
      if (trade.type === 'BUY') {
        if (!holdings[trade.symbol]) {
          holdings[trade.symbol] = { quantity: 0, totalCost: 0 };
        }
        holdings[trade.symbol].quantity += trade.quantity;
        holdings[trade.symbol].totalCost += (trade.quantity * trade.price) + trade.fees;
      } else {
        // SELL
        const avgBuyPrice = holdings[trade.symbol]?.totalCost / holdings[trade.symbol]?.quantity || 0;
        const profit = (trade.price - avgBuyPrice) * trade.quantity - trade.fees;
        runningPnL += profit;
        
        if (holdings[trade.symbol]) {
          holdings[trade.symbol].quantity -= trade.quantity;
          if (holdings[trade.symbol].quantity > 0) {
            holdings[trade.symbol].totalCost = avgBuyPrice * holdings[trade.symbol].quantity;
          } else {
            delete holdings[trade.symbol];
          }
        }
      }

      // Calculate unrealized PnL for current holdings
      let unrealizedPnL = 0;
      Object.entries(holdings).forEach(([symbol, { quantity, totalCost }]) => {
        const currentPrice = currentPrices[symbol]?.price;
        if (currentPrice && quantity > 0) {
          unrealizedPnL += (currentPrice * quantity) - totalCost;
        }
      });

      pnlHistory.push({
        date,
        pnl: runningPnL + unrealizedPnL
      });
    });

    return pnlHistory;
  }, [trades, currentPrices]);

  // Update PnL data when trades or prices change
  useEffect(() => {
    setPnlData(calculatePnLHistory());
  }, [calculatePnLHistory]);

  useEffect(() => {
    setSymbolSummary(summary);
  }, [summary, totalCost]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Fetch cached prices as soon as trades are loaded, before summary is calculated
  useEffect(() => {
    if (!trades.length) return;

    let cancelled = false;
    const symbols = Array.from(new Set(trades.map(t => t.symbol)));

    // First fetch all cached data
    const fetchCachedPrices = async () => {
      const cachedPrices: Record<string, { price: number | null; loading: boolean }> = {};
      await Promise.all(symbols.map(async (symbol) => {
        try {
          const cachedData = await GetDayDataCached(symbol);
          if (cachedData?.length) {
            cachedPrices[symbol] = {
              price: cachedData[cachedData.length - 1].price,
              loading: true, // Still loading as we'll fetch real-time data next
            };
          } else {
            cachedPrices[symbol] = { price: null, loading: true };
          }
        } catch (error) {
          console.error(`Error fetching cached data for ${symbol}:`, error);
          cachedPrices[symbol] = { price: null, loading: true };
        }
      }));

      if (!cancelled) {
        setCurrentPrices(cachedPrices);
      }
    };

    // Then fetch real-time data
    const fetchRealtimePrices = async () => {
      const limit = pLimit(5);
      const results = await Promise.all(
        symbols.map(symbol =>
          limit(async () => {
            try {
              const realTimeData = await GetDayDataRealtime(symbol) as TimeSeriesData[];
              return {
                symbol,
                price: realTimeData.length ? realTimeData[realTimeData.length - 1].price : null
              };
            } catch (error) {
              console.error(`Error fetching real-time data for ${symbol}:`, error);
              return { symbol, price: null };
            }
          })
        )
      );

      if (!cancelled) {
        setCurrentPrices(prev => {
          const newPrices = { ...prev };
          results.forEach(({ symbol, price }) => {
            newPrices[symbol] = {
              price: price !== null ? price : prev[symbol]?.price || null, // Keep cached price if realtime fails
              loading: false
            };
          });
          return newPrices;
        });
      }
    };

    const fetchAllData = async () => {
      await fetchCachedPrices();
      await fetchRealtimePrices();
    };

    fetchAllData();

    return () => { cancelled = true; };
  }, [trades]);

  const openCreateModal = useCallback(() => {
    setEditingTrade(null);
    setSymbol(selectedSymbol || "");
    setType("BUY");
    setQuantity(0);
    setPrice(0);
    setFees(0);
    setTradeDate(new Date().toISOString().slice(0, 16));
    setIsModalOpen(true);
  }, [selectedSymbol]);

  const handleSaveTrade = useCallback(async (keepOpen = false) => {
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
        setTrades((prev) => prev.map((t) => (t.id === updatedTrade.id ? updatedTrade : t)));
      } else {
        updatedTrade = await createTrade(id, {
          symbol,
          type,
          quantity,
          price,
          fees,
          tradeDate: new Date(tradeDate),
        });
        setTrades((prev) => [...prev, updatedTrade]);
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
  }, [symbol, type, quantity, price, fees, tradeDate, id, editingTrade, selectedSymbol]);

  const handleDeleteTrade = useCallback(async () => {
    if (!confiDelete) return;
    setDeletingId(confiDelete.id);
    try {
      await deleteTrade(confiDelete.id);
      setTrades((prev) => prev.filter((t) => t.id !== confiDelete.id));
      setConfiDelete(null);
      if (selectedSymbol && confiDelete.symbol === selectedSymbol &&
        trades.filter(t => t.symbol === selectedSymbol).length === 1) {
        setSelectedSymbol(null);
      }
    } catch (err) {
      console.error("Failed to delete trade:", err);
    } finally {
      setDeletingId(null);
    }
  }, [confiDelete, selectedSymbol, trades]);


  // Export all asset statement (all trades, not just paginated)
  const exportToExcel = useCallback(() => {
    setIsExporting(true);
    try {
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
        "Avg Buy Price": symbolSummary[trade.symbol]?.avgBuyPrice.toFixed(2) || "N/A",
        Profit: currentPrices[trade.symbol]?.price && symbolSummary[trade.symbol]?.quantity > 0
          ? (currentPrices[trade.symbol].price! * symbolSummary[trade.symbol].quantity - symbolSummary[trade.symbol].cost).toFixed(2)
          : "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Asset Statement");

      const colWidths = [
        { wch: 10 }, // Symbol
        { wch: 8 },  // Type
        { wch: 10 }, // Quantity
        { wch: 10 }, // Price
        { wch: 10 }, // Fees
        { wch: 12 }, // Total
        { wch: 20 }, // Trade Date
        { wch: 12 }, // Avg Buy Price
        { wch: 12 }, // Profit
      ];
      worksheet["!cols"] = colWidths;

      const portfolioName = portfolio?.name?.replace(/\s+/g, "_") || "Portfolio";
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `${portfolioName}_Asset_Statement_${date}.xlsx`;

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/vnd.openxmlfoats-officedocument.spreadsheetml.sheet" });
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
  }, [trades, portfolio, symbolSummary, currentPrices]);

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
              aria-label="Export asset statement to Excel"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export Asset Statement
            </Button>
            <Button
              onClick={fetchAllPrices}
              size="lg"
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold"
              disabled={Object.values(currentPrices).some((p) => p.loading)}
              aria-label="Refresh prices"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Prices
            </Button>
            <Link
              href={`/portfolio/${id}/trades`}
            >
              <Button
                size="lg"
                variant="outline"
                className="border-gray-400 text-gray-700 hover:bg-gray-100 font-semibold"
                aria-label="Go to all trades"
              >
                View All Trades
              </Button>
            </Link>
          </div>

          {/* Portfolio Header */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800">{portfolio?.name}</h1>
            <p className="text-gray-600 mt-1">{portfolio?.description}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Portfolio Cost</div>
                <div className="text-2xl font-bold text-gray-900">
                   {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className={`rounded-lg p-4 ${totalPnL >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="text-sm text-gray-600 mb-1">Total Profit/Loss</div>
                <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                   {totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm ml-2">
                    ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PnL Chart */}
          <TimeSeriesChart
            title="Portfolio PnL"
            dayData={pnlData.map(d => ({ x: d.date, y: d.pnl.toFixed(2) })) as any[]}
            allTimeData={pnlData.map(d => ({ x: d.date, y: d.pnl.toFixed(2) })) as any[]}
            yAxisTitle="Profit/Loss"
            lineColor={totalPnL >= 0 ? "#16a34a" : "#dc2626"}
            fillColor={totalPnL >= 0 ? "rgba(22, 163, 74, 0.5)" : "rgba(220, 38, 38, 0.5)"}
          />

          {/* Symbol Summary */}
          {Object.keys(symbolSummary).length > 0 && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Symbol Summary</h3>
              <ul className="space-y-2">
                {Object.entries(symbolSummary).map(([symbol, { cost, quantity, avgBuyPrice, realizedProfit }]) => (
                  <SymbolSummaryItem
                    key={symbol}
                    symbol={symbol}
                    cost={cost}
                    quantity={quantity}
                    avgBuyPrice={avgBuyPrice}
                    realizedProfit={realizedProfit}
                    currentPrice={currentPrices[symbol]?.price}
                    isLoadingPrice={currentPrices[symbol]?.loading}
                    selectedSymbol={selectedSymbol}
                    visibleCharts={visibleCharts}
                    toggleChart={toggleChart}
                  />
                ))}
              </ul>
            </div>
          )}
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

      {/* Confi Delete Modal */}
      <Dialog open={!!confiDelete} onOpenChange={() => setConfiDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confi Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{confiDelete?.symbol}</span> trade?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfiDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrade}
              disabled={deletingId === confiDelete?.id}
              aria-label={`Delete trade for ${confiDelete?.symbol}`}
            >
              {deletingId === confiDelete?.id ? (
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