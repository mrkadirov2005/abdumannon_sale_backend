import React from "react";
import type { Debt } from "../types";

export interface EditDebtFormData {
  amount: string;
  comment: string;
}

interface EditDebtModalProps {
  isOpen: boolean;
  debt: Debt | null;
  formData: EditDebtFormData;
  onFormChange: (data: Partial<EditDebtFormData>) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const EditDebtModal: React.FC<EditDebtModalProps> = ({
  isOpen,
  debt,
  formData,
  onFormChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen || !debt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Qarzni tahrirlash
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Qarzdor
            </label>
            <input
              type="text"
              value={debt.name}
              disabled
              className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-700"
            />
          </div>

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
              Izoh
            </label>
            <input
              type="text"
              value={formData.comment}
              onChange={(e) => onFormChange({ comment: e.target.value })}
              placeholder="Izoh"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Yangilash
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

