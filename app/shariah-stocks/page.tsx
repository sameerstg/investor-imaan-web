'use client';
import StockChart from '@/components/StockChart';
import { symbolsOfShariahCompliantStocks } from '@/store/constant';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import { GetDayDataRealtime } from '@/methods/stockPrice';
import { TimeSeriesData } from '@/methods/stocks';

// Simplified interface without chart data
interface StockSummary {
  symbol: string;
  dayHigh: number;
  dayLow: number;
  volume: number;
  currentPrice: number;
}

interface TimeSeriesItem {
  price: number;
  volume: number;
}

export default function Page() {
  const [stockData, setStockData] = useState<StockSummary[]>([]);
  const [visibleCharts, setVisibleCharts] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchedSymbols, setFetchedSymbols] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const stocksPerPage = 10;

  // Simplified fetch for stock summary data only
  const fetchStockData = useCallback(async (symbol: string): Promise<StockSummary> => {

    try {
      const dayData = await GetDayDataRealtime(symbol) as TimeSeriesData[];
      if (Array.isArray(dayData) && dayData.length > 0) {
        const prices = dayData.map(item => item.price);
        return {
          symbol,
          dayHigh: Math.max(...prices),
          dayLow: Math.min(...prices),
          volume: dayData.reduce((sum, item) => sum + item.volume, 0),
          currentPrice: prices[prices.length - 1],
        };
      }
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
    }

    // Default return for error cases
    return {
      symbol,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      currentPrice: 0,
    };
  }, []);

  // Fetch data for paginated filtered stocks
  const fetchFilteredStockData = useCallback(async () => {
    setIsLoading(true);
    try {
      const filteredSymbols = symbolsOfShariahCompliantStocks.filter(
        (symbol) => symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const startIndex = (currentPage - 1) * stocksPerPage;
      const endIndex = startIndex + stocksPerPage;
      const symbolsToFetch = filteredSymbols.slice(startIndex, endIndex)
        .filter((symbol) => !fetchedSymbols.has(symbol));

      if (symbolsToFetch.length === 0) return;

      // Fetch data sequentially for paginated symbols
      for (const symbol of symbolsToFetch) {
        const dayData = await GetDayDataRealtime(symbol);
        if (Array.isArray(dayData) && dayData.length > 0) {
          const prices = dayData.map(item => item.price);
          setStockData(prev => {
            const existingDataMap = new Map(prev.map(stock => [stock.symbol, stock]));
            existingDataMap.set(symbol, {
              symbol,
              dayHigh: Math.max(...prices),
              dayLow: Math.min(...prices),
              volume: dayData.reduce((sum, item) => sum + item.volume, 0),
              currentPrice: prices[prices.length - 1]
            });
            return [...existingDataMap.values()];
          });
          setFetchedSymbols(prev => new Set([...prev, symbol]));
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentPage, fetchedSymbols]);

  // Debounced fetch handler
  const debouncedFetch = useCallback(debounce(fetchFilteredStockData, 300), [fetchFilteredStockData]);

  // Trigger fetch when search query or page changes
  useEffect(() => {
    debouncedFetch();
    return () => debouncedFetch.cancel(); // Cleanup debounce on unmount
  }, [searchQuery, currentPage, debouncedFetch]);

  // Initialize stockData and load cached data for first page
  useEffect(() => {
    const initialStockData = symbolsOfShariahCompliantStocks.map((symbol) => ({
      symbol,
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      currentPrice: 0,
    }));
    setStockData(initialStockData);

  }, []); // Run only once on mount

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, Math.ceil(filteredStocks.length / stocksPerPage))));
  };

  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search change
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
          onChange={handleSearchChange}
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
              : paginatedStocks.map(({ symbol, dayHigh, dayLow, volume, currentPrice }) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dayHigh.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dayLow.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{volume.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{currentPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setVisibleCharts((prev) => ({ ...prev, [symbol]: !prev[symbol] }))}
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
                        <StockChart
                          symbol={symbol}
                          companyName={symbol}
                        />
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
                  className={`px-3 py-1 border rounded-lg text-sm font-medium ${currentPage === page
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