import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats, toggleIsloading, type ChartDataPoint } from "../../redux/slices/statistics/statisticsSlice";
import type { RootState, AppDispatch } from "../../redux/store";
import {
  FiTrendingUp,
  FiDollarSign,
  FiDownload,
  FiBell,
  FiUserPlus,
  FiUsers,
  FiArrowUpRight,
  FiArrowDownRight,
} from "react-icons/fi";
import { Button, LinearProgress, Tooltip } from "@mui/material";
import { getIsStatisticsPending } from "../../redux/selectors";
import { Refresh } from "@mui/icons-material";
import { FaTicketAlt, FaChartLine } from "react-icons/fa";

// Mock Chart Data
function generateMockChartData(days = 30) {
  const out: ChartDataPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const base = 800 + (i % 7) * 120;
    const variance = Math.round(Math.sin(i) * 80) + (i % 5) * 20;
    const sales = Math.max(0, base + variance);
    const orders = Math.max(1, Math.round(sales / 45));
    out.push({ date: d.toISOString().slice(0, 10), sales, orders });
  }
  return out;
}

const mockCustomers = {
  total: 1200,
  newThisMonth: 45,
  trend: 15,
};

const mockNotifications = [
  { id: 1, message: "New product added: Fresh Bananas", date: "2025-12-27", type: "success" },
  { id: 2, message: "Monthly report is ready to download.", date: "2025-12-26", type: "info" },
  { id: 3, message: "Stock updated for Milk 1L.", date: "2025-12-25", type: "info" },
];

const mockTasks = [
  { id: 1, task: "Review December sales report", done: false, priority: "high" },
  { id: 2, task: "Approve new supplier", done: false, priority: "medium" },
  { id: 3, task: "Check pending customer queries", done: true, priority: "low" },
];

function currency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "UZS" }).format(v);
}

