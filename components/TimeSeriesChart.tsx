'use client';
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { ApexOptions } from 'apexcharts';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface TimeSeriesData {
  x: string | number | Date;
  y: number;
}

interface TimeSeriesChartProps {
  title: string;
  dayData?: TimeSeriesData[];
  allTimeData?: TimeSeriesData[];
  yAxisTitle?: string;
  lineColor?: string;
  fillColor?: string;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  title,
  dayData = [],
  allTimeData = [],
  yAxisTitle = '',
  lineColor = 'rgb(59, 130, 246)',
}) => {
  const [timeRange, setTimeRange] = useState<'1H' | '1D' | '1W' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'All'>('1D');

  const getSelectedData = () => {
    return timeRange === '1D' || timeRange === '1H' ? dayData : allTimeData;
  };

  const filterDataByTimeRange = (data: TimeSeriesData[]) => {
    if (timeRange === 'All' || timeRange === '1H') return data;

    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneMonth = 30 * oneDay;
    let timeLimit: number;

    switch (timeRange) {
      case '1D':
        return data.filter((_, i) => i % 5 === 0);
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

    return data.filter((item) => new Date(item.x).getTime() >= timeLimit);
  };

  const selectedData = filterDataByTimeRange(getSelectedData());

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 400,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    title: {
      text: `${title} - ${timeRange} Chart`,
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
      title: {
        text: yAxisTitle,
        style: { fontSize: '12px' }
      },
      labels: {
        style: { fontFamily: "'Inter', sans-serif", fontSize: '12px' },
        formatter: (value: number) => value.toFixed(2)
      },
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'dd MMM yyyy'
      },
      y: {
        formatter: (value: number) => value.toFixed(2)
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
      }
    },
    colors: [lineColor]
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex flex-wrap gap-2 mb-4">
        {['1H', '1D', '1W', '1M', '6M', 'YTD', '1Y', '5Y', 'All'].map((range) => (
          <button
            key={range}
            className={`px-3 py-1.5 rounded text-sm font-medium ${
              timeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setTimeRange(range as typeof timeRange)}
          >
            {range}
          </button>
        ))}
      </div>

      <ApexChart
        type="area"
        height={400}
        series={[
          {
            name: title,
            data: selectedData
          }
        ]}
        options={chartOptions}
      />
    </div>
  );
};

export default TimeSeriesChart;
