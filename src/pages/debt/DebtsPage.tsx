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
import { Search, Plus, Edit2, Trash2, X, DollarSign, Eye, Printer, ArrowUpDown, ChevronUp, ChevronDown, Filter, Download, Folder, User, ChevronRight } from "lucide-react";
import type { Admin } from "../../../types/types";
import { DEFAULT_SUPPLIER_HTML, generateChequeNumber, printCheque } from "../../components/ui/ChequeProvider";

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

interface FinanceRecord {
  id: number;
  amount: string;
  description?: string;
  type: "income" | "expense";
  category: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

// Add this interface for product entries
interface ProductEntry {
  id: string;
  name: string;
  quantity: number | "";
  price: number | "";
  totalPaid: number;
  unit: string;
}

/* ================= COMPONENT ================= */

export default function DebtManagement() {
  const UNIT_OPTIONS = [
    { value: "pcs", label: "Dona" },
    { value: "kg", label: "Kg" },
    { value: "t", label: "Tonna" },
    { value: "l", label: "Litr" },
  ];

  const formatUnitLabel = (unit: string | undefined | null) => {
    const normalized = unit || "pcs";
    const found = UNIT_OPTIONS.find((opt) => opt.value === normalized);
    return found ? found.label : normalized;
  };
  const [debts, setDebts] = useState<Debt[]>([]);
  const [unreturnedDebts, setUnreturnedDebts] = useState<Debt[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setStatistics] = useState<DebtStatistics | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showDebtDetail, setShowDebtDetail] = useState(false);

