import React from "react";
import type { FormData } from "../types";

interface PaymentModalProps {
  isOpen: boolean;
  selectedPerson: string | null;
  formData: FormData;
  onFormChange: (data: Partial<FormData>) => void;
  onAddPayment: () => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  selectedPerson,
  formData,
  onFormChange,
  onAddPayment,
  onClose,
}) => {
  if (!isOpen || !selectedPerson) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {selectedPerson} ga pul berish
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Summa *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => onFormChange({ amount: e.target.value })}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Izohlar
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                onFormChange({ description: e.target.value })
              }
              placeholder="Pul berish sababi"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Turi
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                onFormChange({
                  type: e.target.value as "income" | "expense",
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="income">Kirim</option>
              <option value="expense">Chiqim</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategoriya
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => onFormChange({ category: e.target.value })}
              placeholder="sales, purchase, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sana
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => onFormChange({ date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onAddPayment}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Qo'shish
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
          >
            Bekor qilish
          </button>
        </div>
      </div>
    </div>
  );
};
