import React from "react";
import { DollarSign } from "lucide-react";
import type { Person } from "../types";
import type { ViewMode } from "../types";

interface FinanceStatsProps {
  uniquePersons: Person[];
  source: "wagons" | "debts" | "myDebts" | "valyutchik" | "overpaid";
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPersonSelect: (person: string | null) => void;
  myDebtsCardTotals?: {
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
  };
}

export const FinanceStats: React.FC<FinanceStatsProps> = ({
  uniquePersons,
  source,
  onViewModeChange,
  onPersonSelect,
  myDebtsCardTotals,
}) => {
  const formatCurrency = (value: number, currency: "USD" | "RUB") => {
    const suffix = currency === "USD" ? "$" : "₽";
    return `${Number(value).toLocaleString("en-US")} ${suffix}`;
  };
  const formatBalance = (
    value: number,
    currency: "USD" | "RUB",
    mode: "default" | "alwaysNegative" | "invert"
  ) => {
    if (mode === "alwaysNegative") {
      return `-${formatCurrency(Math.abs(value), currency)}`;
    }
    if (mode === "invert") {
      if (value > 0) {
        return `-${formatCurrency(value, currency)}`;
      }
      if (value < 0) {
        return `+${formatCurrency(Math.abs(value), currency)}`;
      }
      return formatCurrency(0, currency);
    }
    if (value > 0) {
      return `+${formatCurrency(value, currency)}`;
    }
    if (value < 0) {
      return `-${formatCurrency(Math.abs(value), currency)}`;
    }
    return formatCurrency(0, currency);
  };

  const fallbackTotals = {
    totalAmount: uniquePersons.reduce((sum, p) => sum + p.totalAmount, 0),
    paidAmount: uniquePersons.reduce((sum, p) => sum + p.paidAmount, 0),
    remainingAmount: uniquePersons.reduce((sum, p) => sum + p.remainingAmount, 0),
  };
  const totals =
    source === "myDebts" && myDebtsCardTotals
      ? myDebtsCardTotals
      : fallbackTotals;
  const currency = source === "wagons" || source === "valyutchik" ? "USD" : "RUB";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <div
        onClick={() => {
          onViewModeChange("folders");
          onPersonSelect(null);
        }}
        className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg text-white cursor-pointer hover:shadow-xl transition"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] sm:text-xs md:text-sm font-semibold opacity-90">
            {source === "debts"
              ? "Абдуманнон (берган)"
              : source === "wagons"
              ? "Келган юк"
              : source === "myDebts" || source === "valyutchik"
              ? "Абдуманнон (олган)"
              : "Жами Сумма"}
          </p>
          <DollarSign size={20} className="opacity-50" />
        </div>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold">
          {formatCurrency(totals.totalAmount, currency)}
        </p>
        <p className="text-[11px] sm:text-xs opacity-75 mt-1">
          {uniquePersons.length} та шахс
        </p>
      </div>

      <div
        onClick={() => onViewModeChange("list")}
        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg text-white cursor-pointer hover:shadow-xl transition"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] sm:text-xs md:text-sm font-semibold opacity-90">
            {source === "debts"
              ? "Клиент (берган)"
              : source === "myDebts" || source === "valyutchik"
              ? "Тўланган"
              : "Тўланган"}
          </p>
          <DollarSign size={20} className="opacity-50" />
        </div>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold">
          {formatCurrency(totals.paidAmount, currency)}
        </p>
        <p className="text-[11px] sm:text-xs opacity-75 mt-1">Берилган пул</p>
      </div>

      <div
        onClick={() => onViewModeChange("list")}
        className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg text-white cursor-pointer hover:shadow-xl transition"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] sm:text-xs md:text-sm font-semibold opacity-90">
            Қолдиқ
          </p>
          <DollarSign size={20} className="opacity-50" />
        </div>
        <p className="text-xl sm:text-2xl md:text-3xl font-bold">
          {formatBalance(
            totals.remainingAmount,
            currency,
            source === "wagons"
              ? "alwaysNegative"
              : source === "myDebts" || source === "valyutchik"
              ? "invert"
              : "default"
          )}
        </p>
        <p className="text-[11px] sm:text-xs opacity-75 mt-1">Тўланмаган</p>
      </div>
    </div>
  );
};
