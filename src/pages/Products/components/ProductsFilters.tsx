import { FiSearch } from "react-icons/fi";
import type { Category } from "../../../../types/types";

interface ProductsFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
}

export default function ProductsFilters({
  query,
  onQueryChange,
  categoryFilter,
  onCategoryChange,
  categories,
}: ProductsFiltersProps) {
  return (
    <div className="mb-4 flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <input
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
          }}
          placeholder="Mahsulotni nomi bo'yicha qidirish..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      <select
        value={categoryFilter}
        onChange={(e) => {
          onCategoryChange(e.target.value);
        }}
        className="px-3 py-2 border border-gray-200 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="All">Barcha Kategoriyalar</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.category_name}
          </option>
        ))}
      </select>
    </div>
  );
}
