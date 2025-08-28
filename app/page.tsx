'use client';
import { useState } from 'react';
import StockChart from '@/components/StockChart';

export default function IndicesPage() {
  const [activeTab, setActiveTab] = useState('KSE100');

  const indices = [
    { symbol: 'KMI30' },
    { symbol: 'KMIALLSHR' },
    { symbol: 'KSE100' },
    { symbol: 'ALLSHR' },
    { symbol: 'KSE30' },
    { symbol: 'PSXDIV20' },
    { symbol: 'BKTI' },
    { symbol: 'OGTI' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-5">
      <h1 className="text-2xl sm:text-3xl font-bold  mb-4 sm:mb-6">
        Stock Index Charts
      </h1>
      <div className="flex overflow-x-auto space-x-2 sm:space-x-4 mb-4 sm:mb-6 border-b border-gray-200 pb-2 sm:pb-0 snap-x snap-mandatory">
        {indices.map((index) => (
          <button
            key={index.symbol}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap snap-start ${activeTab === index.symbol
              ? 'border-b-2 border-blue-600 text-blue-600'
              : ' hover:text-blue-600'
              }`}
            onClick={() => setActiveTab(index.symbol)}
            aria-selected={activeTab === index.symbol}
            role="tab"
          >
            {index.symbol}
          </button>
        ))}
      </div>
      <div className="w-full">
        {indices.map((index) => (
          activeTab === index.symbol && (
            <StockChart
              key={index.symbol}
              symbol={index.symbol}
              companyName={index.symbol}
            />
          )
        ))}
      </div>
    </div>
  );
}