import React from "react";

interface FinanceHeaderProps {
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export const FinanceHeader: React.FC<FinanceHeaderProps> = () => {
  return (
    <header className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          💰 Moliyaviy Boshqaruv
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600">
          Pul moviy ma'lumotlarini boshqarish va sleduvchi
        </p>
      </div>
    </header>
  );
};
