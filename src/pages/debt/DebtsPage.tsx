// pages/DebtManagement.tsx
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  accessTokenFromStore,
  getshopidfromstrore,
  getBranchesFromStore,
  getIsSuperUserFromStore,
  getAuthFromStore,
} from "../../redux/selectors";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { toast } from "react-toastify";
import { Search, Plus, Edit2, Trash2, Check, X, DollarSign, Eye, ArrowUpDown, ChevronUp, ChevronDown, Filter, Download, Folder, User, ChevronRight } from "lucide-react";
import type { Admin } from "../../../types/types";

/* ================= TYPES ================= */

interface Debt {
  id: string;
  day: number;
  month: number;
  year: number;
  name: string;
  amount: number;
  product_names: string | string[];
  branch_id: number;
  shop_id: number;
  admin_id: string;
  isreturned: boolean;
}

interface DebtStatistics {
  total_debts: string;
  unreturned_count: string;
  returned_count: string;
  total_amount: string;
  unreturned_amount: string;
  returned_amount: string;
  given_debts_count?: string;
  given_debts_amount?: string;
  taken_debts_count?: string;
  taken_debts_amount?: string;
}

type SortKey = "date" | "name" | "amount" | "isreturned";
type SortDirection = "asc" | "desc";


interface DebtorSummary {
  name: string;
  totalDebts: number;
  totalAmount: number;
  unreturnedAmount: number;
  returnedAmount: number;
  debts: Debt[];
}

// Add this interface for product entries
interface ProductEntry {
  id: string;
  name: string;
  quantity: number;
  price: number;
  totalPaid: number;
}

/* ================= COMPONENT ================= */

