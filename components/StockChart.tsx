'use client';
import React, { useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface TimeSeriesData {
  timestamp: number;
  price: number;
  volume: number;
}

interface StockChartProps {
  symbol: string;
  companyName: string;
  dayData: TimeSeriesData[];
  allTimeData: TimeSeriesData[];
}

const StockChart: React.FC<StockChartProps> = ({ symbol, companyName, dayData, allTimeData }) => {
  const chartRef = useRef<any>(null);
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'All'>('1D');

  // Aggregate data to reduce density
  const aggregateData = (data: TimeSeriesData[], isDayData: boolean): TimeSeriesData[] => {
    if (!data.length) return data;

    if (isDayData) {
      // Aggregate 1D data into 5-minute intervals
      const interval = 5 * 60 * 1000; // 5 minutes in milliseconds
      const aggregated: { [key: number]: { prices: number[]; volumes: number[] } } = {};

      data.forEach((item) => {
        const timestampMs = item.timestamp * 1000;
        const intervalStart = Math.floor(timestampMs / interval) * interval;
        if (!aggregated[intervalStart]) {
          aggregated[intervalStart] = { prices: [], volumes: [] };
        }
        aggregated[intervalStart].prices.push(item.price);
        aggregated[intervalStart].volumes.push(item.volume);
      });

      return Object.keys(aggregated)
        .map((key) => ({
          timestamp: Number(key) / 1000,
          price: aggregated[Number(key)].prices.reduce((sum, p) => sum + p, 0) / aggregated[Number(key)].prices.length,
          volume: Math.round(aggregated[Number(key)].volumes.reduce((sum, v) => sum + v, 0) / aggregated[Number(key)].volumes.length),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    } else {
      // Aggregate other ranges into daily intervals
      const interval = 24 * 60 * 60 * 1000; // 1 day in milliseconds
      const aggregated: { [key: number]: { prices: number[]; volumes: number[] } } = {};

      data.forEach((item) => {
        const timestampMs = item.timestamp * 1000;
        const intervalStart = Math.floor(timestampMs / interval) * interval;
        if (!aggregated[intervalStart]) {
          aggregated[intervalStart] = { prices: [], volumes: [] };
        }
        aggregated[intervalStart].prices.push(item.price);
        aggregated[intervalStart].volumes.push(item.volume);
      });

      return Object.keys(aggregated)
        .map((key) => ({
          timestamp: Number(key) / 1000,
          price: aggregated[Number(key)].prices.reduce((sum, p) => sum + p, 0) / aggregated[Number(key)].prices.length,
          volume: Math.round(aggregated[Number(key)].volumes.reduce((sum, v) => sum + v, 0) / aggregated[Number(key)].volumes.length),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    }
  };

  // Select dataset based on time range
  const getSelectedData = () => {
    return timeRange === '1D' ? aggregateData(dayData, true) : aggregateData(allTimeData, false);
  };

  // Filter data based on selected time range
  const filterDataByTimeRange = (data: TimeSeriesData[]) => {
    if (timeRange === '1D' || timeRange === 'All') {
      return data; // Already aggregated
    }

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneMonth = 30 * oneDay;
    let timeLimit: number;

    switch (timeRange) {
      case '1W':
        timeLimit = now - 7 * oneDay;
        break;
      case '1M':
        timeLimit = now - oneMonth;
        break;
      case '6M':
        timeLimit = now - 6 * oneMonth;
        break;
      case 'YTD': {
        const currentYear = new Date(now).getFullYear();
        timeLimit = new Date(currentYear, 0, 1).getTime();
        break;
      }
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

  // Prepare data for Chart.js
  const selectedData = getSelectedData();
  const chartData = {
    labels: filterDataByTimeRange(selectedData).map((item) =>
      new Date(item.timestamp * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: timeRange === '1D' ? 'numeric' : undefined,
        minute: timeRange === '1D' ? 'numeric' : undefined,
        hour12: true,
      })
    ),
    datasets: [
      {
        label: `${symbol} Price`,
        data: filterDataByTimeRange(selectedData).map((item) => item.price),
        borderColor: '#3b82f6',
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1,
        pointRadius: timeRange === '1D' ? 2 : 3,
        pointHoverRadius: timeRange === '1D' ? 4 : 5,
        pointHitRadius: 10,
        tension: 0.3,
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return;
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');
          return gradient;
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: '500',
          },
          color: '#1f2937',
        },
      },
      title: {
        display: true,
        text: `${companyName} (${symbol}) Stock Price - ${timeRange}`,
        font: {
          size: 18,
          family: "'Inter', sans-serif",
          weight: '600',
        },
        color: '#1f2937',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleFont: {
          size: 14,
          family: "'Inter', sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif",
        },
        padding: 10,
        cornerRadius: 4,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: timeRange === '1D' ? 'Date and Time' : 'Date',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: '500',
          },
          color: '#1f2937',
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: '#1f2937',
          maxRotation: timeRange === '1D' ? 45 : 0,
          autoSkip: true,
          maxTicksLimit: timeRange === '1D' ? 6 : 8,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Price ($)',
          font: {
            size: 14,
            family: "'Inter', sans-serif",
            weight: '500',
          },
          color: '#1f2937',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: '#1f2937',
        },
      },
    },
    elements: {
      line: {
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.1)',
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-96 mb-8">
      <div className="flex flex-wrap gap-2 mb-6">
        {['1D', '1W', '1M', '6M', 'YTD', '1Y', '5Y', 'All'].map((range) => (
          <button
            key={range}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              timeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setTimeRange(range as typeof timeRange)}
          >
            {range}
          </button>
        ))}
      </div>
      {selectedData.length > 0 ? (
        <Line ref={chartRef} data={chartData} options={chartOptions as any} />
      ) : (
        <p className="text-gray-500 text-sm">Loading stock data...</p>
      )}
    </div>
  );
};

export default StockChart;