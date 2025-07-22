'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Define TypeScript interfaces for the API data
interface TableData {
  priceHistory: string[][];
  dividendData: string[][];
  announcementData: string[][];
  companyImageSrc: string;
  companyName: string;
  currentPrice: string;
  priceChange: string;
}

interface ResponseData {
  allData: TableData;
}

const StockDetailsPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [data, setData] = useState<TableData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!symbol) return;
      try {
        const response = await fetch(`/api/stock?symbol=${symbol}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const result: ResponseData = await response.json();
        setData(result.allData);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [symbol]);

  if (loading) {
    return <div className="text-center text-xl mt-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">Error: {error}</div>;
  }

  if (!data) {
    return <div className="text-center text-xl mt-10">No data available</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Company Header */}
      <div className="flex flex-col items-center mb-6 md:flex-row md:items-start md:space-x-6">
        <img
          src={data.companyImageSrc}
          alt={`${data.companyName} logo`}
          className="w-32 h-32 object-contain mb-4 md:mb-0"
          onError={(e) => (e.currentTarget.src = '/placeholder.png')} // Fallback image
        />
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold">{data.companyName}</h1>
          <div className="flex items-center justify-center md:justify-start space-x-4 mt-2">
            <span className="text-2xl font-semibold">{data.currentPrice}</span>
            <span
              className={`text-lg ${
                data.priceChange.startsWith('-') ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {data.priceChange}
            </span>
          </div>
        </div>
      </div>

      {/* Price History Table */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Price History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                {['Date', 'Symbol', 'Name', 'Open', 'High', 'Low', 'Close', 'WAP', 'Volume', 'Previous Close'].map(
                  (header, index) => (
                    <th key={index} className="px-4 py-2 border bg-gray-100">
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {data.priceHistory.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 border text-center">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dividend Data Table */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Dividend Data</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                {['Company', 'Year', 'Dividend', 'Bonus', 'Right'].map((header, index) => (
                  <th key={index} className="px-4 py-2 border bg-gray-100">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.dividendData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 border text-center">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Announcement Data Table */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Announcements</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                {['Company', 'Date', 'Time', 'Announcement'].map((header, index) => (
                  <th key={index} className="px-4 py-2 border bg-gray-100">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.announcementData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 border text-center">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockDetailsPage;