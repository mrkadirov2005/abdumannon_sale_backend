import React from "react";
import type { Debt } from "../types";

interface ProductEntry {
  id: string;
  name: string;
  quantity: number;
  price: number;
  totalPaid: number;
  unit: string;
}

interface DebtProductsModalProps {
  isOpen: boolean;
  debt: Debt | null;
  currency: "USD" | "RUB";
  onClose: () => void;
}

const UNIT_OPTIONS = [
  { value: "pcs", label: "Dona" },
  { value: "kg", label: "Kg" },
  { value: "t", label: "Tonna" },
  { value: "l", label: "Litr" },
];

const formatUnitLabel = (unit: string | undefined | null) => {
  const normalized = unit || "pcs";
  const found = UNIT_OPTIONS.find((opt) => opt.value === normalized);
  return found ? found.label : normalized;
};

const normalizeProductNames = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string" && v.trim() !== "");
  }
  if (typeof value === "string") {
    if (value.trim() === "") return [];
    return value
      .split("|")
      .map((v) => v.trim())
      .filter((v) => v !== "");
  }
  return [];
};

const parseProductsFromString = (productString: string | string[] | undefined | null): ProductEntry[] => {
  if (!productString) return [];

  try {
    const items = normalizeProductNames(productString);
    if (items.length === 0) return [];

    return items.map((item, index) => {
      const [name, quantity, price, totalPaid, unit] = item.split("*");
      return {
        id: `${index}-${Date.now()}`,
        name: name || "",
        quantity: parseFloat(quantity) || 1,
        price: parseFloat(price) || 0,
        totalPaid: parseFloat(totalPaid) || 0,
        unit: unit || "pcs",
      };
    });
  } catch (error) {
    console.error("Error parsing products:", error);
    return [];
  }
};

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
                  const total = Number(product.quantity) * Number(product.price);
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

