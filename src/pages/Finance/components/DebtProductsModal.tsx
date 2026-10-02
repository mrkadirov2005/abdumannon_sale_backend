import React from "react";
import type { Debt } from "../types";
import { formatUnitLabel, parseProductsFromString } from "../debtProducts";

interface DebtProductsModalProps {
  isOpen: boolean;
  debt: Debt | null;
  currency: "USD" | "RUB";
  onClose: () => void;
}

const formatCurrency = (value: number, currency: "USD" | "RUB") => {
  const suffix = currency === "USD" ? "$" : "₽";
  return `${Number(value).toLocaleString("en-US")} ${suffix}`;
};

export const DebtProductsModal: React.FC<DebtProductsModalProps> = ({
  isOpen,
  debt,
  currency,
  onClose,
}) => {
  if (!isOpen || !debt) return null;

  const products = parseProductsFromString(debt.product_names);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Маҳсулотлар</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {products.length === 0 ? (
          <p className="text-gray-500">Маҳсулотлар рўйхати йўқ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Маҳсулот
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">
                    Миқдор
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">
                    Нархи
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">
                    Жами
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const total = Number(product.totalPaid) || Number(product.quantity) * Number(product.price);
                  return (
                    <tr key={product.id} className="border-b">
                      <td className="px-4 py-2 text-gray-900">{product.name}</td>
                      <td className="px-4 py-2 text-right text-gray-700">
                        {product.quantity} {formatUnitLabel(product.unit)}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">
                        {formatCurrency(product.price, currency)}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-900">
                        {formatCurrency(total || product.totalPaid, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
          >
            Ёпиш
          </button>
        </div>
      </div>
    </div>
  );
};

