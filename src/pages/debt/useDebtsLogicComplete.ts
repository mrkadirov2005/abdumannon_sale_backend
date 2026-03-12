// Complete hook extracted from original DebtsPage.tsx
// This hook contains ALL business logic from the original monolithic component
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { DEFAULT_SUPPLIER_HTML, generateChequeNumber, printCheque } from "../../components/ui/ChequeProvider";
import type {
  Debt,
  DebtStatistics,
  DebtorSummary,
  ProductEntry,
  FormData,
  SortKey,
  SortDirection,
  DebtTypeFilter,
} from "./types";
import type { Admin } from "../../../types/types";

export const useDebtsLogic = (
  token: string | undefined,
  shop_id: string | undefined,
  authData: any,
  isSuperAdmin: boolean,
  branches: any
) => {
  // ===== STATE DECLARATIONS (ALL FROM ORIGINAL) =====
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DebtStatistics | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showDebtDetail, setShowDebtDetail] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "folders" | "statistics">("folders");
  const [selectedDebtor, setSelectedDebtor] = useState<string | null>(null);
  const [debtTypeFilter, setDebtTypeFilter] = useState<DebtTypeFilter>("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [searchName, setSearchName] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "returned" | "unreturned">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterByDateRange, setFilterByDateRange] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debtorNameInput, setDebtorNameInput] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    amount: "0",
    product_names: [],
    branch_id: isSuperAdmin ? 1 : (authData?.user as unknown as Admin)?.branch || 1,
  });
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([]);
  const [currentProduct, setCurrentProduct] = useState<ProductEntry>({
    id: Date.now().toString(),
    name: "",
    quantity: 1,
    price: 0,
    totalPaid: 0,
  });

  // ===== FETCH FUNCTIONS (EXACT COPY FROM ORIGINAL) =====
  const fetchDebts = useCallback(async () => {
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
  }, [token, shop_id]);

  const fetchStatistics = useCallback(async () => {
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
  }, [token, shop_id]);

  const fetchUnreturnedDebts = useCallback(async () => {
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
  }, [token, shop_id]);

  const fetchDebtsByBranch = useCallback(async (branchId: string) => {
    try {
      const toastId = toast.loading("🏢 Filial qarzlari yuklanmoqda...");
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.byBranch}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
          branch_id: branchId,
        },
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
  }, [token]);

  const fetchDebtsByCustomer = useCallback(async (customerName: string) => {
    if (!customerName.trim()) {
      await fetchDebts();
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
  }, [token, shop_id, fetchDebts]);

  const fetchDebtById = useCallback(async (debtId: string) => {
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
  }, [token]);

  useEffect(() => {
    if (token && shop_id) {
      fetchDebts();
      fetchStatistics();
    }
  }, [token, shop_id, fetchDebts, fetchStatistics]);

  // ===== PRODUCT HELPERS (EXACT COPY FROM ORIGINAL) =====
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

  const parseProductsFromString = (productString: string | string[] | undefined | null | any): ProductEntry[] => {
    if (!productString) return [];
    
    try {
      let str = productString;
      if (Array.isArray(productString)) {
        str = productString[0] || "";
      }
      
      if (typeof str !== "string" || str.trim() === "") return [];
      
      return str
        .split("|")
        .filter((item) => item.trim() !== "")
        .map((item, index) => {
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
      let str = productString;
      if (Array.isArray(productString)) {
        str = productString[0] || "";
      }
      
      if (typeof str !== "string") return "";
      
      if (str.trim() === "") return "";
      
      if (!str.includes("|") && !str.includes("*")) {
        return str;
      }
      
      return str
        .split("|")
        .filter((item) => item.trim() !== "")
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

  // ===== CRUD OPERATIONS (EXACT COPY FROM ORIGINAL) =====
  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || productEntries.length === 0) {
      toast.error("Barcha majburiy maydonlarni to'ldiring");
      return;
    }

    try {
      const toastId = toast.loading("💾 Qarz yaratilmoqda...");
      const productNamesString = formatProductsToString(productEntries);
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
          product_names: productNamesString,
          branch_id: typeof formData.branch_id === 'string' ? parseInt(formData.branch_id) : formData.branch_id,
          shop_id,
          admin_id: "qarzdorlar",
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
      
      const productString = productEntries.length > 0 
        ? formatProductsToString(productEntries)
        : editingDebt.product_names;

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

  // ===== HELPERS (EXACT COPY FROM ORIGINAL) =====
  const getUniqueDebtors = useMemo((): DebtorSummary[] => {
    const debtorMap = new Map<string, DebtorSummary>();

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

  const printDebt = (debt: Debt) => {
    printCheque({
      title: "Накладная",
      number: generateChequeNumber(),
      date: formatDate(debt),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: debt.name,
      products: [{
        name: formatProductsForDisplay(debt.product_names),
        quantity: 1,
        unit: "pcs",
        price: debt.amount,
        total: debt.amount,
      }],
      signatureLeft: "Руководитель",
      signatureRight: "Бухгалтер",
    });
  };

  const printAllDebts = () => {
    const totalAmount = filteredAndSorted.reduce((sum, d) => sum + d.amount, 0);

    printCheque({
      title: "Отчёт по долгам",
      number: generateChequeNumber(),
      date: new Date(),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: `Итого записей: ${filteredAndSorted.length}`,
      products: filteredAndSorted.map((debt) => ({
        name: `${debt.name} (${formatDate(debt)}) ${debt.isreturned ? "✓" : "⏳"}`,
        quantity: 1,
        unit: "pcs",
        price: debt.amount,
        total: debt.amount,
      })),
      totalAmount,
      signatureLeft: "Руководитель",
      signatureRight: "Бухгалтер",
    });
  };

  const printByDebtors = () => {
    const debtors = getUniqueDebtors;
    const filteredDebtors = debtTypeFilter === "all"
      ? debtors
      : debtTypeFilter === "given"
      ? debtors.filter(d => d.debts.some(debt => debt.branch_id !== 1))
      : debtors.filter(d => d.debts.some(debt => debt.branch_id === 1));

    const grandTotal = filteredDebtors.reduce((sum, d) => sum + d.totalAmount, 0);

    printCheque({
      title: "Отчёт по должникам",
      number: generateChequeNumber(),
      date: new Date(),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: `Тип: ${debtTypeFilter === "given" ? "Berilgan Nasiya" : debtTypeFilter === "taken" ? "Nasiyam" : "Barcha Qarzlar"} | Должников: ${filteredDebtors.length}`,
      products: filteredDebtors.map((debtor) => {
        const relevantDebts = debtTypeFilter === "all"
          ? debtor.debts
          : debtTypeFilter === "given"
          ? debtor.debts.filter(d => d.branch_id !== 1)
          : debtor.debts.filter(d => d.branch_id === 1);
        const debtorTotal = relevantDebts.reduce((s, d) => s + d.amount, 0);
        return {
          name: `${debtor.name} (${relevantDebts.length} долг(ов))`,
          quantity: relevantDebts.length,
          unit: "pcs",
          price: debtorTotal / (relevantDebts.length || 1),
          total: debtorTotal,
        };
      }),
      totalAmount: grandTotal,
      signatureLeft: "Руководитель",
      signatureRight: "Бухгалтер",
    });
  };

  // ===== FILTER + SORT (EXACT COPY FROM ORIGINAL) =====
  const filteredAndSorted = useMemo(() => {
    let list = [...debts];

    if (debtTypeFilter === "given") {
      list = list.filter((d) => d.branch_id === 0);
    } else if (debtTypeFilter === "taken") {
      list = list.filter((d) => d.branch_id === 1);
    }

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

  // ===== EXPORT ALL STATE AND METHODS =====
  return {
    // State
    debts,
    loading,
    statistics,
    selectedDebt,
    showDebtDetail,
    viewMode,
    selectedDebtor,
    debtTypeFilter,
    searchName,
    filterBranch,
    filterStatus,
    showAdvancedFilters,
    filterByDateRange,
    filterStartDate,
    filterEndDate,
    showSuggestions,
    debtorNameInput,
    sortKey,
    sortDirection,
    showCreateModal,
    showEditModal,
    editingDebt,
    showPaymentModal,
    paymentDebt,
    paymentAmount,
    formData,
    productEntries,
    currentProduct,
    totals,
    filteredAndSorted,
    getUniqueDebtors,
    filteredDebtorSuggestions,

    // Setters
    setDebts,
    setSelectedDebt,
    setShowDebtDetail,
    setViewMode,
    setSelectedDebtor,
    setDebtTypeFilter,
    setSearchName,
    setFilterBranch,
    setFilterStatus,
    setShowAdvancedFilters,
    setFilterByDateRange,
    setFilterStartDate,
    setFilterEndDate,
    setShowSuggestions,
    setDebtorNameInput,
    setSortKey,
    setSortDirection,
    setShowCreateModal,
    setShowEditModal,
    setEditingDebt,
    setShowPaymentModal,
    setPaymentDebt,
    setPaymentAmount,
    setFormData,
    setProductEntries,
    setCurrentProduct,

    // Methods
    fetchDebts,
    fetchStatistics,
    fetchDebtById,
    fetchDebtsByCustomer,
    fetchDebtsByBranch,
    fetchUnreturnedDebts,
    handleCreateDebt,
    handleUpdateDebt,
    handleDeleteDebt,
    openEditModal,
    addProductEntry,
    removeProductEntry,
    clearAllProducts,
    handleSort,
    calculateTotalFromProducts,
    formatProductsToString,
    parseProductsFromString,
    formatProductsForDisplay,
    formatDate,
    formatDateForComparison,
    isDateInRange,
    getTimestamp,
    getBranchName,
    exportToCSV,
    printDebt,
    printAllDebts,
    printByDebtors,
  };
};
