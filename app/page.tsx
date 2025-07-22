import { GetIndexTimeSeries } from '@/methods/stocks';
import TimeSeriesChart from '@/components/TimeSeriesChart';

export default async function IndicesPage() {
  const indexData = await GetIndexTimeSeries();

  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-3xl font-bold text-center mb-6">PSX Indices Time Series</h1>
      {indexData.every((index: any) => index.timeSeries.length === 0) && (
        <div className="text-center text-lg text-gray-600 py-5">
          No data available for any index
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {indexData.map((index: any) => (
          <div key={index.symbol}>
            {index.timeSeries.length > 0 ? (
              <TimeSeriesChart data={index.timeSeries} symbol={index.symbol} />
            ) : (
              <div className="p-4 bg-white shadow-md rounded-lg text-center text-lg text-gray-600">
                No time series data available for {index.symbol}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}