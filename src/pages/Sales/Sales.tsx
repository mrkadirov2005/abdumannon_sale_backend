import { useMemo, useState, useEffect } from "react";
import type { Product } from "../../../types/types";
import {  FiTrash2, FiSearch, FiShoppingCart, FiAlertCircle } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../redux/store";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  updatePrice,
  clearCart,
} from "../../redux/slices/sales/salesReducer";
import { checkoutSale } from "../../redux/slices/sales/thunks/checkoutSale";
import { getProductsThunk } from "../../redux/slices/products/thunks/getProducts";
import {
  getProductsFromStore,
  accessTokenFromStore,
  getshopidfromstrore,
  getUserFromStore,
  getSalesCartFromStore,
  getSalesLoadingFromStore,
  getSalesErrorFromStore,
  getBrandsFromStore,
  getIsCheckoutPending,
  getIsProductPending,
  getIsBrandPending,
  getAuthFromStore,
} from "../../redux/selectors";
import type { CartItem } from "../../redux/slices/sales/types";
import { convertIdToBrandName } from "../../middleware/mid_funcs";
import { getBrandsThunk } from "../../redux/slices/brands/thunk/getAllBrands";
import { Button, LinearProgress, Menu, MenuItem, IconButton, Tooltip, Chip, Badge } from "@mui/material";
import { Refresh, FilterList, Receipt, TrendingUp } from "@mui/icons-material";

const LOW_STOCK_THRESHOLD = 5;