export default function DebtManagement() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DebtStatistics | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showDebtDetail, setShowDebtDetail] = useState(false);

  // NEW: View Mode
  const [viewMode, setViewMode] = useState<"list" | "folders" | "statistics">("folders");
  const [selectedDebtor, setSelectedDebtor] = useState<string | null>(null);
  const [debtTypeFilter, setDebtTypeFilter] = useState<"all" | "given" | "taken">("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);

  // Filters
  const [searchName, setSearchName] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "returned" | "unreturned">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterByDateRange, setFilterByDateRange] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // NEW: Autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debtorNameInput, setDebtorNameInput] = useState("");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const isSuperAdmin = useSelector(getIsSuperUserFromStore);
  const authData = useSelector(getAuthFromStore);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    amount: string;
    product_names: string[];
    branch_id: number;
  }>({
    name: "",
    amount: "0",
    product_names: [],
    branch_id: isSuperAdmin ? 1 : (authData.user as unknown as Admin).branch,
  });

  // Replace selectedProducts state with:
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([]);
  const [currentProduct, setCurrentProduct] = useState<ProductEntry>({
    id: Date.now().toString(),
    name: "",
    quantity: 1,
    price: 0,
    totalPaid: 0,
  });

  const token = useSelector(accessTokenFromStore);
  const shop_id = useSelector(getshopidfromstrore);
  const branches = useSelector(getBranchesFromStore);

  /* ================= FETCH DEBTS ================= */

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.all}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
        },
        body: JSON.stringify({ shop_id }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch debts");
      }

      const json = await res.json();
      setDebts(json.data || []);
      toast.success(`${json.data?.length || 0} ta qarz yuklandi`);
    } catch (err) {
      console.error(err);
      toast.error("Qarzlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.statistics}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
        },
        body: JSON.stringify({ shop_id }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const json = await res.json();
      setStatistics(json.data);
    } catch (err) {
      console.error(err);
      toast.error("Statistikani yuklashda xatolik");
    }
  };

  const fetchUnreturnedDebts = async () => {
    try {
      const toastId = toast.loading("📋 Qaytarilmagan qarzlar yuklanmoqda...");
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.unreturned}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
        },
        body: JSON.stringify({ shop_id }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch unreturned debts");
      }

      const json = await res.json();
      setDebts(json.data || []);
      toast.update(toastId, {
        render: `✅ ${json.data?.length || 0} ta qaytarilmagan qarz yuklandi`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Qaytarilmagan qarzlarni yuklashda xatolik");
    }
  };

  const fetchDebtsByBranch = async (branchId: string) => {
    try {
      const toastId = toast.loading("🏢 Filial qarzlari yuklanmoqda...");
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.byBranch}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
          branch_id: branchId,
        },
        body: JSON.stringify({ shop_id }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch branch debts");
      }

      const json = await res.json();
      setDebts(json.data || []);
      toast.update(toastId, {
        render: `✅ Ushbu filial uchun ${json.data?.length || 0} ta qarz yuklandi`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Filial qarzlarini yuklashda xatolik");
    }
  };

  const fetchDebtsByCustomer = async (customerName: string) => {
    if (!customerName.trim()) {
      fetchDebts();
      return;
    }

    try {
      const toastId = toast.loading("🔍 Qarzlar qidirilmoqda...");
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.byCustomer}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
        },
        body: JSON.stringify({ name: customerName, shop_id }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch customer debts");
      }

      const json = await res.json();
      setDebts(json.data || []);
      toast.update(toastId, {
        render: `✅ "${customerName}" uchun ${json.data?.length || 0} ta qarz topildi`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Mijoz qarzlarini yuklashda xatolik");
    }
  };

  const fetchDebtById = async (debtId: string) => {
    try {
      const toastId = toast.loading("📄 Qarz ma'lumotlari yuklanmoqda...");
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.byId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
        },
        body: JSON.stringify({ id: debtId }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch debt");
      }

      const json = await res.json();
      setSelectedDebt(json.data);
      setShowDebtDetail(true);
      toast.update(toastId, {
        render: "✅ Qarz ma'lumotlari yuklandi",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Qarz ma'lumotlarini yuklashda xatolik");
    }
  };

  useEffect(() => {
    if (token && shop_id) {
      fetchDebts();
      fetchStatistics();
    }
  }, [token, shop_id]);

  /* ================= PRODUCT HELPERS (UPDATED) ================= */

  const calculateTotalFromProducts = (entries: ProductEntry[]) => {
    return entries.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  const formatProductsToString = (entries: ProductEntry[]): string => {
    return entries
      .map((p) => `${p.name}*${p.quantity}*${p.price}*${p.totalPaid}`)
      .join("|");
  };

  const formatProductsToArray = (entries: ProductEntry[]): string[] => {
    return entries.map((p) => `${p.name}*${p.quantity}*${p.price}*${p.totalPaid}`);
  };

  const normalizeProductNames = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((v) => typeof v === "string" && v.trim() !== "");
    }
    if (typeof value === "string") {
      if (value.trim() === "") return [];
      return value
        .split("|")
        .map((v) => v.trim())
        .filter((v) => v !== "");
    }
    return [];
  };

  const parseProductsFromString = (productString: string | string[] | undefined | null | any): ProductEntry[] => {
    if (!productString) return [];
    
    try {
      const items = normalizeProductNames(productString);
      if (items.length === 0) return [];

      return items.map((item, index) => {
        const [name, quantity, price, totalPaid] = item.split("*");
        return {
          id: `${index}-${Date.now()}`,
          name: name || "",
          quantity: parseInt(quantity) || 1,
          price: parseFloat(price) || 0,
          totalPaid: parseFloat(totalPaid) || 0,
        };
      });
    } catch (error) {
      console.error("Error parsing products:", error);
      return [];
    }
  };

  const formatProductsForDisplay = (productString: string | string[] | undefined | null | any): string => {
    if (!productString) return "";
    
    try {
      const items = normalizeProductNames(productString);
      if (items.length === 0) return "";

      return items
        .map((item) => {
          const parts = item.split("*");
          const name = parts[0] || "";
          const quantity = parts[1] || "";
          return `${name}${quantity ? ` (${quantity} dona)` : ""}`;
        })
        .filter((item) => item.trim() !== "")
        .join(", ");
    } catch (error) {
      console.error("Error formatting products:", error);
      return "";
    }
  };

  const addProductEntry = () => {
    if (!currentProduct.name || currentProduct.quantity < 1 || currentProduct.price < 0) {
      toast.error("Barcha mahsulot maydonlarini to'ldiring");
      return;
    }

    setProductEntries([...productEntries, currentProduct]);
    setCurrentProduct({
      id: Date.now().toString(),
      name: "",
      quantity: 1,
      price: 0,
      totalPaid: 0,
    });

    const total = calculateTotalFromProducts([...productEntries, currentProduct]);
    setFormData((prev) => ({ ...prev, amount: total.toString() }));
  };

 

  const removeProductEntry = (id: string) => {
    const updated = productEntries.filter((p) => p.id !== id);
    setProductEntries(updated);

    const total = calculateTotalFromProducts(updated);
    setFormData((prev) => ({ ...prev, amount: total.toString() }));
  };

  const clearAllProducts = () => {
    setProductEntries([]);
    setFormData((prev) => ({ ...prev, amount: "0" }));
  };

  /* ================= CRUD OPERATIONS (UPDATED) ================= */

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || productEntries.length === 0) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }

    try {
      const toastId = toast.loading("💾 Qarz yaratilmoqda...");
      const productNamesArray = formatProductsToArray(productEntries);
      const totalAmount = calculateTotalFromProducts(productEntries);

      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.create}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
        },
        body: JSON.stringify({
          name: formData.name,
          amount: totalAmount,
          product_names: productNamesArray,
          branch_id: typeof formData.branch_id === 'string' ? parseInt(formData.branch_id) : formData.branch_id,
          shop_id,
          admin_id: "admin-uuid",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create debt");
      }

      const json = await res.json();
      setDebts([json.data, ...debts]);
      setShowCreateModal(false);
      setFormData({ 
        name: "", 
        amount: "0", 
        product_names: [], 
        branch_id: isSuperAdmin ? 1 : (authData.user as unknown as Admin).branch, 
      });
      setProductEntries([]);
      setCurrentProduct({
        id: Date.now().toString(),
        name: "",
        quantity: 1,
        price: 0,
        totalPaid: 0,
      });
      setDebtorNameInput("");
      setShowSuggestions(false);
      toast.update(toastId, {
        render: `✅ ${json.data.name} uchun qarz yaratildi`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchStatistics();
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Qarz yaratishda xatolik: ${err.message}`);
    }
  };

  const handleUpdateDebt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDebt) return;

    try {
      const toastId = toast.loading("✏️ Qarz yangilanmoqda...");
      
      // If editing with new products, format them; otherwise keep original format
      const productString = productEntries.length > 0 
        ? formatProductsToArray(productEntries)
        : normalizeProductNames(editingDebt.product_names);

      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.update}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
        },
        body: JSON.stringify({
          id: editingDebt.id,
          name: formData.name,
          amount: productEntries.length > 0 
            ? calculateTotalFromProducts(productEntries)
            : parseFloat(formData.amount),
          product_names: productString,
          branch_id: formData.branch_id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update debt");
      }

      const json = await res.json();
      setDebts(debts.map((d) => (d.id === json.data.id ? json.data : d)));
      setShowEditModal(false);
      setEditingDebt(null);
      setProductEntries([]);
      setFormData({ 
        name: "", 
        amount: "0", 
        product_names: [], 
        branch_id: isSuperAdmin ? 1 : (authData.user as unknown as Admin).branch, 
      });
      toast.update(toastId, {
        render: "✅ Qarz muvaffaqiyatli yangilandi",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchStatistics();
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Qarzni yangilashda xatolik: ${err.message}`);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!window.confirm("Haqiqatan ham bu qarzni o'chirmoqchimisiz?")) {
      return;
    }

    try {
      const toastId = toast.loading("🗑️ Qarz o'chirilmoqda...");
      
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.delete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
          id: debtId,
        },
        body: JSON.stringify({ id: debtId }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete debt");
      }

      setDebts(debts.filter((d) => d.id !== debtId));
      toast.update(toastId, {
        render: "✅ Qarz muvaffaqiyatli o'chirildi",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchStatistics();
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Qarzni o'chirishda xatolik: ${err.message}`);
    }
  };

  const openEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    
    // Parse the product string to show in edit modal
    const parsedProducts = parseProductsFromString(debt.product_names);
    setProductEntries(parsedProducts);
    
    setFormData({
      name: debt.name,
      amount: debt.amount.toString(),
      product_names: [],
      branch_id: debt.branch_id,
    });
    setShowEditModal(true);
  };

  /* ================= HELPERS ================= */

  // NEW: Get unique debtors
  const getUniqueDebtors = useMemo((): DebtorSummary[] => {
    const debtorMap = new Map<string, DebtorSummary>();

    // Filter debts by debtTypeFilter first
    let filteredDebts = debts;
    if (debtTypeFilter === "given") {
      filteredDebts = debts.filter((d) => d.branch_id === 0);
    } else if (debtTypeFilter === "taken") {
      filteredDebts = debts.filter((d) => d.branch_id === 1);
    }

    filteredDebts.forEach((debt) => {
      const normalizedName = debt.name.trim().toLowerCase();
      if (!debtorMap.has(normalizedName)) {
        debtorMap.set(normalizedName, {
          name: debt.name,
          totalDebts: 0,
          totalAmount: 0,
          unreturnedAmount: 0,
          returnedAmount: 0,
          debts: [],
        });
      }

      const summary = debtorMap.get(normalizedName)!;
      summary.totalDebts++;
      summary.totalAmount += debt.amount;
      if (debt.isreturned) {
        summary.returnedAmount += debt.amount;
      } else {
        summary.unreturnedAmount += debt.amount;
      }
      summary.debts.push(debt);
    });

    return Array.from(debtorMap.values()).sort((a, b) => 
      b.unreturnedAmount - a.unreturnedAmount
    );
  }, [debts, debtTypeFilter]);

  // NEW: Filter debtors for autocomplete
  const filteredDebtorSuggestions = useMemo(() => {
    if (!debtorNameInput.trim()) return [];
    
    const input = debtorNameInput.toLowerCase();
    return getUniqueDebtors
      .filter((debtor) => debtor.name.toLowerCase().includes(input))
      .slice(0, 5);
  }, [debtorNameInput, getUniqueDebtors]);

  const formatDate = (d: Debt) => `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;

  const getTimestamp = (d: Debt) => new Date(formatDate(d)).getTime();

  const getBranchName = (branchId: number) => {
    const branch = branches.branches?.find((b: { id: number; }) => b.id === branchId);
    return branch?.name || "Unknown";
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown size={16} className="opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const formatDateForComparison = (d: Debt) => {
    const dateStr = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
    return new Date(dateStr);
  };

  const isDateInRange = (debt: Debt): boolean => {
    if (!filterByDateRange || !filterStartDate || !filterEndDate) return true;

    const debtDate = formatDateForComparison(debt);
    const startDate = new Date(filterStartDate);
    const endDate = new Date(filterEndDate);

    return debtDate >= startDate && debtDate <= endDate;
  };

  const exportToCSV = () => {
    try {
      const headers = ["Sana", "Mijoz", "Mahsulotlar", "Summa", "Filial", "Holat"];
      const rows = filteredAndSorted.map((debt) => [
        formatDate(debt),
        debt.name,
        debt.product_names,
        debt.amount,
        getBranchName(debt.branch_id),
        debt.isreturned ? "Qaytarilgan" : "Kutilmoqda",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qarzlar_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("✅ Qarzlar CSV formatida yuklandi");
    } catch (err) {
      console.error(err);
      toast.error("Qarzlarni eksport qilishda xatolik");
    }
  };

  // NEW: Print individual debt
  const printDebt = (debt: Debt) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Накладная #${debt.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
          .header { margin-bottom: 20px; }
          .header-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          .info-section { margin-bottom: 15px; font-size: 12px; line-height: 1.6; }
          .info-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
          th { border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold; background: #f5f5f5; }
          td { border: 1px solid #000; padding: 8px; }
          .total-section { margin-top: 20px; text-align: right; font-size: 12px; }
          .total-row { font-weight: bold; font-size: 14px; margin-top: 10px; }
          .signature-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 11px; }
          .signature-line { text-align: center; }
          .signature-blank { margin-bottom: 30px; border-bottom: 1px solid #000; height: 30px; }
          button { margin-top: 20px; padding: 10px 20px; background: #4F46E5; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-title">НАКЛАДНАЯ № ${debt.id}  ${formatDate(debt)}</div>
        </div>

        <div class="info-section">
          <p><span class="info-label">Поставщик:</span> HC COMPANY</p>
          <p>г. Москва, рынок «Фуд Сити»</p>
          <p>Торговая точка: ${debt.shop_id || '___'}</p>
          <p>Тел: 8-915-016-16-15, 8-916-576-07-07</p>
          <p><span class="info-label">Возврат товара в течение 14 дней</span></p>
        </div>

        <div class="info-section">
          <p><span class="info-label">Покупатель:</span> ${debt.name}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">№</th>
              <th style="width: 40%;">Наименование товара</th>
              <th style="width: 15%;">Количество</th>
              <th style="width: 20%;">Цена за единицу</th>
              <th style="width: 20%;">Сумма</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td>${formatProductsForDisplay(debt.product_names)}</td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">${debt.amount.toLocaleString()}</td>
              <td style="text-align: right;">${debt.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-row">
            ИТОГО: ${debt.amount.toLocaleString()} ?
          </div>
          <div style="margin-top: 10px;">
            <span class="info-label">Статус:</span> ${debt.isreturned ? 'Оплачено' : 'Ожидается'}
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-line">
            <div class="signature-blank"></div>
            <p>Поставщик (подпись)</p>
          </div>
          <div class="signature-line">
            <div class="signature-blank"></div>
            <p>Покупатель (подпись)</p>
          </div>
        </div>

        <button onclick="window.print()">Печать</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // NEW: Print all debts
  const printAllDebts = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalAmount = filteredAndSorted.reduce((sum, d) => sum + d.amount, 0);
    const returnedAmount = filteredAndSorted.filter(d => d.isreturned).reduce((sum, d) => sum + d.amount, 0);
    const unreturnedAmount = filteredAndSorted.filter(d => !d.isreturned).reduce((sum, d) => sum + d.amount, 0);

    const debtsHTML = filteredAndSorted.map((debt, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${formatDate(debt)}</td>
          <td>${debt.name}</td>
          <td>${debt.amount.toLocaleString()}</td>
          <td><span class="status ${debt.isreturned ? 'returned' : 'pending'}">
            ${debt.isreturned ? '✓ Qaytarilgan' : '⏳ Kutilmoqda'}
          </span></td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcha Qarzlar Hisoboti</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f0f0f0; font-weight: bold; }
          tr:hover { background: #f9f9f9; }
          .total-row { background: #e3f2fd; font-weight: bold; font-size: 16px; }
          .status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
          .status.returned { background: #d4edda; color: #155724; }
          .status.pending { background: #f8d7da; color: #721c24; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Barcha Qarzlar Hisoboti</h1>
          <p>Yaratilgan vaqt: ${new Date().toLocaleString()}</p>
          <p>Jami Yozuvlar: ${filteredAndSorted.length}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Sana</th>
              <th>Mijoz</th>
              <th>Summa</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            ${debtsHTML}
            <tr class="total-row">
              <td colspan="3">JAMI</td>
              <td>${totalAmount.toLocaleString()} ?</td>
              <td></td>
            </tr>
            <tr class="total-row">
              <td colspan="3">Qaytarilgan</td>
              <td>${returnedAmount.toLocaleString()} ?</td>
              <td></td>
            </tr>
            <tr class="total-row">
              <td colspan="3">Qaytarilmagan</td>
              <td>${unreturnedAmount.toLocaleString()} ?</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Debt Management System</p>
        </div>

        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // NEW: Print by debtors (grouped)
  const printByDebtors = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const debtors = getUniqueDebtors;
    const filteredDebtors = debtTypeFilter === "all" 
      ? debtors 
      : debtTypeFilter === "given" 
      ? debtors.filter(d => d.debts.some(debt => debt.branch_id !== 1))
      : debtors.filter(d => d.debts.some(debt => debt.branch_id === 1));

    const debtorsHTML = filteredDebtors.map((debtor) => {
      const relevantDebts = debtTypeFilter === "all"
        ? debtor.debts
        : debtTypeFilter === "given"
        ? debtor.debts.filter(d => d.branch_id !== 1)
        : debtor.debts.filter(d => d.branch_id === 1);

      const debtsRows = relevantDebts.map((debt, idx) => {
        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${formatDate(debt)}</td>
            <td>${debt.amount.toLocaleString()}</td>
            <td><span class="status ${debt.isreturned ? 'returned' : 'pending'}">
              ${debt.isreturned ? '✓ Returned' : '⏳ Pending'}
            </span></td>
          </tr>
        `;
      }).join("");

      const debtorTotal = relevantDebts.reduce((sum, d) => sum + d.amount, 0);
      const debtorReturned = relevantDebts.filter(d => d.isreturned).reduce((sum, d) => sum + d.amount, 0);

      return `
        <div class="debtor-section">
          <div class="debtor-header">
            <div class="debtor-info">
              <div class="debtor-avatar">${debtor.name.charAt(0).toUpperCase()}</div>
              <div>
                <h3>${debtor.name}</h3>
                <p class="debtor-meta">${relevantDebts.length} qarz</p>
              </div>
            </div>
            <div class="debtor-summary">
              <div class="summary-item">
                <span class="label">Jami:</span>
                <span class="value">${debtorTotal.toLocaleString()} ?</span>
              </div>
              <div class="summary-item">
                <span class="label">Qaytarilgan:</span>
                <span class="value paid">${debtorReturned.toLocaleString()} ?</span>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Sana</th>
                <th>Summa</th>
                <th>To'langan</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              ${debtsRows}
            </tbody>
          </table>
        </div>
      `;
    }).join("");

    const grandTotal = filteredDebtors.reduce((sum, d) => sum + d.totalAmount, 0);
    const grandPaid = filteredDebtors.reduce((sum, d) => {
      const relevantDebts = debtTypeFilter === "all"
        ? d.debts
        : debtTypeFilter === "given"
        ? d.debts.filter(debt => debt.branch_id !== 1)
        : d.debts.filter(debt => debt.branch_id === 1);
      return sum + relevantDebts.filter(debt => debt.isreturned).reduce((s, debt) => s + debt.amount, 0);
    }, 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Qarzdorlar Bo'yicha Hisobot</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .debtor-section { margin-bottom: 30px; page-break-inside: avoid; border: 2px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
          .debtor-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
          .debtor-info { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
          .debtor-avatar { width: 50px; height: 50px; background: white; color: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; }
          .debtor-info h3 { margin: 0; font-size: 24px; }
          .debtor-meta { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
          .debtor-summary { display: flex; gap: 20px; }
          .summary-item { flex: 1; }
          .summary-item .label { display: block; font-size: 12px; opacity: 0.8; margin-bottom: 5px; }
          .summary-item .value { display: block; font-size: 18px; font-weight: bold; }
          .products { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 14px; }
          .status.returned { background: #d4edda; color: #155724; }
          .status.pending { background: #f8d7da; color: #721c24; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Qarzdorlar Bo'yicha Hisobot</h1>
          <p>Tur: ${debtTypeFilter === "given" ? "Berilgan Nasiya" : debtTypeFilter === "taken" ? "Nasiyam" : "Barcha Qarzlar"}</p>
          <p>Yaratilgan vaqt: ${new Date().toLocaleString()}</p>
          <p>Jami Qarzdorlar: ${filteredDebtors.length}</p>
        </div>
        
        ${debtorsHTML}

        <div class="grand-total">
          <h3>📈 Umumiy Jami</h3>
          <div class="grand-total-grid">
            <div class="grand-total-item">
              <span class="label">Jami Summa</span>
              <span class="value">${grandTotal.toLocaleString()}?</span>
            </div>
            <div class="grand-total-item">
              <span class="label">Jami To'langan</span>
              <span class="value" style="color: #28a745;">${grandPaid.toLocaleString()}?</span>
            </div>
          </div>
        </div>

        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  /* ================= FILTER + SORT ================= */

  const filteredAndSorted = useMemo(() => {
    let list = [...debts];

    // Filter by debt type using branch_id
    if (debtTypeFilter === "given") {
      list = list.filter((d) => d.branch_id === 0);
    } else if (debtTypeFilter === "taken") {
      list = list.filter((d) => d.branch_id === 1);
    }

    // If a debtor is selected in folder view, filter to their debts only
    if (selectedDebtor) {
      list = list.filter((d) => d.name.toLowerCase() === selectedDebtor.toLowerCase());
    }

    if (searchName) {
      list = list.filter((d) => d.name.toLowerCase().includes(searchName.toLowerCase()));
    }

    if (filterBranch) {
      list = list.filter((d) => d.branch_id === parseInt(filterBranch));
    }

    if (filterStatus === "returned") {
      list = list.filter((d) => d.isreturned);
    } else if (filterStatus === "unreturned") {
      list = list.filter((d) => !d.isreturned);
    }

    if (filterByDateRange) {
      list = list.filter((d) => isDateInRange(d));
    }

    list.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortKey) {
        case "date":
          return (getTimestamp(a) - getTimestamp(b)) * dir;
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "amount":
          return (a.amount - b.amount) * dir;
        case "isreturned":
          return (Number(a.isreturned) - Number(b.isreturned)) * dir;
        default:
          return 0;
      }
    });

    return list;
  }, [debts, debtTypeFilter, selectedDebtor, searchName, filterBranch, filterStatus, sortKey, sortDirection, filterByDateRange, filterStartDate, filterEndDate]);

  const totals = useMemo(() => {
    return filteredAndSorted.reduce(
      (acc, debt) => {
        acc.total += debt.amount;
        if (!debt.isreturned) {
          acc.unreturned += debt.amount;
        } else {
          acc.returned += debt.amount;
        }
        return acc;
      },
      { total: 0, unreturned: 0, returned: 0 }
    );
  }, [filteredAndSorted]);

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Qarzlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
      {/* Header */}
      <header className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Qarz Boshqaruvi</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">Mijozlar qarzlarini kuzatish va boshqarish</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus size={20} /> Yangi Qarz
        </button>
      </header>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">Ko'rinish Rejimi</h3>
          <div className="flex gap-2 w-full md:w-auto flex-wrap">
            <button
              onClick={() => {
                setViewMode("folders");
                setSelectedDebtor(null);
                setDebtTypeFilter("all");
              }}
              className={`flex-1 md:flex-none px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm md:text-base ${
                viewMode === "folders"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Folder size={18} /> Qarzdorlar
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                setSelectedDebtor(null);
              }}
              className={`flex-1 md:flex-none px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm md:text-base ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <DollarSign size={18} /> Barcha Qarzlar
            </button>
            <button
              onClick={() => {
                setViewMode("statistics");
                setSelectedDebtor(null);
              }}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                viewMode === "statistics"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📊 Statistika
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center mb-4">
          {/* Search */}
          <div className="flex-1 min-w-full sm:min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Mijoz nomi bo'yicha qidirish..."
                value={searchName}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchName(value);
                  if (value.length > 2) {
                    fetchDebtsByCustomer(value);
                  } else if (value.length === 0) {
                    fetchDebts();
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Branch Filter */}
          <select
            value={filterBranch}
            onChange={(e) => {
              setFilterBranch(e.target.value);
              if (e.target.value) {
                fetchDebtsByBranch(e.target.value);
              } else {
                fetchDebts();
              }
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="">Barcha Filiallar</option>
            {branches.branches?.map((branch) => (
              <option key={String(branch.id)} value={branch.id}>
                {branch.name || "Unknown"}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="all">Barcha Holatlar</option>
            <option value="unreturned">Faqat Qaytarilmagan</option>
            <option value="returned">Faqat Qaytarilgan</option>
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Filter size={18} /> Qo'shimcha
          </button>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Download size={18} /> Yuklash
          </button>

          {/* Print Button */}
          <button
            onClick={printAllDebts}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-purple-300 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            🖨️ Barchasini Chop Etish
          </button>

          {/* Print by Debtors Button */}
          <button
            onClick={printByDebtors}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            👥 Qarzdorlar Bo'yicha Chop Etish
          </button>

          {/* Quick Filter Buttons */}
          <button
            onClick={() => {
              setFilterStatus("unreturned");
              fetchUnreturnedDebts();
            }}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium text-sm"
          >
            Qaytarilmagan
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Qo'shimcha Filtrlar</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish Sanasi</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tugash Sanasi</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterByDateRange}
                    onChange={(e) => setFilterByDateRange(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Oraliq bo'yicha Filtrlash</span>
                </label>
                <button
                  onClick={() => {
                    setFilterByDateRange(false);
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                  className="ml-auto px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Tozalash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtered Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
          <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">Yozuvlar</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">{filteredAndSorted.length}</p>
          </div>
          <div className="p-3 md:p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">Jami Summa</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-900">{totals.total.toLocaleString()}</p>
          </div>
          <div className="p-3 md:p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">Qaytarilmagan</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900">{totals.unreturned.toLocaleString()}</p>
          </div>
          <div className="p-3 md:p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">Qaytarilgan</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-900">{totals.returned.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* STATISTICS VIEW */}
      {viewMode === "statistics" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6">📊 Qarz Statistikasi Ko'rinishi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Given Debts (Berilgan Nasiya) */}
              <div className="border-2 border-blue-200 rounded-lg p-4 sm:p-5 md:p-6 bg-blue-50">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  💰 Berilgan Nasiya
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-blue-200">
                    <span className="text-gray-700">Jami Soni:</span>
                    <span className="font-bold text-blue-900">{debts.filter(d => d.branch_id === 0).length}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-blue-200">
                    <span className="text-gray-700">Jami Summa:</span>
                    <span className="font-bold text-blue-900">
                      {debts.filter(d => d.branch_id === 0).reduce((sum, d) => sum + d.amount, 0).toLocaleString()}?
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-blue-200">
                    <span className="text-gray-700">To'langan Summa:</span>
                    <span className="font-bold text-green-700">
                      {debts.filter(d => d.branch_id === 0 && d.isreturned).reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ?
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Qaytarilmagan:</span>
                    <span className="font-bold text-red-700">
                      {debts.filter(d => (d.branch_id === 0) && !d.isreturned).length}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Qaytarilgan:</span>
                    <span className="font-bold text-green-700">
                      {debts.filter(d => (d.branch_id === 0) && d.isreturned).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* My Debts (Nasiyam) */}
              <div className="border-2 border-red-200 rounded-lg p-4 sm:p-5 md:p-6 bg-red-50">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  💳 Nasiyam
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-red-200">
                    <span className="text-gray-700">Jami Soni:</span>
                    <span className="font-bold text-red-900">{debts.filter(d => d.branch_id === 1).length}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-red-200">
                    <span className="text-gray-700">Jami Summa:</span>
                    <span className="font-bold text-red-900">
                      {debts.filter(d => d.branch_id === 1).reduce((sum, d) => sum + d.amount, 0).toLocaleString()}?
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-red-200">
                    <span className="text-gray-700">To'langan Summa:</span>
                    <span className="font-bold text-green-700">
                      {debts.filter(d => d.branch_id === 1 && d.isreturned).reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ?
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Qaytarilmagan:</span>
                    <span className="font-bold text-red-700">
                      {debts.filter(d => (d.branch_id === 1) && !d.isreturned).length}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Qaytarilgan:</span>
                    <span className="font-bold text-green-700">
                      {debts.filter(d => (d.branch_id === 1) && d.isreturned).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Summary */}
            <div className="mt-4 md:mt-6 border-2 border-purple-200 rounded-lg p-4 sm:p-5 md:p-6 bg-purple-50">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-purple-900 mb-4">📈 Umumiy Xulosala</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Jami Qarzlar</p>
                  <p className="text-2xl font-bold text-purple-900">{debts.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Jami Summa</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {debts.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Net Position */}
            <div className="mt-4 md:mt-6 border-2 border-gray-300 rounded-lg p-4 sm:p-5 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4">⚖️ Sof Pozitsiya</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Men Olishim Kerak:</span>
                  <span className="font-bold text-green-700 text-lg">
                    +{debts.filter(d => d.branch_id === 0 && !d.isreturned).reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ?
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Men To'lashim Kerak:</span>
                  <span className="font-bold text-red-700 text-lg">
                    -{debts.filter(d => d.branch_id === 1 && !d.isreturned).reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ?
                  </span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-300 mt-3">
                  <span className="font-bold text-gray-900 text-lg">Sof Balans:</span>
                  <span className={`font-bold text-xl ${
                    (debts.filter(d => d.branch_id === 0 && !d.isreturned).reduce((sum, d) => sum + d.amount, 0) -
                    debts.filter(d => d.branch_id === 1 && !d.isreturned).reduce((sum, d) => sum + d.amount, 0)) >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}>
                    {(debts.filter(d => d.branch_id === 0 && !d.isreturned).reduce((sum, d) => sum + d.amount, 0) -
                    debts.filter(d => d.branch_id === 1 && !d.isreturned).reduce((sum, d) => sum + d.amount, 0)).toLocaleString()} ?
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEBTORS FOLDER VIEW */}
      {viewMode === "folders" && !selectedDebtor && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Folder className="text-blue-600" size={24} />
              Qarzdorlar ({getUniqueDebtors.length})
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Qarzlarini ko'rish uchun qarzdorga bosing</p>
          </div>

          <div className="divide-y divide-gray-200">
            {getUniqueDebtors.length === 0 ? (
              <div className="p-8 sm:p-10 md:p-12 text-center">
                <User size={48} className="text-gray-300 mb-4 mx-auto" />
                <p className="text-base sm:text-lg md:text-xl font-medium text-gray-900">Qarzdorlar topilmadi</p>
                <p className="text-sm md:text-base text-gray-500 mt-1">Yangi qarz qo'shishdan boshlang</p>
              </div>
            ) : (
              getUniqueDebtors.map((debtor) => (
                <div
                  key={debtor.name}
                  onClick={() => {
                    setSelectedDebtor(debtor.name);
                    setViewMode("list");
                  }}
                  className="p-4 sm:p-5 md:p-6 hover:bg-blue-50 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-3 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg md:text-xl">
                        {debtor.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
                          {debtor.name}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-gray-600">
                          {debtor.totalDebts} qarz
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                      
                      <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition flex-shrink-0" size={24} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DEBTS TABLE/LIST VIEW */}
      {(viewMode === "list" || selectedDebtor) && (
        <>
          {selectedDebtor && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg">
                  {selectedDebtor.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs sm:text-sm md:text-base font-medium text-blue-700">Qarzlari ko'rsatilmoqda:</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-blue-900">{selectedDebtor}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDebtor(null)}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium flex items-center justify-center gap-2"
              >
                <X size={18} /> Filtrni Tozalash
              </button>
            </div>
          )}
          
          {/* Mobile/Tablet Card View */}
          <div className="block xl:hidden space-y-3">
            {filteredAndSorted.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <DollarSign size={48} className="text-gray-300 mb-4 mx-auto" />
                <p className="text-lg font-medium text-gray-900">Qarzlar topilmadi</p>
                <p className="text-sm text-gray-500 mt-1">
                  {debts.length === 0 ? "Yangi qarz qo'shishdan boshlang" : "Filtrlarni sozlashga harakat qiling"}
                </p>
              </div>
            ) : (
              filteredAndSorted.map((debt) => (
                <div
                  key={debt.id}
                  className={`bg-white rounded-lg shadow-sm p-4 md:p-5 border-l-4 ${
                    debt.isreturned ? "border-green-500" : "border-red-500"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-base md:text-lg">{debt.name}</h3>
                      <p className="text-xs md:text-sm text-gray-500">{formatDate(debt)}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        debt.isreturned
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {debt.isreturned ? (
                        <>
                          <Check size={12} /> Returned
                        </>
                      ) : (
                        <>
                          <X size={12} /> Pending
                        </>
                      )}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jami Summa:</span>
                      <span className="font-semibold text-gray-900">
                        {debt.amount.toLocaleString()}?
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Holat:</span>
                      <span className={`font-semibold ${debt.isreturned ? 'text-green-600' : 'text-red-600'}`}>
                        {debt.isreturned ? '✓ Qaytarilgan' : '⏳ Qaytarilmagan'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Filial:</span>
                      <span className="text-gray-900">{getBranchName(debt.branch_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tur:</span>
                      <span className={`text-xs font-semibold ${debt.branch_id === 1 ? "text-red-600" : "text-blue-600"}`}>
                        {debt.branch_id=== 1? "Nasiyam" : "Berilgan"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Mahsulotlar:</span>
                      <p className="text-gray-900 text-xs mt-1 line-clamp-2">{formatProductsForDisplay(debt.product_names)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => printDebt(debt)}
                      className="flex-1 p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm"
                    >
                      🖨️ Chop Etish
                    </button>

                    <button
                      onClick={() => fetchDebtById(debt.id)}
                      className="flex-1 p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm"
                    >
                      <Eye size={16} /> Ko'rish
                    </button>

                    {!debt.isreturned && (
                      <button
                        onClick={() => {
                          setPaymentDebt(debt);
                          setShowPaymentModal(true);
                        }}
                        className="flex-1 p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm"
                      >
                        💰 To'lov
                      </button>
                    )}

                    <button
                      onClick={() => openEditModal(debt)}
                      className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteDebt(debt.id)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden xl:block bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort("date")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Sana
                    {getSortIcon("date")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Mijoz
                    {getSortIcon("name")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tur
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Jami
                    {getSortIcon("amount")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("isreturned")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Holat
                    {getSortIcon("isreturned")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <DollarSign size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900">Qarzlar topilmadi</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {debts.length === 0 ? "Yangi qarz qo'shishdan boshlang" : "Filtrlarni sozlashga harakat qiling"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredAndSorted.map((debt) => {
                    return (
                      <tr
                        key={debt.id}
                        className={`hover:bg-gray-50 transition ${
                          debt.isreturned ? "bg-green-50/50" : "bg-orange-50/30"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{formatDate(debt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{debt.name}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            debt.branch_id === 1 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {debt.branch_id===1 ? "Nasiyam" : "Berilgan"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {debt.amount.toLocaleString()}?
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              debt.isreturned
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {debt.isreturned ? (
                              <>
                                <Check size={14} /> Returned
                              </>
                            ) : (
                              <>
                                <X size={14} /> Pending
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => printDebt(debt)}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                              title="Chop Etish"
                            >
                              🖨️
                            </button>

                            <button
                              onClick={() => fetchDebtById(debt.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                              title="Batafsil Ko'rish"
                            >
                              <Eye size={18} />
                            </button>

                            {!debt.isreturned && (
                              <button
                                onClick={() => {
                                  setPaymentDebt(debt);
                                  setShowPaymentModal(true);
                                }}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                                title="To'lov Qo'shish"
                              >
                                💰
                              </button>
                            )}

                            <button
                              onClick={() => openEditModal(debt)}
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                              title="Tahrirlash"
                            >
                              <Edit2 size={18} />
                            </button>

                            <button
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                              title="O'chirish"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* TOTAL ROW */}
                  <tr className="bg-gradient-to-r from-blue-100 to-purple-100 font-bold border-t-2 border-gray-300">
                    <td colSpan={selectedDebtor ? 3 : 4} className="px-6 py-4 text-right text-base text-gray-900">
                      TOTAL:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                      {filteredAndSorted.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}?
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-green-700">
                      {filteredAndSorted.filter(d => d.isreturned).reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ?
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-red-700">
                      {filteredAndSorted.filter(d => !d.isreturned).reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ?
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* DEBT DETAIL MODAL */}
      {showDebtDetail && selectedDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md md:max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className={`${selectedDebt.isreturned ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-orange-500 to-red-500"} p-6 text-white flex items-center justify-between sticky top-0`}>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{selectedDebt.name}</h2>
                <p className="text-xs opacity-90 mt-1">{getBranchName(selectedDebt.branch_id)}</p>
              </div>
              <button
                onClick={() => setShowDebtDetail(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6 space-y-4">
              {/* Date */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-700 mb-1">Sana</p>
                <p className="text-lg font-bold text-blue-900">{formatDate(selectedDebt)}</p>
              </div>

              {/* Amount */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-700 mb-1">Jami Summa</p>
                <p className="text-3xl font-bold text-purple-900">{selectedDebt.amount.toLocaleString()}?</p>
              </div>

              {/* Status */}
              <div className={`${selectedDebt.isreturned ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
                <p className="text-xs font-medium text-gray-700 mb-2">Holat</p>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${selectedDebt.isreturned ? 'text-green-900' : 'text-yellow-900'}`}>
                    {selectedDebt.isreturned ? '✓ Qaytarilgan' : '⏳ Qaytarilmagan'}
                  </span>
                </div>
              </div>

              {/* Debt Type */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-1">Qarz Turi</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedDebt.branch_id === 1 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {selectedDebt.branch_id === 1 ? "💳 Nasiyam" : "💰 Berilgan Nasiya"}
                </span>
              </div>

              {/* Products */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-3">Mahsulotlar</p>
                {parseProductsFromString(selectedDebt.product_names).length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {parseProductsFromString(selectedDebt.product_names).map((product, index) => (
                      <div
                        key={index}
                        className="bg-white p-3 rounded-lg border border-gray-300 shadow-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {product.quantity} × {product.price.toLocaleString()}? = {(product.quantity * product.price).toLocaleString()}?
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 italic">Mahsulotlar topilmadi</p>
                )}
              </div>

              {/* Status */}
              <div className={`${selectedDebt.isreturned ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border rounded-lg p-4`}>
                <p className="text-xs font-medium text-gray-700 mb-1">Holat</p>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${selectedDebt.isreturned ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {selectedDebt.isreturned ? (
                    <>
                      <Check size={16} /> Returned
                    </>
                  ) : (
                    <>
                      <X size={16} /> Pending
                    </>
                  )}
                </span>
              </div>

              {/* Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Debt ID:</span>
                  <span className="font-mono text-gray-900">{selectedDebt.id}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 font-medium">Shop ID:</span>
                  <span className="font-mono text-gray-900">{selectedDebt.shop_id}</span>
                </div>
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2 justify-end sticky bottom-0">
              <button
                onClick={() => setShowDebtDetail(false)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium order-2 sm:order-1"
              >
                Yopish
              </button>
              <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                <button
                  onClick={async () => {
                    try {
                      const toastId = toast.loading("💾 Saving changes...");
                      const isFullyPaid = selectedDebt.isreturned;
                      
                      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.update}`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          authorization: token ?? "",
                        },
                        body: JSON.stringify({
                          id: selectedDebt.id,
                          name: selectedDebt.name,
                          amount: selectedDebt.amount,
                          product_names: selectedDebt.product_names,
                          branch_id: selectedDebt.branch_id,
                          isreturned: isFullyPaid,
                        }),
                      });

                      if (!res.ok) {
                        throw new Error("Failed to save changes");
                      }

                      const json = await res.json();
                      setDebts(debts.map((d) => (d.id === json.data.id ? json.data : d)));
                      toast.update(toastId, {
                        render: "✅ Changes saved successfully",
                        type: "success",
                        isLoading: false,
                        autoClose: 3000,
                      });
                      fetchStatistics();
                      setShowDebtDetail(false);
                    } catch (err: any) {
                      console.error(err);
                      toast.error(`❌ Failed to save: ${err.message}`);
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  💾 O'zgarishlarni Saqlash
                </button>
                <button
                  onClick={() => printDebt(selectedDebt)}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
                >
                  🖨️ Chop Etish
                </button>
                {!selectedDebt.isreturned && (
                  <button
                    onClick={() => {
                      setPaymentDebt(selectedDebt);
                      setShowPaymentModal(true);
                      setShowDebtDetail(false);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    💰 To'lov Qo'shish
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDebtDetail(false);
                    openEditModal(selectedDebt);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} /> Tahrirlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DEBT MODAL - PRODUCTS SECTION UPDATED */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white flex items-center justify-between rounded-t-xl flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Plus size={24} /> Yangi Qarz Yaratish
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ 
                    name: "", 
                    amount: "0", 
                    product_names: [], 
                    branch_id: isSuperAdmin ? 1 : (authData.user as unknown as Admin).branch, 
                  });
                  setProductEntries([]);
                  setCurrentProduct({
                    id: Date.now().toString(),
                    name: "",
                    quantity: 1,
                    price: 0,
                    totalPaid: 0,
                  });
                  setDebtorNameInput("");
                  setShowSuggestions(false);
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 scroll-smooth">
              <form onSubmit={handleCreateDebt} className="space-y-4 sm:space-y-6">
                {/* Customer Name with Autocomplete */}
                <div className="relative">
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Mijoz Nomi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={debtorNameInput}
                    onChange={(e) => {
                      setDebtorNameInput(e.target.value);
                      setFormData({ ...formData, name: e.target.value });
                      setShowSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowSuggestions(debtorNameInput.length > 0)}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mijoz nomini kiriting"
                    required
                  />
                  
                  {/* Autocomplete Suggestions */}
                  {showSuggestions && filteredDebtorSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 text-xs text-gray-500 font-medium border-b border-gray-200">
                        Mavjud Qarzdorlar
                      </div>
                      {filteredDebtorSuggestions.map((debtor) => (
                        <button
                          key={debtor.name}
                          type="button"
                          onClick={() => {
                            setDebtorNameInput(debtor.name);
                            setFormData({ ...formData, name: debtor.name });
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {debtor.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{debtor.name}</p>
                                <p className="text-xs text-gray-600">
                                  {debtor.totalDebts} qarz
                                </p>
                              </div>
                            </div>
                            {debtor.unreturnedAmount > 0 && (
                              <span className="text-xs font-semibold text-red-600">
                                {debtor.unreturnedAmount.toLocaleString()} kutilmoqda
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Products Manual Entry Section - UPDATED */}
                <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="text-base font-bold text-gray-900 mb-4">📦 Mahsulotlar</h3>

                  {/* Product Input Fields */}
                  <div className="space-y-3 mb-4 bg-white p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mahsulot Nomi</label>
                        <input
                          type="text"
                          value={currentProduct.name}
                          onChange={(e) =>
                            setCurrentProduct({ ...currentProduct, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Masalan: Qalay"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Miqdori</label>
                        <input
                          type="number"
                          value={currentProduct.quantity}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              quantity: e.target.value === "" ? "" : parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Narxi (so'm)</label>
                        <input
                          type="number"
                          value={currentProduct.price}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              price: e.target.value === "" ? "" : parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          placeholder="0"
                        />
                      </div></div>

                    {/* Quick Info */}
                    {currentProduct.price > 0 && currentProduct.quantity > 0 && (
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">
                          Jami: <span className="font-bold text-blue-900">
                            {(currentProduct.price * currentProduct.quantity).toLocaleString()}?
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Add Button */}
                    <button
                      type="button"
                      onClick={addProductEntry}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Mahsulotni Qo'shish
                    </button>
                  </div>

                  {/* Added Products List */}
                  {productEntries.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Tanlangan Mahsulotlar ({productEntries.length})
                        </h4>
                        <button
                          type="button"
                          onClick={clearAllProducts}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Barchasini Tozalash
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-2 bg-white p-3 rounded-lg">
                        {productEntries.map((product) => (
                          <div
                            key={product.id}
                            className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-600">
                                  {product.quantity} × {product.price.toLocaleString()}? = {(product.quantity * product.price).toLocaleString()}?
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeProductEntry(product.id)}
                                className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between font-bold text-gray-900">
                        <span>Jami Summa:</span>
                        <span className="text-lg text-blue-900">
                          {calculateTotalFromProducts(productEntries).toLocaleString()}?
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* MODAL ACTIONS */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2 justify-end rounded-b-xl flex-shrink-0">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ 
                    name: "", 
                    amount: "0", 
                    product_names: [], 
                    // if it is Nasiyam it is 1 else 0
                    branch_id: isSuperAdmin ? 1 : (authData.user as unknown as Admin).branch, 
                  });
                  setProductEntries([]);
                  setCurrentProduct({
                    id: Date.now().toString(),
                    name: "",
                    quantity: 1,
                    price: 0,
                    totalPaid: 0,
                  });
                  setDebtorNameInput("");
                  setShowSuggestions(false);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleCreateDebt}
                disabled={productEntries.length === 0 || !formData.name}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Qarz Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DEBT MODAL - PRODUCTS SECTION UPDATED */}
      {showEditModal && editingDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md md:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 sm:p-6 text-white flex items-center justify-between sticky top-0">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Edit2 size={24} /> Qarzni Tahrirlash
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDebt(null);
                  setProductEntries([]);
                  setFormData({ 
                    name: "", 
                    amount: "0", 
                    product_names: [], 
                    branch_id: 0, 
                  });
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-4 sm:p-6">
              <form onSubmit={handleUpdateDebt} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mijoz Nomi *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Products Section in Edit Modal */}
                <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                  <h3 className="text-base font-bold text-gray-900 mb-4">📦 Mahsulotlar</h3>

                  {/* Product Input Fields */}
                  <div className="space-y-3 mb-4 bg-white p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Mahsulot Nomi</label>
                        <input
                          type="text"
                          value={currentProduct.name}
                          onChange={(e) =>
                            setCurrentProduct({ ...currentProduct, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Masalan: Qalay"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Miqdori</label>
                        <input
                          type="number"
                          value={currentProduct.quantity}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              quantity: e.target.value === "" ? "" : parseInt(e.target.value) || 1,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Narxi (so'm)</label>
                        <input
                          type="number"
                          value={currentProduct.price}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              price: e.target.value === "" ? "" : parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          placeholder="0"
                        />
                      </div></div>

                    {/* Quick Info */}
                    {currentProduct.price > 0 && currentProduct.quantity > 0 && (
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">
                          Jami: <span className="font-bold text-blue-900">
                            {(currentProduct.price * currentProduct.quantity).toLocaleString()}?
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Add Button */}
                    <button
                      type="button"
                      onClick={addProductEntry}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Mahsulotni Qo'shish
                    </button>
                  </div>

                  {/* Added Products List */}
                  {productEntries.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Tanlangan Mahsulotlar ({productEntries.length})
                        </h4>
                        <button
                          type="button"
                          onClick={clearAllProducts}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Barchasini Tozalash
                        </button>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-2 bg-white p-3 rounded-lg">
                        {productEntries.map((product) => (
                          <div
                            key={product.id}
                            className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-600">
                                  {product.quantity} × {product.price.toLocaleString()}? = {(product.quantity * product.price).toLocaleString()}?
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeProductEntry(product.id)}
                                className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="mt-3 pt-3 border-t border-orange-200 flex justify-between font-bold text-gray-900">
                        <span>Jami Summa:</span>
                        <span className="text-lg text-orange-900">
                          {calculateTotalFromProducts(productEntries).toLocaleString()}?
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Branch is set automatically */}

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Joriy Holat:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        editingDebt.isreturned ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {editingDebt.isreturned ? (
                        <>
                          <Check size={14} /> Returned
                        </>
                      ) : (
                        <>
                          <X size={14} /> Pending
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </form>
            </div>

            {/* MODAL ACTIONS */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2 justify-end sticky bottom-0">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDebt(null);
                  setProductEntries([]);
                  setFormData({ 
                    name: "", 
                    amount: "0", 
                    product_names: [], 
                    branch_id: 0, 
                  });
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleUpdateDebt}
                className="w-full sm:w-auto px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Edit2 size={18} /> Yangilash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && paymentDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md md:max-w-lg w-full">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 sm:p-6 text-white flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                ✅ Qarzni Qaytarish
              </h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentDebt(null);
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-4 sm:p-6">
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Mijoz:</p>
                <p className="text-lg font-bold text-blue-900">{paymentDebt.name}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Qarz Miqdori:</span>
                  <span className="font-bold text-gray-900">{paymentDebt.amount.toLocaleString()} ?</span>
                </div>
                <div className="flex justify-between py-2 bg-yellow-50 px-3 rounded-lg">
                  <span className="font-bold text-gray-900">Holat:</span>
                  <span className="font-bold text-yellow-600">
                    {paymentDebt.isreturned ? "Qaytarilgan" : "Qaytarilmagan"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
                <p className="text-sm text-gray-700">
                  Bu qarzni to'liq to'langan deb belgilaysizmi?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentDebt(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={async () => {
                    try {
                      const toastId = toast.loading("💾 Qarz qaytarilmoqda...");

                      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.update}`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          authorization: token ?? "",
                        },
                          body: JSON.stringify({
                            id: paymentDebt.id,
                            name: paymentDebt.name,
                            amount: paymentDebt.amount,
                            product_names: normalizeProductNames(paymentDebt.product_names),
                            branch_id: paymentDebt.branch_id,
                            isreturned: true,
                          }),
                      });

                      if (!res.ok) {
                        throw new Error("Qarzni qaytarishda xatolik");
                      }

                      const json = await res.json();
                      
                      // Update the debts list
                      setDebts(debts.map((d) => 
                        d.id === json.data.id 
                          ? { ...d, isreturned: true } 
                          : d
                      ));

                      // Update selected debt if it's open
                      if (selectedDebt && selectedDebt.id === json.data.id) {
                        setSelectedDebt({ ...selectedDebt, isreturned: true });
                      }

                      // Refresh statistics
                      fetchStatistics();

                      toast.update(toastId, {
                        render: "✅ Qarz qaytarilgan deb belgilandi",
                        type: "success",
                        isLoading: false,
                        autoClose: 3000,
                      });

                      // Close modal and reset
                      setShowPaymentModal(false);
                      setPaymentDebt(null);
                    } catch (err: any) {
                      toast.error(err.message || "Qarzni qaytarishda xatolik");
                    }
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  ✅ Qaytarilgan deb belgilash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
