import { useMemo } from "react";
import { TrendingUp, AttachMoney, CreditCard, Percent, ShoppingCart } from "@mui/icons-material";

type PaymentMethod = "cash" | "card" | "mobile" | "" | null;

interface Sale {
  id: number;
  sale_id: string;
  total_price: number;
  profit: number;
  total_net_price: number;
  payment_method: PaymentMethod;
  sale_time: string;
  admin_name?: string;
}

interface SalesStatisticsProps {
  sales: Sale[];
}

export default function SalesStatistics({ sales }: SalesStatisticsProps) {
  const statistics = useMemo(() => {
    const totalSales = sales.length;
    const totalAmount = sales.reduce((sum, sale) => sum + Number(sale.total_price || 0), 0);
    const totalProfit = sales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0);

    // Calculate paid vs credit
    const paidCash = totalProfit; // Sum of all profits (what has been paid)
    const onCredit = totalAmount - totalProfit; // Remaining unpaid amount (on credit)

    // Calculate percentages
    const paidPercentage = totalAmount > 0 ? (paidCash / totalAmount) * 100 : 0;
    const creditPercentage = totalAmount > 0 ? (onCredit / totalAmount) * 100 : 0;
    const profitMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

    // Group by admin
    const adminStats: Record<string, { count: number; total: number; profit: number }> = {};
    sales.forEach((sale) => {
      const admin = sale.admin_name || "Unknown";
      if (!adminStats[admin]) {
        adminStats[admin] = { count: 0, total: 0, profit: 0 };
      }
      adminStats[admin].count++;
      adminStats[admin].total += Number(sale.total_price || 0);
      adminStats[admin].profit += Number(sale.profit || 0);
    });

    const topAdmins = Object.entries(adminStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalSales,
      totalAmount,
      totalProfit,
      paidCash,
      onCredit,
      paidPercentage,
      creditPercentage,
      profitMargin,
      topAdmins,
    };
  }, [sales]);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Sotuvlar Statistikasi</h2>
        <div className="text-sm text-gray-500">
          Jami sotuvlar: <span className="font-semibold text-gray-900">{statistics.totalSales}</span>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="text-white opacity-80" />
            <span className="text-sm font-medium opacity-90">Jami Sotuvlar</span>
          </div>
          <div className="text-3xl font-bold mb-1">{statistics.totalSales}</div>
          <div className="text-sm opacity-80">{formatter.format(statistics.totalAmount)}</div>
        </div>

        {/* Total Profit Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-white opacity-80" />
            <span className="text-sm font-medium opacity-90">Jami Foyda</span>
          </div>
          <div className="text-3xl font-bold mb-1">{formatter.format(statistics.totalAmount)}</div>
          <div className="text-sm opacity-80">Foyda darajasi: {statistics.profitMargin.toFixed(1)}%</div>
        </div>

        {/* Cash Paid Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <AttachMoney className="text-white opacity-80" />
            <span className="text-sm font-medium opacity-90">Naqd To'langan</span>
          </div>
          <div className="text-3xl font-bold mb-1">{formatter.format(statistics.paidCash)}</div>
          <div className="text-sm opacity-80">
            {statistics.paidPercentage.toFixed(1)}%
          </div>
        </div>

        {/* Credit Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="text-white opacity-80" />
            <span className="text-sm font-medium opacity-90">Nasiya</span>
          </div>
          <div className="text-3xl font-bold mb-1">{formatter.format(statistics.onCredit)}</div>
          <div className="text-sm opacity-80">
            {statistics.creditPercentage.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Payment Distribution Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Percent className="text-blue-600" />
          To'lov Usullari Taqsimoti
        </h3>
        <div className="space-y-4">
          {/* Cash Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">💵 Naqd</span>
              <span className="text-sm font-semibold text-gray-900">
                {statistics.paidPercentage.toFixed(1)}% ({formatter.format(statistics.paidCash)})
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-emerald-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${statistics.paidPercentage}%` }}
              />
            </div>
          </div>

          {/* Credit Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">💳 Nasiya</span>
              <span className="text-sm font-semibold text-gray-900">
                {statistics.creditPercentage.toFixed(1)}% ({formatter.format(statistics.onCredit)})
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-orange-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${statistics.creditPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Admins */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-600" />
          Eng Yaxshi Adminlar (Top 5)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Admin Nomi</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Sotuvlar</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Jami Summa</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Foyda</th>
              </tr>
            </thead>
            <tbody>
              {statistics.topAdmins.map((admin, index) => (
                <tr key={admin.name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{admin.name}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-700">{admin.count}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                    {formatter.format(admin.total)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                    {formatter.format(admin.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">O'rtacha Sotuv</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatter.format(statistics.totalSales > 0 ? statistics.totalAmount / statistics.totalSales : 0)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">O'rtacha Foyda</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatter.format(statistics.totalSales > 0 ? statistics.totalProfit / statistics.totalSales : 0)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">Foyda Foizi</div>
          <div className="text-2xl font-bold text-gray-900">{statistics.profitMargin.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  );
}
