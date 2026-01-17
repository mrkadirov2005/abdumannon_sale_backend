interface ProductsPaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function ProductsPagination({
  page,
  pages,
  total,
  pageSize,
  onPageChange,
}: ProductsPaginationProps) {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <div className="text-gray-600">
        Ko'rsatilmoqda {startItem}–{endItem} jami {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Oldingi
        </button>

        <div className="px-3 py-1 bg-blue-50 rounded-lg border border-blue-200 font-semibold text-blue-900">
          {page} / {pages}
        </div>

        <button
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          disabled={page === pages}
          className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Keyingi
        </button>
      </div>
    </div>
  );
}
