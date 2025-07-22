'use client';

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

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  symbol: string;
}

export default function TimeSeriesChart({ data, symbol }: TimeSeriesChartProps) {
  const chartData = {
    labels: data.map((item) => new Date(item.timestamp * 1000).toLocaleTimeString()),
    datasets: [
      {
        label: 'Price',
        data: data.map((item) => item.price),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Stock Price Over Time (${symbol})`,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Price (PKR)',
        },
      },
    },
  };

  return (
    <div className="mb-8">
      <Line data={chartData} options={options} />
    </div>
  );
}