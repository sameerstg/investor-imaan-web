'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GetAllSymbols, SymbolData } from '@/methods/stocks';

interface Stock {
  company: string;
  open: string;
  high: string;
  low: string;
  close: string;
  average: string;
  volume: string;
  trades: string;
  changeNet: string;
  symbol?: string;
}

interface SortConfig {
  key: keyof Stock;
  direction: 'asc' | 'desc';
}

export default function Home() {


  const [stocks, setStocks] = useState<Stock[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [symbols, setSymbols] = useState<SymbolData[]>([]);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch('/api/stocks');
        const data = await response.json();
        if (response.ok) {
          setStocks(
            data.map((stock: Stock) => ({
              ...stock,
              symbol: stock.symbol || stock.company.split(' ')[0].toUpperCase(),
            }))
          );
        } else {
          setError(data.error || 'Failed to load stocks');
        }
      } catch (err) {
        setError('An error occurred while fetching stock data');
      }
    };

    fetchStocks();
    const fetchSymbols = async () => {

      const data = await GetAllSymbols();
      setSymbols(data);
    }
    fetchSymbols();
  }, []);

  // Filter stocks based on search query
  const filteredStocks = stocks.filter((stock) =>
    stock.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort stocks based on sortConfig
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    const aValue = a[key];
    const bValue = b[key];

    if (aValue == null) return 0;
    if (bValue == null) return 0;

    const numericColumns: (keyof Stock)[] = [
      'open',
      'high',
      'low',
      'close',
      'average',
      'volume',
      'trades',
      'changeNet',
    ];
    if (numericColumns.includes(key)) {
      const aNum = parseFloat(aValue.replace(/[^0-9.-]+/g, '')) || 0;
      const bNum = parseFloat(bValue.replace(/[^0-9.-]+/g, '')) || 0;
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    return direction === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Handle column header click to sort
  const handleSort = (key: keyof Stock) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center font-semibold text-sm sm:text-base">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6">
      <h1 className="text-xl sm:text-3xl font-bold mb-4 text-gray-800">
        KMIALL Stocks
      </h1>
      <p>{JSON.stringify(symbols)}</p>
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by company name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          aria-label="Search stocks by company name"
        />
      </div>
      {sortedStocks.length === 0 && stocks.length > 0 ? (
        <p className="text-gray-600 text-center text-sm sm:text-base">
          No stocks match your search.
        </p>
      ) : sortedStocks.length === 0 ? (
        <p className="text-gray-600 text-center text-sm sm:text-base">
          Loading...
        </p>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table
              className="min-w-full bg-white shadow-md rounded-lg border border-gray-200"
              aria-label="Stock data table"
            >
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {[
                    { key: 'symbol', label: 'Symbol', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h-2m-2 0h-2m-2 0h-2m-2 0h-2M7 7h10' },
                    { key: 'company', label: 'Company', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h-2m-2 0h-2m-2 0h-2m-2 0h-2M7 7h10' },
                    { key: 'open', label: 'Open', icon: 'M5 10l7-7m0 0l7 7m-7-7v18' },
                    { key: 'high', label: 'High', icon: 'M5 15l7-7m0 0l7 7m-7-7V3' },
                    { key: 'low', label: 'Low', icon: 'M5 10l7 7m0 0l7-7m7 7V3' },
                    { key: 'close', label: 'Close', icon: 'M6 18L18 6M6 6l12 12' },
                    { key: 'average', label: 'Avg.', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                    { key: 'volume', label: 'Volume', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                    { key: 'trades', label: 'Trades', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                    { key: 'changeNet', label: 'Change / Net', icon: 'M8 7v8m4-8v8m4-8v8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z' },
                  ].map(({ key, label, icon }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key as keyof Stock)}
                      className={`px-4 py-2 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors touch-none ${sortConfig?.key === key ? 'bg-gray-200 font-bold' : ''
                        }`}
                    // aria-sort={
                    //   sortConfig?.key === key
                    //     ? sortConfig.direction
                    //     : 'none'
                    // }
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 inline-block mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={icon}
                          />
                        </svg>
                        {label}
                        {sortConfig?.key === key && (
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={
                                sortConfig.direction === 'asc'
                                  ? 'M5 10l7-7m0 0l7 7m-7-7v18'
                                  : 'M19 14l-7 7m0 0l-7-7m7 7V3'
                              }
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map((stock, index) => {
                  const isNegative = stock.changeNet.startsWith('-');
                  return (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">
                        <Link
                          href={`/stock/${stock.symbol}`}
                          className="block w-full h-full"
                          aria-label={`View details for ${stock.company}`}
                        >
                          {/* {symbols.find(x => x.name.toLowerCase() === stock.company.toLowerCase())?.symbol || 'N/A'
                          } */}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">
                        <Link
                          href={`/stock/${stock.symbol}`}
                          className="block w-full h-full"
                        >
                          {stock.company}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">
                        {stock.open}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">
                        {stock.high}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">
                        {stock.low}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">
                        {stock.close}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">
                        {stock.average}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">
                        {stock.volume}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-b border-gray-200">
                        {stock.trades}
                      </td>
                      <td
                        className={`px-4 py-2 text-sm border-b border-gray-200 flex items-center ${isNegative ? 'text-red-500' : 'text-green-500'
                          }`}
                      >
                        {isNegative ? (
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 10l7-7m0 0l7 7m-7-7v18"
                            />
                          </svg>
                        )}
                        {stock.changeNet}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-4">
            {sortedStocks.map((stock, index) => {
              const isNegative = stock.changeNet.startsWith('-');
              return (
                <Link
                  key={index}
                  href={`/stock/${stock.symbol}`}
                  className="block bg-white shadow-md rounded-lg p-4 border border-gray-200 hover:bg-gray-50 transition-colors"
                  aria-label={`View details for ${stock.company}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-base font-semibold text-gray-800">
                      {stock.company} ({stock.symbol})
                    </h2>
                    <div
                      className={`flex items-center text-sm ${isNegative ? 'text-red-500' : 'text-green-500'
                        }`}
                    >
                      {isNegative ? (
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
                      )}
                      {stock.changeNet}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                    <div>
                      <span className="font-medium">Open:</span> {stock.open}
                    </div>
                    <div>
                      <span className="font-medium">High:</span> {stock.high}
                    </div>
                    <div>
                      <span className="font-medium">Low:</span> {stock.low}
                    </div>
                    <div>
                      <span className="font-medium">Close:</span> {stock.close}
                    </div>
                    <div>
                      <span className="font-medium">Avg:</span> {stock.average}
                    </div>
                    <div>
                      <span className="font-medium">Volume:</span> {stock.volume}
                    </div>
                    <div>
                      <span className="font-medium">Trades:</span> {stock.trades}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}