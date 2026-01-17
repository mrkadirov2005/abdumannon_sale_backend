import React from "react";
import { Folder, DollarSign } from "lucide-react";
import type { ViewMode } from "../types";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPersonDeselect: () => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  onPersonDeselect,
}) => {
  const handleModeChange = (mode: ViewMode) => {
    onViewModeChange(mode);
    onPersonDeselect();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
          Ko'rinish Rejimi
        </h3>
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <button
            onClick={() => handleModeChange("folders")}
            className={`flex-1 md:flex-none px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm md:text-base ${
              viewMode === "folders"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Folder size={18} /> Papkalar
          </button>
          <button
            onClick={() => handleModeChange("list")}
            className={`flex-1 md:flex-none px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm md:text-base ${
              viewMode === "list"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <DollarSign size={18} /> Barcha Yozuvlar
          </button>
        </div>
      </div>
    </div>
  );
};
