'use client';
import StockChart from '@/components/StockChart';
import { GetAllTimeData, GetDayData } from '@/methods/stocks';
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
        const [
          kse100Day,
          kse100AllTime,
          kse30Day,
          kse30AllTime,
          kmi30Day,
          kmi30AllTime,
        ] = await Promise.all([
          GetDayData('KSE100'),
          GetAllTimeData('KSE100'),
          GetDayData('KSE30'),
          GetAllTimeData('KSE30'),
          GetDayData('KMI30'),
          GetAllTimeData('KMI30'),
        ]);
        setKse100DayData(kse100Day as TimeSeriesData[]);
        setKse100AllTimeData(kse100AllTime as TimeSeriesData[]);
        setKse30DayData(kse30Day as TimeSeriesData[]);
        setKse30AllTimeData(kse30AllTime as TimeSeriesData[]);
        setKmi30DayData(kmi30Day as TimeSeriesData[]);
        setKmi30AllTimeData(kmi30AllTime as TimeSeriesData[]);
      } catch (error) {
        console.error('Error fetching index data:', error);
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