import puppeteer from "puppeteer";

// Define the shape of the data returned from page.evaluate
interface TableData {
  priceHistory: string[][];
  dividendData: string[][];
  announcementData: string[][];
  companyImageSrc: string;
  companyName: string;
  currentPrice: string;
  priceChange: string;
}

interface ResponseData {
  allData: TableData;
}

export async function GET(NextRequest: Request): Promise<Response> {
  const url = new URL(NextRequest.url);
  const symbol = url.searchParams.get("symbol");

  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Navigate and wait for key elements
    await page.goto(
      `https://www.khistocks.com/market-live/companies-live/detailed-view/${symbol}.html`,
      {
        waitUntil: "networkidle2",
        timeout: 30000,
      }
    );
    // Wait for critical elements to ensure they are loaded
    await Promise.all([
      page.waitForSelector("#table_id", { timeout: 10000 }),
      page.waitForSelector("#cmpimg", { timeout: 10000 }),
      page.waitForSelector("#cmpname", { timeout: 10000 }),
      page.waitForSelector("#direction", { timeout: 10000 }),
      page.waitForSelector(".per-price-down", { timeout: 10000 }).catch(() => null), // Optional, as it may not exist
    ]);

    // Extract data
    const allData: TableData = await page.evaluate((): TableData => {
      // Extract price history table (#table_id)
      const priceHistory: string[][] = [];
      const table = document.querySelector("#table_id");
      if (table) {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row) => {
          const columns = row.querySelectorAll("td");
          const newRow: string[] = [];
          columns.forEach((element) => {
            newRow.push(element.textContent?.trim() || "N/A");
          });
          priceHistory.push(newRow);
        });
      }

      // Extract dividend table (#dividendtable)
      const dividendData: string[][] = [];
      const dividendTable = document.querySelector("#dividendtable");
      if (dividendTable) {
        const dividendRows = dividendTable.querySelectorAll("tbody tr");
        dividendRows.forEach((row) => {
          const columns = row.querySelectorAll("td");
          const newRow: string[] = [];
          columns.forEach((element) => {
            newRow.push(element.textContent?.trim() || "N/A");
          });
          dividendData.push(newRow);
        });
      }

      // Extract announcement table (#ann_table)
      const announcementData: string[][] = [];
      const annTable = document.querySelector("#ann_table");
      if (annTable) {
        const annRows = annTable.querySelectorAll("tbody tr");
        annRows.forEach((row) => {
          const columns = row.querySelectorAll("td");
          const newRow: string[] = [];
          columns.forEach((element) => {
            newRow.push(element.textContent?.trim() || "N/A");
          });
          announcementData.push(newRow);
        });
      }

      // Extract image src from #cmpimg
      const companyImageSrc = document.querySelector("#cmpimg")?.getAttribute("src") || "N/A";

      // Extract company name from #cmpname
      const companyName = document.querySelector("#cmpname")?.textContent?.trim() || "N/A";

      // Extract current price from #direction
      const currentPrice = document.querySelector("#direction")?.textContent?.trim() || "N/A";

      // Extract price change from .per-price-down
      const priceChange = document.querySelector(".per-price-down")?.textContent?.trim() || "N/A";

      return {
        priceHistory,
        dividendData,
        announcementData,
        companyImageSrc,
        companyName,
        currentPrice,
        priceChange,
      };
    });

    // Close the browser
    await browser.close();

    // Return the scraped data
    return new Response(JSON.stringify({ allData } as ResponseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching stock data:", {
      message: error?.message,
      stack: error?.stack,
    });
    // Return error response
    return new Response(
      JSON.stringify({
        error: "Failed to fetch stock data",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}