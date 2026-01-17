import React from "react";
import { Trash2, Edit2, DollarSign, ChevronLeft } from "lucide-react";
import type { Debt, SortKey, SortDirection } from "../types";

interface Props {
  selectedDebtor: string | null;
  onDeselectDebtor: () => void;
  debts: Debt[];
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  onSelectDebt: (debt: Debt) => void;
  onPayment: (debt: Debt) => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
}

export const DebtListView: React.FC<Props> = ({
  selectedDebtor,
  onDeselectDebtor,
  debts,
  sortKey,
  sortDirection,
  onSort,
  onSelectDebt,
  onPayment,
  onEdit,
  onDelete,
}) => {
  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field) return <span className="text-gray-300">⇅</span>;
    return <span>{sortDirection === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header with back button */}
      {selectedDebtor && (
        <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
          <button
            onClick={onDeselectDebtor}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold">{selectedDebtor}</h3>
        </div>
      )}

      {/* Table */}
      {debts.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p>Qarzlar topilmadi</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => onSort("name")}
                >
                  Qarz beruvchi {sortKey === "name" && <SortIcon field="name" />}
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => onSort("amount")}
                >
                  Summa {sortKey === "amount" && <SortIcon field="amount" />}
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Holat
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-200"
                  onClick={() => onSort("created_at")}
                >
                  Sana {sortKey === "created_at" && <SortIcon field="created_at" />}
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt) => {
                return (
                  <tr
                    key={debt.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectDebt(debt)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{debt.name}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                      {debt.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        debt.isreturned 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {debt.isreturned ? '✓ Qaytarilgan' : '⏳ Kutilmoqda'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(debt.created_at).toLocaleDateString("uz-UZ")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {!debt.isreturned && (
                          <button
                            onClick={() => onPayment(debt)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="To'lash"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEdit(debt)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Tahrirlash"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(debt)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="O'chirish"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
