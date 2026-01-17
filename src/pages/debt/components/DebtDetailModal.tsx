import React from "react";
import { X, DollarSign, Edit2 } from "lucide-react";
import type { Debt } from "../types";

interface Props {
  debt: Debt;
  onClose: () => void;
  onPayment: () => void;
  onEdit: () => void;
  onSaveChanges: (debt: Debt) => void;
  parseProductsFromString: (str: string) => any[];
  formatDate: (date: string) => string;
  token: string;
}

export const DebtDetailModal: React.FC<Props> = ({
  debt,
  onClose,
  onPayment,
  onEdit,
  parseProductsFromString,
}) => {
  const products = parseProductsFromString(debt.product_names || "");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">{debt.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Jami summa</p>
              <p className="text-2xl font-bold text-blue-600">
                {debt.amount.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Holat</p>
              <p className="text-2xl font-bold text-green-600">
                {debt.isreturned ? '✓ Qaytarilgan' : '⏳ Kutilmoqda'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Holat</span>
              <span className="text-sm font-medium text-gray-700">{debt.isreturned ? '100%' : '0%'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition ${debt.isreturned ? 'bg-green-500' : 'bg-gray-300'}`}
                style={{ width: `${debt.isreturned ? 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Yaratilgan sana</p>
              <p className="text-lg font-medium text-gray-900">
                {`${debt.year}-${String(debt.month).padStart(2, '0')}-${String(debt.day).padStart(2, '0')}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Holati</p>
              <p className="text-lg font-medium text-gray-900">
                {debt.isreturned ? "✓ Qaytarilgan" : "⏳ Kutilmoqda"}
              </p>
            </div>
          </div>

          {/* Products */}
          {products.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Mahsulotlar</h3>
              <div className="space-y-2">
                {products.map((product, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-700">{product.name}</span>
                    <span className="text-gray-600">x{product.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Yopish
          </button>
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Edit2 className="h-4 w-4" />
            Tahrirlash
          </button>
          {!debt.isreturned && (
            <button
              onClick={onPayment}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              <DollarSign className="h-4 w-4" />
              Qaytarish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
