import { useEffect, useMemo, useState } from "react";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { useDispatch, useSelector } from "react-redux";
import {
  accessTokenFromStore,
  getAuthFromStore,
  getIsSuperUserFromStore,
  getUserFromStore,
} from "../../redux/selectors";
import type { Admin } from "../../../types/types";
import {  Menu, MenuItem, Tooltip } from "@mui/material";
import { BarChart } from "@mui/icons-material";
import { type AppDispatch } from "../../redux/store";
import { setSales } from "../../redux/slices/sales/salesReducer";
import { toast } from "react-toastify";
import SalesStatistics from "./SalesStatistics";
import { Search, X } from "lucide-react";
import { DEFAULT_SUPPLIER_HTML, generateChequeNumber, printCheque, verifyChequeNumber } from "../../components/ui/ChequeProvider";

type PaymentMethod = "cash" | "card" | "mobile" | "" | null;

interface Sale {
  id: number;
  sale_id: string;
  total_price: number;
  profit: number;
  total_net_price: number;
  payment_method: PaymentMethod;
  sale_time: string;
  admin_name?: string;
}

interface SoldProduct {
  id: number;
  product_name: string;
  amount: number;
  net_price: number;
  sell_price: number;
  productid: string;
  salesid: string;
  shop_id: string;
  unit?: string | null;
}


function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


