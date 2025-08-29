'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';
import { GetDayDataRealtime, GetAllTimeData } from '@/methods/stockPrice';

// Dynamically import ApexCharts to avoid SSR issues
const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface TimeSeriesData {
  timestamp: number;
  price: number;
  volume: number;
}


interface StockChartProps {
  symbol: string;
  companyName: string;
  trades?: Array<{
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    fees: number;
    tradeDate: Date | string;
  }>;
}

const StockChart: React.FC<StockChartProps> = ({ symbol, companyName, trades = [] }) => {
  const [timeRange, setTimeRange] = useState<'1H' | '1D' | '1W' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'All'>('1D');
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [dayData, setDayData] = useState<TimeSeriesData[]>([]);
  const [allTimeData, setAllTimeData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const realtimeDay = await GetDayDataRealtime(symbol);
        if (Array.isArray(realtimeDay) && realtimeDay.length > 0) {
          setDayData(realtimeDay as TimeSeriesData[]);
        }
        const [allTime] = await Promise.all([
          GetAllTimeData(symbol)
        ]);


        if (allTime) {
          setAllTimeData(allTime as TimeSeriesData[]);
        }


      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  const getSelectedData = () => {
    return timeRange === '1D' || timeRange === '1H' ? dayData : allTimeData;
  };

  const filterDataByTimeRange = (data: TimeSeriesData[]) => {
    if (timeRange === 'All' || timeRange === '1H') return data;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneMonth = 30 * oneDay;
    let timeLimit: number;

    switch (timeRange) {
      case '1D':
        return data.filter((_, i) => i % 5 === 0); // 5-minute intervals
      case '1W':
        timeLimit = now - 7 * oneDay;
        break;
      case '1M':
        timeLimit = now - oneMonth;
        break;
      case '6M':
        timeLimit = now - 6 * oneMonth;
        break;
      case 'YTD':
        timeLimit = new Date(new Date().getFullYear(), 0, 1).getTime();
        break;
      case '1Y':
        timeLimit = now - 12 * oneMonth;
        break;
      case '5Y':
        timeLimit = now - 5 * 12 * oneMonth;
        break;
      default:
        timeLimit = now - oneDay;
    }

    return data.filter((item) => item.timestamp * 1000 >= timeLimit);
  };

  const selectedData = filterDataByTimeRange(getSelectedData());

  // Candlestick format: { x: timestamp, y: [open, high, low, close] }
  const candlestickData = selectedData.map((d, i, arr) => {
    const open = i === 0 ? d.price : arr[i - 1].price;
    const close = d.price;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    return {
      x: new Date(d.timestamp * 1000),
      y: [open, high, low, close],
    };
  });

  const lineData = selectedData.map((d) => ({
    x: new Date(d.timestamp * 1000),
    y: d.price,
  }));

  // Create trade annotations
  const tradeAnnotations = trades
    .filter(trade => trade.symbol === symbol)
    .map(trade => {
      const tradeDate = new Date(trade.tradeDate);
      return {
        x: tradeDate.getTime(),
        y: trade.price,
        marker: {
          size: 6,
          fillColor: trade.type === 'BUY' ? '#10B981' : '#EF4444',
          strokeColor: '#FFFFFF',
          strokeWidth: 2,
          shape: 'circle'
        },
        label: {
          text: trade.type === 'BUY' ? 'B' : 'S',
          style: {
            color: '#FFFFFF',
            background: trade.type === 'BUY' ? '#10B981' : '#EF4444',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: {
              left: 6,
              right: 6,
              top: 4,
              bottom: 4
            }
          },
          offsetY: trade.type === 'BUY' ? -25 : 25
        }
      };
    });

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
      height: 400,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    title: {
      text: `${companyName} (${symbol}) - ${timeRange} ${chartType === 'candlestick' ? 'Candlestick' : 'Line'} Chart`,
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#111827',
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: { fontFamily: "'Inter', sans-serif", fontSize: '12px' },
      },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        style: { fontFamily: "'Inter', sans-serif", fontSize: '12px' },
      },
    },
    tooltip: {
      shared: true,
      theme: 'dark',
    },
    stroke: {
      curve: 'smooth',
      width: chartType === 'line' ? 2 : 1,
    },
    annotations: {
      points: tradeAnnotations
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
      {/* Time Range Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['1H', '1D', '1W', '1M', '6M', 'YTD', '1Y', '5Y', 'All'].map((range) => (
          <button
            key={range}
            className={`px-3 py-1.5 rounded text-sm font-medium ${timeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            onClick={() => setTimeRange(range as typeof timeRange)}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Chart Type Switch */}
      <div className="flex gap-2 mb-6 justify-end">
        <button
          onClick={() => setChartType('line')}
          className={`px-4 py-1.5 rounded text-sm font-medium ${chartType === 'line' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
        >
          Line
        </button>
        <button
          onClick={() => setChartType('candlestick')}
          className={`px-4 py-1.5 rounded text-sm font-medium ${chartType === 'candlestick' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
        >
          Candlestick
        </button>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-gray-500">Loading {symbol} data...</p>
        </div>
      ) : dayData.length === 0 ? (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-gray-500">No data available for {symbol}</p>
        </div>
      ) : (
        <ApexChart
          type={chartType}
          height={400}
          series={[
            {
              name: symbol,
              data: chartType === 'candlestick' ? candlestickData : lineData,
            },
          ]}
          options={chartOptions}
        />
      )}
    </div>
  );
};

export default StockChart;
