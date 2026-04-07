import React from "react";

interface FinanceHeaderProps {
  onSearchChange: (query: string) => void;
  searchQuery: string;
  source: "wagons" | "debts" | "myDebts" | "valyutchik" | "overpaid";
  onSourceChange: (
    source: "wagons" | "debts" | "myDebts" | "valyutchik" | "overpaid"
  ) => void;
  onAddMyDebt: () => void;
}

export const FinanceHeader: React.FC<FinanceHeaderProps> = ({
  source,
  onSourceChange,
  onAddMyDebt,
}) => {
  return (
    <header className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          💰 Молиявий Бошқарув
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600">
          Пул мовий ма'лумотларини бошқариш ва следувчи
        </p>
      </div>
      <div className="flex items-center gap-2">
        {(source === "myDebts" || source === "valyutchik") && (
          <button
            onClick={onAddMyDebt}
            className="px-3 py-2 rounded-md text-sm font-medium transition bg-green-600 text-white hover:bg-green-700"
            title="Қарз қўшиш"
          >
            + Қарз
          </button>
        )}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
        <button
          onClick={() => onSourceChange("wagons")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition ${
            source === "wagons"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Вагонлар
        </button>
        <button
          onClick={() => onSourceChange("debts")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition ${
            source === "debts"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Қарздорлар
        </button>
        <button
          onClick={() => onSourceChange("overpaid")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition ${
            source === "overpaid"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Overpaid
        </button>
        <button
          onClick={() => onSourceChange("myDebts")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition ${
            source === "myDebts"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Қарзларим
        </button>
        <button
          onClick={() => onSourceChange("valyutchik")}
          className={`px-3 py-2 rounded-md text-sm font-medium transition ${
            source === "valyutchik"
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          Валютчик $
        </button>
        </div>
      </div>
    </header>
  );
};