function SalesTrendChart({ data }: { data: ChartDataPoint[] }) {
  const maxSales = Math.max(...data.map(d => d.sales));
  return (
    <div className="w-full h-48 bg-gradient-to-b from-blue-50 to-transparent rounded-lg flex items-end gap-1 px-4 py-6 border border-blue-100">
      {data.slice(-30).map((d) => (
        <Tooltip key={d.date} title={`${d.date}: ${currency(d.sales)}`} placement="top">
          <div
            className="flex-1 rounded-t-sm hover:opacity-100 transition-all cursor-pointer hover:shadow-lg"
            style={{
              height: `${Math.max(5, (d.sales / maxSales) * 100)}%`,
              background: "linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)",
              opacity: 0.7,
            }}
          />
        </Tooltip>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { finance, weeklyData, isLoading, error } = useSelector(
    (s: RootState) => s.statistics
  );
  const [dateRange, setDateRange] = useState("month");

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(toggleIsloading());
    setTimeout(() => {
      dispatch(toggleIsloading());
    }, 5000);
  }, [dispatch]);

  const chartData = weeklyData.length > 0 ? weeklyData : generateMockChartData(30);

  const totals = useMemo(() => {
    if (finance) {
      const ordersMTD = weeklyData.length > 0 ? weeklyData.reduce((sum, d) => sum + d.orders, 0) : 0;
      return {
        salesToday: finance.salesToday || 0,
        netSaleToday: finance.netSaleToday || 0,
        profitToday: finance.netProfitToday || 0,
        salesMTD: finance.totalSale || 0,
        netSaleMTD: finance.totalNetSale || 0,
        netProfitMTD: finance.totalNetProfit || 0,
        ordersMTD,
      };
    }
    const salesToday = chartData[chartData.length - 1]?.sales || 0;
    const netSaleToday = +(salesToday * 0.6).toFixed(2);
    const profitToday = +(salesToday * 0.32).toFixed(2);
    const salesMTD = chartData.reduce((s, d) => s + d.sales, 0);
    const netSaleMTD = +(salesMTD * 0.6).toFixed(2);
    const netProfitMTD = +(salesMTD * 0.32).toFixed(2);
    return { salesToday, netSaleToday, profitToday, salesMTD, netSaleMTD, netProfitMTD, ordersMTD: 0 };
  }, [finance, weeklyData, chartData]);

  const isloadingStatus = useSelector(getIsStatisticsPending);

  if (isLoading && !finance) {
    return (
      <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-500 mb-8">Loading your data...</p>
          <LinearProgress />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* LOADING BAR */}
        {isloadingStatus !== "fulfilled" && (
          <div className="mb-6 rounded-lg overflow-hidden shadow-sm">
            <LinearProgress
              variant="indeterminate"
              color={
                isloadingStatus === "rejected"
                  ? "error"
                  : isloadingStatus === "pending"
                  ? "secondary"
                  : "inherit"
              }
            />
          </div>
        )}

        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your business overview.</p>
          </div>
          <Tooltip title="Refresh data">
            <Button
              onClick={() => {
                dispatch(fetchDashboardStats());
                dispatch(toggleIsloading());
              }}
              variant="outlined"
              className="mt-4 sm:mt-0"
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          </Tooltip>
        </div>

        {/* ERROR ALERT */}
        {error && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-amber-900">API Error</h3>
                <p className="text-amber-800 text-sm">{error} - Showing mock data</p>
              </div>
              <button
                onClick={() => dispatch(fetchDashboardStats())}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* KPI CARDS - TOP ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiDollarSign className="text-blue-600 text-xl" />
              </div>
              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                <FiArrowUpRight size={14} /> 12%
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Sales Today</p>
            <p className="text-2xl font-bold text-gray-900">{currency(totals.salesToday)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <FiTrendingUp className="text-green-600 text-xl" />
              </div>
              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                <FiArrowUpRight size={14} /> 8%
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Net Sale Today</p>
            <p className="text-2xl font-bold text-gray-900">{currency(totals.netSaleToday)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FiTrendingUp className="text-purple-600 text-xl" />
              </div>
              <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                <FiArrowDownRight size={14} /> 3%
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Profit Today</p>
            <p className="text-2xl font-bold text-gray-900">{currency(totals.profitToday)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <FiUsers className="text-orange-600 text-xl" />
              </div>
              <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                <FiArrowUpRight size={14} /> 15%
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900">{mockCustomers.total}</p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 mb-8">
          <button className="px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
            <FiDownload size={18} /> Export CSV
          </button>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
            <FiDownload size={18} /> Export PDF
          </button>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* LEFT SECTION - STATISTICS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Sales Trend</h3>
                  <p className="text-sm text-gray-500">Last 30 days performance</p>
                </div>
                <div className="flex gap-2">
                  {["week", "month", "year"].map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        dateRange === range
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <SalesTrendChart data={chartData} />
            </div>

            {/* MONTHLY STATISTICS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Total Sales MTD */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-900">Total Sales MTD</p>
                    <FiDollarSign className="text-blue-600 text-lg" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{currency(totals.salesMTD)}</p>
                  <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
                    <FiArrowUpRight size={12} /> +12% from last month
                  </p>
                </div>

                {/* Net Sales MTD */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-green-900">Net Sales MTD</p>
                    <FiTrendingUp className="text-green-600 text-lg" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">{currency(totals.netSaleMTD)}</p>
                  <p className="text-xs text-green-700 mt-2">After deductions</p>
                </div>

                {/* Net Profit MTD */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-purple-900">Net Profit MTD</p>
                    <FaChartLine className="text-purple-600 text-lg" />
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{currency(totals.netProfitMTD)}</p>
                  <p className="text-xs text-purple-700 mt-2">Final profit</p>
                </div>

                {/* Orders MTD */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-orange-900">Orders MTD</p>
                    <FaTicketAlt className="text-orange-600 text-lg" />
                  </div>
                  <p className="text-3xl font-bold text-orange-900">{totals.ordersMTD || 0}</p>
                  <p className="text-xs text-orange-700 mt-2">Total orders</p>
                </div>
              </div>

              {/* QUICK SUMMARY */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Quick Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 mb-1">Avg Daily Sales</p>
                    <p className="text-xl font-bold text-gray-900">{currency(totals.salesMTD / 30)}</p>
                  </div>
                  <div className="text-center border-l border-r border-gray-300">
                    <p className="text-xs font-medium text-gray-600 mb-1">Avg Order Value</p>
                    <p className="text-xl font-bold text-gray-900">
                      {currency(
                        (totals.ordersMTD as number) > 0
                          ? totals.salesMTD / (totals.ordersMTD as number)
                          : 0
                      )}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 mb-1">Profit Margin</p>
                    <p className="text-xl font-bold text-gray-900">
                      {totals.salesMTD > 0 ? ((totals.netProfitMTD / totals.salesMTD) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION - WIDGETS */}
          <div className="space-y-6">
            {/* CUSTOMER GROWTH */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-sm p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold">New Customers</h4>
                <div className="bg-white/20 p-2 rounded-lg">
                  <FiUserPlus className="text-xl" />
                </div>
              </div>
              <p className="text-4xl font-bold mb-1">{mockCustomers.newThisMonth}</p>
              <p className="text-blue-100 text-sm flex items-center gap-1">
                <FiArrowUpRight size={14} /> {mockCustomers.trend}% from last month
              </p>
            </div>

            {/* NOTIFICATIONS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiBell className="text-orange-600" /> Notifications
              </h4>
              <div className="space-y-2">
                {mockNotifications.map((n) => (
                  <div key={n.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500 hover:bg-gray-100 transition-colors">
                    <p className="text-sm text-gray-900 font-medium">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* TASKS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="font-bold text-gray-900 mb-4">Tasks & Reminders</h4>
              <div className="space-y-2">
                {mockTasks.map((t) => (
                  <label key={t.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={t.done}
                      readOnly
                      className="w-4 h-4 rounded"
                    />
                    <span className={`text-sm flex-1 ${t.done ? "line-through text-gray-400" : "text-gray-900"}`}>
                      {t.task}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      t.priority === "high"
                        ? "bg-red-100 text-red-700"
                        : t.priority === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {t.priority}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
