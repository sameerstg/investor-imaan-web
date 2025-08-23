'use client';
import StockChart from '@/components/StockChart';
import { GetAllTimeData, GetDayDataCached, GetDayDataRealtime } from '@/methods/stockPrice';
import { symbolsOfShariahCompliantStocks } from '@/store/constant';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';

// Define TimeSeriesData interface
export interface TimeSeriesData {
  timestamp: number;
  price: number;
  volume: number;
  high?: number;
  low?: number;
}

// Interface for stock summary data
interface StockSummary {
  symbol: string;
  dayHigh: number;
  dayLow: number;
  volume: number;
  currentPrice: number;
  dayData: TimeSeriesData[];
  allTimeData?: TimeSeriesData[];
}

export default function Page() {
  const [stockData, setStockData] = useState<StockSummary[]>([]);
  const [visibleCharts, setVisibleCharts] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchedSymbols, setFetchedSymbols] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const stocksPerPage = 10;

  // Fetch cached or real-time data for a single stock
  const fetchStockData = useCallback(async (symbol: string) => {
    const cachedDayData = await GetDayDataCached(symbol);
    if (cachedDayData) {
      const prices = cachedDayData.map((item: TimeSeriesData) => item.price);
      const highs = cachedDayData.map((item: TimeSeriesData) => item.high || item.price);
      const lows = cachedDayData.map((item: TimeSeriesData) => item.low || item.price);
      const dayHigh = cachedDayData.length ? Math.max(...highs) : 0;
      const dayLow = cachedDayData.length ? Math.min(...lows) : 0;
      const volume = cachedDayData.reduce((sum: number, item: TimeSeriesData) => sum + item.volume, 0);
      const currentPrice = prices.length ? prices[prices.length - 1] : 0;

      return {
        symbol,
        companyName: `${symbol} Name`,
        dayHigh,
        dayLow,
        volume,
        currentPrice,
        dayData: cachedDayData,
        allTimeData: undefined,
      };
    }

    try {
      const [dayData] = await Promise.all([
        GetDayDataRealtime(symbol) as Promise<TimeSeriesData[]>,
      ]);
      const prices = dayData.map((item) => item.price);
      const highs = dayData.map((item) => item.high || item.price);
      const lows = dayData.map((item) => item.low || item.price);
      const dayHigh = dayData.length ? Math.max(...highs) : 0;
      const dayLow = dayData.length ? Math.min(...lows) : 0;
      const volume = dayData.reduce((sum, item) => sum + item.volume, 0);
      const currentPrice = prices.length ? prices[prices.length - 1] : 0;

      return {
        symbol,
        dayHigh,
        dayLow,
        volume,
        currentPrice,
        dayData,
        allTimeData: undefined,
      };
    } catch (error) {
      console.error(`Error fetching real-time data for ${symbol}:`, error);
      return {
        symbol,
        dayHigh: 0,
        dayLow: 0,
        volume: 0,
        currentPrice: 0,
        dayData: [],
        allTimeData: undefined,
      };
    }
  }, []);

  // Fetch data for filtered stocks one by one
  const fetchFilteredStockData = useCallback(async () => {
    setIsLoading(true);
    try {
      const filteredSymbols = symbolsOfShariahCompliantStocks.filter(
        (symbol) =>
          symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${symbol} Name`.toLowerCase().includes(searchQuery.toLowerCase())
      );

      for (const symbol of filteredSymbols) {
        if (!fetchedSymbols.has(symbol)) {
          const newStockData = await fetchStockData(symbol);
          setFetchedSymbols((prev) => {
            const newSet = new Set(prev);
            newSet.add(symbol);
            return newSet;
          });

          setStockData((prev) => {
            const existingDataMap = new Map(prev.map((stock) => [stock.symbol, stock]));
            existingDataMap.set(symbol, newStockData);
            return symbolsOfShariahCompliantStocks.map(
              (s) => existingDataMap.get(s) || {
                symbol: s,
                companyName: `${s} Name`,
                dayHigh: 0,
                dayLow: 0,
                volume: 0,
                currentPrice: 0,
                dayData: [],
                allTimeData: undefined,
              }
            );
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, fetchedSymbols, fetchStockData]);

  // Trigger fetch when search query changes and reset to page 1
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on search change
    fetchFilteredStockData();
  }, [searchQuery, fetchFilteredStockData]);

  // Initialize stockData with all symbols
  useEffect(() => {
    const initialStockData = symbolsOfShariahCompliantStocks.map((symbol) => ({
      symbol,
      companyName: `${symbol} Name`,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      currentPrice: 0,
      dayData: [],
      allTimeData: undefined,
    }));
    setStockData(initialStockData);

    const loadCachedData = async () => {
      for (const symbol of symbolsOfShariahCompliantStocks) {
        const cachedData = await GetDayDataCached(symbol);
        if (cachedData) {
          const prices = cachedData.map((item: TimeSeriesData) => item.price);
          const highs = cachedData.map((item: TimeSeriesData) => item.high || item.price);
          const lows = cachedData.map((item: TimeSeriesData) => item.low || item.price);
          const dayHigh = cachedData.length ? Math.max(...highs) : 0;
          const dayLow = cachedData.length ? Math.min(...lows) : 0;
          const volume = cachedData.reduce((sum: number, item: TimeSeriesData) => sum + item.volume, 0);
          const currentPrice = prices.length ? prices[prices.length - 1] : 0;

          setStockData((prev) =>
            prev.map((stock) =>
              stock.symbol === symbol
                ? {
                    ...stock,
                    companyName: `${symbol} Name`,
                    dayHigh,
                    dayLow,
                    volume,
                    currentPrice,
                    dayData: cachedData,
                  }
                : stock
            )
          );
          setFetchedSymbols((prev) => {
            const newSet = new Set(prev);
            newSet.add(symbol);
            return newSet;
          });
        }
      }
    };
    loadCachedData();
  }, []);

  // Fetch allTimeData when chart is toggled
  const toggleChart = async (symbol: string) => {
    setVisibleCharts((prev) => ({
      ...prev,
      [symbol]: !prev[symbol],
    }));

    if (!visibleCharts[symbol]) {
      try {
        const allTimeData = await GetAllTimeData(symbol);
        setStockData((prev) =>
          prev.map((s) =>
            s.symbol === symbol ? { ...s, allTimeData } : s
          )
        );
      } catch (error) {
        console.error(`Error fetching all-time data for ${symbol}:`, error);
        setStockData((prev) =>
          prev.map((s) =>
            s.symbol === symbol ? { ...s, allTimeData: [] } : s
          )
        );
      }
    }
  };

  // Pagination logic
  const filteredStocks = stockData.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredStocks.length / stocksPerPage);
  const startIndex = (currentPage - 1) * stocksPerPage;
  const endIndex = startIndex + stocksPerPage;
  const paginatedStocks = filteredStocks.slice(startIndex, endIndex);

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr>
      {Array(7).fill(0).map((_, index) => (
        <td key={index} className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        </td>
      ))}
    </tr>
  );

  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-3xl font-bold mb-6">Shariah-Compliant Stocks</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by symbol or company name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day High</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day Low</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading && paginatedStocks.length === 0
              ? Array(stocksPerPage).fill(0).map((_, index) => <SkeletonRow key={index} />)
              : paginatedStocks.map(({ symbol, dayHigh, dayLow, volume, currentPrice, dayData, allTimeData }) => (
                  <React.Fragment key={symbol}>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link
                          href={`/stock/${symbol}`}
                          className="text-gray-900 font-medium hover:text-blue-600 block w-full h-full"
                        >
                          {symbol}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dayHigh.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${dayLow.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{volume.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${currentPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => toggleChart(symbol)}
                          className="text-gray-500 hover:text-blue-800 focus:outline-none"
                          aria-label={visibleCharts[symbol] ? `Hide chart for ${symbol}` : `Show chart for ${symbol}`}
                        >
                          <svg
                            className={`w-5 h-5 transform transition-transform ${visibleCharts[symbol] ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    {visibleCharts[symbol] && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4">
                          {dayData && allTimeData ? (
                            <StockChart
                              symbol={symbol}
                              companyName=""
                              dayData={dayData}
                              allTimeData={allTimeData}
                            />
                          ) : (
                            <p className="text-sm text-gray-500">Loading chart data...</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredStocks.length)} of {filteredStocks.length} stocks
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1 border rounded-lg text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}