export default function SaleBoard() {
  const formatAmount = useMemo(
    () => (value: number) =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value) || 0),
    []
  );

  const isSuperAdmin = useSelector(getIsSuperUserFromStore);
  const API_URL = !isSuperAdmin
    ? `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.getAdminSales}`
    : `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.getSales}`;

  const accessToken = useSelector(accessTokenFromStore);
  const authData = useSelector(getAuthFromStore);
  const user = useSelector(getUserFromStore);

  const REQUEST_BODY = !isSuperAdmin
    ? {
        shop_id: authData.user?.shop_id,
        admin_name: authData.isSuperAdmin ? (user as Admin | null)?.last_name : authData.user?.uuid,
      }
    : {
        shop_id: authData.user?.shop_id,
      };

  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [sortKey, setSortKey] = useState<keyof Sale>("sale_time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Additional sorting/filter menu state
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [extraSort, setExtraSort] = useState<"default" | "amount_asc" | "amount_desc" | "profit_asc" | "profit_desc">("default");
  const sortMenuOpen = Boolean(sortMenuAnchor);

  // Payment editing states
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editedPaymentMethod, setEditedPaymentMethod] = useState<string>("");
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>("");
  const [updatingSale, setUpdatingSale] = useState<number | null>(null);

  // Admin name editing states
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null);
  const [editedAdminName, setEditedAdminName] = useState<string>("");

  // Total price editing states
  const [editingTotalId, setEditingTotalId] = useState<number | null>(null);
  const [editedTotalPrice, setEditedTotalPrice] = useState<string>("");

  // Profit editing states
  const [editingProfitId, setEditingProfitId] = useState<number | null>(null);
  const [editedProfit, setEditedProfit] = useState<string>("");

  // Delete sale state
  const [deletingSaleId, setDeletingSaleId] = useState<number | null>(null);

  // Payment status tab: "all" | "paid" | "debt"
  const [paymentTab, setPaymentTab] = useState<"all" | "paid" | "debt">("all");

  // View sale products states
  const [viewingProductsSaleId, setViewingProductsSaleId] = useState<string | null>(null);
  const [saleProducts, setSaleProducts] = useState<SoldProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // View toggle state (table or statistics)
  const [viewMode, setViewMode] = useState<"table" | "statistics">("table");

  // Cheque customer modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [pendingPrintSale, setPendingPrintSale] = useState<Sale | null>(null);

  // Cheque verification
  const [isChequeVerifyOpen, setIsChequeVerifyOpen] = useState<boolean>(false);
  const [chequeInput, setChequeInput] = useState<string>("");
  const [chequeResult, setChequeResult] = useState<{ ok: boolean; message: string } | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!isSuperAdmin && (!REQUEST_BODY.shop_id || !REQUEST_BODY.admin_name)) {
      toast.warning("Missing required information to load sales");
      return;
    }

    const fetchSales = async () => {
      setLoading(true);
      setError("");

      try {
        const options: RequestInit = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: accessToken ?? "",
          },
        };

        options.body = JSON.stringify(REQUEST_BODY);

        const res = await fetch(API_URL, options);

        const json: {
          success: boolean;
          data: Sale[];
          message?: string;
        } = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Failed to fetch sales");
        }

        setData(json.data ?? []);
        console.log(json.data)
        dispatch(setSales(json.data));
        console.log(json.data.filter(sale=>sale.sale_id=="232192b8-27fe-49d0-a456-6b3ae2e0de25"))

        toast.success(`Successfully loaded ${json.data?.length || 0} sales`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        console.error(err);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [API_URL, accessToken, REQUEST_BODY.shop_id, REQUEST_BODY.admin_name, isSuperAdmin, dispatch]);

  const handleSort = (key: keyof Sale) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setExtraSort("default");
  };

  // Extra sorting for amount/profit
  const handleExtraSort = (type: typeof extraSort) => {
    setExtraSort(type);
    setSortMenuAnchor(null);
  };

  const filteredData :Sale[] = useMemo(() => {
    let rows = [...data];

    // Filter by selected admin
    if (selectedAdmin) {
      rows = rows.filter((r) => r.admin_name === selectedAdmin);
    }

    // Filter by date
    if (dateFilter !== "all") {
      rows = rows.filter((r) => {
        const saleDate = new Date(r.sale_time).toLocaleDateString();
        return saleDate === dateFilter;
      });
    }

    if (paymentFilter !== "all") {
      rows = rows.filter((r) => (r.payment_method ?? "") === paymentFilter);
    }

    if (search) {
      rows = rows.filter((r) => 
        (r.admin_name?.toLowerCase() || "").includes(search.toLowerCase())
      );
    }

    // Extra sorting
    if (extraSort === "amount_asc") {
      rows.sort((a, b) => a.total_price - b.total_price);
    } else if (extraSort === "amount_desc") {
      rows.sort((a, b) => b.total_price - a.total_price);
    } else if (extraSort === "profit_asc") {
      rows.sort((a, b) => a.profit - b.profit);
    } else if (extraSort === "profit_desc") {
      rows.sort((a, b) => b.profit - a.profit);
    } else {
      // Default sorting by sortKey/sortOrder
      rows.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }

        return sortOrder === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return rows;
  }, [data, sortKey, sortOrder, paymentFilter, search, extraSort, selectedAdmin, dateFilter]);

  // Filter by payment tab (paid vs debt)
  const tabFilteredData = useMemo(() => {
    if (paymentTab === "paid") {
      return filteredData.filter((sale) => Number(sale.profit) >= Number(sale.total_price));
    }
    if (paymentTab === "debt") {
      return filteredData.filter((sale) => Number(sale.profit) < Number(sale.total_price));
    }
    return filteredData;
  }, [filteredData, paymentTab]);

  // Totals for the active tab
  const tabTotals = useMemo(() => {
    return tabFilteredData.reduce(
      (acc, sale) => {
        acc.totalPrice += Number(sale.total_price) ?? 0;
        acc.totalProfit += Number(sale.profit) ?? 0;
        return acc;
      },
      { totalPrice: 0, totalProfit: 0 }
    );
  }, [tabFilteredData]);

  // Extract unique dates from sales data
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    data.forEach((sale) => {
      const date = new Date(sale.sale_time).toLocaleDateString();
      dates.add(date);
    });
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [data]);

  // Extract unique admin names for autocomplete
  const uniqueAdminNames = useMemo(() => {
    const names = new Set<string>();
    data.forEach((sale) => {
      if (sale.admin_name && sale.admin_name.trim()) {
        names.add(sale.admin_name);
      }
    });
    return Array.from(names).sort();
  }, [data]);

  // Group sales by admin
  const groupedByAdmin = useMemo(() => {
    const groups: Record<string, { sales: Sale[], totalPrice: number, totalProfit: number, latestDate: string }> = {};
    
    const dataToGroup = search 
      ? data.filter((r) => (r.admin_name?.toLowerCase() || "").includes(search.toLowerCase()))
      : data;

    dataToGroup.forEach((sale) => {
      const adminName = sale.admin_name || "Unknown";
      if (!groups[adminName]) {
        groups[adminName] = { sales: [], totalPrice: 0, totalProfit: 0, latestDate: sale.sale_time };
      }
      groups[adminName].sales.push(sale);
      groups[adminName].totalPrice += Number(sale.total_price) || 0;
      groups[adminName].totalProfit += Number(sale.profit) || 0;
      // Keep the latest date
      if (new Date(sale.sale_time) > new Date(groups[adminName].latestDate)) {
        groups[adminName].latestDate = sale.sale_time;
      }
    });

    return Object.entries(groups).map(([adminName, data]) => ({
      adminName,
      salesCount: data.sales.length,
      totalPrice: data.totalPrice,
      totalProfit: data.totalProfit,
      latestDate: data.latestDate,
    }));
  }, [data, search]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, sale) => {
        acc.totalPrice += Number(sale.total_price) ?? 0;
        acc.totalProfit += Number(sale.profit) ?? 0;
        return acc;
      },
      { totalPrice: 0, totalProfit: 0 }
    );
  }, [filteredData]);

  // Reset filters handler
  const handleResetFilters = () => {
    setSearch("");
    setPaymentFilter("all");
    setExtraSort("default");
    setSortKey("sale_time");
    setSortOrder("desc");
    setSelectedAdmin(null);
    setDateFilter("all");
    toast.info("Filtrlar tozalandi");
  };

  // Handle payment method edit
  const handleEditPayment = (sale: Sale) => {
    setEditingPaymentId(sale.id);
    setEditedPaymentMethod(sale.payment_method || "");
    setCustomPaymentMethod("");
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    setEditedPaymentMethod("");
    setCustomPaymentMethod("");
  };

  // Handle admin name edit
  const handleEditAdmin = (sale: Sale) => {
    setEditingAdminId(sale.id);
    setEditedAdminName(sale.admin_name || "");
  };

  const handleCancelAdminEdit = () => {
    setEditingAdminId(null);
    setEditedAdminName("");
  };

  // Handle save admin name
  const handleSaveAdmin = async (saleId: number, sale_id: string) => {
    if (!editedAdminName.trim()) {
      toast.error("Admin nomi bo'sh bo'lishi mumkin emas");
      return;
    }

    setUpdatingSale(saleId);
    try {
      const updateEndpoint = `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.updateSale}`;
      const response = await fetch(updateEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: accessToken ?? "",
        },
        body: JSON.stringify({
          sale_id: sale_id,
          updatedFields: {
            admin_name: editedAdminName,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Admin nomini yangilash amalga oshmadi");
      }

      // Update local state
      setData((prevData) =>
        prevData.map((sale) =>
          sale.id === saleId ? { ...sale, admin_name: editedAdminName } : sale
        )
      );

      toast.success("Admin nomi muvaffaqiyatli yangilandi");
      setEditingAdminId(null);
      setEditedAdminName("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Admin nomini yangilash amalga oshmadi";
      toast.error(message);
      console.error(err);
    } finally {
      setUpdatingSale(null);
    }
  };

  // Handle total price edit
  const handleEditTotal = (sale: Sale) => {
    setEditingTotalId(sale.id);
    setEditedTotalPrice(sale.total_price.toString());
  };

  const handleCancelTotalEdit = () => {
    setEditingTotalId(null);
    setEditedTotalPrice("");
  };

  const handleSaveTotal = async (saleId: number, sale_id: string) => {
    const totalPrice = parseFloat(editedTotalPrice);
    if (isNaN(totalPrice) || totalPrice < 0) {
      toast.error("Iltimos, to'g'ri summa kiriting");
      return;
    }

    setUpdatingSale(saleId);
    try {
      const updateEndpoint = `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.updateSale}`;
      const response = await fetch(updateEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: accessToken ?? "",
        },
        body: JSON.stringify({
          sale_id: sale_id,
          updatedFields: {
            total_price: totalPrice,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Jami summani yangilash amalga oshmadi");
      }

      setData((prevData) =>
        prevData.map((sale) =>
          sale.id === saleId ? { ...sale, total_price: totalPrice } : sale
        )
      );

      toast.success("Jami summa muvaffaqiyatli yangilandi");
      setEditingTotalId(null);
      setEditedTotalPrice("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Jami summani yangilash amalga oshmadi";
      toast.error(message);
      console.error(err);
    } finally {
      setUpdatingSale(null);
    }
  };

  // Handle profit (paid amount) edit
  const handleEditProfit = (sale: Sale) => {
    setEditingProfitId(sale.id);
    setEditedProfit(sale.profit.toString());
  };

  const handleCancelProfitEdit = () => {
    setEditingProfitId(null);
    setEditedProfit("");
  };

  const handleSaveProfit = async (saleId: number, sale_id: string) => {
    const profit = parseFloat(editedProfit);
    if (isNaN(profit)) {
      toast.error("Iltimos, to'g'ri summa kiriting");
      return;
    }

    setUpdatingSale(saleId);
    try {
      const updateEndpoint = `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.updateSale}`;
      const response = await fetch(updateEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: accessToken ?? "",
        },
        body: JSON.stringify({
          sale_id: sale_id,
          updatedFields: {
            profit: profit,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "To'langan summani yangilash amalga oshmadi");
      }

      setData((prevData) =>
        prevData.map((sale) =>
          sale.id === saleId ? { ...sale, profit: profit } : sale
        )
      );

      toast.success("To'langan summa muvaffaqiyatli yangilandi");
      setEditingProfitId(null);
      setEditedProfit("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "To'langan summani yangilash amalga oshmadi";
      toast.error(message);
      console.error(err);
    } finally {
      setUpdatingSale(null);
    }
  };

  // Handle save payment method
  const handleSavePayment = async (saleId: number, sale_id: string) => {
    const finalPaymentMethod = editedPaymentMethod === "boshqa" ? customPaymentMethod : editedPaymentMethod;
    
    if (editedPaymentMethod === "boshqa" && !customPaymentMethod.trim()) {
      toast.error("Iltimos, boshqa to'lov usulini kiriting");
      return;
    }

    setUpdatingSale(saleId);
    try {
      const updateEndpoint = `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.updateSale}`;
      const response = await fetch(updateEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: accessToken ?? "",
        },
        body: JSON.stringify({
          sale_id: sale_id,
          updatedFields: {
            payment_method: finalPaymentMethod,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "To'lov usulini yangilash amalga oshmadi");
      }

      // Update local state
      setData((prevData) =>
        prevData.map((sale) =>
          sale.id === saleId ? { ...sale, payment_method: finalPaymentMethod as PaymentMethod } : sale
        )
      );

      toast.success("To'lov usuli muvaffaqiyatli yangilandi");
      setEditingPaymentId(null);
      setEditedPaymentMethod("");
      setCustomPaymentMethod("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "To'lov usulini yangilash amalga oshmadi";
      toast.error(message);
      console.error(err);
    } finally {
      setUpdatingSale(null);
    }
  };

  // Handle delete sale
  const handleDeleteSale = async (saleId: number, sale_id: string) => {
    if (!window.confirm("Haqiqatan ham bu sotuvni o'chirmoqchimisiz?")) {
      return;
    }

    setDeletingSaleId(saleId);
    try {
      const deleteEndpoint = `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.deleteSale}`;
      const response = await fetch(deleteEndpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: accessToken ?? "",
        },
        body: JSON.stringify({ sale_id: sale_id
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Sotuvni o'chirish amalga oshmadi");
      }

      // Remove from local state
      setData((prevData) => prevData.filter((sale) => sale.id !== saleId));

      toast.success("Sotuv muvaffaqiyatli o'chirildi");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sotuvni o'chirish amalga oshmadi";
      toast.error(message);
      console.error(err);
    } finally {
      setDeletingSaleId(null);
    }
  };

  // Handle view products
  const handleViewProducts = async (sale_id: string) => {
    setViewingProductsSaleId(sale_id);
    setLoadingProducts(true);
    setSaleProducts([]);

    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.sales.getSaleById}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: accessToken ?? "",
          uuid: user?.uuid || "",
        },
        body: JSON.stringify({ sale_id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Mahsulotlarni yuklashda xatolik");
      }

      setSaleProducts(result.products || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mahsulotlarni yuklashda xatolik";
      toast.error(message);
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle close products modal
  const handleCloseProductsModal = () => {
    setViewingProductsSaleId(null);
    setSaleProducts([]);
  };

  // Print individual sale as invoice
  const printSaleAsInvoice = (sale: Sale, customer: string) => {
    const paymentLabel =
      sale.payment_method === "cash" ? "Наличные" :
      sale.payment_method === "card" ? "Карта" : "Мобильная";

    const chequeNumber = generateChequeNumber();
    const safeCustomer = escapeHtml(customer);


    printCheque({
      title: "Накладная",
      number: chequeNumber,
      date: sale.sale_time,
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: safeCustomer,
      buyerLabel: "Покупатель",
      buyerRight: `Способ оплаты: ${paymentLabel}`,
      products: saleProducts.map((p) => ({
        name: p.product_name,
        quantity: p.amount,
        unit: p.unit || "pcs",
        price: p.sell_price,
        total: p.sell_price * p.amount,
      })),
      extraNote: "Возврат товара в течение 14 дней",
      signatureLeft: "Руководитель",
      signatureRight: "Бухгалтер",
    });
  };

  // Handle print all sales for selected admin
  const handlePrintAllAdminSales = () => {
    if (!selectedAdmin || filteredData.length === 0) {
      toast.error("Chop etish uchun sotuvlar yo'q");
      return;
    }

    const totalAmount = filteredData.reduce((s, sale) => s + (Number(sale.total_price) || 0), 0);

    printCheque({
      title: "Отчёт по продажам",
      number: selectedAdmin,
      date: new Date(),
      supplier: "HC COMPANY",
      buyer: `Продавец: ${selectedAdmin} | Всего продаж: ${filteredData.length}`,
      products: filteredData.map((sale) => ({
        name: `Накладная ${sale.sale_id} (${new Date(sale.sale_time).toLocaleDateString("uz-UZ")})`,
        quantity: 1,
        unit: "pcs",
        price: Number(sale.total_price),
        total: Number(sale.total_price),
      })),
      totalAmount,
      signatureLeft: "Руководитель",
      signatureRight: "Бухгалтер",
    });
  };

  const headers: { key: keyof Sale | 'actions' | 'payment_status'; label: string }[] = [
    { key: "sale_time", label: "Sana va Vaqt" },
    { key: "admin_name", label: "Admin Nomi" },
    { key: "total_price", label: "Jami" },
    { key: "profit", label: "To'langan" },
    { key: "payment_status", label: "To'lov Holati" },
    { key: "payment_method", label: "To'lov" },
    { key: "actions", label: "Amallar" },
  ];

  const isFilterActive = search !== "" || paymentFilter !== "all" || extraSort !== "default" || selectedAdmin !== null || dateFilter !== "all" || paymentTab !== "all";

  const handleBackToAdmins = () => {
    setSelectedAdmin(null);
    setPaymentFilter("all");
    setExtraSort("default");
    setDateFilter("all");
    setPaymentTab("all");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 md:p-8">
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Yuklanmoqda...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <p className="text-red-800 font-semibold">Xatolik:</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <>
      {/* Header */}
      <header className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            📊 Sotuvlar Boshqaruvi
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            {selectedAdmin ? `${selectedAdmin} - Sotuvlar ma'lumotlari` : "Barcha sotuvlar va ma'lumotlar"}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => setViewMode("table")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm md:text-base ${
                viewMode === "table"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              📊 Jadval
            </button>
            <button
              onClick={() => setViewMode("statistics")}
              className={`flex-1 sm:flex-none px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm md:text-base ${
                viewMode === "statistics"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              <BarChart fontSize="small" /> Statistika
            </button>
            <button
              onClick={() => {
                setChequeInput("");
                setChequeResult(null);
                setIsChequeVerifyOpen(true);
              }}
              className="flex-1 sm:flex-none px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm md:text-base bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            >
              Chek tekshirish
            </button>
          </div>
        </div>
      </header>

      {/* Action Buttons */}
      {selectedAdmin && (
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handlePrintAllAdminSales}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition font-medium flex items-center justify-center gap-2 shadow-md"
          >
            🖨️ Barcha sotuvlarni chop etish
          </button>
          <button
            onClick={handleBackToAdmins}
            className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium flex items-center justify-center gap-2"
          >
            ← Adminlarga qaytish
          </button>
        </div>
      )}

      {/* Render Statistics View */}
      {viewMode === "statistics" ? (
        <SalesStatistics sales={filteredData} />
      ) : (
        <>
      {/* Filters Card */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
            {selectedAdmin ? "Filtrlar" : "Qidiruv va Filtrlar"}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Admin nomini qidirish..."
              className="w-full pl-10 pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {selectedAdmin && (
            <>
              <select
                className="w-full px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">Barcha sanalar</option>
                {availableDates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>

              <select
                className="w-full px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="all">Barcha to'lovlar</option>
                <option value="cash">Naqd</option>
                <option value="card">Karta</option>
                <option value="mobile">Mobil</option>
                <option value="">Noma'lum</option>
              </select>

              {/* Sorting/filter menu */}
              <Tooltip title="Summa/foyda bo'yicha tartiblash">
                <button
                  onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                  className="w-full px-4 py-2 md:py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition font-medium flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                    <path d="M10 17l5-5-5-5v10z" fill="currentColor" />
                  </svg>
                  Tartiblash
                </button>
              </Tooltip>
              <Menu
                anchorEl={sortMenuAnchor}
                open={sortMenuOpen}
                onClose={() => setSortMenuAnchor(null)}
              >
                <MenuItem
                  selected={extraSort === "default"}
                  onClick={() => handleExtraSort("default")}
                >
                  Standart tartiblash
                </MenuItem>
                <MenuItem
                  selected={extraSort === "amount_asc"}
                  onClick={() => handleExtraSort("amount_asc")}
                >
                  Summa: Kamdan ko'pga
                </MenuItem>
                <MenuItem
                  selected={extraSort === "amount_desc"}
                  onClick={() => handleExtraSort("amount_desc")}
                >
                  Summa: Ko'pdan kamga
                </MenuItem>
                <MenuItem
                  selected={extraSort === "profit_asc"}
                  onClick={() => handleExtraSort("profit_asc")}
                >
                  Foyda: Kamdan ko'pga
                </MenuItem>
                <MenuItem
                  selected={extraSort === "profit_desc"}
                  onClick={() => handleExtraSort("profit_desc")}
                >
                  Foyda: Ko'pdan kamga
                </MenuItem>
              </Menu>
            </>
          )}

          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-2 md:py-3 text-sm md:text-base bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition flex items-center justify-center gap-2 font-medium"
            >
              <X size={18} /> Tozalash
            </button>
          )}
        </div>

        {/* Results Info */}
        {selectedAdmin && (
          <div className="mt-4 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm md:text-base text-gray-700">
              <span className="font-bold text-blue-900">{filteredData.length}</span> ta sotuv topildi • Jami: <span className="font-bold text-blue-900">{formatAmount(totals.totalPrice)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Show Admin List or Detailed Sales */}
      {!selectedAdmin ? (
        <>
          {/* Admin List View - Table Style */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 md:px-5 py-3 md:py-4 text-left font-semibold text-gray-700">Admin Nomi</th>
                    <th className="px-4 md:px-5 py-3 md:py-4 text-left font-semibold text-gray-700">So'nggi sotuv sanasi</th>
                    <th className="px-4 md:px-5 py-3 md:py-4 text-left font-semibold text-gray-700">Jami sotuvlar</th>
                    <th className="px-4 md:px-5 py-3 md:py-4 text-left font-semibold text-gray-700">Jami summa</th>
                    <th className="px-4 md:px-5 py-3 md:py-4 text-left font-semibold text-gray-700">Jami foyda</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByAdmin.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        <p className="text-base">Ma'lumot topilmadi</p>
                      </td>
                    </tr>
                  )}
                  {groupedByAdmin.map((admin) => (
                    <tr
                      key={admin.adminName}
                      onClick={() => setSelectedAdmin(admin.adminName)}
                      className="border-b border-gray-200 hover:bg-blue-50 transition cursor-pointer group"
                    >
                      <td className="px-4 md:px-5 py-3 md:py-4 text-sm font-medium text-blue-600 hover:text-blue-700">{admin.adminName}</td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-sm text-gray-700">{new Date(admin.latestDate).toLocaleString('uz-UZ')}</td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-sm text-gray-700">{admin.salesCount}</td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-sm text-gray-900 font-medium">{formatAmount(admin.totalPrice)}</td>
                      <td className="px-4 md:px-5 py-3 md:py-4 text-sm font-semibold text-green-600">{formatAmount(admin.totalProfit)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 font-semibold">
                  <tr>
                    <td colSpan={5} className="px-4 md:px-5 py-3 md:py-4 text-sm text-gray-700">
                      {groupedByAdmin.length} admin ko'rsatilmoqda
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            {groupedByAdmin.length} admin ko'rsatilmoqda
          </div>
        </>
      ) : (
        <>
          {/* Payment Status Tabs */}
          <div className="flex gap-2 mb-6 bg-white rounded-lg shadow-sm p-1.5">
            <button
              onClick={() => setPaymentTab("all")}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
                paymentTab === "all"
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Barchasi ({filteredData.length})
            </button>
            <button
              onClick={() => setPaymentTab("paid")}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
                paymentTab === "paid"
                  ? "bg-green-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              ✓ To'liq to'langan ({filteredData.filter((s) => Number(s.profit) >= Number(s.total_price)).length})
            </button>
            <button
              onClick={() => setPaymentTab("debt")}
              className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
                paymentTab === "debt"
                  ? "bg-red-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              ✗ Qarzlar ({filteredData.filter((s) => Number(s.profit) < Number(s.total_price)).length})
            </button>
          </div>

          {/* Detailed Sales View - Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 md:p-5 shadow-lg text-white">
              <p className="text-sm md:text-base font-semibold opacity-90 mb-2">Jami Sotuvlar</p>
              <p className="text-3xl md:text-4xl font-bold">{tabFilteredData.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 md:p-5 shadow-lg text-white">
              <p className="text-sm md:text-base font-semibold opacity-90 mb-2">Jami Summa</p>
              <p className="text-3xl md:text-4xl font-bold">{formatAmount(tabTotals.totalPrice)}</p>
              <p className="text-xs md:text-sm opacity-75 mt-1">?</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 md:p-5 shadow-lg text-white">
              <p className="text-sm md:text-base font-semibold opacity-90 mb-2">{paymentTab === "debt" ? "Jami To'langan" : "Jami Foyda"}</p>
              <p className="text-3xl md:text-4xl font-bold">{formatAmount(tabTotals.totalProfit)}</p>
              <p className="text-xs md:text-sm opacity-75 mt-1">?</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h.key}
                      onClick={() => h.key !== 'actions' && handleSort(h.key as keyof Sale)}
                      className={`px-4 md:px-5 py-3 md:py-4 text-left font-semibold text-gray-700 ${h.key !== 'actions' ? 'cursor-pointer hover:text-blue-600 transition' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {h.label}
                        {sortKey === h.key && extraSort === "default" && (
                          <span className="ml-1 text-blue-600">{sortOrder === "asc" ? "▲" : "▼"}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {tabFilteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      <p className="text-base">{paymentTab === "paid" ? "To'liq to'langan sotuvlar topilmadi" : paymentTab === "debt" ? "Qarzlar topilmadi" : "Ma'lumot topilmadi"}</p>
                    </td>
                  </tr>
                )}

                {tabFilteredData.map((row) => (
                  <tr key={row.id} className="border-b border-gray-200 hover:bg-blue-50 transition group">
                    <td className="px-4 md:px-5 py-3 md:py-4 text-sm text-gray-700">{new Date(row.sale_time).toLocaleString('uz-UZ')}</td>
                    <td className="px-4 md:px-5 py-3 md:py-4 text-sm">
                      {editingAdminId === row.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editedAdminName}
                            onChange={(e) => setEditedAdminName(e.target.value)}
                            list="admin-names-list"
                            className="flex-1 px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Admin nomini kiriting..."
                          />
                          <datalist id="admin-names-list">
                            {uniqueAdminNames.map((name) => (
                              <option key={name} value={name} />
                            ))}
                          </datalist>
                          <button
                            onClick={() => handleSaveAdmin(row.id, row.sale_id)}
                            disabled={updatingSale === row.id}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:bg-gray-400 transition"
                          >
                            {updatingSale === row.id ? "..." : "✓"}
                          </button>
                          <button
                            onClick={handleCancelAdminEdit}
                            disabled={updatingSale === row.id}
                            className="px-3 py-2 bg-gray-400 text-white rounded-lg text-xs hover:bg-gray-500 disabled:bg-gray-300 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{row.admin_name || "—"}</span>
                          <button
                            onClick={() => handleEditAdmin(row)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Tahrirlash
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-4 text-sm">
                      {editingTotalId === row.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editedTotalPrice}
                            onChange={(e) => setEditedTotalPrice(e.target.value)}
                            className="flex-1 px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Jami summani kiriting..."
                          />
                          <button
                            onClick={() => handleSaveTotal(row.id, row.sale_id)}
                            disabled={updatingSale === row.id}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:bg-gray-400 transition"
                          >
                            {updatingSale === row.id ? "..." : "✓"}
                          </button>
                          <button
                            onClick={handleCancelTotalEdit}
                            disabled={updatingSale === row.id}
                            className="px-3 py-2 bg-gray-400 text-white rounded-lg text-xs hover:bg-gray-500 disabled:bg-gray-300 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{formatAmount(row.total_price)}</span>
                          <button
                            onClick={() => handleEditTotal(row)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Tahrirlash
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-4 text-sm text-green-600">
                      {editingProfitId === row.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editedProfit}
                            onChange={(e) => setEditedProfit(e.target.value)}
                            className="flex-1 px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="To'langan summani kiriting..."
                          />
                          <button
                            onClick={() => handleSaveProfit(row.id, row.sale_id)}
                            disabled={updatingSale === row.id}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:bg-gray-400 transition"
                          >
                            {updatingSale === row.id ? "..." : "✓"}
                          </button>
                          <button
                            onClick={handleCancelProfitEdit}
                            disabled={updatingSale === row.id}
                            className="px-3 py-2 bg-gray-400 text-white rounded-lg text-xs hover:bg-gray-500 disabled:bg-gray-300 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{formatAmount(row.profit)}</span>
                          <button
                            onClick={() => handleEditProfit(row)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Tahrirlash
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-4 text-center">
                      {row.profit === row.total_price ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full font-bold text-lg" title="To'liq to'langan">
                          ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full font-bold text-lg" title="To'lanmagan yoki qisman to'langan">
                          ✗
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-4 text-sm">
                      {editingPaymentId === row.id ? (
                        <div className="space-y-2">
                          <select
                            value={editedPaymentMethod}
                            onChange={(e) => {
                              setEditedPaymentMethod(e.target.value);
                              if (e.target.value !== "boshqa") {
                                setCustomPaymentMethod("");
                              }
                            }}
                            className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="">Noma'lum</option>
                            <option value="Naqd">Naqd</option>
                            <option value="Nasiya">Nasiya</option>
                            <option value="cash">Naqd (cash)</option>
                            <option value="card">Karta</option>
                            <option value="mobile">Mobil</option>
                            <option value="boshqa">Boshqa</option>
                          </select>
                          {editedPaymentMethod === "boshqa" && (
                            <input
                              type="text"
                              value={customPaymentMethod}
                              onChange={(e) => setCustomPaymentMethod(e.target.value)}
                              placeholder="To'lov usulini kiriting..."
                              className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-900">{row.payment_method || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 md:px-5 py-3 md:py-4 text-sm">
                      {editingPaymentId === row.id ? (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleSavePayment(row.id, row.sale_id)}
                            disabled={updatingSale === row.id}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:bg-gray-400 transition"
                          >
                            {updatingSale === row.id ? "Saqlanmoqda..." : "Saqlash"}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updatingSale === row.id}
                            className="px-3 py-2 bg-gray-400 text-white rounded-lg text-xs hover:bg-gray-500 disabled:bg-gray-300 transition"
                          >
                            Bekor qilish
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleViewProducts(row.sale_id)}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 flex items-center gap-1 transition"
                            title="Mahsulotlarni ko'rish"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditPayment(row)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition"
                          >
                            To'lovni tahrirlash
                          </button>
                          <button
                            onClick={() => handleDeleteSale(row.id, row.sale_id)}
                            disabled={deletingSaleId === row.id}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:bg-gray-400 transition"
                          >
                            {deletingSaleId === row.id ? "O'chirilmoqda..." : "O'chirish"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 font-semibold">
                <tr>
                  <td className="px-4 md:px-5 py-3 md:py-4 text-right" colSpan={2}>
                    Jami:
                  </td>
                  <td className="px-4 md:px-5 py-3 md:py-4 text-gray-900">{formatAmount(tabTotals.totalPrice)}</td>
                  <td className="px-4 md:px-5 py-3 md:py-4 text-green-600">{formatAmount(tabTotals.totalProfit)}</td>
                  <td className="px-4 md:px-5 py-3 md:py-4" colSpan={3}>
                    {tabFilteredData.length} sotuv
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            {data.length} dan {tabFilteredData.length} sotuv ko'rsatilmoqda
          </div>
        </>
      )}

      {/* Products Modal */}
      {viewingProductsSaleId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseProductsModal}>
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 md:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Sotilgan mahsulotlar</h3>
              <button
                onClick={handleCloseProductsModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto max-h-[calc(80vh-130px)]">
              {loadingProducts ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : saleProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">Mahsulot topilmadi</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Mahsulot nomi</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Miqdor</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Tan narxi</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Sotuv narxi</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Jami</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Foyda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleProducts.map((product, index) => {
                      const total = product.sell_price * product.amount;
                      const profit = (product.sell_price - product.net_price) * product.amount;
                      return (
                        <tr key={product.id} className="border-b border-gray-200 hover:bg-blue-50 transition">
                          <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{product.product_name}</td>
                          <td className="px-4 py-3 text-gray-700">
                            {product.amount}{product.unit ? ` ${product.unit}` : ""}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{formatAmount(product.net_price)}</td>
                          <td className="px-4 py-3 text-gray-700">{formatAmount(product.sell_price)}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{formatAmount(total)}</td>
                          <td className="px-4 py-3 text-green-600 font-semibold">{formatAmount(profit)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 font-semibold">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right text-gray-900">Jami:</td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatAmount(saleProducts.reduce((sum, p) => sum + (p.sell_price * p.amount), 0))}
                      </td>
                      <td className="px-4 py-3 text-green-600">
                        {formatAmount(saleProducts.reduce((sum, p) => sum + ((p.sell_price - p.net_price) * p.amount), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                </div>
              )}
            </div>

            <div className="p-5 md:p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-wrap">
              <button
                onClick={() => {
                  const sale = data.find(s => s.sale_id === viewingProductsSaleId);
                  if (!sale) {
                    toast.error("Sotuv topilmadi");
                    return;
                  }
                  setPendingPrintSale(sale);
                  setCustomerName("");
                  setIsCustomerModalOpen(true);
                }}
                disabled={loadingProducts || saleProducts.length === 0}
                className="px-4 md:px-6 py-2 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition"
              >
                <span>🖨️</span>
                Chop etish
              </button>
              <button
                onClick={handleCloseProductsModal}
                className="px-4 md:px-6 py-2 md:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Name Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => { setIsCustomerModalOpen(false); setPendingPrintSale(null); }}>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-bold text-gray-900">Mijoz nomi</h3>
              <button
                onClick={() => { setIsCustomerModalOpen(false); setPendingPrintSale(null); }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                Ã—
              </button>
            </div>
            <div className="p-5">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Mijoz ismi..."
                className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => { setIsCustomerModalOpen(false); setPendingPrintSale(null); }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  const name = customerName.trim();
                  if (!name) {
                    toast.error("Mijoz ismini kiriting");
                    return;
                  }
                  if (!pendingPrintSale) {
                    toast.error("Sotuv topilmadi");
                    return;
                  }
                  printSaleAsInvoice(pendingPrintSale, name);
                  setIsCustomerModalOpen(false);
                  setPendingPrintSale(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Chop etish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cheque Verification Modal */}
      {isChequeVerifyOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setIsChequeVerifyOpen(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-bold text-gray-900">Chek tekshirish</h3>
              <button
                onClick={() => setIsChequeVerifyOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                Ã—
              </button>
            </div>
            <div className="p-5 space-y-3">
              <input
                type="text"
                value={chequeInput}
                onChange={(e) => setChequeInput(e.target.value)}
                placeholder="123456A"
                className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {chequeResult && (
                <div className={`text-sm font-medium ${chequeResult.ok ? "text-green-600" : "text-red-600"}`}>
                  {chequeResult.message}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsChequeVerifyOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition"
              >
                Yopish
              </button>
              <button
                onClick={() => setChequeResult(verifyChequeNumber(chequeInput))}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
              >
                Tekshirish
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
      </>
      )}
    </div>
  );
}
