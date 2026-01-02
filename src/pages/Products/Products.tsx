import { useMemo, useState, useEffect, type ChangeEvent } from "react";
import { FiPlus, FiSearch, FiDownload, FiAlertTriangle } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import {
  accessTokenFromStore,
  getCategoriesFromStore,
  getBrandsFromStore,
  getProductsFromStore,
  getshopidfromstrore,
  getIsSingleProductOpenFromStore,
  getProductsStatusFromStore,
  getAdminPermissionsFromStore,
  getIsSuperUserFromStore,
  getIsProductPending,
  getAuthFromStore
} from "../../redux/selectors";

import type { AppDispatch } from "../../redux/store";
import { getProductsThunk } from "../../redux/slices/products/thunks/getProducts";
import { getCategoriesThunk } from "../../redux/slices/categories/thunk/getAllCategories";
import { getBrandsThunk } from "../../redux/slices/brands/thunk/getAllBrands";
import { setSingleProduct } from "../../redux/slices/products/productsreducer";
import {
  convertIdToBrandName,
  convertIdToCategoryName
} from "../../middleware/mid_funcs";
import { Button,  LinearProgress, Menu, MenuItem, IconButton, Tooltip } from "@mui/material";
import { DisabledByDefault, Edit, Refresh, Save, FilterList, WarningAmber, Delete } from "@mui/icons-material";
import { FaDownload } from "react-icons/fa";
import { exampleProduct, type Product } from "../../../types/types";
import UpdateProductForm from "./updateProduct";
import { deleteProductsThunk } from "../../redux/slices/products/thunks/deleteProduct";
import { restockProductThunk } from "../../redux/slices/products/thunks/restockProduct";
import { getBranchesThunk } from "../../redux/slices/branches/thunks/GetBranchesThunk";

