import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Person, FinanceRecord } from "../types";

interface DetailsPanelProps {
  person: Person;
  financeRecords: FinanceRecord[];
  onAddPayment: () => void;
  onDeleteWagon: (wagonId: string) => void;
  onDeleteFinanceRecord: (recordId: number) => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  person,
  financeRecords,
  onAddPayment,
  onDeleteWagon,
  onDeleteFinanceRecord,
}) => {
  const personFinanceRecords = financeRecords.filter((record) =>
    record.description?.startsWith(person.name)
  );

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
        {person.name}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-gray-600 text-sm mb-1">Jami Summa</p>
          <p className="text-3xl font-bold text-blue-600">
            {person.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-gray-600 text-sm mb-1">To'langan</p>
          <p className="text-3xl font-bold text-green-600">
            {person.paidAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-gray-600 text-sm mb-1">Qoldiq Summa</p>
          <p className="text-3xl font-bold text-orange-600">
            {person.remainingAmount.toLocaleString()}
          </p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Vagonlar ({person.wagons.length})
      </h3>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Vagon
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Mahsulotlar
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Jami
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
            {person.wagons.map((wagon) => {
              // Extract wagon number (part after comma)
              const parts = wagon.wagon_number.split(',');
              const wagonNumber = parts[1] || wagon.wagon_number;
              
              return (
                <tr key={wagon.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {wagonNumber}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {wagon.products.length}
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
                  <td className="px-4 py-3 text-center space-x-2 flex justify-center">
                    <button
                      onClick={onAddPayment}
                      className="text-blue-600 hover:text-blue-800 transition"
                      title="Pul qo'shish"
                    >
                      <Plus size={18} />
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
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">
        Pul berish tarixi ({personFinanceRecords.length})
      </h3>

      <div className="space-y-2">
        {personFinanceRecords.length === 0 ? (
          <p className="text-gray-500">Pul berish tarixi yo'q</p>
        ) : (
          personFinanceRecords.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {record.description?.split(": ")[1] || record.description}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(record.date).toLocaleDateString("uz-UZ")}
                </p>
              </div>
              <div className="text-right mr-4">
                <p
                  className={`font-bold text-lg ${
                    record.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {record.type === "income" ? "+" : "-"}
                  {parseFloat(record.amount).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => onDeleteFinanceRecord(record.id)}
                className="text-red-600 hover:text-red-800 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
