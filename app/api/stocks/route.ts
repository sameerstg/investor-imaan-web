import puppeteer from 'puppeteer';

interface Cache {
  stocks: Array<{
    company: string;
    open: string;
    high: string;
    low: string;
    close: string;
    average: string;
    volume: string;
    trades: string;
    changeNet: string;
  }>;
  timestamp: number;
}

const cache: Cache = {
  stocks: [],
  timestamp: 0,
};

export async function GET() {
  try {
    // Check if cache is valid (less than 24 hours old)
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();

    if (cache.stocks.length > 0 && now - cache.timestamp < CACHE_DURATION) {
      console.log('Serving from cache');
      return new Response(JSON.stringify(cache.stocks), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    // Navigate and wait for the table
    await page.goto('https://www.khistocks.com/market-live/index-live/KMIALL.html', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForSelector('#tbl_const', { timeout: 10000 });

    // Extract data
    const stocks = await page.evaluate(() => {
      const table = document.querySelector('#tbl_const');
      if (!table) return [];

      const rows = table.querySelectorAll('tbody tr');
      const stockData: Array<{
        company: string;
        open: string;
        high: string;
        low: string;
        close: string;
        average: string;
        volume: string;
        trades: string;
        changeNet: string;
      }> = [];

      rows.forEach((row) => {
        const columns = row.querySelectorAll('td');
        if (columns.length >= 9) {
          stockData.push({
            company: columns[0].textContent?.trim() || 'N/A',
            open: columns[1].textContent?.trim() || 'N/A',
            high: columns[2].textContent?.trim() || 'N/A',
            low: columns[3].textContent?.trim() || 'N/A',
            close: columns[4].textContent?.trim() || 'N/A',
            average: columns[5].textContent?.trim() || 'N/A',
            volume: columns[6].textContent?.trim() || 'N/A',
            trades: columns[7].textContent?.trim() || 'N/A',
            changeNet: columns[8].textContent?.trim() || 'N/A',
          });
        }
      });

      return stockData;
    });

    // Close the browser
    await browser.close();

    // Update cache
    if (stocks.length > 0) {
      cache.stocks = stocks;
      cache.timestamp = now;
      console.log('Cache updated with new data');
    } else {
      console.error('No stock data extracted from the table');
      return new Response(JSON.stringify({ error: 'No stock data found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return the scraped data
    return new Response(JSON.stringify(stocks), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error:any) {
    console.error('Error fetching stock data:', {
      message: error?.message,
      stack: error?.stack,
    });
    // Return cached data if available and error occurs
    if (cache.stocks.length > 0) {
      console.log('Serving stale cache due to error');
      return new Response(JSON.stringify(cache.stocks), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(
      JSON.stringify({ error: 'Failed to fetch stock data', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}