import React, { useState } from "react";
import { X, DollarSign } from "lucide-react";
import type { Debt } from "../types";

interface Props {
  debt: Debt;
  paymentAmount: string;
  onPaymentAmountChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
  token: string;
}

export const PaymentModal: React.FC<Props> = ({
  debt,
  paymentAmount,
  onPaymentAmountChange,
  onClose,
  onSubmit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const amount = parseFloat(paymentAmount) || 0;

  const handleSubmit = async () => {
    if (amount <= 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(amount);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">To'lov Qilish</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Debtor Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Qarz beruvchi</p>
            <p className="text-lg font-semibold text-gray-900">{debt.name}</p>
          </div>

          {/* Amount Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Jami summa</p>
            <p className="text-xl font-bold text-blue-600">
              {debt.amount.toLocaleString()}
            </p>
          </div>

          {/* Payment Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To'lash summa
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => onPaymentAmountChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Summary */}
          {amount > 0 && (
            <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">Bu qarzni to'liq qaytarilgan deb belgilaysizmi?</p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || amount <= 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
          >
            <DollarSign className="h-4 w-4" />
            {isSubmitting ? "Saqlanmoqda..." : "To'lash"}
          </button>
        </div>
      </div>
    </div>
  );
};
