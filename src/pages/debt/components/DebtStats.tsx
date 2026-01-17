import React from "react";
import type { Debt, DebtStatistics, DebtTypeFilter } from "../types";

interface Props {
  debts: Debt[];
  statistics: DebtStatistics | null;
  debtTypeFilter: DebtTypeFilter;
  onDebtTypeChange: (filter: DebtTypeFilter) => void;
}

export const DebtStats: React.FC<Props> = ({
  debts,
  debtTypeFilter,
  onDebtTypeChange,
}) => {
  const allDebts = debts.length;
  const givenDebts = debts.filter((d) => d.branch_id !== 1).length;
  const takenDebts = debts.filter((d) => d.branch_id === 1).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div
        onClick={() => onDebtTypeChange("all")}
        className={`p-6 rounded-lg cursor-pointer transition ${
          debtTypeFilter === "all"
            ? "bg-blue-100 border-2 border-blue-500 shadow-lg"
            : "bg-white border border-gray-200 shadow"
        }`}
      >
        <p className="text-gray-600 text-sm">Barcha Qarzlar</p>
        <p className="text-3xl font-bold text-gray-900">{allDebts}</p>
      </div>

      <div
        onClick={() => onDebtTypeChange("given")}
        className={`p-6 rounded-lg cursor-pointer transition ${
          debtTypeFilter === "given"
            ? "bg-blue-100 border-2 border-blue-500 shadow-lg"
            : "bg-white border border-gray-200 shadow"
        }`}
      >
        <p className="text-gray-600 text-sm">Berilgan Nasiya</p>
        <p className="text-3xl font-bold text-blue-600">{givenDebts}</p>
      </div>

      <div
        onClick={() => onDebtTypeChange("taken")}
        className={`p-6 rounded-lg cursor-pointer transition ${
          debtTypeFilter === "taken"
            ? "bg-red-100 border-2 border-red-500 shadow-lg"
            : "bg-white border border-gray-200 shadow"
        }`}
      >
        <p className="text-gray-600 text-sm">Nasiyam</p>
        <p className="text-3xl font-bold text-red-600">{takenDebts}</p>
      </div>
    </div>
  );
};
