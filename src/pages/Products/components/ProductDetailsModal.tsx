import { Edit, Delete } from "@mui/icons-material";
import type { Product, Category } from "../../../../types/types";
import { convertIdToCategoryName } from "../../../middleware/mid_funcs";

interface ProductDetailsModalProps {
  isOpen: boolean;
  product: Product | null;
  categories: Category[];
  permissions: string[];
  isSuperUser: boolean;
  isExpired: (product: Product) => boolean;
  LOW_STOCK_THRESHOLD: number;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onClose: () => void;
}

export default function ProductDetailsModal({
  isOpen,
  product,
  categories,
  permissions,
  isSuperUser,
  isExpired,
  LOW_STOCK_THRESHOLD,
  onEdit,
  onDelete,
  onClose,
}: ProductDetailsModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{product.name}</h2>
            <p className="text-blue-100 text-sm mt-1">Mahsulot tafsilotlari</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl font-bold">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Asosiy Ma'lumotlar</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">Mahsulot ID</label>
                <p className="text-sm font-mono text-gray-900">{product.id}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Mahsulot Nomi</label>
                <p className="text-sm text-gray-900 font-medium">{product.name}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Kategoriya</label>
                <p className="text-sm text-gray-900">{convertIdToCategoryName(product.category_id, categories)}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Yetkazib beruvchi</label>
                <p className="text-sm text-gray-900">{product.supplier || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">Yaratilgan</label>
                <p className="text-sm text-gray-900">{product.createdat}</p>
              </div>
            </div>
          </div>

          {/* Price & Stock Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Narx va Ombor</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-600">Sotish Narxi</label>
                <p className="text-xl font-bold text-green-600">{product.sell_price}</p>
              </div>
              {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <label className="text-xs font-semibold text-gray-600">Tozalangan Narxi</label>
                  <p className="text-xl font-bold text-gray-900">{product.net_price}</p>
                </div>
              )}
              {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <label className="text-xs font-semibold text-gray-600">Foyda</label>
                  <p className="text-xl font-bold text-blue-600">
                    {(product.cost_price ?? 0) + product.net_price - product.sell_price < 1
                      ? String((product.cost_price ?? 0) + product.net_price - product.sell_price).substring(0, 3)
                      : (product.cost_price ?? 0) + product.net_price - product.sell_price}
                  </p>
                </div>
              )}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-600">Ombor</label>
                <p
                  className={`text-xl font-bold ${
                    product.availability === 0
                      ? "text-red-500"
                      : product.availability <= LOW_STOCK_THRESHOLD
                        ? "text-yellow-600"
                        : "text-green-600"
                  }`}
                >
                  {product.availability}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          {(product.expire_date || (product as any).expiry_date) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Qo'shimcha Ma'lumotlar</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Amal Qilish Muddati</label>
                  <p
                    className={`text-sm font-medium ${isExpired(product) ? "text-red-600" : "text-gray-900"}`}
                  >
                    {/* @ts-ignore */}
                    {new Date(product.expire_date || product.expiry_date).toLocaleDateString()}
                    {isExpired(product) && <span className="ml-2 text-xs">(Muddati o'tgan)</span>}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {product.availability === 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Sotilgan</span>
            )}
            {product.availability > 0 && product.availability <= LOW_STOCK_THRESHOLD && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                Kam Ombor
              </span>
            )}
            {product.availability > LOW_STOCK_THRESHOLD && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                Omborda mavjud
              </span>
            )}
            {isExpired(product) && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                Muddati o'tgan
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Yopish
          </button>
          {(permissions.includes("UPDATE_PRODUCT") || isSuperUser) && (
            <button
              onClick={() => {
                onEdit(product);
                onClose();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Edit fontSize="small" />
              Tahrirlash
            </button>
          )}
          {(permissions.includes("DELETE_PRODUCT") || isSuperUser) && (
            <button
              onClick={() => {
                if (window.confirm(`${product.name} o'chirilsinmi?`)) {
                  onDelete(product);
                  onClose();
                }
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
            >
              <Delete fontSize="small" />
              O'chirish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
