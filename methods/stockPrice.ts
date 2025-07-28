'use server';
import { TimeSeriesData } from "./stocks";
// In-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

// Utility function to check if cache is still valid
function isCacheValid(timestamp: number, duration: number): boolean {
  return Date.now() - timestamp < duration;
}
export async function GetDayDataRealtime(symbol: string) {
  try {
    const response = await fetch(
      `https://dps.psx.com.pk/timeseries/int/${symbol}`,
      {
        cache: "no-store",
      }
    );
    const data = await response.json();

    const formattedTimeSeries: TimeSeriesData[] = data.data.map(
      (item: [number, number, number]) => ({
        timestamp: item[0],
        price: item[1],
        volume: item[2],
      })
    );

    // Cache the result for future use by GetDayData or GetDayDataCached
    const cacheKey = `dayData_${symbol}`;
    cache.set(cacheKey, { data: formattedTimeSeries, timestamp: Date.now() });

    return formattedTimeSeries;
  } catch (error: any) {
    console.error(
      `Failed to fetch real-time time series for ${symbol}:`,
      error.message
    );
    return { symbol, timeSeries: [] };
  }
}

export async function GetDayDataCached(symbol: string) {
  const cacheKey = `dayData_${symbol}`;
  const cached = cache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp, 1000 * 60 * 60 * 24)) {
    return cached.data;
  }

  return null;
}

export async function GetAllTimeData(symbol: string) {
  const cacheKey = `allTimeData_${symbol}`;
  const cached = cache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp, 1000 * 60 * 60 * 24)) {
    return cached.data;
  }

  try {
    const response = await fetch(
      `https://dps.psx.com.pk/timeseries/eod/${symbol}`,
      {
        cache: "no-store",
      }
    );
    const data = await response.json();

    const formattedTimeSeries: TimeSeriesData[] = data.data.map(
      (item: [number, number, number]) => ({
        timestamp: item[0],
        price: item[1],
        volume: item[2],
      })
    );

    // Cache the result
    cache.set(cacheKey, { data: formattedTimeSeries, timestamp: Date.now() });

    return formattedTimeSeries;
  } catch (error: any) {
    console.error(`Failed to fetch time series for ${symbol}:`, error.message);
    return { symbol, timeSeries: [] };
  }
}
