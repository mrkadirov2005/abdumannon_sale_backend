import React from "react";
import type { Person } from "../types";

interface FolderViewProps {
  persons: Person[];
  selectedPerson: string | null;
  onPersonSelect: (person: string) => void;
  source: "wagons" | "debts";
}

export const FolderView: React.FC<FolderViewProps> = ({
  persons,
  selectedPerson,
  onPersonSelect,
  source,
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
                {source === "wagons"
                  ? `${person.wagons?.length || 0} ta vagon`
                  : `${person.debts?.length || 0} ta qarz`}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Ma'lumotlar ko'rish uchun bosing
          </div>
        </div>
      ))}
    </div>
  );
};
