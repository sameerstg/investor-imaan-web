'use client';
import StockChart from '@/components/StockChart';
import { GetAllTimeData, GetCompanyName, GetDayData } from '@/methods/stocks';
import { symbolsOfShariahCompliantStocks } from '@/store/constant';
import React, { useState, useEffect } from 'react';

// Define TimeSeriesData interface
export interface TimeSeriesData {
  timestamp: number;
  price: number;
  volume: number;
  high?: number; // Optional, if API provides
  low?: number; // Optional, if API provides
}

// Interface for stock summary data (for table)
interface StockSummary {
  symbol: string;
  companyName: string;
  dayHigh: number;
  dayLow: number;
  volume: number;
  currentPrice: number;
  dayData: TimeSeriesData[]; // Fetched initially
  allTimeData?: TimeSeriesData[]; // Fetched lazily
}


export default function Page() {
  // State for table data and chart visibility
  const [stockData, setStockData] = useState<StockSummary[]>([]);
  const [visibleCharts, setVisibleCharts] = useState<{ [key: string]: boolean }>({});

  // Initial fetch for table data and dayData
  useEffect(() => {
    const fetchInitialData = async () => {
      const dataPromises = symbolsOfShariahCompliantStocks.map(async (symbol: string) => {
        try {
          const [companyName, dayData] = await Promise.all([
            GetCompanyName(symbol),
            GetDayData(symbol) as Promise<TimeSeriesData[]>,
          ]);
          // Compute summary data from dayData
          const prices = dayData.map((item) => item.price);
          const highs = dayData.map((item) => item.high || item.price);
          const lows = dayData.map((item) => item.low || item.price);
          const dayHigh = dayData.length ? Math.max(...highs) : 0;
          const dayLow = dayData.length ? Math.min(...lows) : 0;
          const volume = dayData.reduce((sum, item) => sum + item.volume, 0);
          const currentPrice = prices.length ? prices[prices.length - 1] : 0;

          return {
            symbol,
            companyName,
            dayHigh,
            dayLow,
            volume,
            currentPrice,
            dayData,
            allTimeData: undefined, // Not fetched initially
          };
        } catch (error) {
          console.error(`Error fetching initial data for ${symbol}:`, error);
          return {
            symbol,
            companyName: `${symbol} Name`,
            dayHigh: 0,
            dayLow: 0,
            volume: 0,
            currentPrice: 0,
            dayData: [],
            allTimeData: undefined,
          };
        }
      });

      const resolvedData = await Promise.all(dataPromises);
      setStockData(resolvedData);
    };

    fetchInitialData();
  }, []);

  // Fetch allTimeData when chart is toggled
  const toggleChart = async (symbol: string) => {
    // Toggle visibility
    setVisibleCharts((prev) => ({
      ...prev,
      [symbol]: !prev[symbol],
    }));

    // Fetch allTimeData if not already loaded
    if (!visibleCharts[symbol]) {
      setStockData((prevData) =>
        prevData.map((stock) => {
          if (stock.symbol === symbol && !stock.allTimeData) {
            // Trigger fetch for allTimeData
            GetAllTimeData(symbol)
              .then((allTimeData) => {
                setStockData((prev:any) =>
                  prev.map((s:any) =>
                    s.symbol === symbol
                      ? { ...s, allTimeData }
                      : s
                  )
                );
              })
              .catch((error) => {
                console.error(`Error fetching all-time data for ${symbol}:`, error);
                setStockData((prev) =>
                  prev.map((s) =>
                    s.symbol === symbol
                      ? { ...s, allTimeData: [] }
                      : s
                  )
                );
              });
          }
          return stock;
        })
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Shariah-Compliant Stocks</h1>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day High</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day Low</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stockData.map(({ symbol, companyName, dayHigh, dayLow, volume, currentPrice, dayData, allTimeData }) => (
              <React.Fragment key={symbol}>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dayHigh.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dayLow.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{volume.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{currentPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => toggleChart(symbol)}
                      className="text-blue-600 hover:text-blue-800 focus:outline-none"
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
                          companyName={companyName}
                          dayData={dayData}
                          allTimeData={allTimeData}
                        />
                      ) : (
                        <p className="text-gray-500 text-sm">Loading chart data...</p>
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