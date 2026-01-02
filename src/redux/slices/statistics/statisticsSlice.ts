import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../config/endpoints";
import { toast } from "react-toastify";

export type FinanceStats = {
  totalSale: number;
  totalNetSale: number;
  totalNetProfit: number;
  salesToday: number;
  netSaleToday: number; // Added this field
  netProfitToday: number;
};

export type ChartDataPoint = {
  date: string;
  sales: number;
  orders: number;
};

export type ProductStats = {
  id: string;
  name: string;
  units?: number;
  revenue?: number;
  stock?: number;
};

type StatisticsState = {
  finance: FinanceStats | null;
  weeklyData: ChartDataPoint[];
  topProducts: ProductStats[];
  lowStockProducts: ProductStats[];
  isLoading: boolean;
  error: string | null;
  status:"pending" | "fulfilled" |"rejected" | "idle";
};

const initialState: StatisticsState = {
  finance: null,
  weeklyData: [],
  topProducts: [],
  lowStockProducts: [],
  isLoading: false,
  error: null,
  status:"idle"
};

// Thunk to fetch dashboard finance statistics
export const fetchDashboardStats = createAsyncThunk(
  "statistics/fetchDashboardStats",
  async (_, { rejectWithValue, getState }) => {
    try {
      // Get token from Redux state
      const state = getState() as any;
      const token = state.auth?.accessToken;

      if (!token) {
        const errorMsg = "No authentication token found";
        toast.error(errorMsg);
        return rejectWithValue(errorMsg);
      }

      // Fetch finance stats
      const financeRes = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.statistics.financeMain}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
          "ngrok-skip-browser-warning": "true", // Skip ngrok browser warning
        },
      });

      // Check if response is HTML (error page)
      const contentType = financeRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        await financeRes.text(); // Read the response to clear it
        const errorMsg = `API returned HTML instead of JSON. Status: ${financeRes.status}. Check if endpoint exists: ${ENDPOINTS.statistics.financeMain}`;
        toast.error("Failed to load finance statistics");
        throw new Error(errorMsg);
      }

      if (!financeRes.ok) {
        const errorText = await financeRes.text();
        try {
          const errorJson = JSON.parse(errorText);
          const errorMsg = errorJson.message || `Failed to fetch finance stats (Status: ${financeRes.status})`;
          toast.error(errorMsg);
          throw new Error(errorMsg);
        } catch {
          const errorMsg = `Failed to fetch finance stats (Status: ${financeRes.status})`;
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
      }

      const financeResponse = await financeRes.json();
      // Handle response that might be wrapped in 'data' property
      const apiData = financeResponse.data || financeResponse;
      
      // Map API response to our expected structure
      // API returns: { sale, net_sale, profit, today: { sale, net_sale, profit } }
      // We need: { totalSale, totalNetSale, totalNetProfit, salesToday, netSaleToday, netProfitToday }
      const financeData: FinanceStats = {
        totalSale: apiData.sale || apiData.total_sale || 0,
        totalNetSale: apiData.net_sale || 0,
        totalNetProfit: apiData.profit || 0,
        salesToday: apiData.today?.sale || apiData.today?.total_sale || 0,
        netSaleToday: apiData.today?.net_sale || 0,
        netProfitToday: apiData.today?.profit || 0,
      };

      // Fetch weekly chart data
      const weeklyRes = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.statistics.graphWeekly}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
          "ngrok-skip-browser-warning": "true", // Skip ngrok browser warning
        },
      });

      // Check if response is HTML (error page)
      const weeklyContentType = weeklyRes.headers.get("content-type");
      if (!weeklyContentType || !weeklyContentType.includes("application/json")) {
        await weeklyRes.text(); // Read the response to clear it
        const errorMsg = `API returned HTML instead of JSON. Status: ${weeklyRes.status}. Check if endpoint exists: ${ENDPOINTS.statistics.graphWeekly}`;
        toast.error("Failed to load weekly data");
        throw new Error(errorMsg);
      }

      if (!weeklyRes.ok) {
        const errorText = await weeklyRes.text();
        try {
          const errorJson = JSON.parse(errorText);
          const errorMsg = errorJson.message || `Failed to fetch weekly data (Status: ${weeklyRes.status})`;
          toast.error(errorMsg);
          throw new Error(errorMsg);
        } catch {
          const errorMsg = `Failed to fetch weekly data (Status: ${weeklyRes.status})`;
          toast.error(errorMsg);
          throw new Error(errorMsg);
        }
      }

      const weeklyResponse = await weeklyRes.json();
      // Handle response that might be wrapped in 'data' property
      const apiWeeklyData = weeklyResponse.data || weeklyResponse;
      
      // Map API response to ChartDataPoint format
      // API returns: [{ day, month, year, total_sale, net_sale, profit }]
      // We need: [{ date: "YYYY-MM-DD", sales: number, orders: number }]
      let weeklyData: ChartDataPoint[] = [];
      if (Array.isArray(apiWeeklyData)) {
        weeklyData = apiWeeklyData.map((item: any) => {
          // Convert day, month, year to date string (YYYY-MM-DD)
          let dateStr = "";
          if (item.day && item.month && item.year) {
            const month = String(item.month).padStart(2, '0');
            const day = String(item.day).padStart(2, '0');
            dateStr = `${item.year}-${month}-${day}`;
          } else if (item.date) {
            dateStr = item.date;
          } else {
            dateStr = new Date().toISOString().slice(0, 10);
          }
          
          return {
            date: dateStr,
            sales: item.total_sale || item.sales || item.sale || 0,
            orders: item.count || item.orders || item.order || 0, // API doesn't provide orders, use count if available
          };
        });
        
        // Sort by date to ensure chronological order
        weeklyData.sort((a, b) => a.date.localeCompare(b.date));
      }

      // Fetch high-stock (top products)
      const highStockRes = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.statistics.highStock}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
          "ngrok-skip-browser-warning": "true",
        },
      });

      let topProducts: ProductStats[] = [];
      if (highStockRes.ok) {
        const highStockContentType = highStockRes.headers.get("content-type");
        if (highStockContentType && highStockContentType.includes("application/json")) {
          const highStockResponse = await highStockRes.json();
          const apiTopProducts = highStockResponse.data || highStockResponse;
          // Map API response to our ProductStats format
          topProducts = Array.isArray(apiTopProducts) ? apiTopProducts.map((p: any) => ({
            id: p.id || p._id || String(Math.random()),
            name: p.name || p.product_name || "Unknown Product",
            units: p.units || p.quantity || p.sold || 0,
            revenue: p.revenue || p.total_revenue || p.amount || 0,
          })) : [];
        }
      } else {
        toast.warning("Could not load top products data");
      }

      // Fetch low-stock products
      const lowStockRes = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.statistics.lowStock}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
          "ngrok-skip-browser-warning": "true",
        },
      });

      let lowStockProducts: ProductStats[] = [];
      if (lowStockRes.ok) {
        const lowStockContentType = lowStockRes.headers.get("content-type");
        if (lowStockContentType && lowStockContentType.includes("application/json")) {
          const lowStockResponse = await lowStockRes.json();
          const apiLowStock = lowStockResponse.data || lowStockResponse;
          // Map API response to our ProductStats format
          lowStockProducts = Array.isArray(apiLowStock) ? apiLowStock.map((p: any) => ({
            id: p.id || p._id || String(Math.random()),
            name: p.name || p.product_name || "Unknown Product",
            stock: p.stock || p.quantity || p.remaining || 0,
          })) : [];
        }
      } else {
        toast.warning("Could not load low stock products data");
      }

      // Show success toast
      toast.success("Dashboard statistics loaded successfully");

      return { 
        finance: financeData, 
        weekly: weeklyData,
        topProducts,
        lowStockProducts,
      };
    } catch (error) {
      const errorMsg = (error as Error).message || "Failed to fetch dashboard statistics";
      // Toast already shown in catch blocks above, so we don't need another one here
      return rejectWithValue(errorMsg);
    }
  }
);

const statisticsSlice = createSlice({
  name: "statistics",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    toggleIsloading(state){
      state.isLoading=!state.isLoading;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status="pending"
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status="fulfilled";
        state.finance = action.payload.finance;
        state.weeklyData = action.payload.weekly;
        state.topProducts = action.payload.topProducts || [];
        state.lowStockProducts = action.payload.lowStockProducts || [];
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.status="rejected";
        // Error toast already shown in the thunk
      });
  },
});

export const { clearError, toggleIsloading } = statisticsSlice.actions;
export default statisticsSlice.reducer;