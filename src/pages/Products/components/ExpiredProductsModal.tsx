import type { Product, Category } from "../../../../types/types";
import { convertIdToCategoryName } from "../../../middleware/mid_funcs";
import { Button } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { WarningAmber } from "@mui/icons-material";

interface ExpiredProductsModalProps {
  isOpen: boolean;
  expiredProducts: Product[];
  categories: Category[];
  permissions: string[];
  isSuperUser: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onClose: () => void;
}

export default function ExpiredProductsModal({
  isOpen,
  expiredProducts,
  categories,
  permissions,
  isSuperUser,
  onEdit,
  onDelete,
  onClose,
}: ExpiredProductsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-red-50 border-b border-red-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-3 rounded-lg">
              <WarningAmber className="text-white text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-900">Muddati Tugagan Mahsulotlar</h2>
              <p className="text-red-700 text-sm">Muddati o'tgan mahsulotlar</p>
            </div>
          </div>
          <button onClick={onClose} className="text-red-600 hover:text-red-700 text-2xl font-bold">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {expiredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Muddati tugagan mahsulot topilmadi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-red-100">
                    <th className="px-4 py-3 text-left font-semibold text-red-900 border border-red-200">Mahsulot Nomi</th>
                    <th className="px-4 py-3 text-left font-semibold text-red-900 border border-red-200">Kategoriya</th>
                    <th className="px-4 py-3 text-right font-semibold text-red-900 border border-red-200">Ombor</th>
                    <th className="px-4 py-3 text-left font-semibold text-red-900 border border-red-200">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {expiredProducts.map((p) => (
                    <tr key={p.id} className="border-b border-gray-200 hover:bg-red-50 transition-colors">
                      <td className="px-4 py-3 border border-gray-200">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {/* @ts-ignore */}
                          Expired: {new Date(p.expire_date || p.expiry_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 border border-gray-200">
                        {convertIdToCategoryName(p.category_id, categories)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold border border-gray-200 text-red-600">
                        {p.availability}
                      </td>
                      <td className="px-4 py-3 border border-gray-200">
                        <div className="flex gap-2">
                          {(permissions.includes("UPDATE_PRODUCT") || isSuperUser) && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                onEdit(p);
                                onClose();
                              }}
                            >
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
                                  onClose();
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
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
