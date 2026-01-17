import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { Debt } from "../types";

interface Props {
  debt: Debt;
  formData: any;
  onFormDataChange: (data: any) => void;
  currentProduct: any;
  onCurrentProductChange: (product: any) => void;
  productEntries: any[];
  onAddProduct: () => void;
  onRemoveProduct: (idx: number) => void;
  onClearProducts: () => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  calculateTotalFromProducts: () => number;
  branches: any[];
}

export const EditDebtModal: React.FC<Props> = ({
  debt,
  formData,
  onFormDataChange,
  currentProduct,
  onCurrentProductChange,
  productEntries,
  onAddProduct,
  onRemoveProduct,
  onClearProducts,
  onClose,
  onSubmit,
  calculateTotalFromProducts,
  branches,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = calculateTotalFromProducts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">Qarzni Tahrirlash</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Debtor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qarz beruvchi nomi
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Branch Selection */}
          {branches && branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filial
              </label>
              <select
                value={formData.branch_id || ""}
                onChange={(e) =>
                  onFormDataChange({ ...formData, branch_id: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Filialni tanlang</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summa
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) =>
                onFormDataChange({ ...formData, amount: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Mahsulotlar</h3>

            {/* Add Product */}
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={currentProduct.name}
                onChange={(e) =>
                  onCurrentProductChange({ ...currentProduct, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mahsulot nomi"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={currentProduct.quantity}
                  onChange={(e) =>
                    onCurrentProductChange({
                      ...currentProduct,
                      quantity: parseInt(e.target.value),
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Miqdori"
                />
                <input
                  type="number"
                  value={currentProduct.price}
                  onChange={(e) =>
                    onCurrentProductChange({
                      ...currentProduct,
                      price: parseFloat(e.target.value),
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Narxi"
                />
              </div>
              <button
                onClick={onAddProduct}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Plus className="h-4 w-4" />
                Mahsulot Qo'shish
              </button>
            </div>

            {/* Product List */}
            {productEntries.length > 0 && (
              <div className="space-y-2 mb-4">
                {productEntries.map((product, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        {product.quantity} x {product.price}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemoveProduct(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={onClearProducts}
                  className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
                >
                  Barchasini o'chirish
                </button>
              </div>
            )}
          </div>

          {/* Total */}
          {total > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Mahsulotlardan jami</p>
              <p className="text-2xl font-bold text-blue-600">{total.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
};
