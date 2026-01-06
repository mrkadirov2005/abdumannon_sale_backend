import { useMemo } from "react";
import { TrendingUp, Inventory, BarChart, Percent } from "@mui/icons-material";
import type { Product } from "../../../types/types";
import { AlertTriangle, DollarSign } from "lucide-react";
interface ProductsStatisticsProps {
  products: Product[];
}
const LOW_STOCK_THRESHOLD = 5;

export default function ProductsStatistics({ products }: ProductsStatisticsProps) {
  const isExpired = (product: Product) => {
    // @ts-ignore
    if (!product.expire_date && !product.expiry_date) return false;
    // @ts-ignore
    return new Date(product.expire_date || product.expiry_date as unknown as Date) < new Date();
  };

  const statistics = useMemo(() => {
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, p) => sum + (p.availability || 0), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + ((p.sell_price || 0) * (p.availability || 0)), 0);
    const totalNetValue = products.reduce((sum, p) => sum + ((p.net_price || 0) * (p.availability || 0)), 0);
    const totalProfit = totalInventoryValue - totalNetValue;
    const profitMargin = totalInventoryValue > 0 ? (totalProfit / totalInventoryValue) * 100 : 0;

    // Stock status counts
    const expiredProducts = products.filter(p => isExpired(p));
    const lowStockProducts = products.filter(p => p.availability > 0 && p.availability <= LOW_STOCK_THRESHOLD);
    const outOfStockProducts = products.filter(p => p.availability === 0);
    const healthyStockProducts = products.filter(p => p.availability > LOW_STOCK_THRESHOLD && !isExpired(p));

    // Average calculations
    const avgPrice = totalProducts > 0 ? (totalInventoryValue / totalQuantity) : 0;
    const avgQuantityPerProduct = totalProducts > 0 ? totalQuantity / totalProducts : 0;

    // Category stats
    const categoryStats: Record<string, { count: number; quantity: number; value: number }> = {};
    products.forEach((product) => {
      const categoryId = product.category_id || "Unknown";
      if (!categoryStats[categoryId]) {
        categoryStats[categoryId] = { count: 0, quantity: 0, value: 0 };
      }
      categoryStats[categoryId].count++;
      categoryStats[categoryId].quantity += product.availability || 0;
      categoryStats[categoryId].value += (product.sell_price || 0) * (product.availability || 0);
    });

    const topCategories = Object.entries(categoryStats)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalProducts,
      totalQuantity,
      totalInventoryValue,
      totalNetValue,
      totalProfit,
      profitMargin,
      expiredCount: expiredProducts.length,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      healthyStockCount: healthyStockProducts.length,
      avgPrice,
      avgQuantityPerProduct,
      expiredPercentage: totalProducts > 0 ? (expiredProducts.length / totalProducts) * 100 : 0,
      lowStockPercentage: totalProducts > 0 ? (lowStockProducts.length / totalProducts) * 100 : 0,
      outOfStockPercentage: totalProducts > 0 ? (outOfStockProducts.length / totalProducts) * 100 : 0,
      topCategories,
    };
  }, [products]);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "UZS",
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Mahsulotlar Statistikasi</h2>
        <div className="text-sm text-gray-500">
          Jami mahsulotlar: <span className="font-semibold text-gray-900">{statistics.totalProducts}</span>
        </div>
      </div>

      {/* Main KPI Cards - 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inventory Value */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="text-white opacity-80" />
            <span className="text-sm font-medium opacity-90">Jami Qiymat</span>
          </div>
          <div className="text-2xl font-bold mb-1">{formatter.format(statistics.totalInventoryValue)}</div>
          <div className="text-sm opacity-80">{statistics.totalQuantity} dona mahsulot</div>
        </div>

        {/* Total Quantity */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Inventory className="text-white opacity-80" />
            <span className="text-sm font-medium opacity-90">Jami Miqdor</span>
          </div>
          <div className="text-3xl font-bold mb-1">{statistics.totalQuantity}</div>
          <div className="text-sm opacity-80">O'rtacha: {statistics.avgQuantityPerProduct.toFixed(1)} dona</div>
        </div>

        {/* Total Profit */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-white opacity-80" />
            <span className="text-sm font-medium opacity-90">Foyda</span>
          </div>
          <div className="text-2xl font-bold mb-1">{formatter.format(statistics.totalProfit)}</div>
          <div className="text-sm opacity-80">Foyda: {statistics.profitMargin.toFixed(1)}%</div>
        </div>

        {/* Average Price */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <BarChart className="text-white opacity-80" />
            <span className="text-sm font-medium opacity-90">O'rtacha Narx</span>
          </div>
          <div className="text-2xl font-bold mb-1">{formatter.format(statistics.avgPrice)}</div>
          <div className="text-sm opacity-80">Hisoblangan narx</div>
        </div>
      </div>

      {/* Stock Status Overview */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-orange-600" />
          Zaxira Holatini Ko'rikovi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Healthy Stock */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">Yaxshi Zaxira</div>
            <div className="text-3xl font-bold text-green-600">{statistics.healthyStockCount}</div>
            <div className="text-xs text-gray-600 mt-1">{(statistics.totalProducts > 0 ? (statistics.healthyStockCount / statistics.totalProducts) * 100 : 0).toFixed(1)}%</div>
          </div>

          {/* Low Stock */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600 mb-1">Kam Zaxira</div>
            <div className="text-3xl font-bold text-yellow-600">{statistics.lowStockCount}</div>
            <div className="text-xs text-gray-600 mt-1">{statistics.lowStockPercentage.toFixed(1)}%</div>
          </div>

          {/* Out of Stock */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border-l-4 border-red-500">
            <div className="text-sm text-gray-600 mb-1">Tugab Ketgan</div>
            <div className="text-3xl font-bold text-red-600">{statistics.outOfStockCount}</div>
            <div className="text-xs text-gray-600 mt-1">{statistics.outOfStockPercentage.toFixed(1)}%</div>
          </div>

          {/* Expired */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-l-4 border-orange-500">
            <div className="text-sm text-gray-600 mb-1">Eskirgan</div>
            <div className="text-3xl font-bold text-orange-600">{statistics.expiredCount}</div>
            <div className="text-xs text-gray-600 mt-1">{statistics.expiredPercentage.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Stock Distribution Bars */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Percent className="text-blue-600" />
          Zaxira Taqsimoti
        </h3>
        <div className="space-y-5">
          {/* Healthy Stock Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">✅ Yaxshi Zaxira</span>
              <span className="text-sm font-semibold text-gray-900">
                {(statistics.totalProducts > 0 ? (statistics.healthyStockCount / statistics.totalProducts) * 100 : 0).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${statistics.totalProducts > 0 ? (statistics.healthyStockCount / statistics.totalProducts) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Low Stock Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">⚠️ Kam Zaxira</span>
              <span className="text-sm font-semibold text-gray-900">{statistics.lowStockPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-yellow-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${statistics.lowStockPercentage}%` }}
              />
            </div>
          </div>

          {/* Out of Stock Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">❌ Tugab Ketgan</span>
              <span className="text-sm font-semibold text-gray-900">{statistics.outOfStockPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-red-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${statistics.outOfStockPercentage}%` }}
              />
            </div>
          </div>

          {/* Expired Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">🗓️ Eskirgan</span>
              <span className="text-sm font-semibold text-gray-900">{statistics.expiredPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-orange-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${statistics.expiredPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart className="text-blue-600" />
          Eng Qimmatbaho Kategoriyalar
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">#</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kategoriya</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Mahsulot Soni</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Jami Miqdor</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Jami Qiymat</th>
              </tr>
            </thead>
            <tbody>
              {statistics.topCategories.map((category, index) => (
                <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{category.id}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-700">{category.count}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-700">{category.quantity}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                    {formatter.format(category.value)}
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
          <div className="text-sm text-gray-600 mb-1">Jami Net Qiymat</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatter.format(statistics.totalNetValue)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Mahsulot Soni</div>
          <div className="text-2xl font-bold text-gray-900">{statistics.totalProducts}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-purple-500">
          <div className="text-sm text-gray-600 mb-1">Zaxiraning Sog'lig'i</div>
          <div className="text-2xl font-bold text-gray-900">
            {(statistics.totalProducts > 0 ? (statistics.healthyStockCount / statistics.totalProducts) * 100 : 0).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
