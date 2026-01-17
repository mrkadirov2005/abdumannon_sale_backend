import { FiAlertTriangle } from "react-icons/fi";
import { WarningAmber } from "@mui/icons-material";
import type { Product } from "../../../../types/types";

interface ProductsAlertsProps {
  expiredProducts: Product[];
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  onExpiredClick: () => void;
  LOW_STOCK_THRESHOLD: number;
}

export default function ProductsAlerts({
  expiredProducts,
  lowStockProducts,
  outOfStockProducts,
  onExpiredClick,
  LOW_STOCK_THRESHOLD,
}: ProductsAlertsProps) {
  if (expiredProducts.length === 0 && lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {expiredProducts.length > 0 && (
        <div
          onClick={onExpiredClick}
          className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 mb-1">
            <WarningAmber className="text-red-600" />
            <h3 className="font-bold text-red-900">Muddati Tugagan Mahsulotlar</h3>
          </div>
              <p className="text-red-800 font-semibold text-2xl">{expiredProducts.length}</p>
          <p className="text-red-700 text-xs mt-2">Muddati tugagan tovarlarni ko'rish va boshqarish uchun bosing</p>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <FiAlertTriangle className="text-yellow-600" />
            <h3 className="font-bold text-yellow-900">Kam Ombor Mahsulotlar</h3>
          </div>
          <p className="text-yellow-800 font-semibold text-2xl">{lowStockProducts.length}</p>
          <p className="text-yellow-700 text-xs mt-2">{LOW_STOCK_THRESHOLD} birlikdan kam tovarlar</p>
        </div>
      )}

      {outOfStockProducts.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <FiAlertTriangle className="text-orange-600" />
            <h3 className="font-bold text-orange-900">Sotilgan</h3>
          </div>
          <p className="text-orange-800 font-semibold text-2xl">{outOfStockProducts.length}</p>
          <p className="text-orange-700 text-xs mt-2">Ushbu tovarlarni tez orada to'ldiring</p>
        </div>
      )}
    </div>
  );
}
