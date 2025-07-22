"use server";

import puppeteer from "puppeteer";

export interface SymbolData {
  symbol: string;
  name: string;
  sectorName: string;
  isETF: boolean;
  isDebt: boolean;
}

export interface TimeSeriesData {
  timestamp: number;
  price: number;
  volume: number;
}

export interface SymbolWithTimeSeries {
  symbolData: SymbolData;
  timeSeries: TimeSeriesData[];
}
export interface CompanyReport {
  reportType: "Annual" | "Quarterly";
  periodEnded: string; // ISO date string (e.g., '2024-12-31')
  postingDate: string; // ISO date string (e.g., '2025-02-27')
}
export async function GetAllSymbolsWithTimeSeries() {
  try {
    // Fetch symbol metadata
    const symbolResponse = await fetch("https://dps.psx.com.pk/symbols", {
      cache: "no-store",
    });
    const symbolData = await symbolResponse.json();
    const filteredSymbols = symbolData.filter(
      (x: SymbolData) => x.sectorName !== "BILLS AND BONDS"
    );

    // Fetch time series data for each symbol (limit to first 5 to avoid API overload)
    const maxSymbols = 100; // Adjust as needed
    const timeSeriesPromises = filteredSymbols
      .slice(0, maxSymbols)
      .map(async (symbolItem: SymbolData) => {
        try {
          const timeSeriesResponse = await fetch(
            `https://dps.psx.com.pk/timeseries/int/${symbolItem.symbol}`,
            { cache: "no-store" }
          );
          const timeSeriesData = await timeSeriesResponse.json();
          const formattedTimeSeries: TimeSeriesData[] = timeSeriesData.data.map(
            (item: [number, number, number]) => ({
              timestamp: item[0],
              price: item[1],
              volume: item[2],
            })
          );
          return {
            symbolData: symbolItem,
            timeSeries: formattedTimeSeries,
          };
        } catch (error: any) {
          console.error(
            `Failed to fetch time series for ${symbolItem.symbol}:`,
            error.message
          );
          return { symbolData: symbolItem, timeSeries: [] };
        }
      });

    const symbolsWithTimeSeries: SymbolWithTimeSeries[] = await Promise.all(
      timeSeriesPromises
    );

    return symbolsWithTimeSeries;
  } catch (error: any) {
    console.error("Failed to fetch symbols:", error.message);
    return [];
  }
}
export async function GetAllSymbols() {
  try {
    const response = await fetch("https://dps.psx.com.pk/symbols", {});
    const data = await response.json();

    return data.filter((x: SymbolData) => x.sectorName !== "BILLS AND BONDS");
  } catch (error: any) {
    console.error("Failed to fetch symbols:", error.message);
    return [];
  }
}
export async function GetCompanyName(symbol: string) {
  try {
    const response = await fetch("https://dps.psx.com.pk/symbols", {});
    const data = await response.json();

    return (
      data.find((x: SymbolData) => x.symbol === symbol)?.name ||
      "Unknown Company"
    );
  } catch (error: any) {
    console.error("Failed to fetch symbols:", error.message);
    return [];
  }
}

export async function GetDayData(symbol: string) {
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
    return formattedTimeSeries;
  } catch (error: any) {
    console.error(`Failed to fetch time series for ${symbol}:`, error.message);
    return { symbol, timeSeries: [] };
  }
}
export async function GetAllTimeData(symbol: string) {
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
    return formattedTimeSeries;
  } catch (error: any) {
    console.error(`Failed to fetch time series for ${symbol}:`, error.message);
    return { symbol, timeSeries: [] };
  }
}
export interface CompanyReport {
  tableHtml: string; // HTML string of the table
}

export async function GetCompanyReports(symbol: string): Promise<any> {
  try {
    console.log(`Fetching reports for ${symbol}`);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true, // or 'new' if you're using newer versions and want full headless mode
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Useful for server environments
    });

    const page = await browser.newPage();

    // Navigate to target URL
    await page.goto(`https://dps.psx.com.pk/company/reports/${symbol}`, {
      waitUntil: "networkidle0",
    });

    // Wait for the table to load
    await page.waitForSelector("table");

    // Extract the table HTML
    const tableHtml = await page.$eval("table", (table) => table.outerHTML);

    await browser.close();

    return { tableHtml };
  } catch (error: any) {
    console.error(`Failed to fetch reports for ${symbol}:`, error.message);
    return { tableHtml: "" };
  }
}
