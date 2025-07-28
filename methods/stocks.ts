"use server";

import puppeteer from "puppeteer";

// In-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();

// Utility function to check if cache is still valid
function isCacheValid(timestamp: number, duration: number): boolean {
  return Date.now() - timestamp < duration;
}

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

export async function GetAllSymbols() {
  const cacheKey = "allSymbols";
  const cached = cache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp, 1000 * 60 * 60 * 24)) {
    return cached.data;
  }

  try {
    const response = await fetch("https://dps.psx.com.pk/symbols", {});
    const data = await response.json();

    const filteredData = data.filter(
      (x: SymbolData) => x.sectorName !== "BILLS AND BONDS"
    );

    // Cache the result
    cache.set(cacheKey, { data: filteredData, timestamp: Date.now() });

    return filteredData;
  } catch (error: any) {
    console.error("Failed to fetch symbols:", error.message);
    return [];
  }
}

export async function GetCompanyName(symbol: string) {
  const cacheKey = `companyName_${symbol}`;
  const cached = cache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp, 1000 * 60 * 60 * 24)) {
    return cached.data;
  }

  try {
    const response = await fetch("https://dps.psx.com.pk/symbols", {});
    const data = await response.json();

    const companyName =
      data.find((x: SymbolData) => x.symbol === symbol)?.name ||
      "Unknown Company";

    // Cache the result
    cache.set(cacheKey, { data: companyName, timestamp: Date.now() });

    return companyName;
  } catch (error: any) {
    console.error("Failed to fetch symbols:", error.message);
    return "Unknown Company";
  }
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

export interface CompanyReport {
  tableHtml: string; // HTML string of the table
}

export async function GetCompanyReports(symbol: string): Promise<any> {
  const cacheKey = `companyReports_${symbol}`;
  const cached = cache.get(cacheKey);

  if (cached && isCacheValid(cached.timestamp, 1000 * 60 * 60 * 24)) {
    return cached.data;
  }

  try {
    console.log(`Fetching reports for ${symbol}`);

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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

    // Cache the result
    cache.set(cacheKey, { data: { tableHtml }, timestamp: Date.now() });

    return { tableHtml };
  } catch (error: any) {
    console.error(`Failed to fetch reports for ${symbol}:`, error.message);
    return { tableHtml: "" };
  }
}
