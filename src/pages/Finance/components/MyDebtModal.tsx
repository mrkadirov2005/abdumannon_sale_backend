import React from "react";

export interface MyDebtFormData {
  lender: string;
  amount: string;
  comment: string;
  isReturned: boolean;
  date: string;
}

interface MyDebtModalProps {
  isOpen: boolean;
  formData: MyDebtFormData;
  onFormChange: (data: Partial<MyDebtFormData>) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const MyDebtModal: React.FC<MyDebtModalProps> = ({
  isOpen,
  formData,
  onFormChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Қарз қўшиш</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Қарз берувчи *
            </label>
            <input
              type="text"
              value={formData.lender}
              onChange={(e) => onFormChange({ lender: e.target.value })}
              placeholder="Исм ёки ташкилот"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Сумма *
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

          <div className="flex items-center gap-2">
            <input
              id="my-debt-returned"
              type="checkbox"
              checked={formData.isReturned}
              onChange={(e) => onFormChange({ isReturned: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label
              htmlFor="my-debt-returned"
              className="text-sm font-semibold text-gray-700"
            >
              Қайтарилди
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Қўшиш
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
          >
            Бекор қилиш
          </button>
        </div>
      </div>
    </div>
  );
};