  // NEW: View Mode
  const [viewMode, setViewMode] = useState<"list" | "folders" | "statistics">("folders");
  const [selectedDebtor, setSelectedDebtor] = useState<string | null>(null);
  const [debtTypeFilter, setDebtTypeFilter] = useState<"all" | "given" | "taken">("all");

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
    quantity: "",
    price: "",
    totalPaid: 0,
    unit: "pcs",
  });

  const token = useSelector(accessTokenFromStore);
  const shop_id = useSelector(getshopidfromstrore);
  const branches = useSelector(getBranchesFromStore);
  const EXCLUDED_ADMIN_ID = "qarzlarim";

  const filterVisibleDebts = (items: Debt[]) => {
    return items.filter((d) => d.admin_id !== EXCLUDED_ADMIN_ID);
  };

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
      const filtered = filterVisibleDebts(json.data || []);
      setDebts(filtered);
      toast.success(`${filtered.length || 0} ta qarz yuklandi`);
    } catch (err) {
      console.error(err);
      toast.error("Қарзларни юклашда хатолик");
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
      toast.error("Статистикани юклашда хатолик");
    }
  };

  const fetchUnreturnedDebts = async () => {
    try {
      const toastId = toast.loading("Қайтарилмаган қарзлар юкланмоқда...");
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
      const filtered = filterVisibleDebts(json.data || []);
      setDebts(filtered);
      setUnreturnedDebts(filtered);
      toast.update(toastId, {
        render: ` ${filtered.length || 0} ta qaytarilmagan qarz yuklandi`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Қайтарилмаган қарзларни юклашда хатолик");
    }
  };

  const fetchUnreturnedDebtsCache = async () => {
    try {
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
      setUnreturnedDebts(filterVisibleDebts(json.data || []));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFinanceRecords = async () => {
    try {
      const res = await fetch(`${DEFAULT_ENDPOINT}/finance`, {
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch finance records");
      }

      const json = await res.json();
      const records = json.data || json;
      setFinanceRecords(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDebtsByBranch = async (branchId: string) => {
    try {
      const toastId = toast.loading("Филиал қарзлари юкланмоқда...");
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
      const filtered = filterVisibleDebts(json.data || []);
      setDebts(filtered);
      toast.update(toastId, {
        render: `Ushbu filial uchun ${filtered.length || 0} ta qarz yuklandi`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Филиал қарзларини юклашда хатолик");
    }
  };

  const fetchDebtsByCustomer = async (customerName: string) => {
    if (!customerName.trim()) {
      fetchDebts();
      return;
    }

    try {
      const toastId = toast.loading("Қарзлар қидирилмоқда...");
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
      const filtered = filterVisibleDebts(json.data || []);
      setDebts(filtered);
      toast.update(toastId, {
        render: ` "${customerName}" учун ${filtered.length || 0} ta qarz topildi`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Мижоз қарзларини юклашда хатолик");
    }
  };

  const fetchDebtById = async (debtId: string) => {
    try {
      const toastId = toast.loading("Қарз ма'лумотлари юкланмоқда...");
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
        render: " Qarz ma'lumotlari yuklandi",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Қарз ма'лумотларини юклашда хатолик");
    }
  };

  useEffect(() => {
    if (token && shop_id) {
      fetchDebts();
      fetchStatistics();
      fetchUnreturnedDebtsCache();
      fetchFinanceRecords();
    }
  }, [token, shop_id]);

  /* ================= PRODUCT HELPERS (UPDATED) ================= */

  const calculateTotalFromProducts = (entries: ProductEntry[]) => {
    return entries.reduce((total, product) => {
      const price = typeof product.price === "number" ? product.price : Number(product.price) || 0;
      const quantity = typeof product.quantity === "number" ? product.quantity : Number(product.quantity) || 0;
      return total + price * quantity;
    }, 0);
  };

  const formatProductsToArray = (entries: ProductEntry[]): string[] => {
    return entries.map(
      (p) => `${p.name}*${p.quantity}*${p.price}*${p.totalPaid}*${p.unit || "pcs"}`
    );
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
        const [name, quantity, price, totalPaid, unit] = item.split("*");
        return {
          id: `${index}-${Date.now()}`,
          name: name || "",
          quantity: parseInt(quantity) || 1,
          price: parseFloat(price) || 0,
          totalPaid: parseFloat(totalPaid) || 0,
          unit: unit || "pcs",
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
          const unit = parts[4] || "pcs";
          const unitLabel = formatUnitLabel(unit);
          return `${name}${quantity ? ` (${quantity} ${unitLabel})` : ""}`;
        })
        .filter((item) => item.trim() !== "")
        .join(", ");
    } catch (error) {
      console.error("Error formatting products:", error);
      return "";
    }
  };

  const addProductEntry = () => {
    const quantity = typeof currentProduct.quantity === "number"
      ? currentProduct.quantity
      : Number(currentProduct.quantity);
    const price = typeof currentProduct.price === "number"
      ? currentProduct.price
      : Number(currentProduct.price);

    if (!currentProduct.name || !Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(price) || price < 0) {
      toast.error("Барча маҳсулот майдонларини тўлдиринг");
      return;
    }

    const normalizedProduct: ProductEntry = {
      ...currentProduct,
      quantity,
      price,
    };

    setProductEntries([...productEntries, normalizedProduct]);
    setCurrentProduct({
      id: Date.now().toString(),
      name: "",
      quantity: "",
      price: "",
      totalPaid: 0,
      unit: "pcs",
    });

    const total = calculateTotalFromProducts([...productEntries, normalizedProduct]);
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
      toast.error("Барча мажбурий майдонларни тўлдиринг");
      return;
    }

    try {
      const toastId = toast.loading("Қарз яратилмоқда...");
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
          admin_id: "qarzdorlar",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create debt");
      }

      const json = await res.json();
      setDebts([json.data, ...debts]);
      fetchUnreturnedDebtsCache();
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
        quantity: "",
        price: "",
        totalPaid: 0,
        unit: "pcs",
      });
      setDebtorNameInput("");
      setShowSuggestions(false);
      toast.update(toastId, {
        render: ` ${json.data.name} uchun qarz yaratildi`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchStatistics();
    } catch (err: any) {
      console.error(err);
      toast.error(` Qarz yaratishda xatolik: ${err.message}`);
    }
  };

  const handleUpdateDebt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDebt) return;

    try {
      const toastId = toast.loading(" Қарз янгиланмоқда...");
      
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
        render: " Qarz muvaffaqiyatli yangilandi",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchStatistics();
    } catch (err: any) {
      console.error(err);
      toast.error(`   Œ Qarzni yangilashda xatolik: ${err.message}`);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!window.confirm("Haqiqatan ham bu qarzni o'chirmoqchimisiz?")) {
      return;
    }

    try {
      const toastId = toast.loading("Қарз ўчирилмоқда...");
      
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
      fetchUnreturnedDebtsCache();
      toast.update(toastId, {
        render: " Qarz muvaffaqiyatli o'chirildi",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchStatistics();
    } catch (err: any) {
      console.error(err);
      toast.error(`   Œ Qarzni o'chirishda xatolik: ${err.message}`);
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
  const unreturnedByName = useMemo(() => {
    let list = unreturnedDebts;
    if (debtTypeFilter === "given") {
      list = unreturnedDebts.filter((d) => d.branch_id === 0);
    } else if (debtTypeFilter === "taken") {
      list = unreturnedDebts.filter((d) => d.branch_id === 1);
    }

    const map = new Map<string, number>();
    list.forEach((debt) => {
      const normalizedName = debt.name.trim().toLowerCase();
      map.set(normalizedName, (map.get(normalizedName) || 0) + debt.amount);
    });

    return map;
  }, [unreturnedDebts, debtTypeFilter]);

  const paymentsByName = useMemo(() => {
    const map = new Map<string, number>();
    financeRecords.forEach((record) => {
      if (record.type !== "income") return;
      if (record.category === "my_debt") return;
      const descriptionParts = record.description?.split(": ") || [];
      const rawPersonName = (descriptionParts[0] || "").trim();
      if (!rawPersonName) return;
      const key = rawPersonName.toLowerCase();
      const amount = Number.parseFloat(record.amount || "0");
      if (!Number.isFinite(amount)) return;
      map.set(key, (map.get(key) || 0) + amount);
    });
    return map;
  }, [financeRecords]);

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
      summary.debts.push(debt);
    });

    const normalized = Array.from(debtorMap.values()).map((summary) => {
      const key = summary.name.trim().toLowerCase();
      const basePaid = summary.debts
        .filter((d) => d.isreturned)
        .reduce((sum, d) => sum + d.amount, 0);
      const baseRemaining = Math.max(0, summary.totalAmount - basePaid);
      const payments = paymentsByName.get(key) || 0;
      const returnedAmount = basePaid + payments;
      const unreturnedAmount = Math.max(0, baseRemaining - payments);
      return {
        ...summary,
        unreturnedAmount,
        returnedAmount,
      };
    });

    return normalized.sort((a, b) => b.unreturnedAmount - a.unreturnedAmount);
  }, [debts, debtTypeFilter, paymentsByName, unreturnedByName]);

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
      toast.success(" Қарзлар ЦСВ форматида юкланди");
    } catch (err) {
      console.error(err);
      toast.error("Қарзларни експорт қилишда хатолик");
    }
  };

  // NEW: Print individual debt
  const printDebt = (debt: Debt) => {
    const parsedProducts = parseProductsFromString(debt.product_names);
    const products = parsedProducts.length > 0
      ? parsedProducts.map((p) => ({
          name: p.name,
          quantity: Number(p.quantity),
          unit: p.unit || "pcs",
          price: Number(p.price),
          total: Number(p.price) * Number(p.quantity),
        }))
      : [{
          name: formatProductsForDisplay(debt.product_names) || " €”",
          quantity: 1,
          unit: "pcs",
          price: debt.amount,
          total: debt.amount,
        }];

    printCheque({
      title: "Ð  Ð°ÐºÐ»Ð°Ð´Ð½Ð°Ñ",
      number: generateChequeNumber(),
      date: formatDate(debt),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: debt.name,
      products,
      extraNote: "Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‚ Ñ‚Ð¾Ð²Ð°Ñ€Ð° Ð² Ñ‚ÐµÑ‡ÐµÐ½Ð¸Ðµ 14 Ð´Ð½ÐµÐ¹",
      status: debt.isreturned ? "ÐžÐ¿Ð»Ð°Ñ‡ÐµÐ½Ð¾" : "ÐžÐ¶Ð¸Ð´Ð°ÐµÑ‚ÑÑ",
      signatureLeft: "Ð ÑƒÐºÐ¾Ð²Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒ",
      signatureRight: "Ð‘ÑƒÑ…Ð³Ð°Ð»Ñ‚ÐµÑ€",
    });
  };

  // NEW: Print all debts
  const printAllDebts = () => {
    const totalAmount = totals.total;
    const unreturnedAmount = totals.unreturned;
    const returnedAmount = totals.returned;

    printCheque({
      title: "ÐžÑ‚Ñ‡Ñ‘Ñ‚ Ð¿Ð¾ Ð´Ð¾Ð»Ð³Ð°Ð¼",
      number: generateChequeNumber(),
      date: new Date(),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: `Ð˜Ñ‚Ð¾Ð³Ð¾ Ð·Ð°Ð¿Ð¸ÑÐµÐ¹: ${filteredAndSorted.length} | Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‰ÐµÐ½Ð¾: ${returnedAmount.toLocaleString("en-US")} | Ð  Ðµ Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‰ÐµÐ½Ð¾: ${unreturnedAmount.toLocaleString("en-US")}`,
      products: filteredAndSorted.map((debt) => ({
        name: `${debt.name} (${formatDate(debt)}) ${debt.isreturned ? "ha" : "yoq"}`,
        quantity: 1,
        unit: "pcs",
        price: debt.amount,
        total: debt.amount,
      })),
      totalAmount,
      signatureLeft: "Ð ÑƒÐºÐ¾Ð²Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒ",
      signatureRight: "Ð‘ÑƒÑ…Ð³Ð°Ð»Ñ‚ÐµÑ€",
    });
  };

  // NEW: Print by debtors (grouped)
  const printByDebtors = () => {
    const debtors = getUniqueDebtors;
    const filteredDebtors = debtTypeFilter === "all"
      ? debtors
      : debtTypeFilter === "given"
      ? debtors.filter(d => d.debts.some(debt => debt.branch_id !== 1))
      : debtors.filter(d => d.debts.some(debt => debt.branch_id === 1));

    const grandTotal = filteredDebtors.reduce((sum, d) => sum + d.totalAmount, 0);

    printCheque({
      title: "ÐžÑ‚Ñ‡Ñ‘Ñ‚ Ð¿Ð¾ Ð´Ð¾Ð»Ð¶Ð½Ð¸ÐºÐ°Ð¼",
      number: generateChequeNumber(),
      date: new Date(),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: `Ð¢Ð¸Ð¿: ${debtTypeFilter === "given" ? "Berilgan Nasiya" : debtTypeFilter === "taken" ? "Nasiyam" : "Barcha Qarzlar"} | Ð”Ð¾Ð»Ð¶Ð½Ð¸ÐºÐ¾Ð²: ${filteredDebtors.length}`,
      products: filteredDebtors.map((debtor) => {
        const relevantDebts = debtTypeFilter === "all"
          ? debtor.debts
          : debtTypeFilter === "given"
          ? debtor.debts.filter(d => d.branch_id !== 1)
          : debtor.debts.filter(d => d.branch_id === 1);
        const debtorTotal = relevantDebts.reduce((s, d) => s + d.amount, 0);
        return {
          name: `${debtor.name} (${relevantDebts.length} Ð´Ð¾Ð»Ð³(Ð¾Ð²))`,
          quantity: relevantDebts.length,
          unit: "pcs",
          price: debtorTotal / relevantDebts.length,
          total: debtorTotal,
        };
      }),
      totalAmount: grandTotal,
      signatureLeft: "Ð ÑƒÐºÐ¾Ð²Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒ",
      signatureRight: "Ð‘ÑƒÑ…Ð³Ð°Ð»Ñ‚ÐµÑ€",
    });
  };

  /* ================= FILTER + SORT ================= */

  const applyFilters = (input: Debt[]) => {
    let list = [...input];

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

    return list;
  };

  const filteredAndSorted = useMemo(() => {
    const list = applyFilters(debts);
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
    const total = filteredAndSorted.reduce((sum, debt) => sum + debt.amount, 0);
    const basePaid = filteredAndSorted
      .filter((d) => d.isreturned)
      .reduce((sum, d) => sum + d.amount, 0);
    const baseRemaining = Math.max(0, total - basePaid);

    const uniqueNames = new Set(filteredAndSorted.map((d) => d.name.trim().toLowerCase()));
    let payments = 0;
    uniqueNames.forEach((key) => {
      payments += paymentsByName.get(key) || 0;
    });

    const returned = basePaid + payments;
    const unreturned = Math.max(0, baseRemaining - payments);
    return { total, unreturned, returned };
  }, [filteredAndSorted, paymentsByName]);

  const debtorCount = useMemo(() => {
    const uniqueNames = new Set(
      filteredAndSorted
        .map((d) => d.name?.trim().toLowerCase())
        .filter((name) => Boolean(name))
    );
    return uniqueNames.size;
  }, [filteredAndSorted]);

  const moliyaStats = useMemo(() => {
    const sumAmount = (list: Debt[]) => list.reduce((sum, d) => sum + d.amount, 0);

    const totalTaken = debts.filter((d) => d.branch_id === 1);
    const totalGiven = debts.filter((d) => d.branch_id === 0);

    const totalTakenAmount = sumAmount(totalTaken);
    const totalGivenAmount = sumAmount(totalGiven);
    const basePaidTaken = sumAmount(totalTaken.filter((d) => d.isreturned));
    const basePaidGiven = sumAmount(totalGiven.filter((d) => d.isreturned));
    const baseRemainingTaken = Math.max(0, totalTakenAmount - basePaidTaken);
    const baseRemainingGiven = Math.max(0, totalGivenAmount - basePaidGiven);

    let paymentsTaken = 0;
    let paymentsGiven = 0;
    const takenNames = new Set(totalTaken.map((d) => d.name.trim().toLowerCase()));
    const givenNames = new Set(totalGiven.map((d) => d.name.trim().toLowerCase()));
    paymentsByName.forEach((amount, nameKey) => {
      if (takenNames.has(nameKey)) paymentsTaken += amount;
      if (givenNames.has(nameKey)) paymentsGiven += amount;
    });

    const unreturnedTakenAmount = Math.max(0, baseRemainingTaken - paymentsTaken);
    const unreturnedGivenAmount = Math.max(0, baseRemainingGiven - paymentsGiven);
    const returnedTakenAmount = basePaidTaken + paymentsTaken;
    const returnedGivenAmount = basePaidGiven + paymentsGiven;

    const unreturnedTakenCount = totalTaken.filter((d) => !d.isreturned).length;
    const unreturnedGivenCount = totalGiven.filter((d) => !d.isreturned).length;
    const returnedTakenCount = totalTaken.filter((d) => d.isreturned).length;
    const returnedGivenCount = totalGiven.filter((d) => d.isreturned).length;

    return {
      totalTakenCount: totalTaken.length,
      totalGivenCount: totalGiven.length,
      totalTakenAmount,
      totalGivenAmount,
      unreturnedTakenCount,
      unreturnedGivenCount,
      unreturnedTakenAmount,
      unreturnedGivenAmount,
      returnedTakenCount,
      returnedGivenCount,
      returnedTakenAmount,
      returnedGivenAmount,
    };
  }, [debts, paymentsByName]);

  /* ================= UI ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Қарзлар юкланмоқда...</p>
        </div>
      </div>
    );
  }

 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
      {/* Header */}
      <header className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Қарз Бошқаруви</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">Мижозлар қарзларини кузатиш ва бошқариш</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus size={20} /> Янги Қарз
        </button>
      </header>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">Кўриниш Режими</h3>
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
              <Folder size={18} /> Қарздорлар
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
              <DollarSign size={18} /> Барча Қарзлар
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
              Статистика
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
                placeholder="Мижоз номи бўйича қидириш..."
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
            <option value="">Барча Филиаллар</option>
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
            <option value="all">Барча Ҳолатлар</option>
            <option value="unreturned">Фақат Қайтарилмаган</option>
            <option value="returned">Фақат Қайтарилган</option>
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Filter size={18} /> Қўшимча
          </button>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Download size={18} /> Юклаш
          </button>

          {/* Print Button */}
          <button
            onClick={printAllDebts}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-purple-300 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            Барчасини Чоп Етиш
          </button>

          {/* Print by Debtors Button */}
          <button
            onClick={printByDebtors}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            Қарздорлар Бўйича Чоп Етиш
          </button>

          {/* Quick Filter Buttons */}
          <button
            onClick={() => {
              setFilterStatus("unreturned");
              fetchUnreturnedDebts();
            }}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium text-sm"
          >
            Қайтарилмаган
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Қўшимча Филтрлар</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Бошланиш Санаси</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тугаш Санаси</label>
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
                  <span className="text-sm font-medium text-gray-700">Оралиқ бўйича Филтрлаш</span>
                </label>
                <button
                  onClick={() => {
                    setFilterByDateRange(false);
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                  className="ml-auto px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Тозалаш
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Debtor Count */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 text-sm">
          <div className="p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">Қарздорлар</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">{debtorCount}</p>
          </div>
        </div>
      </div>

      {/* STATISTICS VIEW */}
      {viewMode === "statistics" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6">Қарз Статистикаси Кўриниши</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Given Debts (Berilgan Nasiya) */}
              <div className="border-2 border-blue-200 rounded-lg p-4 sm:p-5 md:p-6 bg-blue-50">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  Берилган Насия
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-blue-200">
                    <span className="text-gray-700">Жами Сони:</span>
                    <span className="font-bold text-blue-900">{moliyaStats.totalGivenCount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-blue-200">
                    <span className="text-gray-700">Жами Сумма:</span>
                    <span className="font-bold text-blue-900">
                      {moliyaStats.totalGivenAmount.toLocaleString("en-US")} ₽
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-blue-200">
                    <span className="text-gray-700">Тўланган Сумма:</span>
                    <span className="font-bold text-green-700">
                      {moliyaStats.returnedGivenAmount.toLocaleString("en-US")} ₽
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Қайтарилмаган:</span>
                    <span className="font-bold text-red-700">
                      {moliyaStats.unreturnedGivenCount}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Қайтарилган:</span>
                    <span className="font-bold text-green-700">
                      {moliyaStats.returnedGivenCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* My Debts (Nasiyam) */}
              <div className="border-2 border-red-200 rounded-lg p-4 sm:p-5 md:p-6 bg-red-50">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  Насиям
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-red-200">
                    <span className="text-gray-700">Жами Сони:</span>
                    <span className="font-bold text-red-900">{moliyaStats.totalTakenCount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-red-200">
                    <span className="text-gray-700">Жами Сумма:</span>
                    <span className="font-bold text-red-900">
                      {moliyaStats.totalTakenAmount.toLocaleString("en-US")} ₽
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-red-200">
                    <span className="text-gray-700">Тўланган Сумма:</span>
                    <span className="font-bold text-green-700">
                      {moliyaStats.returnedTakenAmount.toLocaleString("en-US")} ₽
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Қайтарилмаган:</span>
                    <span className="font-bold text-red-700">
                      {moliyaStats.unreturnedTakenCount}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Қайтарилган:</span>
                    <span className="font-bold text-green-700">
                      {moliyaStats.returnedTakenCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Summary */}
            <div className="mt-4 md:mt-6 border-2 border-purple-200 rounded-lg p-4 sm:p-5 md:p-6 bg-purple-50">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-purple-900 mb-4">Умумий Хулосала</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Жами Қарзлар</p>
                  <p className="text-2xl font-bold text-purple-900">{debts.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Жами Сумма</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {debts.reduce((sum, d) => sum + d.amount, 0).toLocaleString("en-US")}
                  </p>
                </div>
              </div>
            </div>

            {/* Net Position */}
            <div className="mt-4 md:mt-6 border-2 border-gray-300 rounded-lg p-4 sm:p-5 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4"> š–ï¸ Соф Позиция</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Мен Олишим Керак:</span>
                  <span className="font-bold text-green-700 text-lg">
                    +{moliyaStats.unreturnedGivenAmount.toLocaleString("en-US")} ₽
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-700">Мен Тўлашим Керак:</span>
                  <span className="font-bold text-red-700 text-lg">
                    -{moliyaStats.unreturnedTakenAmount.toLocaleString("en-US")} ₽
                  </span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-300 mt-3">
                  <span className="font-bold text-gray-900 text-lg">Соф Баланс:</span>
                  <span className={`font-bold text-xl ${
                    (moliyaStats.unreturnedGivenAmount - moliyaStats.unreturnedTakenAmount) >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}>
                    {(moliyaStats.unreturnedGivenAmount - moliyaStats.unreturnedTakenAmount).toLocaleString("en-US")} ₽
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
              Қарздорлар ({getUniqueDebtors.length})
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Қарзларини кўриш учун қарздорга босинг</p>
          </div>

          <div className="divide-y divide-gray-200">
            {getUniqueDebtors.length === 0 ? (
              <div className="p-8 sm:p-10 md:p-12 text-center">
                <User size={48} className="text-gray-300 mb-4 mx-auto" />
                <p className="text-base sm:text-lg md:text-xl font-medium text-gray-900">Қарздорлар топилмади</p>
                <p className="text-sm md:text-base text-gray-500 mt-1">Янги қарз қўшишдан бошланг</p>
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
                          {debtor.totalDebts} қарз
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
                  <p className="text-xs sm:text-sm md:text-base font-medium text-blue-700">Қарзлари кўрсатилмоқда:</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-blue-900">{selectedDebtor}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDebtor(null)}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium flex items-center justify-center gap-2"
              >
                <X size={18} /> Филтрни Тозалаш
              </button>
            </div>
          )}
          
          {/* Mobile/Tablet Card View */}
          <div className="block xl:hidden space-y-3">
            {filteredAndSorted.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <DollarSign size={48} className="text-gray-300 mb-4 mx-auto" />
                <p className="text-lg font-medium text-gray-900">Қарзлар топилмади</p>
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
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Жами Сумма:</span>
                      <span className="font-semibold text-gray-900">
                        {debt.amount.toLocaleString("en-US")} ₽
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Филиал:</span>
                      <span className="text-gray-900">{getBranchName(debt.branch_id)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Тур:</span>
                      <span className={`text-xs font-semibold ${debt.branch_id === 1 ? "text-red-600" : "text-blue-600"}`}>
                        {debt.branch_id=== 1? "Nasiyam" : "Berilgan"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Маҳсулотлар:</span>
                      <p className="text-gray-900 text-xs mt-1 line-clamp-2">{formatProductsForDisplay(debt.product_names)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => printDebt(debt)}
                      className="flex-1 p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm"
                    >
                      <Printer size={16} /> Чоп Етиш
                    </button>

                    <button
                      onClick={() => fetchDebtById(debt.id)}
                      className="flex-1 p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm"
                    >
                      <Eye size={16} /> Кўриш
                    </button>


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
                    Сана
                    {getSortIcon("date")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Мижоз
                    {getSortIcon("name")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Тур
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Жами
                    {getSortIcon("amount")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Амаллар
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <DollarSign size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900">Қарзлар топилмади</p>
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
                            {debt.amount.toLocaleString("en-US")} ₽
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => printDebt(debt)}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                              title="Чоп Етиш"
                            >
                              <Printer size={18} />
                            </button>

                            <button
                              onClick={() => fetchDebtById(debt.id)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                              title="Батафсил Кўриш"
                            >
                              <Eye size={18} />
                            </button>


                            <button
                              onClick={() => openEditModal(debt)}
                              className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                              title="Таҳрирлаш"
                            >
                              <Edit2 size={18} />
                            </button>

                            <button
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                              title="Ўчириш"
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
                    <td colSpan={3} className="px-6 py-4 text-right text-base text-gray-900">
                      ТОТАЛ:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                      {filteredAndSorted.reduce((sum, d) => sum + d.amount, 0).toLocaleString("en-US")} ₽
                    </td>
                    <td className="px-6 py-4"></td>
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
                <p className="text-xs font-medium text-blue-700 mb-1">Сана</p>
                <p className="text-lg font-bold text-blue-900">{formatDate(selectedDebt)}</p>
              </div>

              {/* Amount */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-700 mb-1">Жами Сумма</p>
                <p className="text-3xl font-bold text-purple-900">{selectedDebt.amount.toLocaleString("en-US")} ₽</p>
              </div>

              {/* Debt Type */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-1">Қарз Тури</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedDebt.branch_id === 1 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {selectedDebt.branch_id === 1 ? "Nasiyam" : "Berilgan Nasiya"}
                </span>
              </div>

              {/* Products */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-3">Маҳсулотлар</p>
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
                              {product.quantity} {formatUnitLabel(product.unit)} × {Number(product.price).toLocaleString("en-US")} ₽ = {(Number(product.quantity) * Number(product.price)).toLocaleString("en-US")} ₽
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 italic">Маҳсулотлар топилмади</p>
                )}
              </div>

              {/* Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600 font-medium">Дебт ИД:</span>
                  <span className="font-mono text-gray-900">{selectedDebt.id}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600 font-medium">Шоп ИД:</span>
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
                Ёпиш
              </button>
              <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                <button
                  onClick={async () => {
                    try {
                      const toastId = toast.loading("Савинг чангес...");
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
                        render: " Changes saved successfully",
                        type: "success",
                        isLoading: false,
                        autoClose: 3000,
                      });
                      fetchStatistics();
                      fetchUnreturnedDebtsCache();
                      setShowDebtDetail(false);
                    } catch (err: any) {
                      console.error(err);
                      toast.error(`   Œ Failed to save: ${err.message}`);
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  Ўзгаришларни Сақлаш
                </button>
                <button
                  onClick={() => printDebt(selectedDebt)}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
                >
                  Чоп Етиш
                </button>
                <button
                  onClick={() => {
                    setShowDebtDetail(false);
                    openEditModal(selectedDebt);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} /> Таҳрирлаш
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
                <Plus size={24} /> Янги Қарз Яратиш
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
                    quantity: "",
                    price: "",
                    totalPaid: 0,
                    unit: "pcs",
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
                    Мижоз Номи <span className="text-red-500">*</span>
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
                    placeholder="Мижоз номини киритинг"
                    required
                  />
                  
                  {/* Autocomplete Suggestions */}
                  {showSuggestions && filteredDebtorSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 text-xs text-gray-500 font-medium border-b border-gray-200">
                        Мавжуд Қарздорлар
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
                                  {debtor.totalDebts} қарз
                                </p>
                              </div>
                            </div>
                            {debtor.unreturnedAmount > 0 && (
                              <span className="text-xs font-semibold text-red-600">
                                {debtor.unreturnedAmount.toLocaleString("en-US")} кутилмоқда
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
                  <h3 className="text-base font-bold text-gray-900 mb-4">Маҳсулотлар</h3>

                  {/* Product Input Fields */}
                  <div className="space-y-3 mb-4 bg-white p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Маҳсулот Номи</label>
                        <input
                          type="text"
                          value={currentProduct.name}
                          onChange={(e) =>
                            setCurrentProduct({ ...currentProduct, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Масалан: Қалай"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Миқдори</label>
                        <input
                          type="number"
                          value={currentProduct.quantity}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              quantity: e.target.value === ""
                                ? ""
                                : Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">О €˜лчов</label>
                        <select
                          value={currentProduct.unit}
                          onChange={(e) =>
                            setCurrentProduct({ ...currentProduct, unit: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {UNIT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Нархи (сўм)</label>
                        <input
                          type="number"
                          value={currentProduct.price}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              price: e.target.value === ""
                                ? ""
                                : Math.max(0, Number.parseFloat(e.target.value) || 0),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          placeholder="0"
                        />
                      </div></div>

                    {/* Quick Info */}
                    {Number(currentProduct.price) > 0 && Number(currentProduct.quantity) > 0 && (
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">
                          Жами: <span className="font-bold text-blue-900">
                            {(Number(currentProduct.price) * Number(currentProduct.quantity)).toLocaleString("en-US")} ₽  {formatUnitLabel(currentProduct.unit)}
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
                      <Plus size={18} /> Маҳсулотни Қўшиш
                    </button>
                  </div>

                  {/* Added Products List */}
                  {productEntries.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Танланган Маҳсулотлар ({productEntries.length})
                        </h4>
                        <button
                          type="button"
                          onClick={clearAllProducts}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Барчасини Тозалаш
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
                                  {product.quantity} {formatUnitLabel(product.unit)} × {Number(product.price).toLocaleString("en-US")} ₽ = {(Number(product.quantity) * Number(product.price)).toLocaleString("en-US")} ₽
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
                        <span>Жами Сумма:</span>
                        <span className="text-lg text-blue-900">
                          {calculateTotalFromProducts(productEntries).toLocaleString("en-US")} ₽
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
                    quantity: "",
                    price: "",
                    totalPaid: 0,
                    unit: "pcs",
                  });
                  setDebtorNameInput("");
                  setShowSuggestions(false);
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Бекор қилиш
              </button>
              <button
                onClick={handleCreateDebt}
                disabled={productEntries.length === 0 || !formData.name}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Қарз Яратиш
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
                <Edit2 size={24} /> Қарзни Таҳрирлаш
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Мижоз Номи *</label>
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
                  <h3 className="text-base font-bold text-gray-900 mb-4">Маҳсулотлар</h3>

                  {/* Product Input Fields */}
                  <div className="space-y-3 mb-4 bg-white p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Маҳсулот Номи</label>
                        <input
                          type="text"
                          value={currentProduct.name}
                          onChange={(e) =>
                            setCurrentProduct({ ...currentProduct, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Масалан: Қалай"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Миқдори</label>
                        <input
                          type="number"
                          value={currentProduct.quantity}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              quantity: e.target.value === ""
                                ? ""
                                : Math.max(1, Number.parseInt(e.target.value, 10) || 1),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">О €˜лчов</label>
                        <select
                          value={currentProduct.unit}
                          onChange={(e) =>
                            setCurrentProduct({ ...currentProduct, unit: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {UNIT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Нархи (сўм)</label>
                        <input
                          type="number"
                          value={currentProduct.price}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              price: e.target.value === ""
                                ? ""
                                : Math.max(0, Number.parseFloat(e.target.value) || 0),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                          placeholder="0"
                        />
                      </div></div>

                    {/* Quick Info */}
                    {Number(currentProduct.price) > 0 && Number(currentProduct.quantity) > 0 && (
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <p className="text-xs text-gray-600">
                          Жами: <span className="font-bold text-blue-900">
                            {(Number(currentProduct.price) * Number(currentProduct.quantity)).toLocaleString("en-US")} ₽  {formatUnitLabel(currentProduct.unit)}
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
                      <Plus size={18} /> Маҳсулотни Қўшиш
                    </button>
                  </div>

                  {/* Added Products List */}
                  {productEntries.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Танланган Маҳсулотлар ({productEntries.length})
                        </h4>
                        <button
                          type="button"
                          onClick={clearAllProducts}
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                        >
                          Барчасини Тозалаш
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
                                  {product.quantity} {formatUnitLabel(product.unit)} × {Number(product.price).toLocaleString("en-US")} ₽ = {(Number(product.quantity) * Number(product.price)).toLocaleString("en-US")} ₽
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
                        <span>Жами Сумма:</span>
                        <span className="text-lg text-orange-900">
                          {calculateTotalFromProducts(productEntries).toLocaleString("en-US")} ₽
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Branch is set automatically */}

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
                Бекор қилиш
              </button>
              <button
                onClick={handleUpdateDebt}
                className="w-full sm:w-auto px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
              >
                <Edit2 size={18} /> Янгилаш
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}




