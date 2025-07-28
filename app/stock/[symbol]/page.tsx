'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {  GetCompanyName, GetCompanyReports } from '@/methods/stocks';
import FinancialReports from '@/components/FinancialReports';
import StockChart from '@/components/StockChart';
import { GetAllTimeData, GetDayDataCached, GetDayDataRealtime } from '@/methods/stockPrice';

const StockDetailsPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [dayData, setDayData] = useState<TimeSeriesData[]>([]);
  const [allTimeData, setAllTimeData] = useState<TimeSeriesData[]>([]);
  const [companyName, setCompanyName] = useState<string>('Loading...');
  const [reports, setReports] = useState<CompanyReport | null>(null);
  const [isLoadingRealtime, setIsLoadingRealtime] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cached day data first for quick rendering
        const cachedDayData = await GetDayDataCached(symbol);
        if (cachedDayData) {
          setDayData(cachedDayData as TimeSeriesData[]);
        }

        // Fetch other data in parallel
        const [name, allTimeData, reportsData] = await Promise.all([
          GetCompanyName(symbol),
          GetAllTimeData(symbol),
          GetCompanyReports(symbol),
        ]);

        setCompanyName(name);
        setAllTimeData(allTimeData as TimeSeriesData[]);
        setReports(reportsData);

        // Fetch real-time day data in the background
        setIsLoadingRealtime(true);
        const realtimeDayData = await GetDayDataRealtime(symbol);
        setDayData(realtimeDayData as TimeSeriesData[]);
        setIsLoadingRealtime(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setReports({ tableHtml: '' }); // Fallback for reports
        if (!dayData.length) {
          setDayData([]); // Ensure dayData is empty if no cache and real-time fails
        }
      }
    };
    fetchData();
  }, [symbol]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {companyName} ({symbol}) Stock Details {isLoadingRealtime && '(Updating...)'}
      </h1>
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