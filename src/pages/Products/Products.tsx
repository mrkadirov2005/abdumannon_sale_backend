import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../redux/store";
import { getAdminPermissionsFromStore, getIsSuperUserFromStore, getIsProductPending } from "../../redux/selectors";
import { setSingleProduct } from "../../redux/slices/products/productsreducer";
import { LinearProgress } from "@mui/material";
import { useProductsLogic } from "./hooks/useProductsLogic";
import ProductsHeader from "./components/ProductsHeader";
import ProductsFilters from "./components/ProductsFilters";
import ProductsTable from "./components/ProductsTable";
import ProductsAlerts from "./components/ProductsAlerts";
import ProductsPagination from "./components/ProductsPagination";
import ProductsSummary from "./components/ProductsSummary";
import ExpiredProductsModal from "./components/ExpiredProductsModal";
import ProductDetailsModal from "./components/ProductDetailsModal";
import UpdateProductForm from "./updateProduct";
import ProductsStatistics from "./ProductsStatistics";
import type { Product } from "../../../types/types";
import { exampleProduct } from "../../../types/types";

export default function Products() {
  const dispatch = useDispatch<AppDispatch>();

  // Use custom logic hook
  const {
    query,
    categoryFilter,
    page,
    stockFilter,
    isRestock,
    restockValue,
    categories,
    filtered,
    pageItems,
    pages,
    expiredProducts,
    lowStockProducts,
    outOfStockProducts,
    isSingleProductOpen,
    setQuery,
    setCategoryFilter,
    setPage,
    setStockFilter,
    setIsRestock,
    setRestockValue,
    handleRestock,
    handleDeleteProduct,
    handleRefresh,
    exportCSV,
    isExpired,
    LOW_STOCK_THRESHOLD,
  } = useProductsLogic();

  // Get permissions
  const permissions = useSelector(getAdminPermissionsFromStore);
  const isSuperUser = useSelector(getIsSuperUserFromStore);
  const isProductLoadingStatus = useSelector(getIsProductPending);

  // UI state
  const [viewMode, setViewMode] = useState<"table" | "statistics">("table");
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Handlers
  const handleSetSingleProduct = (product: Product = exampleProduct, state: "edit" | "add" | "idle") => {
    dispatch(setSingleProduct({ product, state }));
  };

  const handleEditProduct = (product: Product) => {
    handleSetSingleProduct(product, "edit");
  };

  const handleDeleteWithConfirm = (product: Product) => {
    handleDeleteProduct(product.id);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Loading bar */}
      {isProductLoadingStatus !== "fulfilled" && (
        <LinearProgress
          color={
            isProductLoadingStatus === "rejected"
              ? "error"
              : isProductLoadingStatus === "pending"
                ? "primary"
                : "primary"
          }
          className="mb-4"
        />
      )}

      {/* Header */}
      <ProductsHeader
        onAddProduct={() => handleSetSingleProduct(exampleProduct, "add")}
        onRefresh={handleRefresh}
        onExportCSV={exportCSV}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        LOW_STOCK_THRESHOLD={LOW_STOCK_THRESHOLD}
        anchorEl={anchorEl}
        onFilterMenuOpen={(e) => setAnchorEl(e.currentTarget)}
        onFilterMenuClose={() => setAnchorEl(null)}
      />

      {/* Alerts */}
      <ProductsAlerts
        expiredProducts={expiredProducts}
        lowStockProducts={lowStockProducts}
        outOfStockProducts={outOfStockProducts}
        onExpiredClick={() => setShowExpiredModal(true)}
        LOW_STOCK_THRESHOLD={LOW_STOCK_THRESHOLD}
      />

      {/* Expired Products Modal */}
      <ExpiredProductsModal
        isOpen={showExpiredModal}
        expiredProducts={expiredProducts}
        categories={categories}
        permissions={permissions}
        isSuperUser={isSuperUser}
        onEdit={handleEditProduct}
        onDelete={handleDeleteWithConfirm}
        onClose={() => setShowExpiredModal(false)}
      />

      {/* Update Product Form Modal */}
      {isSingleProductOpen !== "idle" ? (
        <UpdateProductForm type={isSingleProductOpen === "add" ? "add" : "edit"} />
      ) : null}

      {/* View Mode Toggle */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setViewMode("table")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm ${
            viewMode === "table"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          📊 Jadval
        </button>
        <button
          onClick={() => setViewMode("statistics")}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm ${
            viewMode === "statistics"
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
          }`}
        >
          📈 Statistika
        </button>
      </div>

      {/* Render Statistics or Table View */}
      {viewMode === "statistics" ? (
        <ProductsStatistics products={filtered} />
      ) : (
        <>
          {/* Filters */}
          <ProductsFilters
            query={query}
            onQueryChange={(newQuery) => {
              setQuery(newQuery);
              setPage(1);
            }}
            categoryFilter={categoryFilter}
            onCategoryChange={(category) => {
              setCategoryFilter(category);
              setPage(1);
            }}
            categories={categories}
          />

          {/* Products Table */}
          <ProductsTable
            products={pageItems}
            categories={categories}
            isRestock={isRestock}
            restockValue={restockValue}
            onRestockChange={setRestockValue}
            onRestockStart={(productId) => setIsRestock(productId)}
            onRestockSave={(productId, value, availability) => {
              handleRestock(productId, value, availability);
            }}
            onEdit={handleEditProduct}
            onDelete={handleDeleteWithConfirm}
            onProductClick={handleProductClick}
            permissions={permissions}
            isSuperUser={isSuperUser}
            LOW_STOCK_THRESHOLD={LOW_STOCK_THRESHOLD}
          />

          {/* Pagination */}
          <ProductsPagination
            page={page}
            pages={pages}
            total={filtered.length}
            pageSize={10}
            onPageChange={setPage}
          />

          {/* Summary Cards */}
          <ProductsSummary products={filtered} categories={categories} />
        </>
      )}

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={showProductModal}
        product={selectedProduct}
        categories={categories}
        permissions={permissions}
        isSuperUser={isSuperUser}
        isExpired={isExpired}
        LOW_STOCK_THRESHOLD={LOW_STOCK_THRESHOLD}
        onEdit={handleEditProduct}
        onDelete={handleDeleteWithConfirm}
        onClose={() => {
          setShowProductModal(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}
