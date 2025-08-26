"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPortfolioById } from "@/methods/portfolio/portfolio";
import { Trade } from "@prisma/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import * as XLSX from "xlsx";

interface Prop {
  params: { id: string };
}

export default function AllTradesPage({ params }: Prop) {
  const [portfolio, setPortfolio] = useState<any>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 20;
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPortfolioById(params.id)
      .then((port) => {
        setPortfolio(port);
        setTrades(port?.Trade || []);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const totalPages = Math.ceil(trades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const endIndex = startIndex + tradesPerPage;
  const paginatedTrades = trades.slice(startIndex, endIndex);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const exportTradesToExcel = useCallback(() => {
    setIsExporting(true);
    try {
      const exportData = trades.map((t) => ({
        Symbol: t.symbol,
        Type: t.type,
        Quantity: t.quantity,
        Price: t.price.toFixed(2),
        Fees: t.fees.toFixed(2),
        Total: (t.quantity * t.price).toFixed(2),
        "Trade Date": new Date(t.tradeDate).toLocaleString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Trade Logs");

      worksheet["!cols"] = [
        { wch: 10 }, // Symbol
        { wch: 8 },  // Type
        { wch: 10 }, // Quantity
        { wch: 10 }, // Price
        { wch: 10 }, // Fees
        { wch: 12 }, // Total
        { wch: 20 }, // Trade Date
      ];

      const portfolioName = portfolio?.name?.replace(/\s+/g, "_") || "Portfolio";
      const date = new Date().toISOString().slice(0, 10);
      const fileName = `${portfolioName}_Trade_Logs_${date}.xlsx`;

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
      console.error("Failed to export trade logs:", err);
    } finally {
      setIsExporting(false);
    }
  }, [trades, portfolio]);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold ">
          All Trades {portfolio?.name ? `- ${portfolio.name}` : ""}
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={exportTradesToExcel}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50 font-semibold"
            disabled={isExporting || trades.length === 0}
            aria-label="Export trade logs to Excel"
          >
            Export Trade Logs
          </Button>
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
                        {t.quantity} {t.symbol} @ {t.price} (Fees: {t.fees}) (Total: {(t.quantity * t.price).toFixed(2)})
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
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500">
                    Showing {startIndex + 1} to {Math.min(endIndex, trades.length)} of {trades.length} trades
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
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                      ))}
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
              No trades found.
            </p>
          )}
        </>
      )}
    </div>
  );
}
