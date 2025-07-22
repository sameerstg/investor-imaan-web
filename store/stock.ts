import { create } from 'zustand';

// Define the shape of each market data item
interface MarketDataItem {
  symbol: string;
  name: string;
  sectorName: string;
  isETF: boolean;
  isDebt: boolean;
}

// Define the store's state and actions
interface MarketStore {
  marketData: MarketDataItem[];
  loading: boolean;
  error: string | null;
  fetchMarketData: () => Promise<void>;
}

const useMarketStore = create<MarketStore>((set) => ({
  marketData: [],
  loading: false,
  error: null,

  fetchMarketData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('https://dps.psx.com.pk/symbols');
      const data = await response.json();

      // Transform the API data to match the desired format
      const formattedData: MarketDataItem[] = data.data;

      set({
        marketData: formattedData,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch market data',
        loading: false,
      });
    }
  },
}));

export default useMarketStore;