export default function Products() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Stock/expiry filter menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "high" | "not_available" | "expired">("all");
  const open = Boolean(anchorEl);

  // Expired products modal
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  // Product details modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const LOW_STOCK_THRESHOLD = 5;
  
  function isExpired(product: Product) {
    // @ts-ignore
    if (!product.expire_date && !product.expiry_date) return false;
    // @ts-ignore
    return new Date(product.expire_date || product.expiry_date as unknown as Date) < new Date();
  }

  const dispatch = useDispatch<AppDispatch>();

  const token = useSelector(accessTokenFromStore);
  const shop_id = useSelector(getshopidfromstrore);

  const products = useSelector(getProductsFromStore);
  const categories = useSelector(getCategoriesFromStore);
  const brands = useSelector(getBrandsFromStore);
  const isSingleProductOpen = useSelector(getIsSingleProductOpenFromStore);
  const productReduxStatus = useSelector(getProductsStatusFromStore);
  const permissions = useSelector(getAdminPermissionsFromStore);
  const isSuperUser = useSelector(getIsSuperUserFromStore);
  const authData = useSelector(getAuthFromStore);

  useEffect(() => {
    if (shop_id && token) {
      // @ts-ignore
      dispatch(getProductsThunk({ shop_id, token, branch: authData.isSuperAdmin ? 100 : authData.user.branch }));
      dispatch(getCategoriesThunk({ token }));
      dispatch(getBrandsThunk({ token }));
      dispatch(getBranchesThunk({shop_id, token}));
    }
  }, [shop_id, token, dispatch]);

  const expiredProducts = useMemo(() => {
    return products.filter((p) => isExpired(p));
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.availability > 0 && p.availability <= LOW_STOCK_THRESHOLD);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((p) => p.availability === 0);
  }, [products]);

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

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  function exportCSV() {
    const headers = [
      "id",
      "name",
      "brand",
      "category",
      "sell_price",
      "net_price",
      "availability",
      "createdat"
    ];

    const rows = filtered.map((p) => [
      p.id,
      p.name,
      convertIdToBrandName(p.brand_id, brands),
      convertIdToCategoryName(p.category_id, categories),
      p.sell_price,
      p.net_price,
      p.availability,
      p.createdat
    ]);

    const csv =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              `"${String(cell ?? "").replace(/"/g, '""')}"`
            )
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
  }

  const handleSetSingleProduct = (product: Product = exampleProduct, state: "edit" | "add" | "idle") => {
    dispatch(setSingleProduct({ product, state }));
  };

  // Restock states
  const [isRestock, setIsRestock] = useState<false | string>(false);
  const [restockValue, setRestockValue] = useState<number>(0);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);

  // Restock handler
  const handleRestock = (productId: string, total: number, availability: number) => {
    if (!token) return;
    if (total <= 0) return;

    dispatch(restockProductThunk({ availability, token, total, id: productId }));
    // @ts-ignore
    dispatch(getProductsThunk({ shop_id, token, branch: authData.isSuperAdmin ? 100 : authData.user.branch }));

    setRestockProductId(productId);
  };

  useEffect(() => {
    if (productReduxStatus === "fulfilled" && restockProductId) {
      setIsRestock(false);
      setRestockValue(0);
      setRestockProductId(null);
    }
  }, [productReduxStatus, restockProductId]);

  const isProductLoadingStatus = useSelector(getIsProductPending);

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {isProductLoadingStatus !== "fulfilled" && (
        <LinearProgress
          color={isProductLoadingStatus === "rejected" ? "error" : isProductLoadingStatus === "pending" ? "primary" : "primary"}
          className="mb-4"
        />
      )}

      {/* HEADER */}
      <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Mahsulotlar</h1>
          <p className="text-sm text-gray-600 mt-1">
            Ombor va narxlarni boshqaring.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 text-sm hover:bg-gray-50 transition-colors"
          >
            <FiDownload /> CSV Yuklash
          </button>

          <button
            onClick={() => handleSetSingleProduct(exampleProduct, "add")}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <FiPlus /> Mahsulot Qo'sh
          </button>

          <button
            onClick={() => {
              // @ts-ignore
              dispatch(getProductsThunk({ shop_id, token, branch: authData.isSuperAdmin ? 100 : authData.user.branch }));
              dispatch(getCategoriesThunk({ token }));
              dispatch(getBrandsThunk({ token }));
            }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Refresh />
          </button>

          {/* Stock/Expiry Filter Menu */}
          <Tooltip title="Ombor/Muddati Tugagan Filtri">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} className="border border-gray-200">
              <FilterList />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
            <MenuItem
              selected={stockFilter === "all"}
              onClick={() => {
                setStockFilter("all");
                setAnchorEl(null);
              }}
            >
              Barcha Mahsulotlar
            </MenuItem>
            <MenuItem
              selected={stockFilter === "low"}
              onClick={() => {
                setStockFilter("low");
                setAnchorEl(null);
              }}
            >
              Kam Ombor (≤ {LOW_STOCK_THRESHOLD})
            </MenuItem>
            <MenuItem
              selected={stockFilter === "high"}
              onClick={() => {
                setStockFilter("high");
                setAnchorEl(null);
              }}
            >
              Ko'p Ombor (&gt; {LOW_STOCK_THRESHOLD})
            </MenuItem>
            <MenuItem
              selected={stockFilter === "not_available"}
              onClick={() => {
                setStockFilter("not_available");
                setAnchorEl(null);
              }}
            >
              Mavjud emas (Sotilgan)
            </MenuItem>
            <MenuItem
              selected={stockFilter === "expired"}
              onClick={() => {
                setStockFilter("expired");
                setAnchorEl(null);
              }}
            >
              Muddati Tugagan Mahsulotlar
            </MenuItem>
          </Menu>
        </div>
      </header>

      {/* ALERTS SECTION */}
      {(expiredProducts.length > 0 || lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {expiredProducts.length > 0 && (
            <div
              onClick={() => setShowExpiredModal(true)}
              className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1">
                <WarningAmber className="text-red-600" />
                <h3 className="font-bold text-red-900">Muddati Tugagan Mahsulotlar</h3>
              </div>
              <p className="text-red-800 text-sm font-semibold text-2xl">{expiredProducts.length}</p>
              <p className="text-red-700 text-xs mt-2">Muddati tugagan tovarlarni ko'rish va boshqarish uchun bosing</p>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FiAlertTriangle className="text-yellow-600" />
                <h3 className="font-bold text-yellow-900">Kam Ombor Mahsulotlar</h3>
              </div>
              <p className="text-yellow-800 text-sm font-semibold text-2xl">{lowStockProducts.length}</p>
              <p className="text-yellow-700 text-xs mt-2">{LOW_STOCK_THRESHOLD} birlikdan kam tovarlar</p>
            </div>
          )}

          {outOfStockProducts.length > 0 && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <FiAlertTriangle className="text-orange-600" />
                <h3 className="font-bold text-orange-900">Sotilgan</h3>
              </div>
              <p className="text-orange-800 text-sm font-semibold text-2xl">{outOfStockProducts.length}</p>
              <p className="text-orange-700 text-xs mt-2">Ushbu tovarlarni tez orada to'ldiring</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL FOR EXPIRED PRODUCTS */}
      {showExpiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-red-50 border-b border-red-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 p-3 rounded-lg">
                  <WarningAmber className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-red-900">Muddati Tugagan Mahsulotlar</h2>
                  <p className="text-red-700 text-sm">Muddati o'tgan mahsulotlar</p>
                </div>
              </div>
              <button
                onClick={() => setShowExpiredModal(false)}
                className="text-red-600 hover:text-red-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {expiredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Muddati tugagan mahsulot topilmadi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-red-100">
                        <th className="px-4 py-3 text-left font-semibold text-red-900 border border-red-200">Brand</th>
                        <th className="px-4 py-3 text-left font-semibold text-red-900 border border-red-200">Mahsulot Nomi</th>
                        <th className="px-4 py-3 text-left font-semibold text-red-900 border border-red-200">Kategoriya</th>
                        <th className="px-4 py-3 text-right font-semibold text-red-900 border border-red-200">Ombor</th>
                        <th className="px-4 py-3 text-left font-semibold text-red-900 border border-red-200">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiredProducts.map((p) => (
                        <tr key={p.id} className="border-b border-gray-200 hover:bg-red-50 transition-colors">
                          <td className="px-4 py-3 border border-gray-200">
                            {convertIdToBrandName(p.brand_id, brands)}
                          </td>
                          <td className="px-4 py-3 border border-gray-200">
                            <div className="font-medium text-gray-900">{p.name}</div>
                            <div className="text-xs text-gray-500">
                              {/* @ts-ignore */}
                              Expired: {new Date(p.expire_date || p.expiry_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-4 py-3 border border-gray-200">
                            {convertIdToCategoryName(p.category_id, categories)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold border border-gray-200 text-red-600">
                            {p.availability}
                          </td>
                          <td className="px-4 py-3 border border-gray-200">
                            <div className="flex gap-2">
                              {(permissions.includes("UPDATE_PRODUCT") || isSuperUser) && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => {
                                    handleSetSingleProduct(p, "edit");
                                    setShowExpiredModal(false);
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </Button>
                              )}
                              {(permissions.includes("DELETE_PRODUCT") || isSuperUser) && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="error"
                                  onClick={() => {
                                    if (window.confirm(`${p.name} o'chirilsinmi?`)) {
                                      dispatch(deleteProductsThunk({ product_id: p.id, token }));
                                      setShowExpiredModal(false);
                                    }
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-end">
              <button
                onClick={() => setShowExpiredModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {isSingleProductOpen !== "idle" ? <UpdateProductForm type={isSingleProductOpen === "add" ? "add" : "edit"} /> : ""}

      {/* SEARCH & FILTERS */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Mahsulotni nomi bo'yicha qidirish..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
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

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border border-gray-200">Brand</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border border-gray-200">Nomi</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 border border-gray-200">Kategoriya</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900 border border-gray-200">Sotish Narxi</th>
              {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
                <th className="px-4 py-3 text-right font-semibold text-gray-900 border border-gray-200">Tozalangan Narxi</th>
              )}
              {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
                <th className="px-4 py-3 text-right font-semibold text-gray-900 border border-gray-200">Foyda</th>
              )}
              <th className="px-4 py-3 text-right font-semibold text-gray-900 border border-gray-200">Ombor</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-900 border border-gray-200">To'ldirish</th>
              <th className="px-4 py-3 font-semibold text-gray-900 border border-gray-200">Amallar</th>
            </tr>
          </thead>

          <tbody>
            {pageItems.map((p) => (
              <tr key={p.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                <td className="px-4 py-3 border border-gray-200">
                  {convertIdToBrandName(p.brand_id, brands)}
                </td>

                <td 
                  className="px-4 py-3 border border-gray-200 cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => {
                    setSelectedProduct(p);
                    setShowProductModal(true);
                  }}
                  title="Mahsulot tafsilotlarini ko'rish"
                >
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {p.name}
                    <span className="text-blue-500 text-xs">🔍</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {p.supplier ?? "—"} • {p.createdat}
                  </div>
                </td>

                <td className="px-4 py-3 border border-gray-200">
                  {convertIdToCategoryName(p.category_id, categories)}
                </td>

                <td className="px-4 py-3 text-right font-semibold border border-gray-200">
                  {p.sell_price}
                </td>

                {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
                  <td className="px-4 py-3 text-right text-gray-600 border border-gray-200">
                    {p.net_price}
                  </td>
                )}

                {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
                  <td className="px-4 py-3 text-right text-gray-600 border border-gray-200">
                    {p.sell_price - p.net_price < 1
                      ? String(p.sell_price - p.net_price).substring(0, 3)
                      : p.sell_price - p.net_price}
                  </td>
                )}

                <td
                  className={`px-4 py-3 text-right font-semibold border border-gray-200 ${
                    p.availability > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {p.availability}
                </td>

                <td className="px-4 py-3 border border-gray-200">
                  {isRestock === p.id ? (
                    <div className="text-green-600 flex gap-2 items-center justify-center">
                      <input
                        className="border-b-2 border-green-600 w-20 text-center focus:outline-none"
                        type="number"
                        value={restockValue}
                        min={1}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setRestockValue(Number(e.target.value));
                        }}
                      />
                      <Button
                        onClick={() => handleRestock(p.id, restockValue, p.availability)}
                        disabled={restockValue <= 0}
                        size="small"
                      >
                        <Save />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsRestock(p.id);
                        setRestockValue(0);
                      }}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
                    >
                      <FaDownload className="inline mr-1" /> To'ldirish
                    </button>
                  )}
                </td>

                <td className="px-4 py-3 border border-gray-200">
                  <div className="flex gap-2 justify-center">
                    {(permissions.includes("UPDATE_PRODUCT") || isSuperUser) && (
                      <Button size="small" variant="outlined" onClick={() => handleSetSingleProduct(p, "edit")}>
                        <Edit fontSize="small" />
                      </Button>
                    )}

                    {(permissions.includes("DELETE_PRODUCT") || isSuperUser) && (
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        onClick={() => {
                          if (window.confirm(`${p.name} o'chirilsinmi?`)) {
                            dispatch(deleteProductsThunk({ product_id: p.id, token }));
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </Button>
                    )}

                    {!(permissions.includes("DELETE_PRODUCT")) &&
                      !(permissions.includes("UPDATE_PRODUCT")) &&
                      !isSuperUser && (
                        <button
                          onClick={() => alert("O'zgartirishlar kiritishga ruxsat yo'q")}
                          className="text-gray-400"
                        >
                          <DisabledByDefault />
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}

            {pageItems.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                  Mahsulot topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PRODUCT DETAILS MODAL */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedProduct.name}</h2>
                <p className="text-blue-100 text-sm mt-1">Mahsulot tafsilotlari</p>
              </div>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProduct(null);
                }}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Asosiy Ma'lumotlar</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Mahsulot ID</label>
                    <p className="text-sm font-mono text-gray-900">{selectedProduct.id}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Mahsulot Nomi</label>
                    <p className="text-sm text-gray-900 font-medium">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Brand</label>
                    <p className="text-sm text-gray-900">{convertIdToBrandName(selectedProduct.brand_id, brands)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Kategoriya</label>
                    <p className="text-sm text-gray-900">{convertIdToCategoryName(selectedProduct.category_id, categories)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Yetkazib beruvchi</label>
                    <p className="text-sm text-gray-900">{selectedProduct.supplier || "—"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Yaratilgan</label>
                    <p className="text-sm text-gray-900">{selectedProduct.createdat}</p>
                  </div>
                </div>
              </div>

              {/* Price & Stock Information */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Narx va Ombor</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <label className="text-xs font-semibold text-gray-600">Sotish Narxi</label>
                    <p className="text-xl font-bold text-green-600">{selectedProduct.sell_price}</p>
                  </div>
                  {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <label className="text-xs font-semibold text-gray-600">Tozalangan Narxi</label>
                      <p className="text-xl font-bold text-gray-900">{selectedProduct.net_price}</p>
                    </div>
                  )}
                  {(permissions.includes("PRODUCT_DETAILS") || isSuperUser) && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <label className="text-xs font-semibold text-gray-600">Foyda</label>
                      <p className="text-xl font-bold text-blue-600">
                        {selectedProduct.sell_price - selectedProduct.net_price < 1
                          ? String(selectedProduct.sell_price - selectedProduct.net_price).substring(0, 3)
                          : selectedProduct.sell_price - selectedProduct.net_price}
                      </p>
                    </div>
                  )}
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <label className="text-xs font-semibold text-gray-600">Ombor</label>
                    <p className={`text-xl font-bold ${
                      selectedProduct.availability === 0 ? 'text-red-500' :
                      selectedProduct.availability <= LOW_STOCK_THRESHOLD ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {selectedProduct.availability}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              {(selectedProduct.expire_date || (selectedProduct as any).expiry_date) && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Qo'shimcha Ma'lumotlar</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Amal Qilish Muddati</label>
                      <p className={`text-sm font-medium ${
                        isExpired(selectedProduct) ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {/* @ts-ignore */}
                        {new Date(selectedProduct.expire_date || selectedProduct.expiry_date).toLocaleDateString()}
                        {isExpired(selectedProduct) && <span className="ml-2 text-xs">(Muddati o'tgan)</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {selectedProduct.availability === 0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Sotilgan</span>
                )}
                {selectedProduct.availability > 0 && selectedProduct.availability <= LOW_STOCK_THRESHOLD && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Kam Ombor</span>
                )}
                {selectedProduct.availability > LOW_STOCK_THRESHOLD && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Omborda mavjud</span>
                )}
                {isExpired(selectedProduct) && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Muddati o'tgan</span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProduct(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Yopish
              </button>
              {(permissions.includes("UPDATE_PRODUCT") || isSuperUser) && (
                <button
                  onClick={() => {
                    handleSetSingleProduct(selectedProduct, "edit");
                    setShowProductModal(false);
                    setSelectedProduct(null);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Edit fontSize="small" />
                  Tahrirlash
                </button>
              )}
              {(permissions.includes("DELETE_PRODUCT") || isSuperUser) && (
                <button
                  onClick={() => {
                    if (window.confirm(`${selectedProduct.name} o'chirilsinmi?`)) {
                      dispatch(deleteProductsThunk({ product_id: selectedProduct.id, token }));
                      setShowProductModal(false);
                      setSelectedProduct(null);
                    }
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Delete fontSize="small" />
                  O'chirish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAGINATION */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Ko'rsatilmoqda {(page - 1) * pageSize + 1}–
          {Math.min(page * pageSize, filtered.length)} jami {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Oldingi
          </button>

          <div className="px-3 py-1 bg-blue-50 rounded-lg border border-blue-200 font-semibold text-blue-900">
            {page} / {pages}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Keyingi
          </button>
        </div>
      </div>
    </div>
  );
}
