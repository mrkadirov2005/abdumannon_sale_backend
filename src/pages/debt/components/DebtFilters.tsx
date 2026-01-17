import React from "react";
import { Search, ChevronDown } from "lucide-react";

interface Props {
  searchName: string;
  onSearchChange: (value: string) => void;
  filterBranch: string;
  onFilterBranchChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onShowAdvancedFilters: (value: boolean) => void;
  filterByDateRange: boolean;
  onFilterByDateRange: (value: boolean) => void;
  filterStartDate: string;
  onFilterStartDateChange: (value: string) => void;
  filterEndDate: string;
  onFilterEndDateChange: (value: string) => void;
  debtTypeFilter: string;
  onCreateClick: () => void;
  branches: any[];
}

export const DebtFilters: React.FC<Props> = ({
  searchName,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  showAdvancedFilters,
  onShowAdvancedFilters,
  filterByDateRange,
  onFilterByDateRange,
  filterStartDate,
  onFilterStartDateChange,
  filterEndDate,
  onFilterEndDateChange,
  onCreateClick,
}) => {
  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow">
      {/* Main Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Qarz beruvchini qidirish..."
            value={searchName}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Barcha holatlari</option>
          <option value="partially">Qisman to'langan</option>
          <option value="unpaid">To'lanmagan</option>
          <option value="paid">To'langan</option>
        </select>

        <button
          onClick={onCreateClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Yangi Qarz
        </button>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => onShowAdvancedFilters(!showAdvancedFilters)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm"
      >
        <ChevronDown
          className={`h-4 w-4 transition ${showAdvancedFilters ? "rotate-180" : ""}`}
        />
        Qo'shimcha Filtrlar
      </button>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filterByDateRange}
              onChange={(e) => onFilterByDateRange(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-gray-700">Sana bo'yicha filtrlash</span>
          </label>

          {filterByDateRange && (
            <>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => onFilterStartDateChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => onFilterEndDateChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};
