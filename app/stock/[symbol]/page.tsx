'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StockData {
  company: {
    name: string;
    sector: string;
    price: string;
    change: string;
    total_volume: string;
  };
  market_info: Record<string, string>;
  contacts: Record<string, string>;
  representatives: string[][];
  announcements: Array<{
    company: string;
    date: string;
    time: string;
    announcement: string;
  }>;
  price_history: Array<{
    day: string;
    code: string;
    company: string;
    open: string;
    high: string;
    low: string;
    close: string;
    avg: string;
    turnover: string;
    ldcp: string;
  }>;
  dividend_data: Array<{
    name: string;
    year: string;
    cash_dividend: string;
    bonus_dividend: string;
    right_shares: string;
  }>;
}

export default function StockDetail({ params }: { params: { symbol: string } }) {
  const [data, setData] = useState<StockData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const response = await fetch(`/api/stock?symbol=${params.symbol}`);
        const result = await response.json();
        if (response.ok) {
          setData(result);
        } else {
          setError(result.error || 'Failed to load stock data');
        }
      } catch (err) {
        setError('An error occurred while fetching stock data');
      }
    };

    fetchStock();
  }, [params.symbol]);

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-red-500 text-center font-semibold">
          Error: {error}
        </div>
        <Link href="/" className="text-blue-500 hover:underline mt-4 block text-center">
          Back to Stocks
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <p className="text-gray-600 text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Link href="/" className="text-blue-500 hover:underline mb-4 block">
        Back to Stocks
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">
        {data.company.name}
      </h1>

      {/* Iframe Section */}
      <section className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2 flex items-center">
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Original Page
        </h2>
        <div className="bg-white p-4 rounded-lg shadow-md">
          {iframeError ? (
            <p className="text-red-500">
              {iframeError}
            </p>
          ) : (
            <iframe
              src={`https://www.khistocks.com/market-live/companies-live/detailed-view/${params.symbol}.html`}
              className="w-full h-[600px] border border-gray-200 rounded-lg"
              title={`${data.company.name} Stock Page`}
              onError={() => setIframeError('Failed to load the page. The website may block iframes or be unavailable.')}
              loading="lazy"
            />
          )}
        </div>
      </section>

      {/* Company Details */}
      <section className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2 flex items-center">
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h-2m-2 0h-2m-2 0h-2m-2 0h-2M7 7h10"
            />
          </svg>
          Company Details
        </h2>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p><strong>Sector:</strong> {data.company.sector}</p>
          <p><strong>Price:</strong> {data.company.price}</p>
          <p><strong>Total Volume:</strong> {data.company.total_volume}</p>
          <p className={`flex items-center ${data.company.change.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>
            <strong>Change:</strong> {data.company.change}
            {data.company.change.startsWith('-') ? (
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
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            ) : (
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
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            )}
          </p>
        </div>
      </section>

      {/* Market Info */}
      <section className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2 flex items-center">
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7v8m4-8v8m4-8v8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
            />
          </svg>
          Market Info
        </h2>
        <div className="bg-white p-4 rounded-lg shadow-md">
          {Object.entries(data.market_info).map(([key, value]) => (
            <p key={key}>
              <strong>{key.replace(/_/g, ' ').toUpperCase()}:</strong> {value}
            </p>
          ))}
        </div>
      </section>

      {/* Contacts */}
      <section className="mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2 flex items-center">
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Contacts
        </h2>
        <div className="bg-white p-4 rounded-lg shadow-md">
          {Object.entries(data.contacts).map(([key, value]) => (
            <p key={key}>
              <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{' '}
              {key === 'email' || key === 'website' ? (
                <a href={key === 'email' ? `mailto:${value}` : value} className="text-blue-500 hover:underline">
                  {value}
                </a>
              ) : (
                value
              )}
            </p>
          ))}
        </div>
      </section>

      {/* Representatives */}
      {data.representatives.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Representatives
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Designation</th>
                </tr>
              </thead>
              <tbody>
                {data.representatives.map(([name, designation], index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{name}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{designation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Announcements */}
      {data.announcements.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Announcements
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Date</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Time</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Announcement</th>
                </tr>
              </thead>
              <tbody>
                {data.announcements.map(({ date, time, announcement }, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{date}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{time}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{announcement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Price History */}
      {data.price_history.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Price History
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Day</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Open</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">High</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Low</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Close</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Avg.</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Turnover</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">LDCP</th>
                </tr>
              </thead>
              <tbody>
                {data.price_history.map(({ day, open, high, low, close, avg, turnover, ldcp }, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{day}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{open}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{high}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{low}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{close}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{avg}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{turnover}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{ldcp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Dividend Data */}
      {data.dividend_data.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 flex items-center">
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Dividend Data
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Year</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Cash Dividend</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Bonus Dividend</th>
                  <th className="px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-700">Right Shares</th>
                </tr>
              </thead>
              <tbody>
                {data.dividend_data.map(({ year, cash_dividend, bonus_dividend, right_shares }, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{year}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{cash_dividend}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{bonus_dividend}</td>
                    <td className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200">{right_shares}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}