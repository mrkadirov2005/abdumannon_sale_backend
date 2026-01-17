import type { Product, Category } from "../../../../types/types";

interface ProductsSummaryProps {
  products: Product[];
  categories: Category[];
}

export default function ProductsSummary({ products }: ProductsSummaryProps) {
  const totalPrice = products.reduce((sum, p) => sum + (p.sell_price || 0), 0);
  const totalQuantity = products.reduce((sum, p) => sum + (p.availability || 0), 0);
  const totalValue = products.reduce((sum, p) => sum + ((p.sell_price || 0) * (p.availability || 0)), 0);

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="p-5 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-600 mb-1">Jami Mahsulotlar</p>
        <p className="text-2xl font-bold text-blue-900">{products.length}</p>
      </div>
      <div className="p-5 bg-green-50 rounded-lg border border-green-200">
        <p className="text-sm text-gray-600 mb-1">Jami Miqdor</p>
        <p className="text-2xl font-bold text-green-900">{totalQuantity.toLocaleString()}</p>
      </div>
      <div className="p-5 bg-purple-50 rounded-lg border border-purple-200">
        <p className="text-sm text-gray-600 mb-1">O'rtacha Narx</p>
        <p className="text-2xl font-bold text-purple-900">
          {products.length > 0
            ? (totalPrice / products.length).toLocaleString("en-US", { maximumFractionDigits: 0 })
            : 0}{" "}
          Rubl
        </p>
      </div>
      <div className="p-5 bg-orange-50 rounded-lg border border-orange-200">
        <p className="text-sm text-gray-600 mb-1">Jami Qiymati</p>
        <p className="text-2xl font-bold text-orange-900">{totalValue.toLocaleString()} Rubl</p>
      </div>
    </div>
  );
}