export default function Sales() {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<string>("All");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("Naqd");
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState<string>("");
  const [customAdminName, setCustomAdminName] = useState<string>("");
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [sortType, setSortType] = useState<
    "default" | "low_stock" | "high_stock" | "not_available" | "expired" | "price_asc" | "price_desc"
  >("default");

  const sortMenuOpen = Boolean(sortAnchorEl);

  function isExpired(product: Product) {
    if (!product.expire_date) return false;
    return new Date(product.expire_date as unknown as Date) < new Date();
  }

  const dispatch = useDispatch<AppDispatch>();
  const products = useSelector(getProductsFromStore);
  const brands = useSelector(getBrandsFromStore);
  const cart = useSelector(getSalesCartFromStore);
  const loading = useSelector(getSalesLoadingFromStore);
  const error = useSelector(getSalesErrorFromStore);
  const token = useSelector(accessTokenFromStore);
  const shop_id = useSelector(getshopidfromstrore);
  const user = useSelector(getUserFromStore);
  const authData = useSelector(getAuthFromStore);

  useEffect(() => {
    if (shop_id && token) {
      // @ts-ignore
      dispatch(getProductsThunk({ shop_id, token, branch: authData.isSuperAdmin ? 100 : authData.user.branch }));
      dispatch(getBrandsThunk({ token }));
    }
  }, [shop_id, token, dispatch]);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }),
    []
  );

  const brandNames = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const brandName = convertIdToBrandName(p.brand_id, brands);
      set.add(brandName || "Unknown");
    });
    return ["All", ...Array.from(set)];
  }, [products, brands]);

  const filtered = useMemo(() => {
    let result = products;

    if (sortType === "low_stock") {
      result = result.filter((p) => p.availability > 0 && p.availability <= LOW_STOCK_THRESHOLD);
    } else if (sortType === "high_stock") {
      result = result.filter((p) => p.availability > LOW_STOCK_THRESHOLD);
    } else if (sortType === "not_available") {
      result = result.filter((p) => p.availability === 0);
    } else if (sortType === "expired") {
      result = result.filter((p) => isExpired(p));
    }

    const q = query.trim().toLowerCase();
    result = result.filter((p) => {
      const brandName = convertIdToBrandName(p.brand_id, brands);
      if (brand !== "All" && brandName !== brand) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q);
    });

    if (sortType === "price_asc") {
      result = [...result].sort((a, b) => a.sell_price - b.sell_price);
    } else if (sortType === "price_desc") {
      result = [...result].sort((a, b) => b.sell_price - a.sell_price);
    }

    return result;
  }, [products, query, brand, brands, sortType]);

  function handleAddToCart(product: Product) {
    const cartItem: CartItem = {
      productid: product.id,
      name: product.name,
      price: product.sell_price,
      netPrice: product.net_price,
      quantity: 1,
    };
    dispatch(addToCart(cartItem));
  }

  function handleRemoveFromCart(productId: string) {
    dispatch(removeFromCart(productId));
  }

  // function handleChangeQty(productId: string, delta: number) {
  //   const item = cart.find((i) => i.productid === productId);
  //   if (item) {
  //     const newQuantity = Math.max(1, item.quantity + delta);
  //     dispatch(updateQuantity({ productid: productId, quantity: newQuantity }));
  //   }
  // }

  const totals = useMemo(() => {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = cart.reduce((sum, item) => {
      // Only calculate discount if the current price is greater than net price
      const itemDiscount = item.price > item.netPrice ? (item.price - item.netPrice) * item.quantity : 0;
      return sum + itemDiscount;
    }, 0);
    const paid = parseFloat(paidAmount) || 0;
    const remaining = total - paid;
    return { total, discount, finalTotal: total, products: cart.length, paid, remaining };
  }, [cart, paidAmount]);

  function handleCheckout() {
    if (cart.length === 0) return;
    setPaidAmount(totals.finalTotal.toString());
    setShowPayment(true);
  }

  async function handleConfirmPayment() {
    const method = paymentMethod === "boshqa" ? customPaymentMethod : paymentMethod;
    if (!user || !shop_id || !token) {
      alert("Missing user information. Please login again.");
      return;
    }

    if (cart.length === 0) {
      alert("Cart is empty. Please add products before checkout.");
      return;
    }

    const admin = user as any;
    let adminName = "";
    if (admin?.first_name) {
      adminName = `${admin.first_name}${admin?.last_name ? ` ${admin.last_name}` : ""}`.trim();
    } else if (admin?.name) {
      adminName = admin.name;
    } else if (admin?.lastname) {
      adminName = admin.lastname;
    }

    let adminNumber = "";
    if (admin?.phone_number) {
      adminNumber = admin.phone_number;
    } else if (admin?.phonenumber) {
      adminNumber = admin.phonenumber;
    }

    if (!adminName || adminName.trim() === "") {
      alert("Admin name is missing. Please check your user profile.");
      return;
    }

    if (!adminNumber || adminNumber.trim() === "") {
      alert("Admin phone number is missing. Please check your user profile.");
      return;
    }

    if (!method) {
      alert("Please select a payment method.");
      return;
    }

    try {
      // Use custom admin name if provided, otherwise use default logic
      const finalAdminName = customAdminName.trim() 
        ? customAdminName.trim() 
        : (authData.isSuperAdmin ? adminName : authData.user?.uuid);

      await dispatch(
        checkoutSale({
          products: cart,
          admin_number: adminNumber,
          // @ts-ignore
          admin_name: finalAdminName,
          shop_id: shop_id,
          payment_method: method,
          token: token,
          branch: authData.isSuperAdmin ? 100 : 0,
          profit: parseFloat(paidAmount) || 0,
          total_net_price: parseFloat(paidAmount) || 0,
        })
      ).unwrap();

      setShowPayment(false);
      setPaidAmount("");
      setCustomAdminName("");
    } catch (error: any) {
      const errorMessage = typeof error === "string" ? error : error?.message;
      if (errorMessage && errorMessage !== "Checkout failed") {
        alert(`Checkout failed: ${errorMessage}`);
      } else {
        alert("Checkout failed. Please try again.");
      }
    }
  }

  const isCheckoutLoading = useSelector(getIsCheckoutPending);
  const isProductLoading = useSelector(getIsProductPending);
  const isBrandLoading = useSelector(getIsBrandPending);

  const lowStockProducts = products.filter((p) => p.availability > 0 && p.availability <= LOW_STOCK_THRESHOLD);
  const outOfStockProducts = products.filter((p) => p.availability === 0);
  const expiredProducts = products.filter((p) => isExpired(p));

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-6">
      {(isCheckoutLoading === "rejected" ||
        isCheckoutLoading === "pending" ||
        isProductLoading === "pending" ||
        isBrandLoading === "pending" ||
        isProductLoading === "rejected" ||
        isBrandLoading === "rejected") && (
        <LinearProgress
          color={
            isCheckoutLoading || isBrandLoading === "pending" || isProductLoading === "pending"
              ? "primary"
              : "error"
          }
          className="mb-4"
        />
      )}

      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
              <FiShoppingCart className="text-blue-600" /> Checkout
            </h1>
            <p className="text-gray-600 mt-1">Fast cashier view — search, filter & checkout products</p>
          </div>
          <Tooltip title="Refresh data">
            <Button
              onClick={() => {
                // @ts-ignore
                dispatch(getProductsThunk({ shop_id, token, branch: authData.isSuperAdmin ? 100 : authData.user.branch }));
                dispatch(getBrandsThunk({ token }));
              }}
              variant="outlined"
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          </Tooltip>
        </div>

        {/* ALERTS */}
        <div className="mt-4 flex gap-3 flex-wrap">
          {error && (
            <div className="flex-1 min-w-[300px] px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
          )}

          {lowStockProducts.length > 0 && (
            <Chip
              icon={<TrendingUp />}
              label={`Low Stock: ${lowStockProducts.length}`}
              color="warning"
              variant="outlined"
            />
          )}

          {outOfStockProducts.length > 0 && (
            <Chip
              icon={<FiAlertCircle />}
              label={`Out of Stock: ${outOfStockProducts.length}`}
              color="error"
              variant="outlined"
            />
          )}

          {expiredProducts.length > 0 && (
            <Chip
              icon={<FiAlertCircle />}
              label={`Expireds: ${expiredProducts.length}`}
              color="error"
              variant="filled"
            />
          )}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* LEFT: PRODUCT LIST */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {/* FILTERS */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            {/* Search */}
            <div className="relative">
              <input
                id="product-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiSearch className="absolute right-3 top-2.5 text-gray-400" />
            </div>

            {/* Brand + Sort + Reset */}
            <div className="flex gap-2">
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {brandNames.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <Tooltip title="Sort/Filter">
                <IconButton
                  size="small"
                  onClick={(e) => setSortAnchorEl(e.currentTarget)}
                  className="border border-gray-200"
                >
                  <FilterList />
                </IconButton>
              </Tooltip>

              <Menu anchorEl={sortAnchorEl} open={sortMenuOpen} onClose={() => setSortAnchorEl(null)}>
                <MenuItem
                  selected={sortType === "default"}
                  onClick={() => {
                    setSortType("default");
                    setSortAnchorEl(null);
                  }}
                >
                  Default
                </MenuItem>
                <MenuItem
                  selected={sortType === "low_stock"}
                  onClick={() => {
                    setSortType("low_stock");
                    setSortAnchorEl(null);
                  }}
                >
                  Low Stock (≤ {LOW_STOCK_THRESHOLD})
                </MenuItem>
                <MenuItem
                  selected={sortType === "high_stock"}
                  onClick={() => {
                    setSortType("high_stock");
                    setSortAnchorEl(null);
                  }}
                >
                  High Stock (&gt; {LOW_STOCK_THRESHOLD})
                </MenuItem>
                <MenuItem
                  selected={sortType === "not_available"}
                  onClick={() => {
                    setSortType("not_available");
                    setSortAnchorEl(null);
                  }}
                >
                  Out of Stock
                </MenuItem>
                <MenuItem
                  selected={sortType === "expired"}
                  onClick={() => {
                    setSortType("expired");
                    setSortAnchorEl(null);
                  }}
                >
                  Expired
                </MenuItem>
                <MenuItem
                  selected={sortType === "price_asc"}
                  onClick={() => {
                    setSortType("price_asc");
                    setSortAnchorEl(null);
                  }}
                >
                  Price: Low → High
                </MenuItem>
                <MenuItem
                  selected={sortType === "price_desc"}
                  onClick={() => {
                    setSortType("price_desc");
                    setSortAnchorEl(null);
                  }}
                >
                  Price: High → Low
                </MenuItem>
              </Menu>

              <button
                onClick={() => {
                  setQuery("");
                  setBrand("All");
                  setSortType("default");
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Found: <span className="font-bold text-gray-900">{filtered.length}</span> products
            </div>
          </div>

          {/* PRODUCT LIST */}
          <div className="flex-1 overflow-y-auto space-y-2 p-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {convertIdToBrandName(p.brand_id, brands) || "Unknown"}
                    </div>
                    <div className="text-sm font-bold text-blue-600 mt-1">
                      {formatter.format(p.sell_price)}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div
                      className={`text-xs font-semibold px-2 py-1 rounded ${
                        p.availability === 0
                          ? "bg-red-100 text-red-700"
                          : p.availability <= LOW_STOCK_THRESHOLD
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Stock: {p.availability}
                    </div>
                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={p.availability <= 0}
                      className={`w-full px-2 py-1.5 rounded text-sm font-medium transition-colors ${
                        p.availability <= 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FiSearch size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: CART */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Badge badgeContent={cart.length} color="primary">
                <FiShoppingCart className="text-gray-700" />
              </Badge>
              Cart
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 p-4">
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FiShoppingCart size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Cart is empty</p>
              </div>
            )}

            {cart.map((product) => (
              <div key={product.productid} className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">{product.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>Price:</span>
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0) {
                            dispatch(updatePrice({ productid: product.productid, price: val }));
                          }
                        }}
                        className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(product.productid)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          dispatch(updateQuantity({ productid: product.productid, quantity: val }));
                        }
                      }}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="font-bold text-gray-900">{formatter.format(product.price * product.quantity)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => dispatch(clearCart())}
              disabled={cart.length === 0}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* RIGHT: SUMMARY & CHECKOUT */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Receipt className="text-blue-600" />
              <h3 className="font-bold text-lg">Buyurtma Tafsilotlari</h3>
            </div>

            {/* ITEMS BREAKDOWN */}
            <div className="space-y-2 py-4 border-y border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mahsulotlar:</span>
                <span className="font-semibold">{cart.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Jami narxi:</span>
                <span className="font-semibold">{formatter.format(totals.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">To'langan:</span>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Qoldiq:</span>
                <span className={`font-semibold ${totals.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatter.format(Math.abs(totals.remaining))}
                </span>
              </div>
            </div>

            {/* TOTAL */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">{formatter.format(totals.finalTotal)}</span>
              </div>
            </div>

            {/* PAYMENT SECTION */}
            {showPayment && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-sm text-gray-900">Payment Method</h4>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    if (e.target.value !== "boshqa") {
                      setCustomPaymentMethod("");
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Naqd">💵 Naqd</option>
                  <option value="Nasiya">💳 Nasiya</option>
                  <option value="boshqa">📝 Boshqa</option>
                </select>

                {paymentMethod === "boshqa" && (
                  <input
                    type="text"
                    value={customPaymentMethod}
                    onChange={(e) => setCustomPaymentMethod(e.target.value)}
                    placeholder="Enter payment method..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Admin Name (Optional)</label>
                  <input
                    type="text"
                    value={customAdminName}
                    onChange={(e) => setCustomAdminName(e.target.value)}
                    placeholder="Enter admin name (leave empty for default)..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowPayment(false);
                      setPaymentMethod("Naqd");
                      setCustomPaymentMethod("");
                      setPaidAmount("");
                      setCustomAdminName("");
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={loading || (paymentMethod === "boshqa" && !customPaymentMethod.trim())}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Processing..." : "Confirm"}
                  </button>
                </div>
              </div>
            )}

            {/* CHECKOUT BUTTONS */}
            {!showPayment && (
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || loading}
                  className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                    cart.length && !loading
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                >
                  {loading ? "Processing..." : `Checkout — ${formatter.format(totals.finalTotal)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
