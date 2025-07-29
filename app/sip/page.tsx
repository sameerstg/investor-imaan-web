'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

// Dynamically import ApexCharts (since it needs window in SSR)
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const SIPCalculator = () => {
  // States for user inputs and calculations
  const [sipAmount, setSipAmount] = useState<number>(1000);
  const [interestRate, setInterestRate] = useState<number>(0.2); // 20% as a realistic default
  const [investmentPeriod, setInvestmentPeriod] = useState<number>(1);
  const [chartData, setChartData] = useState<{ x: string; y: number }[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);

  // Function to calculate SIP returns (using compound interest formula for SIP)
  const calculateSIP = () => {
    const monthlyRate = interestRate / 12; // Monthly rate from annual rate
    const months = investmentPeriod * 12;
    let totalAmount = 0;
    const monthlyData: { x: string; y: number }[] = [];

    // Use the compound interest formula for SIP: A = P * [(1 + r/n)^(n*t) - 1] / (r/n)
    for (let i = 1; i <= months; i++) {
      const amount = sipAmount * ((Math.pow(1 + monthlyRate, i) - 1) / monthlyRate);
      totalAmount = amount;
      monthlyData.push({
        x: `Month ${i}`,
        y: Math.round(amount * 100) / 100,
      });
    }

    setChartData(monthlyData);
    setTotalValue(totalAmount);
  };

  // Run the calculation on page load or when inputs change
  useEffect(() => {
    calculateSIP();
  }, [sipAmount, interestRate, investmentPeriod]);

  // Chart options with proper types
  const [chartOptions, setChartOptions] = useState<ApexOptions>({
    chart: {
      id: 'sip-chart',
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      categories: [],
      title: {
        text: 'Time (Months)',
      },
    },
    yaxis: {
      title: {
        text: 'Investment Value (PKR)',
      },
      labels: {
        formatter: (value: number) => `PKR ${value.toFixed(2)}`,
      },
    },
    title: {
      text: `SIP Growth Over ${investmentPeriod} Years`,
      align: 'center',
    },
    stroke: {
      curve: 'smooth',
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      y: {
        formatter: (value: number) => `PKR ${value.toFixed(2)}`,
      },
    },
    colors: ['#2563eb'],
  });

  // Update chart options when chartData changes
  useEffect(() => {
    if (chartData.length > 0) {
      setChartOptions((prevOptions) => ({
        ...prevOptions,
        xaxis: {
          ...prevOptions.xaxis,
          categories: chartData.map((data) => data.x),
        },
        title: {
          ...prevOptions.title,
          text: `SIP Growth Over ${investmentPeriod} Years`,
        },
      }));
    }
  }, [chartData, investmentPeriod]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">SIP Calculator (PKR)</h1>

      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="sip-amount" className="block text-lg font-semibold text-gray-700">
            Monthly SIP Amount (PKR)
          </label>
          <input
            id="sip-amount"
            type="number"
            value={sipAmount}
            onChange={(e) => setSipAmount(Number(e.target.value))}
            placeholder="Enter monthly SIP amount (PKR)"
            className="w-full p-3 border border-gray-300 rounded-md"
            min={500}
          />
        </div>

        <div>
          <label htmlFor="interest-rate" className="block text-lg font-semibold text-gray-700">
            Annual Interest Rate (%)
          </label>
          <input
            id="interest-rate"
            type="number"
            value={interestRate * 100}
            onChange={(e) => setInterestRate(Number(e.target.value) / 100)}
            placeholder="Enter annual interest rate (%)"
            className="w-full p-3 border border-gray-300 rounded-md"
            min={0}
            step={0.1}
          />
        </div>

        <div>
          <label htmlFor="investment-period" className="block text-lg font-semibold text-gray-700">
            Investment Period (Years)
          </label>
          <input
            id="investment-period"
            type="number"
            value={investmentPeriod}
            onChange={(e) => setInvestmentPeriod(Number(e.target.value))}
            placeholder="Enter investment period (Years)"
            className="w-full p-3 border border-gray-300 rounded-md"
            min={1}
          />
        </div>

        <button
          onClick={calculateSIP}
          className="w-full p-3 bg-blue-500 text-white font-semibold rounded-md mt-4 hover:bg-blue-600"
        >
          Calculate
        </button>
      </div>

      <div className="chart-container">
        <ReactApexChart
          options={chartOptions}
          series={[{
            name: 'Investment Value',
            data: chartData.map((data) => data.y),
          }]}
          type="line"
          height={350}
        />
      </div>

      <div className="total-value text-center mt-6">
        <h2 className="text-xl font-semibold text-gray-700">
          Total Value at the end of {investmentPeriod} years:
        </h2>
        <p className="text-2xl font-bold text-green-600">
          PKR {totalValue.toFixed(2)}
        </p>
      </div>
    </div>
  );
};

export default SIPCalculator;
