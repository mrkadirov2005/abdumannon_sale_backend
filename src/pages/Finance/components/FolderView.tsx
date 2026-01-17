import React from "react";
import type { Person } from "../types";

interface FolderViewProps {
  persons: Person[];
  selectedPerson: string | null;
  onPersonSelect: (person: string) => void;
}

export const FolderView: React.FC<FolderViewProps> = ({
  persons,
  selectedPerson,
  onPersonSelect,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {persons.map((person) => (
        <div
          key={person.name}
          onClick={() => onPersonSelect(person.name)}
          className={`p-4 rounded-lg cursor-pointer transition transform hover:scale-105 ${
            selectedPerson === person.name
              ? "bg-blue-100 border-2 border-blue-500 shadow-lg"
              : "bg-white border border-gray-200 shadow hover:shadow-md"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="text-3xl">📁</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                {person.name}
              </h3>
              <p className="text-xs text-gray-500">
                {person.wagons.length} ta vagon
              </p>
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Jami:</span>
              <span className="font-semibold text-gray-900">
                {person.totalAmount.toLocaleString()} ₽
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">To'langan:</span>
              <span className="font-semibold text-green-600">
                {person.paidAmount.toLocaleString()} ₽
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-1">
              <span className="text-gray-600">Qolgan:</span>
              <span className="font-semibold text-red-600">
                {person.remainingAmount.toLocaleString()} ₽
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
