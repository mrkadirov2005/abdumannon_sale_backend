import React from "react";
import { Trash2, Printer } from "lucide-react";
import type { Wagon, Debt } from "../types";
import { DEFAULT_SUPPLIER_HTML, generateChequeNumber, printCheque } from "../../../components/ui/ChequeProvider";

interface ListViewProps {
  wagons: Wagon[];
  debts: Debt[];
  source: "wagons" | "debts" | "myDebts";
  onDeleteWagon: (wagonId: string) => void;
  onDeleteDebt: (debtId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  wagons,
  debts,
  source,
  onDeleteWagon,
  onDeleteDebt,
}) => {
  const formatCurrency = (value: number, currency: "USD" | "RUB") => {
    const suffix = currency === "USD" ? "$" : "₽";
    return `${Number(value).toLocaleString("en-US")} ${suffix}`;
  };

  const printDebt = (debt: Debt) => {
    const date = `${debt.year}-${String(debt.month).padStart(2, "0")}-${String(debt.day).padStart(2, "0")}`;
    printCheque({
      title: "Накладная",
      number: generateChequeNumber(),
      date,
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: debt.name,
      products: [{
        name: debt.name,
        quantity: 1,
        unit: "pcs",
        price: debt.amount,
        total: debt.amount,
      }],
      totalAmount: debt.amount,
      status: debt.isreturned ? "✓ Қайтарилган" : "⏳ Қайтарилмаган",
      signatureLeft: "Поставщик",
      signatureRight: "Получатель",
    });
  };

  const printWagon = (wagon: Wagon) => {
    printCheque({
      title: "Накладная",
      number: generateChequeNumber(),
      date: new Date().toLocaleDateString("ru-RU"),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: wagon.wagon_number.split(",")[0] || "",
      products: (wagon.products || []).map((p) => ({
        name: p.product_name || p.name || "",
        quantity: Number(p.amount ?? 0),
        unit: p.unit || "pcs",
        price: Number(p.price ?? 0),
        total: p.subtotal !== undefined ? Number(p.subtotal) : Number(p.amount ?? 0) * Number(p.price ?? 0),
      })),
      totalAmount: Number(wagon.total),
      status: `To'langan: ${Number(wagon.paid_amount || 0).toLocaleString("en-US")}`,
      signatureLeft: "Поставщик",
      signatureRight: "Получатель",
    });
  };

  if (source !== "wagons") {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Мижоз
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Сана
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Сумма
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Ҳолат
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Амаллар
                </th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt) => (
                <tr key={debt.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {debt.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {`${debt.year}-${String(debt.month).padStart(2, "0")}-${String(debt.day).padStart(2, "0")}`}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(debt.amount, "RUB")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        debt.isreturned
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {debt.isreturned ? "Qaytarilgan" : "Qaytarilmagan"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => printDebt(debt)}
                      className="text-purple-600 hover:text-purple-800 transition"
                      title="Чоп Етиш"
                    >
                      <Printer size={18} />
                    </button>
                    {source === "myDebts" && (
                      <button
                        onClick={() => onDeleteDebt(debt.id)}
                        className="text-red-600 hover:text-red-800 transition ml-3"
                        title="Ўчириш"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm md:text-base">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Вагон Рақами
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Жами Сумма
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Тўланган
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Қолдиқ
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Амаллар
              </th>
            </tr>
          </thead>
          <tbody>
            {wagons.map((wagon) => (
              <tr key={wagon.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {wagon.wagon_number}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {formatCurrency(parseFloat(wagon.total.toString()), "USD")}
                </td>
                <td className="px-4 py-3 text-right text-green-600 font-semibold">
                  {formatCurrency(parseFloat((wagon.paid_amount || 0).toString()), "USD")}
                </td>
                <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                  {formatCurrency(
                    parseFloat(wagon.total.toString()) -
                      parseFloat((wagon.paid_amount || 0).toString()),
                    "USD"
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => printWagon(wagon)}
                    className="text-purple-600 hover:text-purple-800 transition mr-2"
                    title="Чоп Етиш"
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteWagon(wagon.id)}
                    className="text-red-600 hover:text-red-800 transition"
                    title="Ўчириш"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
