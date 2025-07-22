'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GetDayData, GetAllTimeData, GetCompanyName, GetCompanyReports } from '@/methods/stocks';
import FinancialReports from '@/components/FinancialReports';
import StockChart from '@/components/StockChart';

const StockDetailsPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [dayData, setDayData] = useState<TimeSeriesData[]>([]);
  const [allTimeData, setAllTimeData] = useState<TimeSeriesData[]>([]);
  const [companyName, setCompanyName] = useState<string>('Loading...');
  const [reports, setReports] = useState<CompanyReport | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [name, dayData, allTimeData, reportsData] = await Promise.all([
          GetCompanyName(symbol),
          GetDayData(symbol),
          GetAllTimeData(symbol),
          GetCompanyReports(symbol),
        ]);
        setCompanyName(name);
        setDayData(dayData as TimeSeriesData[]);
        setAllTimeData(allTimeData as TimeSeriesData[]);
        setReports(reportsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setReports({ tableHtml: '' }); // Fallback
      }
    };
    fetchData();
  }, [symbol]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{companyName} ({symbol}) Stock Details</h1>
      <StockChart
        symbol={symbol}
        companyName={companyName}
        dayData={dayData}
        allTimeData={allTimeData}
      />
      <FinancialReports reports={reports} />
    </div>
  );
};

export default StockDetailsPage;

export interface TimeSeriesData {
  timestamp: number;
  price: number;
  volume: number;
}

export interface CompanyReport {
  tableHtml: string; // HTML string of the table
}