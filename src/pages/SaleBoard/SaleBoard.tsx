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
import { CircularProgress, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { BarChart } from "@mui/icons-material";
import { type AppDispatch } from "../../redux/store";
import { setSales } from "../../redux/slices/sales/salesReducer";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import SalesStatistics from "./SalesStatistics";

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
}

export default function SaleBoard() {
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

  // View sale products states
  const [viewingProductsSaleId, setViewingProductsSaleId] = useState<string | null>(null);
  const [saleProducts, setSaleProducts] = useState<SoldProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // View toggle state (table or statistics)
  const [viewMode, setViewMode] = useState<"table" | "statistics">("table");

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
          sale_id: sale_id,
        },
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

  // Handle print check as PDF
  const handlePrintCheck = () => {
    if (saleProducts.length === 0) {
      toast.error("Chop etish uchun mahsulot yo'q");
      return;
    }

    const sale = data.find(s => s.sale_id === viewingProductsSaleId);
    if (!sale) return;

    try {
      const totalAmount = saleProducts.reduce((sum, p) => sum + (p.sell_price * p.amount), 0);
      const totalProfit = saleProducts.reduce((sum, p) => sum + ((p.sell_price - p.net_price) * p.amount), 0);

      // Create PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297] // Receipt width
      });

      let yPos = 10;
      const leftMargin = 5;
      const rightMargin = 75;
      const lineHeight = 5;

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SOTUV CHEKI', 40, yPos, { align: 'center' });
      yPos += lineHeight + 2;

      // Line
      doc.setLineWidth(0.3);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += lineHeight;

      // Date and time
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Sana: ${new Date(sale.sale_time).toLocaleDateString('uz-UZ')}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Vaqt: ${new Date(sale.sale_time).toLocaleTimeString('uz-UZ')}`, leftMargin, yPos);
      yPos += lineHeight;
      doc.text(`Chek №: ${sale.sale_id}`, leftMargin, yPos);
      yPos += lineHeight + 2;

      // Line
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += lineHeight;

      // Info section
      doc.setFont('helvetica', 'bold');
      doc.text('Sotuvchi:', leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(sale.admin_name || 'N/A', 30, yPos);
      yPos += lineHeight;

      const paymentText = sale.payment_method === 'cash' ? 'Naqd' : 
                         sale.payment_method === 'card' ? 'Karta' : 
                         sale.payment_method === 'mobile' ? 'Mobil' : 
                         sale.payment_method || 'N/A';
      doc.setFont('helvetica', 'bold');
      doc.text("To'lov:", leftMargin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(paymentText, 30, yPos);
      yPos += lineHeight + 2;

      // Line
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += lineHeight;

      // Products table header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Mahsulot', leftMargin, yPos);
      doc.text('Soni', 45, yPos, { align: 'center' });
      doc.text('Narxi', 57, yPos, { align: 'right' });
      doc.text('Jami', rightMargin, yPos, { align: 'right' });
      yPos += lineHeight;

      // Line
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += lineHeight;

      // Products
      doc.setFont('helvetica', 'normal');
      saleProducts.forEach((product, index) => {
        const total = product.sell_price * product.amount;
        const productName = `${index + 1}. ${product.product_name}`;
        
        // Word wrap for long product names
        const splitName = doc.splitTextToSize(productName, 35);
        doc.text(splitName, leftMargin, yPos);
        doc.text(product.amount.toString(), 45, yPos, { align: 'center' });
        doc.text(product.sell_price  as unknown as string, 57, yPos, { align: 'right' });
        doc.text(total.toFixed(2), rightMargin, yPos, { align: 'right' });
        
        yPos += lineHeight * splitName.length;
        
        // Thin line
        doc.setLineWidth(0.1);
        doc.line(leftMargin, yPos, rightMargin, yPos);
        yPos += lineHeight;
      });

      // Line before totals
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += lineHeight;

      // Totals section
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Mahsulotlar soni:', leftMargin, yPos);
      doc.text(`${saleProducts.length} ta`, rightMargin, yPos, { align: 'right' });
      yPos += lineHeight;

      doc.text('Foyda:', leftMargin, yPos);
      doc.text(`${totalProfit.toFixed(2)} so'm`, rightMargin, yPos, { align: 'right' });
      yPos += lineHeight + 2;

      // Grand total
      doc.setLineWidth(0.5);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += lineHeight;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("JAMI TO'LOV:", leftMargin, yPos);
      doc.text(`${totalAmount.toFixed(2)} so'm`, rightMargin, yPos, { align: 'right' });
      yPos += lineHeight + 3;

      // Line
      doc.setLineWidth(0.3);
      doc.line(leftMargin, yPos, rightMargin, yPos);
      yPos += lineHeight;

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Xaridingiz uchun rahmat!', 40, yPos, { align: 'center' });
      yPos += lineHeight;
      doc.text('Yana kutamiz!', 40, yPos, { align: 'center' });

      // Save PDF
      const fileName = `Chek_${sale.sale_id}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success('PDF yuklandi!');
    } catch (error) {
      console.error('PDF yaratishda xatolik:', error);
      toast.error('PDF yaratishda xatolik yuz berdi');
    }
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

  const isFilterActive = search !== "" || paymentFilter !== "all" || extraSort !== "default" || selectedAdmin !== null || dateFilter !== "all";

  const handleBackToAdmins = () => {
    setSelectedAdmin(null);
    setPaymentFilter("all");
    setExtraSort("default");
    setDateFilter("all");
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      {loading && (
        <div className="absolute top-[50%] left-[50%] translate-x-[-50%]">
          <CircularProgress size={100} />
        </div>
      )}

      {error && <div className="p-4 text-red-600 mb-4">{error}</div>}
      
      {!loading && !error && (
        <>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {selectedAdmin ? `${selectedAdmin} sotuvlari` : "Sotuvlar paneli"}
        </h2>
        <div className="flex items-center gap-3">
          {/* View Toggle Buttons */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              📊 Jadval
            </button>
            <button
              onClick={() => setViewMode("statistics")}
              className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "statistics"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              <BarChart fontSize="small" />
              Statistika
            </button>
          </div>
          {selectedAdmin && (
            <button
              onClick={handleBackToAdmins}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              ← Adminlarga qaytish
            </button>
          )}
        </div>
      </div>

      {/* Render Statistics View */}
      {viewMode === "statistics" ? (
        <SalesStatistics sales={filteredData} />
      ) : (
        <>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Admin nomini qidirish..."
          className="border px-3 py-2 rounded-md text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {selectedAdmin && (
          <>
            <select
              className="border px-3 py-2 rounded-md text-sm"
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
              className="border px-3 py-2 rounded-md text-sm"
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
              <IconButton onClick={(e) => setSortMenuAnchor(e.currentTarget)}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M10 17l5-5-5-5v10z" fill="currentColor" />
                </svg>
              </IconButton>
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
            className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition"
          >
            Filtrlarni tozalash
          </button>
        )}
      </div>

      {/* Show Admin List or Detailed Sales */}
      {!selectedAdmin ? (
        <>
          {/* Admin List View */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border text-left">Admin Nomi</th>
                  <th className="px-3 py-2 border text-left">So'nggi sotuv sanasi</th>
                  <th className="px-3 py-2 border text-left">Jami sotuvlar</th>
                  <th className="px-3 py-2 border text-left">Jami summa</th>
                  <th className="px-3 py-2 border text-left">Jami foyda</th>
                </tr>
              </thead>
              <tbody>
                {groupedByAdmin.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      Ma'lumot topilmadi
                    </td>
                  </tr>
                )}
                {groupedByAdmin.map((admin) => (
                  <tr
                    key={admin.adminName}
                    onClick={() => setSelectedAdmin(admin.adminName)}
                    className="hover:bg-blue-50 cursor-pointer transition"
                  >
                    <td className="px-3 py-2 border font-medium text-blue-600">{admin.adminName}</td>
                    <td className="px-3 py-2 border">{new Date(admin.latestDate).toLocaleString()}</td>
                    <td className="px-3 py-2 border">{admin.salesCount}</td>
                    <td className="px-3 py-2 border">{admin.totalPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 border text-green-600">{admin.totalProfit.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-gray-500">
            {groupedByAdmin.length} admin ko'rsatilmoqda
          </div>
        </>
      ) : (
        <>
          {/* Detailed Sales View */}
          <div className="flex gap-6 mb-4 text-sm font-medium">
            <div>Jami sotuvlar: {filteredData.length}</div>
            <div>Jami summa: {totals.totalPrice.toFixed(2)}</div>
            <div className="text-green-600">Jami foyda: {totals.totalProfit.toFixed(2)}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  {headers.map((h) => (
                    <th
                      key={h.key}
                      onClick={() => h.key !== 'actions' && handleSort(h.key as keyof Sale)}
                      className={`px-3 py-2 border text-left ${h.key !== 'actions' ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                    >
                      {h.label}
                      {sortKey === h.key && extraSort === "default" && (
                        <span className="ml-1">{sortOrder === "asc" ? "▲" : "▼"}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500">
                      Ma'lumot topilmadi
                    </td>
                  </tr>
                )}

                {filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 group">
                    <td className="px-3 py-2 border">{new Date(row.sale_time).toLocaleString()}</td>
                    <td className="px-3 py-2 border">
                      {editingAdminId === row.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editedAdminName}
                            onChange={(e) => setEditedAdminName(e.target.value)}
                            list="admin-names-list"
                            className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                          >
                            {updatingSale === row.id ? "..." : "✓"}
                          </button>
                          <button
                            onClick={handleCancelAdminEdit}
                            disabled={updatingSale === row.id}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 disabled:bg-gray-300"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{row.admin_name || "—"}</span>
                          <button
                            onClick={() => handleEditAdmin(row)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Tahrirlash
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 border">
                      {editingTotalId === row.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editedTotalPrice}
                            onChange={(e) => setEditedTotalPrice(e.target.value)}
                            className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Jami summani kiriting..."
                          />
                          <button
                            onClick={() => handleSaveTotal(row.id, row.sale_id)}
                            disabled={updatingSale === row.id}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                          >
                            {updatingSale === row.id ? "..." : "✓"}
                          </button>
                          <button
                            onClick={handleCancelTotalEdit}
                            disabled={updatingSale === row.id}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 disabled:bg-gray-300"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{row.total_price}</span>
                          <button
                            onClick={() => handleEditTotal(row)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Tahrirlash
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 border text-green-600">
                      {editingProfitId === row.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editedProfit}
                            onChange={(e) => setEditedProfit(e.target.value)}
                            className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="To'langan summani kiriting..."
                          />
                          <button
                            onClick={() => handleSaveProfit(row.id, row.sale_id)}
                            disabled={updatingSale === row.id}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                          >
                            {updatingSale === row.id ? "..." : "✓"}
                          </button>
                          <button
                            onClick={handleCancelProfitEdit}
                            disabled={updatingSale === row.id}
                            className="px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 disabled:bg-gray-300"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{row.profit}</span>
                          <button
                            onClick={() => handleEditProfit(row)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Tahrirlash
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 border text-center">
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
                    <td className="px-3 py-2 border">
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
                            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                            />
                          )}
                        </div>
                      ) : (
                        <span>{row.payment_method || "—"}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 border">
                      {editingPaymentId === row.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSavePayment(row.id, row.sale_id)}
                            disabled={updatingSale === row.id}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                          >
                            {updatingSale === row.id ? "Saqlanmoqda..." : "Saqlash"}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updatingSale === row.id}
                            className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 disabled:bg-gray-300"
                          >
                            Bekor qilish
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewProducts(row.sale_id)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 flex items-center gap-1"
                            title="Mahsulotlarni ko'rish"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditPayment(row)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            To'lovni tahrirlash
                          </button>
                          <button
                            onClick={() => handleDeleteSale(row.id, row.sale_id)}
                            disabled={deletingSaleId === row.id}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:bg-gray-400"
                          >
                            {deletingSaleId === row.id ? "O'chirilmoqda..." : "O'chirish"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold">
                <tr>
                  <td className="px-3 py-2 border text-right" colSpan={2}>
                    Jami:
                  </td>
                  <td className="px-3 py-2 border">{totals.totalPrice.toFixed(2)}</td>
                  <td className="px-3 py-2 border text-green-600">{totals.totalProfit.toFixed(2)}</td>
                  <td className="px-3 py-2 border" colSpan={3}>
                    {filteredData.length} sotuv
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            {data.length} dan {filteredData.length} sotuv ko'rsatilmoqda
          </div>
        </>
      )}

      {/* Products Modal */}
      {viewingProductsSaleId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseProductsModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold">Sotilgan mahsulotlar</h3>
              <button
                onClick={handleCloseProductsModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              {loadingProducts ? (
                <div className="flex justify-center py-8">
                  <CircularProgress size={40} />
                </div>
              ) : saleProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Mahsulot topilmadi
                </div>
              ) : (
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 border text-left">#</th>
                      <th className="px-3 py-2 border text-left">Mahsulot nomi</th>
                      <th className="px-3 py-2 border text-left">Miqdor</th>
                      <th className="px-3 py-2 border text-left">Tan narxi</th>
                      <th className="px-3 py-2 border text-left">Sotuv narxi</th>
                      <th className="px-3 py-2 border text-left">Jami</th>
                      <th className="px-3 py-2 border text-left">Foyda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleProducts.map((product, index) => {
                      const total = product.sell_price * product.amount;
                      const profit = (product.sell_price - product.net_price) * product.amount;
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border">{index + 1}</td>
                          <td className="px-3 py-2 border font-medium">{product.product_name}</td>
                          <td className="px-3 py-2 border">{product.amount}</td>
                          <td className="px-3 py-2 border">{product.net_price}</td>
                          <td className="px-3 py-2 border">{product.sell_price}</td>
                          <td className="px-3 py-2 border font-semibold">{total.toFixed(2)}</td>
                          <td className="px-3 py-2 border text-green-600 font-semibold">{profit.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 font-semibold">
                    <tr>
                      <td colSpan={5} className="px-3 py-2 border text-right">Jami:</td>
                      <td className="px-3 py-2 border">
                        {saleProducts.reduce((sum, p) => sum + (p.sell_price * p.amount), 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 border text-green-600">
                        {saleProducts.reduce((sum, p) => sum + ((p.sell_price - p.net_price) * p.amount), 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={handlePrintCheck}
                disabled={loadingProducts || saleProducts.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>🖨️</span>
                Chop etish
              </button>
              <button
                onClick={handleCloseProductsModal}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Yopish
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