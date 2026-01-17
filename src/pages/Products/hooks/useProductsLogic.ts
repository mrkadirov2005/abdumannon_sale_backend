import { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../../redux/store";
import {
  accessTokenFromStore,
  getCategoriesFromStore,
  getProductsFromStore,
  getshopidfromstrore,
  getIsSingleProductOpenFromStore,
  getProductsStatusFromStore,
  getAuthFromStore,
} from "../../../redux/selectors";
import { getProductsThunk } from "../../../redux/slices/products/thunks/getProducts";
import { getCategoriesThunk } from "../../../redux/slices/categories/thunk/getAllCategories";
import { deleteProductsThunk } from "../../../redux/slices/products/thunks/deleteProduct";
import { restockProductThunk } from "../../../redux/slices/products/thunks/restockProduct";
import type { Product } from "../../../../types/types";

const LOW_STOCK_THRESHOLD = 5;

export const useProductsLogic = () => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector(accessTokenFromStore);
  const shop_id = useSelector(getshopidfromstrore);
  const products = useSelector(getProductsFromStore);
  const categories = useSelector(getCategoriesFromStore);
  const isSingleProductOpen = useSelector(getIsSingleProductOpenFromStore);
  const productReduxStatus = useSelector(getProductsStatusFromStore);
  const authData = useSelector(getAuthFromStore);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "high" | "not_available" | "expired">("all");
  const [isRestock, setIsRestock] = useState<false | string>(false);
  const [restockValue, setRestockValue] = useState<number>(0);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);

  const pageSize = 10;

  // Fetch data on mount
  useEffect(() => {
    if (shop_id && token) {
      // @ts-ignore
      dispatch(getProductsThunk({ shop_id, token, branch: authData.isSuperAdmin ? 100 : authData.user.branch }));
      dispatch(getCategoriesThunk({ token }));
    }
  }, [shop_id, token, dispatch, authData]);

  // Check if product is expired
  const isExpired = (product: Product) => {
    // @ts-ignore
    if (!product.expire_date && !product.expiry_date) return false;
    // @ts-ignore
    return new Date(product.expire_date || product.expiry_date as unknown as Date) < new Date();
  };

  // Calculate filtered products based on all filters
  const filtered = useMemo(() => {
    let result = products as Product[];

    // Stock/expiry filtering
    if (stockFilter === "low") {
      result = result.filter((p) => p.availability > 0 && p.availability <= LOW_STOCK_THRESHOLD);
    } else if (stockFilter === "high") {
      result = result.filter((p) => p.availability > LOW_STOCK_THRESHOLD);
    } else if (stockFilter === "not_available") {
      result = result.filter((p) => p.availability === 0);
    } else if (stockFilter === "expired") {
      result = result.filter((p) => isExpired(p));
    }

    // Category and search filtering
    result = result.filter((p) => {
      if (categoryFilter !== "All" && p.category_id !== categoryFilter) return false;
      if (!query) return true;
      const q = query.trim().toLowerCase();
      return p.name.toLowerCase().includes(q);
    });

    return result;
  }, [products, query, categoryFilter, stockFilter]);

  // Get special product lists
  const expiredProducts = useMemo(() => {
    return products.filter((p: Product) => isExpired(p));
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.availability > 0 && p.availability <= LOW_STOCK_THRESHOLD);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.availability === 0);
  }, [products]);

  // Pagination
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Export CSV
  const exportCSV = () => {
    const headers = ["id", "name", "category", "sell_price", "net_price", "availability", "createdat"];
    const rows = filtered.map((p) => [p.id, p.name, p.category_id, p.sell_price, p.net_price, p.availability, p.createdat]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Restock handler
  const handleRestock = (productId: string, total: number, availability: number) => {
    if (!token) return;
    if (total <= 0) return;

    dispatch(restockProductThunk({ availability, token, total, id: productId }));
    // @ts-ignore
    dispatch(getProductsThunk({ shop_id, token, branch: authData.isSuperAdmin ? 100 : authData.user.branch }));
    setRestockProductId(productId);
  };

  // Delete product handler
  const handleDeleteProduct = (productId: string) => {
    dispatch(deleteProductsThunk({ product_id: productId, token }));
  };

  // Refresh handler
  const handleRefresh = () => {
    // @ts-ignore
    dispatch(getProductsThunk({ shop_id, token, branch: authData.isSuperAdmin ? 100 : authData.user.branch }));
    dispatch(getCategoriesThunk({ token }));
  };

  // Watch for restock completion
  useEffect(() => {
    if (productReduxStatus === "fulfilled" && restockProductId) {
      setIsRestock(false);
      setRestockValue(0);
      setRestockProductId(null);
    }
  }, [productReduxStatus, restockProductId]);

  return {
    // State
    query,
    categoryFilter,
    page,
    stockFilter,
    isRestock,
    restockValue,
    products,
    categories,
    filtered,
    pageItems,
    pages,
    expiredProducts,
    lowStockProducts,
    outOfStockProducts,
    productReduxStatus,
    isSingleProductOpen,
    token,
    shop_id,
    authData,
    
    // State setters
    setQuery,
    setCategoryFilter,
    setPage,
    setStockFilter,
    setIsRestock,
    setRestockValue,

    // Handlers
    handleRestock,
    handleDeleteProduct,
    handleRefresh,
    exportCSV,
    isExpired,
    
    // Constants
    LOW_STOCK_THRESHOLD,
    pageSize,
  };
};
