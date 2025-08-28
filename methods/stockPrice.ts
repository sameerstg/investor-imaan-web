"use server";
import { TimeSeriesData } from "./stocks";

export async function GetDayDataRealtime(symbol: string) {
  try {
    const response = await fetch(
      `https://dps.psx.com.pk/timeseries/int/${symbol}`,
      {
        next: { revalidate: 60 }, // cache for 60 seconds
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


    return formattedTimeSeries;
  } catch (error: any) {
    console.error(
      `Failed to fetch real-time time series for ${symbol}:`,
      error.message
    );
    return { symbol, timeSeries: [] };
  }
}


export async function GetAllTimeData(symbol: string) {



  try {
    const response = await fetch(
      `https://dps.psx.com.pk/timeseries/eod/${symbol}`,
      {
        next: { revalidate: 60*60*60*24 }, 
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

    return formattedTimeSeries;
  } catch (error: any) {
    console.error(`Failed to fetch time series for ${symbol}:`, error.message);
    return { symbol, timeSeries: [] };
  }
}
