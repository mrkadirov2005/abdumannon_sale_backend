import React from "react";
import { Trash2, Printer } from "lucide-react";
import type { Wagon, Debt } from "../types";
import { printCheque } from "../../../components/ui/ChequeProvider";

interface ListViewProps {
  wagons: Wagon[];
  debts: Debt[];
  source: "wagons" | "debts";
  onDeleteWagon: (wagonId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  wagons,
  debts,
  source,
  onDeleteWagon,
}) => {

  const printDebt = (debt: Debt) => {
    const date = `${debt.year}-${String(debt.month).padStart(2, "0")}-${String(debt.day).padStart(2, "0")}`;
    printCheque({
      title: "Қарз накладная",
      number: String(debt.id),
      date,
      supplier: "HC COMPANY",
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
    const parts = wagon.wagon_number.split(",");
    const wagonNumber = parts[1] || wagon.wagon_number;
    printCheque({
      title: "Вагон накладная",
      number: wagonNumber,
      date: new Date().toLocaleDateString("ru-RU"),
      supplier: "HC COMPANY",
      buyer: wagon.wagon_number.split(",")[0] || "",
      products: (wagon.products || []).map((p) => ({
        name: p.product_name || p.name || "",
        quantity: Number(p.amount ?? 0),
        unit: p.unit || "pcs",
        price: Number(p.price ?? 0),
        total: p.subtotal !== undefined ? Number(p.subtotal) : Number(p.amount ?? 0) * Number(p.price ?? 0),
      })),
      totalAmount: Number(wagon.total),
      status: `To'langan: ${Number(wagon.paid_amount || 0).toLocaleString("en-IN")}`,
      signatureLeft: "Поставщик",
      signatureRight: "Получатель",
    });
  };

  if (source === "debts") {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Mijoz
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Sana
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Summa
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Holat
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Amallar
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
                    {debt.amount.toLocaleString("en-IN")}
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
                      title="Chop Etish"
                    >
                      <Printer size={18} />
                    </button>
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
                Vagon Raqami
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Jami Summa
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                To'langan
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Qoldiq
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Amallar
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
                  {parseFloat(wagon.total.toString()).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-right text-green-600 font-semibold">
                  {parseFloat((wagon.paid_amount || 0).toString()).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                  {(
                    parseFloat(wagon.total.toString()) -
                    parseFloat((wagon.paid_amount || 0).toString())
                  ).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => printWagon(wagon)}
                    className="text-purple-600 hover:text-purple-800 transition mr-2"
                    title="Chop Etish"
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteWagon(wagon.id)}
                    className="text-red-600 hover:text-red-800 transition"
                    title="O'chirish"
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
