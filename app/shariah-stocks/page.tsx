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

  // Fetch cached or real-time data for a single stock
  const fetchStockData = useCallback(async (symbol: string) => {
    // Try to get cached data first
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
        companyName: `${symbol} Name`, // Placeholder, will be updated with real-time data if needed
        dayHigh,
        dayLow,
        volume,
        currentPrice,
        dayData: cachedDayData,
        allTimeData: undefined,
      };
    }

    // Fetch real-time data if no valid cache
    try {
      const [ dayData] = await Promise.all([
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
      // Filter symbols based on search query
      const filteredSymbols = symbolsOfShariahCompliantStocks.filter(
        (symbol) =>
          symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${symbol} Name`.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Fetch data one by one for symbols that haven't been fully fetched
      for (const symbol of filteredSymbols) {
        if (!fetchedSymbols.has(symbol)) {
          const newStockData = await fetchStockData(symbol);

          // Update fetched symbols
          setFetchedSymbols((prev) => {
            const newSet = new Set(prev);
            newSet.add(symbol);
            return newSet;
          });

          // Update stock data incrementally
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

  // Trigger fetch when search query changes
  useEffect(() => {
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

    // Load cached data for all symbols
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
                    companyName: `${symbol} Name`, // Will be updated with real-time data if fetched
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

  // Skeleton loader component
  const SkeletonRow = () => (
    <tr>
      {Array(7)
        .fill(0)
        .map((_, index) => (
          <td key={index} className="px-6 py-4 whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </td>
        ))}
    </tr>
  );

  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-3xl font-bold  mb-6">Shariah-Compliant Stocks</h1>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by symbol or company name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className=" rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Day High</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Day Low</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Volume</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Current Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className=" divide-y divide-gray-200">
            {isLoading && stockData.length === 0
              ? Array(5).fill(0).map((_, index) => <SkeletonRow key={index} />)
              : stockData
                  .filter(
                    (stock) =>
                      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) 
                  )
                  .map(({ symbol, dayHigh, dayLow, volume, currentPrice, dayData, allTimeData }) => (
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
                       
                        <td className="px-6 py-4 whitespace-nowrap text-sm ">{dayHigh.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm ">{dayLow.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm ">{volume.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm ">{currentPrice.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm ">
                          <button
                            onClick={() => toggleChart(symbol)}
                            className=" hover:text-blue-800 focus:outline-none"
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
                                companyName={""}
                                dayData={dayData}
                                allTimeData={allTimeData}
                              />
                            ) : (
                              <p className="text-sm">Loading chart data...</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}