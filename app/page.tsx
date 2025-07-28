'use client';
import StockChart from '@/components/StockChart';
import {
  GetDayDataCached, GetDayDataRealtime, GetAllTimeData
} from '@/methods/stockPrice';
import React, { useEffect, useState } from 'react';

export interface TimeSeriesData {
  timestamp: number;
  price: number;
  volume: number;
}

export default function IndicesPage() {
  const [kse100DayData, setKse100DayData] = useState<TimeSeriesData[]>([]);
  const [kse100AllTimeData, setKse100AllTimeData] = useState<TimeSeriesData[]>([]);
  const [kse30DayData, setKse30DayData] = useState<TimeSeriesData[]>([]);
  const [kse30AllTimeData, setKse30AllTimeData] = useState<TimeSeriesData[]>([]);
  const [kmi30DayData, setKmi30DayData] = useState<TimeSeriesData[]>([]);
  const [kmi30AllTimeData, setKmi30AllTimeData] = useState<TimeSeriesData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Step 1: Show all symbols with placeholder data
        setKse100DayData([]);
        setKse100AllTimeData([]);
        setKse30DayData([]);
        setKse30AllTimeData([]);
        setKmi30DayData([]);
        setKmi30AllTimeData([]);

        // Step 2: Fetch cached day data and all-time data
        const [
          kse100CachedDay,
          kse100AllTime,
          kse30CachedDay,
          kse30AllTime,
          kmi30CachedDay,
          kmi30AllTime,
        ] = await Promise.all([
          GetDayDataCached('KSE100'),
          GetAllTimeData('KSE100'),
          GetDayDataCached('KSE30'),
          GetAllTimeData('KSE30'),
          GetDayDataCached('KMI30'),
          GetAllTimeData('KMI30'),
        ]);

        setKse100DayData(kse100CachedDay || []);
        setKse100AllTimeData(kse100AllTime as TimeSeriesData[]);
        setKse30DayData(kse30CachedDay || []);
        setKse30AllTimeData(kse30AllTime as TimeSeriesData[]);
        setKmi30DayData(kmi30CachedDay || []);
        setKmi30AllTimeData(kmi30AllTime as TimeSeriesData[]);

        // Step 3: Fetch real-time day data
        const [
          kse100RealtimeDay,
          kse30RealtimeDay,
          kmi30RealtimeDay,
        ] = await Promise.all([
          GetDayDataRealtime('KSE100'),
          GetDayDataRealtime('KSE30'),
          GetDayDataRealtime('KMI30'),
        ]);

        setKse100DayData(kse100RealtimeDay as TimeSeriesData[]);
        setKse30DayData(kse30RealtimeDay as TimeSeriesData[]);
        setKmi30DayData(kmi30RealtimeDay as TimeSeriesData[]);
      } catch (error) {
        console.error('Error fetching index data:', error);
        setKse100DayData([]);
        setKse30DayData([]);
        setKmi30DayData([]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Stock Index Charts</h1>
      <div className="space-y-8">
        <StockChart
          symbol="KSE100"
          dayData={kse100DayData}
          allTimeData={kse100AllTimeData}
          companyName='KSE100 Index'
        />
        <StockChart
          symbol="KSE30"
          dayData={kse30DayData}
          allTimeData={kse30AllTimeData}
          companyName='KSE30 Index'
        />
        <StockChart
          symbol="KMI30"
          dayData={kmi30DayData}
          allTimeData={kmi30AllTimeData}
          companyName='KMI30 Index'
        />
      </div>
    </div>
  );
}