// Complete hook extracted from original DebtsPage.tsx
// This hook contains ALL business logic from the original monolithic component
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
          <div style="margin-bottom: 10px;">
          </div>
          <div class="total-row">
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

  const printAllDebts = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const totalAmount = filteredAndSorted.reduce((sum, d) => sum + d.amount, 0);

    const debtsHTML = filteredAndSorted.map((debt, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${formatDate(debt)}</td>
          <td>${debt.name}</td>
          <td>${debt.amount.toLocaleString()}</td>
          <td><span class="status ${debt.isreturned ? 'returned' : 'pending'}">
            ${debt.isreturned ? '✓ Returned' : '⏳ Pending'}
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
              <th>Jami Summa</th>
              <th>To'langan Summa</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            ${debtsHTML}
            <tr class="total-row">
              <td colspan="3">JAMI</td>
              <td>${totalAmount.toLocaleString()} so'm</td>
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
                <span class="value">${debtorTotal.toLocaleString()} so'm</span>
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
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
          th { border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background: #f5f5f5; }
          td { border: 1px solid #ddd; padding: 8px; }
          .grand-total { margin-top: 30px; padding: 20px; background: #f0f0f0; border-radius: 8px; }
          .grand-total h3 { margin-top: 0; }
          .grand-total-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 15px; }
          .grand-total-item { padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #667eea; }
          .grand-total-item .label { display: block; font-size: 12px; color: #666; margin-bottom: 5px; }
          .grand-total-item .value { display: block; font-size: 20px; font-weight: bold; }
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
