import React from "react";
import { Trash2 } from "lucide-react";
import type { Wagon } from "../types";

interface ListViewProps {
  wagons: Wagon[];
  onDeleteWagon: (wagonId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({ wagons, onDeleteWagon }) => {
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
