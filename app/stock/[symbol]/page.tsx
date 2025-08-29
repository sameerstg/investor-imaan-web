'use client';
import React, { useEffect, useState } from 'react';
import { GetCompanyName, GetCompanyReports } from '@/methods/stocks';
import FinancialReports from '@/components/FinancialReports';
import StockChart from '@/components/StockChart';

interface Prop {
  params: Promise<{ symbol: string }>;
}

const StockDetailsPage: React.FC<Prop> = ({ params }) => {
  const [symbol, setSymbol] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('Loading...');
  const [reports, setReports] = useState<CompanyReport | null>(null);
  const [isLoadingRealtime, setIsLoadingRealtime] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resolvedParams = await params;
        const symbolValue = resolvedParams.symbol;
        setSymbol(symbolValue);

        // Fetch other data in parallel
        const [name, reportsData] = await Promise.all([
          GetCompanyName(symbolValue),
          GetCompanyReports(symbolValue),
        ]);

        setCompanyName(name);
        setReports(reportsData);

        // Note: StockChart component will fetch its own data
        setIsLoadingRealtime(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setReports({ tableHtml: '' }); // Fallback for reports
      }
    };
    fetchData();
  }, [params]);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {companyName} ({symbol}) {isLoadingRealtime && '(Updating...)'}
      </h1>
      <StockChart
        symbol={symbol}
        companyName={companyName}
      />
      <FinancialReports reports={reports} />
    </div>
  );
};

export default StockDetailsPage;

export interface CompanyReport {
  tableHtml: string; // HTML string of the table
}