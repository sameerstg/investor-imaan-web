'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

// Dynamically import ApexCharts (since it needs window in SSR)
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const SIPCalculator = () => {
    // States for user inputs and calculations
    const [sipAmount, setSipAmount] = useState<number>(1000);
    const [interestRate, setInterestRate] = useState<number>(0.12); // 12% as a realistic default
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
            foreColor: '#4b5563', // Default text color for light mode
        },
        xaxis: {
            categories: [],
            title: {
                text: 'Time (Months)',
            },
            labels: {
                style: {
                    colors: '#4b5563', // Light mode axis label color
                },
            },
        },
        yaxis: {
            title: {
                text: 'Investment Value (PKR)',
            },
            labels: {
                formatter: (value: number) => `PKR ${value.toFixed(2)}`,
                style: {
                    colors: '#4b5563', // Light mode axis label color
                },
            },
        },
        title: {
            text: `SIP Growth Over ${investmentPeriod} Years`,
            align: 'center',
            style: {
                color: '#1f2937', // Light mode title color
            },
        },
        stroke: {
            curve: 'smooth',
            width: 2,
        },
        dataLabels: {
            enabled: false,
        },
        tooltip: {
            y: {
                formatter: (value: number) => `PKR ${value.toFixed(2)}`,
            },
            theme: 'light', // Default to light, will update dynamically
        },
        colors: ['#2563eb'],
        grid: {
            borderColor: '#e5e7eb', // Light mode grid color
        },
    });

    // Update chart options for dark/light mode and chartData
    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        if (chartData.length > 0) {
            setChartOptions((prevOptions) => ({
                ...prevOptions,
                xaxis: {
                    ...prevOptions.xaxis,
                    categories: chartData.map((data) => data.x),
                    labels: {
                        style: {
                            colors: isDarkMode ? '#d1d5db' : '#4b5563', // Dark/light mode axis label color
                        },
                    },
                },
                yaxis: {
                    ...prevOptions.yaxis,
                    labels: {
                        style: {
                            colors: isDarkMode ? '#d1d5db' : '#4b5563', // Dark/light mode axis label color
                        },
                    },
                },
                title: {
                    ...prevOptions.title,
                    text: `SIP Growth Over ${investmentPeriod} Years`,
                    style: {
                        color: isDarkMode ? '#f3f4f6' : '#1f2937', // Dark/light mode title color
                    },
                },
                chart: {
                    ...prevOptions.chart,
                    foreColor: isDarkMode ? '#d1d5db' : '#4b5563', // Dark/light mode text color
                },
                tooltip: {
                    ...prevOptions.tooltip,
                    theme: isDarkMode ? 'dark' : 'light',
                },
                grid: {
                    borderColor: isDarkMode ? '#374151' : '#e5e7eb', // Dark/light mode grid color
                },
            }));
        }
    }, [chartData, investmentPeriod]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">
                    SIP Calculator (PKR)
                </h1>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                    <div>
                        <label
                            htmlFor="sip-amount"
                            className="block text-sm sm:text-lg font-semibold text-gray-700 dark:text-gray-200"
                        >
                            Monthly SIP Amount (PKR)
                        </label>
                        <input
                            id="sip-amount"
                            type="number"
                            value={sipAmount}
                            onChange={(e) => setSipAmount(Number(e.target.value))}
                            placeholder="Enter monthly SIP amount (PKR)"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={500}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="interest-rate"
                            className="block text-sm sm:text-lg font-semibold text-gray-700 dark:text-gray-200"
                        >
                            Annual Interest Rate (%)
                        </label>
                        <input
                            id="interest-rate"
                            type="number"
                            value={interestRate * 100}
                            onChange={(e) => setInterestRate(Number(e.target.value) / 100)}
                            placeholder="Enter annual interest rate (%)"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={0}
                            step={0.1}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="investment-period"
                            className="block text-sm sm:text-lg font-semibold text-gray-700 dark:text-gray-200"
                        >
                            Investment Period (Years)
                        </label>
                        <input
                            id="investment-period"
                            type="number"
                            value={investmentPeriod}
                            onChange={(e) => setInvestmentPeriod(Number(e.target.value))}
                            placeholder="Enter investment period (Years)"
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={1}
                        />
                    </div>
                </div>

                <button
                    onClick={calculateSIP}
                    className="w-full p-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                >
                    Calculate
                </button>

                <div className="chart-container mt-6">
                    <ReactApexChart
                        options={chartOptions}
                        series={[{ name: 'Investment Value', data: chartData.map((data) => data.y) }]}
                        type="line"
                        height={350}
                        width="100%"
                    />
                </div>

                <div className="total-value text-center mt-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-200">
                        Total Value at the end of {investmentPeriod} years:
                    </h2>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                        PKR {totalValue.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SIPCalculator;