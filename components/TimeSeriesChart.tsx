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
  costData?: TimeSeriesData[];
  showCostLine?: boolean;
  profitAmount?: number;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  title,
  dayData = [],
  allTimeData = [],
  yAxisTitle = '',
  lineColor = 'rgb(59, 130, 246)',
  costData = [],
  showCostLine = false,
  profitAmount = 0,
}) => {
  const [timeRange, setTimeRange] = useState<'1H' | '1D' | '1W' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'All'>('1D');

  const getSelectedData = () => {
    return timeRange === '1D' || timeRange === '1H' ? dayData : allTimeData;
  };

  const getSelectedCostData = () => {
    return timeRange === '1D' || timeRange === '1H' ? costData : costData;
  };

  const filterDataByTimeRange = (data: TimeSeriesData[]) => {
    if (timeRange === 'All' || timeRange === '1H') return data;

    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneMonth = 30 * oneDay;
    let timeLimit: number;
    let stepSize: number;

    switch (timeRange) {
      case '1D':
        stepSize = 10; // Show every 10th point for 1D
        return data.filter((_, i) => i % stepSize === 0);
      case '1W':
        timeLimit = now - 7 * oneDay;
        stepSize = 5; // Show every 5th point for 1W
        break;
      case '1M':
        timeLimit = now - oneMonth;
        stepSize = 3; // Show every 3rd point for 1M
        break;
      case '6M':
        timeLimit = now - 6 * oneMonth;
        stepSize = 2; // Show every 2nd point for 6M
        break;
      case 'YTD':
        timeLimit = new Date(new Date().getFullYear(), 0, 1).getTime();
        stepSize = 2;
        break;
      case '1Y':
        timeLimit = now - 12 * oneMonth;
        stepSize = 2;
        break;
      case '5Y':
        timeLimit = now - 5 * 12 * oneMonth;
        stepSize = 1;
        break;
      default:
        timeLimit = now - oneDay;
        stepSize = 5;
    }

    const filteredByTime = data.filter((item) => new Date(item.x).getTime() >= timeLimit);
    return filteredByTime.filter((_, i) => i % stepSize === 0);
  };

  const selectedData = filterDataByTimeRange(getSelectedData());
  const selectedCostData = showCostLine ? filterDataByTimeRange(getSelectedCostData()) : [];

  // Create trade annotations (empty for now, can be extended later)
  const tradeAnnotations: any[] = [];

  const chartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 450,
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
        formatter: (value: number, { seriesIndex, dataPointIndex }: any) => {
          if (showCostLine && selectedCostData.length > 0 && seriesIndex === 0 && selectedCostData[dataPointIndex]) {
            const costValue = selectedCostData[dataPointIndex].y;
            const portfolioValue = value;
            const profit = portfolioValue - costValue;
            const profitPercent = costValue > 0 ? (profit / costValue) * 100 : 0;
            return `${value.toFixed(2)} (${profit >= 0 ? '+' : ''}${profit.toFixed(2)}, ${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)`;
          }
          return value.toFixed(2);
        }
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    markers: {
      size: 4,
      colors: showCostLine ? [lineColor, '#6B7280'] : [lineColor],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: {
        size: 6
      }
    },
    colors: showCostLine ? [lineColor, '#6B7280'] : [lineColor],
    grid: {
      show: true,
      borderColor: '#e5e7eb',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      }
    },
    annotations: {
      points: [
        ...tradeAnnotations,
        ...(profitAmount !== 0 ? [{
          x: selectedData.length > 0 ? selectedData[selectedData.length - 1].x : new Date(),
          y: selectedData.length > 0 ? selectedData[selectedData.length - 1].y : 0,
          marker: {
            size: 0
          },
          label: {
            text: `${profitAmount >= 0 ? '+' : ''}${profitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            style: {
              color: '#FFFFFF',
              background: profitAmount >= 0 ? '#10B981' : '#EF4444',
              fontSize: '14px',
              fontWeight: 'bold',
              padding: {
                left: 8,
                right: 8,
                top: 6,
                bottom: 6
              }
            },
            offsetY: -40,
            offsetX: 20
          }
        }] : [])
      ]
    }
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
        type="line"
        height={450}
        series={
          showCostLine && selectedCostData.length > 0
            ? [
                {
                  name: 'Portfolio Value',
                  data: selectedData
                },
                {
                  name: 'Cost Basis',
                  data: selectedCostData
                }
              ]
            : [
                {
                  name: title,
                  data: selectedData
                }
              ]
        }
        options={chartOptions}
      />
    </div>
  );
};

export default TimeSeriesChart;
