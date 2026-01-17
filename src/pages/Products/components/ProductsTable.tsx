import { Button } from "@mui/material";
import type { ChangeEvent } from "react";
import { Edit, Delete, Save } from "@mui/icons-material";
import { FaDownload } from "react-icons/fa";
import type { Product, Category } from "../../../../types/types";
import { convertIdToCategoryName } from "../../../middleware/mid_funcs";
import { calculateProfit } from "./helpers";

interface ProductsTableProps {
  products: Product[];
  categories: Category[];
  isRestock: false | string;
  restockValue: number;
  onRestockChange: (value: number) => void;
  onRestockStart: (productId: string) => void;
  onRestockSave: (productId: string, value: number, availability: number) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onProductClick: (product: Product) => void;
  permissions: string[];
  isSuperUser: boolean;
  LOW_STOCK_THRESHOLD: number;
}

export default function ProductsTable({
  products,
  categories,
  isRestock,
  restockValue,
  onRestockChange,
  onRestockStart,
  onRestockSave,
  onEdit,
  onDelete,
  onProductClick,
  permissions,
  isSuperUser,
}: ProductsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 border border-gray-200">Nomi</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-900 border border-gray-200">Kategoriya</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-900 border border-gray-200">Sotish Narxi</th>
            {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
              <th className="px-4 py-3 text-right font-semibold text-gray-900 border border-gray-200">
                Tozalangan Narxi
              </th>
            )}
            {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
              <th className="px-4 py-3 text-right font-semibold text-gray-900 border border-gray-200">Foyda</th>
            )}
            <th className="px-4 py-3 text-right font-semibold text-gray-900 border border-gray-200">Ombor</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-900 border border-gray-200">To'ldirish</th>
            <th className="px-4 py-3 font-semibold text-gray-900 border border-gray-200">Amallar</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
              <td
                className="px-4 py-3 border border-gray-200 cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => onProductClick(p)}
                title="Mahsulot tafsilotlarini ko'rish"
              >
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  {p.name}
                  <span className="text-blue-500 text-xs">🔍</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {p.supplier ?? "—"} • {p.createdat}
                </div>
              </td>

              <td className="px-4 py-3 border border-gray-200">
                {convertIdToCategoryName(p.category_id, categories)}
              </td>

              <td className="px-4 py-3 text-right font-semibold border border-gray-200">{p.sell_price}</td>

              {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
                <td className="px-4 py-3 text-right text-gray-600 border border-gray-200">{p.net_price}</td>
              )}

              {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
                <td className="px-4 py-3 text-right text-gray-600 border border-gray-200">
                 {calculateProfit({sell_price: p.sell_price, net_price: p.net_price, cost_price: p.cost_price as number})}
                </td>
              )}

              <td
                className={`px-4 py-3 text-right font-semibold border border-gray-200 ${
                  p.availability > 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {p.availability}
              </td>

              <td className="px-4 py-3 border border-gray-200">
                {isRestock === p.id ? (
                  <div className="text-green-600 flex gap-2 items-center justify-center">
                    <input
                      className="border-b-2 border-green-600 w-20 text-center focus:outline-none"
                      type="number"
                      value={restockValue}
                      min={1}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        onRestockChange(Number(e.target.value));
                      }}
                    />
                    <Button
                      onClick={() => onRestockSave(p.id, restockValue, p.availability)}
                      disabled={restockValue <= 0}
                      size="small"
                    >
                      <Save />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onRestockStart(p.id);
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
                  >
                    <FaDownload className="inline mr-1" /> To'ldirish
                  </button>
                )}
              </td>

              <td className="px-4 py-3 border border-gray-200">
                <div className="flex gap-2 justify-center">
                  {(permissions.includes("UPDATE_PRODUCT") || isSuperUser) && (
                    <Button size="small" variant="outlined" onClick={() => onEdit(p)}>
                      <Edit fontSize="small" />
                    </Button>
                  )}

                  {(permissions.includes("DELETE_PRODUCT") || isSuperUser) && (
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => {
                        if (window.confirm(`${p.name} o'chirilsinmi?`)) {
                          onDelete(p);
                        }
                      }}
                    >
                      <Delete fontSize="small" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {products.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                Mahsulot topilmadi
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
