import React from "react";
import { Folder, ChevronRight } from "lucide-react";
import type { DebtorSummary } from "../types";

interface Props {
  debtors: DebtorSummary[];
  onSelectDebtor: (name: string) => void;
}

export const DebtFolderView: React.FC<Props> = ({ debtors, onSelectDebtor }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
    <div className="p-4 border-b border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Folder className="text-blue-600" size={24} />
        Qarzdorlar ({debtors.length})
      </h2>
    </div>
    <div className="divide-y divide-gray-200">
      {debtors.map((debtor) => (
        <div
          key={debtor.name}
          onClick={() => onSelectDebtor(debtor.name)}
          className="p-4 hover:bg-blue-50 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {debtor.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {debtor.name}
                </h3>
                <p className="text-sm text-gray-600">{debtor.totalDebts} qarz</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">Jami</p>
                <p className="text-lg font-bold text-gray-900">
                  {debtor.totalAmount.toLocaleString()}
                </p>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-blue-600" size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
