import { FiPlus, FiDownload } from "react-icons/fi";
import { Refresh, FilterList } from "@mui/icons-material";
import { IconButton, Tooltip, Menu, MenuItem } from "@mui/material";

interface ProductsHeaderProps {
  onAddProduct: () => void;
  onRefresh: () => void;
  onExportCSV: () => void;
  stockFilter: "all" | "low" | "high" | "not_available" | "expired";
  onStockFilterChange: (filter: "all" | "low" | "high" | "not_available" | "expired") => void;
  LOW_STOCK_THRESHOLD: number;
  anchorEl: null | HTMLElement;
  onFilterMenuOpen: (e: React.MouseEvent<HTMLElement>) => void;
  onFilterMenuClose: () => void;
}

export default function ProductsHeader({
  onAddProduct,
  onRefresh,
  onExportCSV,
  stockFilter,
  onStockFilterChange,
  LOW_STOCK_THRESHOLD,
  anchorEl,
  onFilterMenuOpen,
  onFilterMenuClose,
}: ProductsHeaderProps) {
  const open = Boolean(anchorEl);

  return (
    <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Mahsulotlar</h1>
        <p className="text-sm text-gray-600 mt-1">Ombor va narxlarni boshqaring.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={onExportCSV}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 text-sm hover:bg-gray-50 transition-colors"
        >
          <FiDownload /> CSV Yuklash
        </button>

        <button
          onClick={onAddProduct}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Mahsulot Qo'sh
        </button>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          <Refresh />
        </button>

        <Tooltip title="Ombor/Muddati Tugagan Filtri">
          <IconButton onClick={onFilterMenuOpen} className="border border-gray-200">
            <FilterList />
          </IconButton>
        </Tooltip>

        <Menu anchorEl={anchorEl} open={open} onClose={onFilterMenuClose}>
          <MenuItem
            selected={stockFilter === "all"}
            onClick={() => {
              onStockFilterChange("all");
              onFilterMenuClose();
            }}
          >
            Barcha Mahsulotlar
          </MenuItem>
          <MenuItem
            selected={stockFilter === "low"}
            onClick={() => {
              onStockFilterChange("low");
              onFilterMenuClose();
            }}
          >
            Kam Ombor (≤ {LOW_STOCK_THRESHOLD})
          </MenuItem>
          <MenuItem
            selected={stockFilter === "high"}
            onClick={() => {
              onStockFilterChange("high");
              onFilterMenuClose();
            }}
          >
            Ko'p Ombor (&gt; {LOW_STOCK_THRESHOLD})
          </MenuItem>
          <MenuItem
            selected={stockFilter === "not_available"}
            onClick={() => {
              onStockFilterChange("not_available");
              onFilterMenuClose();
            }}
          >
            Mavjud emas (Sotilgan)
          </MenuItem>
          <MenuItem
            selected={stockFilter === "expired"}
            onClick={() => {
              onStockFilterChange("expired");
              onFilterMenuClose();
            }}
          >
            Muddati Tugagan Mahsulotlar
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
}
