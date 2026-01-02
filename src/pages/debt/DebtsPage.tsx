// pages/DebtManagement.tsx
import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  accessTokenFromStore,
  getshopidfromstrore,
  getBranchesFromStore,
  getProductsFromStore,
  getIsSuperUserFromStore,
  getAuthFromStore,
} from "../../redux/selectors";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { toast } from "react-toastify";
import { Search, Plus, Edit2, Trash2, Check, X, DollarSign, Eye, ArrowUpDown, ChevronUp, ChevronDown, Filter, Download } from "lucide-react";
import type { Admin } from "../../../types/types";

/* ================= TYPES ================= */

interface Debt {
  id: string;
  day: number;
  month: number;
  year: number;
  name: string;
  amount: number;
  product_names: string;
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
}

type SortKey = "date" | "name" | "amount" | "isreturned";
type SortDirection = "asc" | "desc";

interface SelectedProduct {
  id: number;
  name: string;
  sell_price: number;
  scale: string;
  quantity: number;
}

/* ================= COMPONENT ================= */

export default function DebtManagement() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DebtStatistics | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [showDebtDetail, setShowDebtDetail] = useState(false);

  // Filters
  const [searchName, setSearchName] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "returned" | "unreturned">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterByDateRange, setFilterByDateRange] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

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
  const [formData, setFormData] = useState({
    name: "",
    amount: "0",
    product_names: [] as string[],
    branch_id: isSuperAdmin ? "" : (authData.user as unknown as Admin).branch,
  });

  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  const token = useSelector(accessTokenFromStore);
  const shop_id = useSelector(getshopidfromstrore);
  const branches = useSelector(getBranchesFromStore);
  const products = useSelector(getProductsFromStore);

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
      toast.success(`Loaded ${json.data?.length || 0} debts`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch debts");
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
      toast.error("Failed to fetch statistics");
    }
  };

  const fetchUnreturnedDebts = async () => {
    try {
      const toastId = toast.loading("📋 Loading unreturned debts...");
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
        render: `✅ Loaded ${json.data?.length || 0} unreturned debts`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch unreturned debts");
    }
  };

  const fetchDebtsByBranch = async (branchId: string) => {
    try {
      const toastId = toast.loading("🏢 Loading branch debts...");
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
        render: `✅ Loaded ${json.data?.length || 0} debts for this branch`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch branch debts");
    }
  };

  const fetchDebtsByCustomer = async (customerName: string) => {
    if (!customerName.trim()) {
      fetchDebts();
      return;
    }

    try {
      const toastId = toast.loading("🔍 Searching debts...");
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
        render: `✅ Found ${json.data?.length || 0} debts for "${customerName}"`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch customer debts");
    }
  };

  const fetchDebtById = async (debtId: string) => {
    try {
      const toastId = toast.loading("📄 Loading debt details...");
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
        render: "✅ Debt details loaded",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch debt details");
    }
  };

  useEffect(() => {
    if (token && shop_id) {
      fetchDebts();
      fetchStatistics();
    }
  }, [token, shop_id]);

  /* ================= PRODUCT HELPERS ================= */

  const toggleProductSelection = (product: any) => {
    const isSelected = formData.product_names.includes(product.name);
    let newProductNames;
    let newSelectedProducts = [...selectedProducts];

    if (isSelected) {
      newProductNames = formData.product_names.filter((name) => name !== product.name);
      newSelectedProducts = selectedProducts.filter((p) => p.id !== product.id);
    } else {
      newProductNames = [...formData.product_names, product.name];
      newSelectedProducts = [
        ...selectedProducts,
        {
          id: product.id,
          name: product.name,
          sell_price: product.sell_price,
          scale: product.scale,
          quantity: 1,
        },
      ];
    }

    setFormData({ ...formData, product_names: newProductNames });
    setSelectedProducts(newSelectedProducts);

    const total = calculateTotalFromProducts(newSelectedProducts);
    setFormData((prev) => ({ ...prev, amount: total.toString() }));
  };

  const updateProductQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedSelectedProducts = selectedProducts.map((product) =>
      product.id === productId ? { ...product, quantity: newQuantity } : product
    );

    setSelectedProducts(updatedSelectedProducts);

    const total = calculateTotalFromProducts(updatedSelectedProducts);
    setFormData((prev) => ({ ...prev, amount: total.toString() }));
  };

  const getProductQuantity = (productId: number) => {
    const product = selectedProducts.find((p) => p.id === productId);
    return product ? product.quantity : 1;
  };

  const calculateTotalFromProducts = (productsArray: SelectedProduct[]) => {
    return productsArray.reduce((total, product) => {
      return total + product.sell_price * (product.quantity || 1);
    }, 0);
  };

  const clearSelectedProducts = () => {
    setFormData((prev) => ({ ...prev, product_names: [], amount: "0" }));
    setSelectedProducts([]);
  };

  /* ================= CRUD OPERATIONS ================= */

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.branch_id || formData.product_names.length === 0) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const toastId = toast.loading("💾 Creating debt...");
      const productNamesString = formData.product_names.join(", ");
      const totalAmount = calculateTotalFromProducts(selectedProducts);

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

      if (!res.ok) {
        throw new Error("Failed to create debt");
      }

      const json = await res.json();
      setDebts([json.data, ...debts]);
      setShowCreateModal(false);
      setFormData({ name: "", amount: "0", product_names: [], branch_id: "" });
      setSelectedProducts([]);
      toast.update(toastId, {
        render: `✅ Debt created for ${json.data.name}`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchStatistics();
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Failed to create debt: ${err.message}`);
    }
  };

  const handleUpdateDebt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDebt) return;

    try {
      const toastId = toast.loading("✏️ Updating debt...");
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.update}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
        },
        body: JSON.stringify({
          id: editingDebt.id,
          name: formData.name,
          amount: parseFloat(formData.amount),
          product_names: Array.isArray(formData.product_names)
            ? formData.product_names.join(", ")
            : formData.product_names,
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
      setFormData({ name: "", amount: "0", product_names: [], branch_id: "" });
      setSelectedProducts([]);
      toast.update(toastId, {
        render: "✅ Debt updated successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchStatistics();
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Failed to update debt: ${err.message}`);
    }
  };

  const handleMarkAsReturned = async (id: string) => {
    try {
      const toastId = toast.loading("⏳ Marking as returned...");
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.mark_returned}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to mark debt as returned");
      }

      const json = await res.json();
      setDebts(debts.map((d) => (d.id === json.data.id ? json.data : d)));
      toast.update(toastId, {
        render: "✅ Debt marked as returned",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchStatistics();
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Failed to mark debt as returned: ${err.message}`);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm("Are you sure you want to delete this debt?")) return;

    try {
      const toastId = toast.loading("🗑️ Deleting debt...");
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.delete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: token ?? "",
          id,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete debt");
      }

      setDebts(debts.filter((d) => d.id !== id));
      toast.update(toastId, {
        render: "✅ Debt deleted successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchStatistics();
      setShowDebtDetail(false);
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Failed to delete debt: ${err.message}`);
    }
  };

  const openEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name,
      amount: debt.amount.toString(),
      product_names: Array.isArray(debt.product_names)
        ? debt.product_names
        : debt.product_names.split(", "),
      branch_id: debt.branch_id.toString(),
    });
    setSelectedProducts([]);
    setShowEditModal(true);
  };

  /* ================= HELPERS ================= */

  const formatDate = (d: Debt) => `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;

  const getTimestamp = (d: Debt) => new Date(formatDate(d)).getTime();

  const getBranchName = (branchId: number) => {
    const branch = branches.branches?.find((b) => b.id === branchId);
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
      const headers = ["Date", "Customer", "Products", "Amount", "Branch", "Status"];
      const rows = filteredAndSorted.map((debt) => [
        formatDate(debt),
        debt.name,
        debt.product_names,
        debt.amount,
        getBranchName(debt.branch_id),
        debt.isreturned ? "Returned" : "Pending",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `debts_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("✅ Debts exported to CSV");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export debts");
    }
  };

  /* ================= FILTER + SORT ================= */

  const filteredAndSorted = useMemo(() => {
    let list = [...debts];

    if (searchName) {
      list = list.filter((d) => d.name.toLowerCase().includes(searchName.toLowerCase()));
    }

    if (filterBranch) {
      list = list.filter((d) => d.branch_id.toString() === filterBranch);
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
  }, [debts, searchName, filterBranch, filterStatus, sortKey, sortDirection, filterByDateRange, filterStartDate, filterEndDate]);

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
          <p className="text-gray-600">Loading debts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Debt Management</h1>
          <p className="text-gray-600">Track and manage customer debts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} /> New Debt
        </button>
      </header>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold opacity-90">Total Debts</p>
              <DollarSign size={24} className="opacity-50" />
            </div>
            <p className="text-4xl font-bold">{statistics.total_debts}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold opacity-90">Unreturned</p>
              <X size={24} className="opacity-50" />
            </div>
            <p className="text-4xl font-bold">{statistics.unreturned_count}</p>
            <p className="text-sm opacity-75 mt-2">{parseFloat(statistics.unreturned_amount).toLocaleString()} so'm</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold opacity-90">Returned</p>
              <Check size={24} className="opacity-50" />
            </div>
            <p className="text-4xl font-bold">{statistics.returned_count}</p>
            <p className="text-sm opacity-75 mt-2">{parseFloat(statistics.returned_amount).toLocaleString()} so'm</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold opacity-90">Total Amount</p>
              <DollarSign size={24} className="opacity-50" />
            </div>
            <p className="text-4xl font-bold">{parseFloat(statistics.total_amount).toLocaleString()}</p>
            <p className="text-sm opacity-75 mt-2">so'm</p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by customer name..."
                value={searchName}
                onChange={(e) => {
                  setSearchName(e.target.value);
                  if (e.target.value.length > 2) {
                    fetchDebtsByCustomer(e.target.value);
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
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Branches</option>
            {branches.branches?.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="unreturned">Unreturned Only</option>
            <option value="returned">Returned Only</option>
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium flex items-center gap-2"
          >
            <Filter size={18} /> Advanced
          </button>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium flex items-center gap-2"
          >
            <Download size={18} /> Export
          </button>

          {/* Quick Filter Buttons */}
          <button
            onClick={() => {
              setFilterStatus("unreturned");
              fetchUnreturnedDebts();
            }}
            className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium text-sm"
          >
            Unreturned
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Advanced Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
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
                  <span className="text-sm font-medium text-gray-700">Filter by Range</span>
                </label>
                <button
                  onClick={() => {
                    setFilterByDateRange(false);
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                  className="ml-auto px-3 py-2 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtered Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-600 font-medium">Records</p>
            <p className="text-2xl font-bold text-blue-900">{filteredAndSorted.length}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-gray-600 font-medium">Total Amount</p>
            <p className="text-2xl font-bold text-purple-900">{totals.total.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-gray-600 font-medium">Unreturned</p>
            <p className="text-2xl font-bold text-red-900">{totals.unreturned.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-gray-600 font-medium">Returned</p>
            <p className="text-2xl font-bold text-green-900">{totals.returned.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort("date")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Date
                    {getSortIcon("date")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Customer
                    {getSortIcon("name")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Products
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Amount
                    {getSortIcon("amount")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Branch
                </th>
                <th
                  onClick={() => handleSort("isreturned")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Status
                    {getSortIcon("isreturned")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <DollarSign size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900">No debts found</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {debts.length === 0 ? "Start by adding a new debt" : "Try adjusting your filters"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((debt) => (
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
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-gray-600 line-clamp-2 truncate" title={debt.product_names}>
                        {debt.product_names}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {debt.amount.toLocaleString()} so'm
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{getBranchName(debt.branch_id)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
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
                          onClick={() => fetchDebtById(debt.id)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>

                        {!debt.isreturned && (
                          <button
                            onClick={() => handleMarkAsReturned(debt.id)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                            title="Mark as Returned"
                          >
                            <Check size={18} />
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(debt)}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>

                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEBT DETAIL MODAL */}
      {showDebtDetail && selectedDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                <p className="text-xs font-medium text-blue-700 mb-1">Date</p>
                <p className="text-lg font-bold text-blue-900">{formatDate(selectedDebt)}</p>
              </div>

              {/* Amount */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-700 mb-1">Amount</p>
                <p className="text-3xl font-bold text-purple-900">{selectedDebt.amount.toLocaleString()} so'm</p>
              </div>

              {/* Products */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Products</p>
                <p className="text-sm text-gray-900">{selectedDebt.product_names}</p>
              </div>

              {/* Status */}
              <div className={`${selectedDebt.isreturned ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border rounded-lg p-4`}>
                <p className="text-xs font-medium text-gray-700 mb-1">Status</p>
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
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2 justify-between sticky bottom-0 flex-wrap">
              <button
                onClick={() => setShowDebtDetail(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Close
              </button>
              <div className="flex gap-2">
                {!selectedDebt.isreturned && (
                  <button
                    onClick={() => {
                      handleMarkAsReturned(selectedDebt.id);
                      setShowDebtDetail(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
                  >
                    <Check size={18} /> Mark Returned
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDebtDetail(false);
                    openEditModal(selectedDebt);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center gap-2"
                >
                  <Edit2 size={18} /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DEBT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus size={24} /> Create New Debt
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", amount: "0", product_names: [], branch_id: "" });
                  setSelectedProducts([]);
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6">
              <form onSubmit={handleCreateDebt} className="space-y-6">
                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                {/* Amount Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={calculateTotalFromProducts(selectedProducts).toLocaleString() + " so'm"}
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 font-bold text-lg text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated from selected products</p>
                </div>

                {/* Products Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Products <span className="text-red-500">*</span>
                  </label>

                  <div className="max-h-72 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 space-y-2">
                    {products.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No products available</p>
                    ) : (
                      products.map((product) => {
                        const isSelected = formData.product_names.includes(product.name);
                        return (
                          <div
                            key={product.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 border-blue-300 ring-1 ring-blue-200"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => toggleProductSelection(product)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                                    <p className="text-xs text-gray-500">{product.scale}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-gray-900">{product.sell_price.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">per unit</p>
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="mt-3 pt-3 border-t border-blue-100">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-700">Quantity:</span>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const qty = getProductQuantity(Number(product.id));
                                            updateProductQuantity(Number(product.id), qty - 1);
                                          }}
                                          className="w-8 h-8 flex items-center justify-center bg-gray-300 rounded-lg hover:bg-gray-400 font-bold"
                                        >
                                          −
                                        </button>
                                        <input
                                          type="number"
                                          min="1"
                                          value={getProductQuantity(Number(product.id))}
                                          onChange={(e) =>
                                            updateProductQuantity(Number(product.id), parseInt(e.target.value) || 1)
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-16 text-center border border-gray-300 rounded-lg py-1 font-semibold"
                                        />
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const qty = getProductQuantity(Number(product.id));
                                            updateProductQuantity(Number(product.id), qty + 1);
                                          }}
                                          className="w-8 h-8 flex items-center justify-center bg-gray-300 rounded-lg hover:bg-gray-400 font-bold"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="ml-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleProductSelection(product);
                                  }}
                                  className="h-5 w-5 text-blue-600 rounded"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Selected Products Summary */}
                {selectedProducts.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center justify-between">
                      <span>Selected Products ({selectedProducts.length})</span>
                      <button
                        type="button"
                        onClick={clearSelectedProducts}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </button>
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedProducts.map((product) => (
                        <div key={product.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                          <div>
                            <span className="font-medium">{product.name}</span>
                            <span className="text-gray-600 ml-2">× {product.quantity}</span>
                          </div>
                          <div className="font-semibold text-blue-900">
                            {(product.sell_price * product.quantity).toLocaleString()} so'm
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between font-bold text-gray-900">
                      <span>Total Amount:</span>
                      <span className="text-lg text-blue-900">
                        {calculateTotalFromProducts(selectedProducts).toLocaleString()} so'm
                      </span>
                    </div>
                  </div>
                )}

                {/* Branch Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {isSuperAdmin ? (
                      <>
                        <option value="">Select branch</option>
                        {branches.branches?.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </>
                    ) : (
                      <option value={(authData.user as unknown as Admin).branch} selected>
                        {(authData.user as unknown as Admin).branch}
                      </option>
                    )}
                  </select>
                </div>
              </form>
            </div>

            {/* MODAL ACTIONS */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2 justify-end sticky bottom-0">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", amount: "0", product_names: [], branch_id: "" });
                  setSelectedProducts([]);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDebt}
                disabled={selectedProducts.length === 0 || !formData.name || !formData.branch_id}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus size={18} /> Create Debt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DEBT MODAL */}
      {showEditModal && editingDebt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white flex items-center justify-between sticky top-0">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Edit2 size={24} /> Edit Debt
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDebt(null);
                  setFormData({ name: "", amount: "0", product_names: [], branch_id: "" });
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6">
              <form onSubmit={handleUpdateDebt} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (so'm) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Products *</label>
                  <textarea
                    value={Array.isArray(formData.product_names) ? formData.product_names.join(", ") : formData.product_names}
                    onChange={(e) => setFormData({ ...formData, product_names: e.target.value.split(", ") })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate product names with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch *</label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select branch</option>
                    {branches.branches?.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Current Status:</span>
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
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDebt(null);
                  setFormData({ name: "", amount: "0", product_names: [], branch_id: "" });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDebt}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center gap-2"
              >
                <Edit2 size={18} /> Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}