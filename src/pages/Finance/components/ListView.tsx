import React from "react";
import { Trash2 } from "lucide-react";
import type { Wagon, Debt } from "../types";

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
                    {debt.amount.toLocaleString()}
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
                  {parseFloat(wagon.total.toString()).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-green-600 font-semibold">
                  {parseFloat((wagon.paid_amount || 0).toString()).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                  {(
                    parseFloat(wagon.total.toString()) -
                    parseFloat((wagon.paid_amount || 0).toString())
                  ).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
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
