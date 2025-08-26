'use client';
import StockChart from '@/components/StockChart';

export default function IndicesPage() {
  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Stock Index Charts</h1>
      <div className="space-y-8">
        <StockChart symbol="KSE100" companyName="KSE100 Index" />
        <StockChart symbol="KSE30" companyName="KSE30 Index" />
        <StockChart symbol="KMI30" companyName="KMI30 Index" />
      </div>
    </div>
  );
}