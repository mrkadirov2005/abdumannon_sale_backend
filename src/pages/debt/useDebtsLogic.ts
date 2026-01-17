import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import type {
  Debt,
  DebtStatistics,
  DebtorSummary,
  ProductEntry,
  FormData,
  SortKey,
  SortDirection,
  DebtTypeFilter,
  Product,
} from "./types";
import type { Admin } from "../../../types/types";

export const useDebtsLogic = (
  token: string | undefined,
  shop_id: string | undefined,
  authData: any,
  isSuperAdmin: boolean
) => {
  // ===== STATE =====
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DebtStatistics | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showDebtDetail, setShowDebtDetail] = useState(false);
  const [viewMode, setViewMode] = useState<DebtTypeFilter | "folders" | "list" | "statistics">("folders");
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

  // ===================== FETCH FUNCTIONS =====================

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

      if (!res.ok) throw new Error("Failed to fetch debts");

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

      if (!res.ok) throw new Error("Failed to fetch statistics");

      const json = await res.json();
      setStatistics(json.data);
    } catch (err) {
      console.error(err);
      toast.error("Statistikani yuklashda xatolik");
    }
  }, [token, shop_id]);

  useEffect(() => {
    fetchDebts();
    fetchStatistics();
  }, [fetchDebts, fetchStatistics]);

  // ===================== HELPER FUNCTIONS =====================

  const formatDate = (d: Debt) =>
    `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(
      2,
      "0"
    )}`;

  const formatDateForComparison = (d: Debt) => {
    const dateStr = `${d.year}-${String(d.month).padStart(2, "0")}-${String(
      d.day
    ).padStart(2, "0")}`;
    return new Date(dateStr);
  };

  const isDateInRange = (debt: Debt): boolean => {
    if (!filterByDateRange || !filterStartDate || !filterEndDate) return true;
    const debtDate = formatDateForComparison(debt);
    const start = new Date(filterStartDate);
    const end = new Date(filterEndDate);
    return debtDate >= start && debtDate <= end;
  };

  const parseProductsFromString = (productString: string): Product[] => {
    try {
      if (!productString) return [];
      const products = JSON.parse(productString);
      return Array.isArray(products) ? products : [];
    } catch (error) {
      console.error("Error parsing products:", error);
      return [];
    }
  };

  const formatProductsToString = (products: Product[]): string => {
    try {
      return JSON.stringify(products);
    } catch (error) {
      console.error("Error formatting products:", error);
      return "";
    }
  };

  const formatProductsForDisplay = (productString: string): string => {
    const products = parseProductsFromString(productString);
    return products.map((p) => `${p.name} (${p.quantity} ${p.price})`).join(", ");
  };

  const calculateTotalFromProducts = (products: Product[]): number => {
    return products.reduce((sum, p) => sum + p.quantity * p.price, 0);
  };

  // ===================== GET UNIQUE DEBTORS =====================

  const getUniqueDebtors = useMemo((): DebtorSummary[] => {
    const debtorMap = new Map<string, DebtorSummary>();

    // Filter by debt type
    let filteredDebts = debts;
    if (debtTypeFilter === "given") {
      filteredDebts = debts.filter((d) => d.branch_id !== 1); // branch_id !== 1 = "Berilgan Nasiya"
    } else if (debtTypeFilter === "taken") {
      filteredDebts = debts.filter((d) => d.branch_id === 1); // branch_id === 1 = "Nasiyam"
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

    return Array.from(debtorMap.values()).sort(
      (a, b) => b.unreturnedAmount - a.unreturnedAmount
    );
  }, [debts, debtTypeFilter]);

  // ===================== DEBTORS AUTOCOMPLETE =====================

  const filteredDebtorSuggestions = useMemo(() => {
    if (!debtorNameInput.trim()) return [];
    const input = debtorNameInput.toLowerCase();
    return getUniqueDebtors
      .filter((debtor) => debtor.name.toLowerCase().includes(input))
      .slice(0, 5);
  }, [debtorNameInput, getUniqueDebtors]);

  // ===================== FILTERED AND SORTED LIST =====================

  const filteredAndSorted = useMemo(() => {
    let list = debts;

    // Filter by debt type
    if (debtTypeFilter === "given") {
      list = list.filter((d) => d.branch_id !== 1);
    } else if (debtTypeFilter === "taken") {
      list = list.filter((d) => d.branch_id === 1);
    }

    // Filter by selected debtor
    if (selectedDebtor) {
      list = list.filter((d) => d.name === selectedDebtor);
    }

    // Filter by search name
    if (searchName) {
      list = list.filter((d) =>
        d.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by branch
    if (filterBranch) {
      list = list.filter((d) => d.branch_id.toString() === filterBranch);
    }

    // Filter by status
    if (filterStatus === "returned") {
      list = list.filter((d) => d.isreturned);
    } else if (filterStatus === "unreturned") {
      list = list.filter((d) => !d.isreturned);
    }

    // Filter by date range
    list = list.filter((d) => isDateInRange(d));

    // Sort
    list.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortKey) {
        case "date":
          aVal = formatDateForComparison(a);
          bVal = formatDateForComparison(b);
          break;
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "amount":
          aVal = a.amount;
          bVal = b.amount;
          break;
        case "isreturned":
          aVal = a.isreturned ? 1 : 0;
          bVal = b.isreturned ? 1 : 0;
          break;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [debts, debtTypeFilter, selectedDebtor, searchName, filterBranch, filterStatus, sortKey, sortDirection, filterByDateRange, filterStartDate, filterEndDate]);

  // ===================== CRUD OPERATIONS =====================

  const handleCreateDebt = useCallback(
    async (e: React.FormEvent) => {
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
            branch_id: formData.branch_id,
            shop_id,
            admin_id: "admin-uuid",
          }),
        });

        if (!res.ok) throw new Error("Failed to create debt");

        const json = await res.json();
        setDebts([json.data, ...debts]);
        setShowCreateModal(false);
        setFormData({
          name: "",
          amount: "0",
          product_names: [],
          branch_id: 1, // Reset to default: Nasiyam
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
    },
    [formData, productEntries, token, shop_id, debts, fetchStatistics]
  );

  const handleUpdateDebt = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingDebt) return;

      try {
        const toastId = toast.loading("✏️ Qarz yangilanmoqda...");
        const productString =
          productEntries.length > 0
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
            amount:
              productEntries.length > 0
                ? calculateTotalFromProducts(productEntries)
                : parseFloat(formData.amount),
            product_names: productString,
            branch_id: formData.branch_id,
          }),
        });

        if (!res.ok) throw new Error("Failed to update debt");

        const json = await res.json();
        setDebts(debts.map((d) => (d.id === json.data.id ? json.data : d)));
        setShowEditModal(false);
        setEditingDebt(null);
        setProductEntries([]);
        setFormData({
          name: "",
          amount: "0",
          product_names: [],
          branch_id: 1,
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
    },
    [editingDebt, productEntries, formData, token, debts, fetchStatistics]
  );

  const handleDeleteDebt = useCallback(
    async (debtId: string) => {
      if (!window.confirm("Haqiqatan ham bu qarzni o'chirmoqchimisiz?")) return;

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

        if (!res.ok) throw new Error("Failed to delete debt");

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
    },
    [debts, token, fetchStatistics]
  );

  const openEditModal = useCallback((debt: Debt) => {
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
  }, []);

  const addProductEntry = useCallback(() => {
    if (
      !currentProduct.name ||
      currentProduct.quantity < 1 ||
      currentProduct.price < 0
    ) {
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
  }, [currentProduct, productEntries]);

  const removeProductEntry = useCallback(
    (id: string) => {
      const updated = productEntries.filter((p) => p.id !== id);
      setProductEntries(updated);
      const total = calculateTotalFromProducts(updated);
      setFormData((prev) => ({ ...prev, amount: total.toString() }));
    },
    [productEntries]
  );

  const clearAllProducts = useCallback(() => {
    setProductEntries([]);
    setFormData((prev) => ({ ...prev, amount: "0" }));
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }, [sortKey]);

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

    // Computed
    getUniqueDebtors,
    filteredDebtorSuggestions,
    filteredAndSorted,

    // Methods
    fetchDebts,
    fetchStatistics,
    parseProductsFromString,
    formatProductsToString,
    formatProductsForDisplay,
    calculateTotalFromProducts,
    formatDate,
    formatDateForComparison,
    isDateInRange,
    handleCreateDebt,
    handleUpdateDebt,
    handleDeleteDebt,
    openEditModal,
    addProductEntry,
    removeProductEntry,
    clearAllProducts,
    handleSort,
  };
};
