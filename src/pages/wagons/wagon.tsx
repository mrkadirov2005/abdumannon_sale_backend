import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Eye,
  Filter,
  Package,
  DollarSign,
  AlertCircle,
  Check,
  ChevronUp,
  ChevronDown,
  Folder,
  User,
  ChevronRight,
} from "lucide-react";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { useSelector } from "react-redux";
import { accessTokenFromStore } from "../../redux/selectors";

// Types
interface Product {
  product_id: string;
  product_name: string;
  amount: number;
  price: number;
  subtotal: number;
  paid_amount?: number;
}

interface Wagon {
  id: string;
  wagon_number: string;
  products: Product[];
  total: number;
  paid_amount?: number;
  indicator: "debt_taken" | "debt_given" | "none";
  shop_id: string | null;
  branch: number | null;
  created_by: string | null;
  created_at: string;
}

interface Statistics {
  total_wagons: number;
  debt_taken_count: number;
  debt_given_count: number;
  none_count: number;
  total_amount: number;
  debt_taken_amount: number;
  debt_given_amount: number;
}

const WagonsPage: React.FC = () => {
  // State Management
  const [wagons, setWagons] = useState<Wagon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [indicatorFilter, setIndicatorFilter] = useState<"all" | "debt_taken" | "debt_given" | "none">("all");
  const [sortField, setSortField] = useState<"created_at" | "wagon_number" | "total">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  // View Mode States
  const [viewMode, setViewMode] = useState<"list" | "folders" | "statistics">("folders");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedWagon, setSelectedWagon] = useState<Wagon | null>(null);

  ///selecctors
      const token = useSelector(accessTokenFromStore)
      console.log("token in wagon page:", token);

  // Form State
  const [formData, setFormData] = useState({
    wagon_number: "",
    indicator: "none" as "debt_taken" | "debt_given" | "none",
    shop_id: "" as string,
    branch: null as number | null,
  });

  const [productRows, setProductRows] = useState<Array<{
    product_id: string;
    product_name: string;
    amount: string;
    price: string;
    paid_amount: string;
  }>>([{ product_id: "", product_name: "", amount: "", price: "", paid_amount: "" }]);

  // Statistics State
  const [statistics, setStatistics] = useState<Statistics>({
    total_wagons: 0,
    debt_taken_count: 0,
    debt_given_count: 0,
    none_count: 0,
    total_amount: 0,
    debt_taken_amount: 0,
    debt_given_amount: 0,
  });

  // Fetch Wagons
  const fetchWagons = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.wagons.getAll}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "authorization": `${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setWagons(data.data);
        calculateStatistics(data.data);
      } else {
        toast.error("Vagonlarni yuklashda xatolik");
      }
    } catch (error) {
      console.error("Error fetching wagons:", error);
      toast.error("Serverga ulanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWagons();
  }, []);

  // Calculate Statistics
  const calculateStatistics = (wagonData: Wagon[]) => {
    const stats = {
      total_wagons: wagonData.length,
      debt_taken_count: wagonData.filter((w) => w.indicator === "debt_taken").length,
      debt_given_count: wagonData.filter((w) => w.indicator === "debt_given").length,
      none_count: wagonData.filter((w) => w.indicator === "none").length,
      total_amount: wagonData.reduce((sum, w) => sum + parseFloat(w.total.toString()), 0),
      debt_taken_amount: wagonData
        .filter((w) => w.indicator === "debt_taken")
        .reduce((sum, w) => sum + parseFloat(w.total.toString()), 0),
      debt_given_amount: wagonData
        .filter((w) => w.indicator === "debt_given")
        .reduce((sum, w) => sum + parseFloat(w.total.toString()), 0),
    };
    setStatistics(stats);
  };

  // Create Wagon
  const handleCreateWagon = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate products
    const validProducts = productRows.filter(
      (row) => row.product_id && row.product_name && row.amount && row.price
    );

    if (validProducts.length === 0) {
      toast.error("Kamida bitta mahsulot qo'shing");
      return;
    }

    const products = validProducts.map((row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      amount: parseFloat(row.amount),
      price: parseFloat(row.price),
      paid_amount: row.paid_amount ? parseFloat(row.paid_amount) : 0,
    }));

    // Calculate total paid amount from products
    const totalPaidAmount = products.reduce((sum, p) => sum + (p.paid_amount || 0), 0);

    try {
      const uuid = localStorage.getItem("uuid");

      const response = await fetch(`${DEFAULT_ENDPOINT}/wagons/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
          uuid: uuid || "",
        },
        body: JSON.stringify({
          ...formData,
          shop_id: formData.shop_id || null,
          paid_amount: totalPaidAmount,
          products,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Vagon muvaffaqiyatli yaratildi");
        setShowCreateModal(false);
        resetForm();
        fetchWagons();
      } else {
        toast.error(data.message || "Vagon yaratishda xatolik");
      }
    } catch (error) {
      console.error("Error creating wagon:", error);
      toast.error("Serverga ulanishda xatolik");
    }
  };

  // Update Wagon
  const handleUpdateWagon = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWagon) return;

    const validProducts = productRows.filter(
      (row) => row.product_id && row.product_name && row.amount && row.price
    );

    const products = validProducts.map((row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      amount: parseFloat(row.amount),
      price: parseFloat(row.price),
      paid_amount: row.paid_amount ? parseFloat(row.paid_amount) : 0,
    }));

    // Calculate total paid amount from products
    const totalPaidAmount = products.reduce((sum, p) => sum + (p.paid_amount || 0), 0);

    try {
      
      const uuid = localStorage.getItem("uuid");

      const response = await fetch(`${DEFAULT_ENDPOINT}/wagons/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
          uuid: uuid || "",
        },
        body: JSON.stringify({
          id: selectedWagon.id,
          ...formData,
          shop_id: formData.shop_id || null,
          paid_amount: totalPaidAmount,
          products,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Vagon muvaffaqiyatli yangilandi");
        setShowEditModal(false);
        resetForm();
        fetchWagons();
      } else {
        toast.error(data.message || "Vagon yangilashda xatolik");
      }
    } catch (error) {
      console.error("Error updating wagon:", error);
      toast.error("Serverga ulanishda xatolik");
    }
  };

  // Delete Wagon
  const handleDeleteWagon = async (id: string) => {
    if (!window.confirm("Ushbu vagonni o'chirishni xohlaysizmi?")) return;

    try {
      
      const uuid = localStorage.getItem("uuid");

      const response = await fetch(`${DEFAULT_ENDPOINT}/wagons/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "authorization": `${token}`,
          uuid: uuid || "",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Vagon o'chirildi");
        fetchWagons();
      } else {
        toast.error(data.message || "Vagon o'chirishda xatolik");
      }
    } catch (error) {
      console.error("Error deleting wagon:", error);
      toast.error("Serverga ulanishda xatolik");
    }
  };

  // Open Edit Modal
  const openEditModal = (wagon: Wagon) => {
    setSelectedWagon(wagon);
    setFormData({
      wagon_number: wagon.wagon_number,
      indicator: wagon.indicator,
      shop_id: wagon.shop_id || "",
      branch: wagon.branch,
    });
    setProductRows(
      wagon.products.map((p) => ({
        product_id: p.product_id,
        product_name: p.product_name,
        amount: p.amount.toString(),
        price: p.price.toString(),
        paid_amount: p.paid_amount ? p.paid_amount.toString() : "\"",
      }))
    );
    setShowEditModal(true);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      wagon_number: "",
      indicator: "none",
      shop_id: "",
      branch: null,
    });
    setProductRows([{ product_id: "", product_name: "", amount: "", price: "", paid_amount: "" }]);
    setSelectedWagon(null);
  };

  // Add Product Row
  const addProductRow = () => {
    setProductRows([...productRows, { product_id: "", product_name: "", amount: "", price: "", paid_amount: "" }]);
  };

  // Remove Product Row
  const removeProductRow = (index: number) => {
    if (productRows.length > 1) {
      setProductRows(productRows.filter((_, i) => i !== index));
    }
  };

  // Update Product Row
  const updateProductRow = (index: number, field: string, value: string) => {
    const updated = [...productRows];
    updated[index] = { ...updated[index], [field]: value };
    setProductRows(updated);
  };

  // Filtering and Sorting
  const filteredAndSorted = useMemo(() => {
    let list = [...wagons];

    // Filter by indicator
    if (indicatorFilter !== "all") {
      list = list.filter((w) => w.indicator === indicatorFilter);
    }

    // Filter by selected person (wagon_number in folders view)
    if (selectedPerson) {
      list = list.filter((w) => w.wagon_number.toLowerCase() === selectedPerson.toLowerCase());
    }

    // Filter by search
    if (searchQuery) {
      list = list.filter((w) => w.wagon_number.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort
    list.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "created_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (sortField === "total") {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return list;
  }, [wagons, indicatorFilter, selectedPerson, searchQuery, sortField, sortDirection]);

  // Get unique persons (wagon numbers grouped)
  const getUniquePersons = useMemo(() => {
    const personsMap = new Map<string, { name: string; totalWagons: number; totalAmount: number; wagons: Wagon[] }>();

    let filteredWagons = wagons;
    if (indicatorFilter !== "all") {
      filteredWagons = wagons.filter((w) => w.indicator === indicatorFilter);
    }

    filteredWagons.forEach((wagon) => {
      const name = wagon.wagon_number;
      if (personsMap.has(name)) {
        const existing = personsMap.get(name)!;
        existing.totalWagons++;
        existing.totalAmount += parseFloat(wagon.total.toString());
        existing.wagons.push(wagon);
      } else {
        personsMap.set(name, {
          name,
          totalWagons: 1,
          totalAmount: parseFloat(wagon.total.toString()),
          wagons: [wagon],
        });
      }
    });

    return Array.from(personsMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [wagons, indicatorFilter]);

  // Handle Sort
  const handleSort = (field: "created_at" | "wagon_number" | "total") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get Sort Icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  // Format Date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get Indicator Label
  const getIndicatorLabel = (indicator: string) => {
    switch (indicator) {
      case "debt_taken":
        return "Oluvchi";
      case "debt_given":
        return "Sotuvchi";
      case "none":
        return "Yo'q";
      default:
        return indicator;
    }
  };

  // Get person label based on indicator
  const getPersonLabel = (indicator: string) => {
    switch (indicator) {
      case "debt_taken":
        return "Oluvchi"; // We are taking debt, so this person is giving us (buyer from us)
      case "debt_given":
        return "Sotuvchi"; // We are giving debt, so this person is taking from us (seller to us)
      case "none":
        return "Vagon Raqami";
      default:
        return "Vagon Raqami";
    }
  };

  // Get Indicator Color
  const getIndicatorColor = (indicator: string) => {
    switch (indicator) {
      case "debt_taken":
        return "bg-red-100 text-red-800 border-red-200";
      case "debt_given":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "none":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Print Wagon
  const printWagon = (wagon: Wagon) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const productsHtml = wagon.products
      .map(
        (p, i) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${i + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${p.product_name}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.amount}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.price.toLocaleString()} so'm</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${p.subtotal.toLocaleString()} so'm</td>
      </tr>
    `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vagon #${wagon.wagon_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #4F46E5; color: white; padding: 10px; text-align: left; }
            .info { margin: 20px 0; }
            .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>🚛 Vagon Ma'lumotlari</h1>
          <div class="info">
            <p><strong>Vagon Raqami:</strong> ${wagon.wagon_number}</p>
            <p><strong>Indikator:</strong> ${getIndicatorLabel(wagon.indicator)}</p>
            <p><strong>Sana:</strong> ${formatDate(wagon.created_at)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="border: 1px solid #ddd; padding: 10px;">#</th>
                <th style="border: 1px solid #ddd; padding: 10px;">Mahsulot</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Miqdor</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Narx</th>
                <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Jami</th>
              </tr>
            </thead>
            <tbody>
              ${productsHtml}
            </tbody>
          </table>
          <div class="total">
            JAMI: ${parseFloat(wagon.total.toString()).toLocaleString()} so'm
          </div>
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #4F46E5; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Chop Etish
          </button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            🚛 Vagonlar Boshqaruvi
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Vagonlar va yuklar ma'lumotlarini boshqarish
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus size={20} /> Yangi Vagon
        </button>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div 
          onClick={() => {
            setIndicatorFilter("all");
            setViewMode("folders");
            setSelectedPerson(null);
          }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg text-white cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm md:text-base font-semibold opacity-90">Jami Vagonlar</p>
            <Truck size={20} className="opacity-50 hidden md:block" />
          </div>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{statistics.total_wagons}</p>
          <p className="text-xs sm:text-sm opacity-75 mt-1">
            {statistics.total_amount.toLocaleString()} so'm
          </p>
        </div>

        <div 
          onClick={() => {
            setIndicatorFilter("debt_taken");
            setViewMode("folders");
            setSelectedPerson(null);
          }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg text-white cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm md:text-base font-semibold opacity-90">Olingan Qarz</p>
            <AlertCircle size={20} className="opacity-50 hidden md:block" />
          </div>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{statistics.debt_taken_count}</p>
          <p className="text-xs sm:text-sm opacity-75 mt-1">
            {statistics.debt_taken_amount.toLocaleString()} so'm
          </p>
        </div>

        <div 
          onClick={() => {
            setIndicatorFilter("debt_given");
            setViewMode("folders");
            setSelectedPerson(null);
          }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg text-white cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm md:text-base font-semibold opacity-90">Berilgan Qarz</p>
            <DollarSign size={20} className="opacity-50 hidden md:block" />
          </div>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{statistics.debt_given_count}</p>
          <p className="text-xs sm:text-sm opacity-75 mt-1">
            {statistics.debt_given_amount.toLocaleString()} so'm
          </p>
        </div>

        <div 
          onClick={() => setViewMode("statistics")}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg text-white cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm md:text-base font-semibold opacity-90">Statistika</p>
            <Check size={20} className="opacity-50 hidden md:block" />
          </div>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">{statistics.none_count}</p>
          <p className="text-xs sm:text-sm opacity-75 mt-1">Batafsil Ko'rish</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">Ko'rinish Rejimi</h3>
          <div className="flex gap-2 w-full md:w-auto flex-wrap">
            <button
              onClick={() => {
                setViewMode("folders");
                setSelectedPerson(null);
              }}
              className={`flex-1 md:flex-none px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm md:text-base ${
                viewMode === "folders"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Folder size={18} /> 
              {indicatorFilter === "debt_taken" ? "Oluvchilar" : indicatorFilter === "debt_given" ? "Sotuvchilar" : "Shaxslar"}
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                setSelectedPerson(null);
              }}
              className={`flex-1 md:flex-none px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition text-sm md:text-base ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <DollarSign size={18} /> Barcha Vagonlar
            </button>
            <button
              onClick={() => {
                setViewMode("statistics");
                setSelectedPerson(null);
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
            Filtrlar & Qidiruv
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full md:w-auto px-4 py-2 md:py-2.5 text-sm md:text-base bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2"
          >
            <Filter size={18} />
            {showFilters ? "Filtrlarni Yashirish" : "Filtrlarni Ko'rsatish"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Vagon raqami bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={indicatorFilter}
            onChange={(e) => setIndicatorFilter(e.target.value as any)}
            className="w-full px-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Barcha Indikatorlar</option>
            <option value="debt_taken">Olingan Qarz</option>
            <option value="debt_given">Berilgan Qarz</option>
            <option value="none">Yo'q</option>
          </select>

          {(searchQuery || indicatorFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setIndicatorFilter("all");
              }}
              className="w-full px-4 py-2 md:py-2.5 text-sm md:text-base bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition flex items-center justify-center gap-2"
            >
              <X size={18} /> Tozalash
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="mt-4 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm md:text-base text-gray-700">
            <span className="font-bold text-blue-900">{filteredAndSorted.length}</span> ta vagon topildi
          </p>
        </div>
      </div>

      {/* STATISTICS VIEW */}
      {viewMode === "statistics" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-6">📊 Vagonlar Statistikasi</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Debt Taken */}
              <div className="border-2 border-red-200 rounded-lg p-4 sm:p-5 md:p-6 bg-red-50">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  🚛 Olingan Qarz
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-red-200">
                    <span className="text-gray-700">Jami Soni:</span>
                    <span className="font-bold text-red-900">{statistics.debt_taken_count}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-red-100 px-3 rounded-lg">
                    <span className="font-bold text-gray-900">Jami Summa:</span>
                    <span className="font-bold text-red-900 text-lg">
                      {statistics.debt_taken_amount.toLocaleString()} so'm
                    </span>
                  </div>
                </div>
              </div>

              {/* Debt Given */}
              <div className="border-2 border-green-200 rounded-lg p-4 sm:p-5 md:p-6 bg-green-50">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                  💰 Berilgan Qarz
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-green-200">
                    <span className="text-gray-700">Jami Soni:</span>
                    <span className="font-bold text-green-900">{statistics.debt_given_count}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-green-100 px-3 rounded-lg">
                    <span className="font-bold text-gray-900">Jami Summa:</span>
                    <span className="font-bold text-green-900 text-lg">
                      {statistics.debt_given_amount.toLocaleString()} so'm
                    </span>
                  </div>
                </div>
              </div>

              {/* None */}
              <div className="border-2 border-gray-200 rounded-lg p-4 sm:p-5 md:p-6 bg-gray-50">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  ✅ Qarzisiz
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-700">Jami Soni:</span>
                    <span className="font-bold text-gray-900">{statistics.none_count}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Summary */}
            <div className="mt-4 md:mt-6 border-2 border-blue-200 rounded-lg p-4 sm:p-5 md:p-6 bg-blue-50">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-blue-900 mb-4">📈 Umumiy Xulosala</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Jami Vagonlar</p>
                  <p className="text-2xl font-bold text-blue-900">{statistics.total_wagons}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Jami Summa</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {statistics.total_amount.toLocaleString()} so'm
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">O'rtacha Summa</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {statistics.total_wagons > 0 
                      ? (statistics.total_amount / statistics.total_wagons).toFixed(0) 
                      : '0'} so'm
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOLDERS VIEW */}
      {viewMode === "folders" && !selectedPerson && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Folder className="text-blue-600" size={24} />
              {indicatorFilter === "debt_taken" ? "Oluvchilar" : indicatorFilter === "debt_given" ? "Sotuvchilar" : "Shaxslar"} ({getUniquePersons.length})
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Vagonlarini ko'rish uchun shaxsga bosing</p>
          </div>

          <div className="divide-y divide-gray-200">
            {getUniquePersons.length === 0 ? (
              <div className="p-8 sm:p-10 md:p-12 text-center">
                <User size={48} className="text-gray-300 mb-4 mx-auto" />
                <p className="text-base sm:text-lg md:text-xl font-medium text-gray-900">Shaxslar topilmadi</p>
                <p className="text-sm md:text-base text-gray-500 mt-1">Yangi vagon qo'shishdan boshlang</p>
              </div>
            ) : (
              getUniquePersons.map((person) => (
                <div
                  key={person.name}
                  onClick={() => {
                    setSelectedPerson(person.name);
                    setViewMode("list");
                  }}
                  className="p-4 sm:p-5 md:p-6 hover:bg-blue-50 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-3 md:gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg md:text-xl">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate group-hover:text-blue-600 transition">
                          {person.name}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-gray-600">
                          {person.totalWagons} vagon
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                      <div className="text-right">
                        <p className="text-xs sm:text-sm md:text-base font-medium text-gray-600">Jami Summa</p>
                        <p className="text-sm sm:text-lg md:text-xl font-bold text-blue-900">
                          {person.totalAmount.toLocaleString()} so'm
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition flex-shrink-0" size={24} />
                    </div>
                  </div>
                </div>
              ))
  )}
          </div>
        </div>
      )}

      {/* WAGONS LIST/TABLE VIEW */}
      {(viewMode === "list" || selectedPerson) && (
        <>
          {selectedPerson && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg">
                  {selectedPerson.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs sm:text-sm md:text-base font-medium text-blue-700">Vagonlari ko'rsatilmoqda:</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-blue-900">{selectedPerson}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPerson(null)}
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
            <Truck size={48} className="text-gray-300 mb-4 mx-auto" />
            <p className="text-lg font-medium text-gray-900">Vagonlar topilmadi</p>
            <p className="text-sm text-gray-500 mt-1">
              {wagons.length === 0 ? "Yangi vagon qo'shishdan boshlang" : "Filtrlarni o'zgartiring"}
            </p>
          </div>
        ) : (
          filteredAndSorted.map((wagon) => (
            <div
              key={wagon.id}
              className="bg-white rounded-lg shadow-sm p-4 md:p-5 border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{getPersonLabel(wagon.indicator)}</p>
                  <h3 className="font-semibold text-gray-900 text-base md:text-lg">
                    {wagon.indicator === "debt_taken" ? "👤" : wagon.indicator === "debt_given" ? "💼" : "🚛"} {wagon.wagon_number}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500">{formatDate(wagon.created_at)}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getIndicatorColor(
                    wagon.indicator
                  )}`}
                >
                  {getIndicatorLabel(wagon.indicator)}
                </span>
              </div>

              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mahsulotlar:</span>
                  <span className="font-semibold text-gray-900">{wagon.products.length} ta</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-600 font-bold">Jami Summa:</span>
                  <span className="font-bold text-blue-600 text-base md:text-lg">
                    {parseFloat(wagon.total.toString()).toLocaleString()} so'm
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => printWagon(wagon)}
                  className="flex-1 p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm"
                >
                  🖨️ Chop
                </button>

                <button
                  onClick={() => {
                    setSelectedWagon(wagon);
                    setShowDetailModal(true);
                  }}
                  className="flex-1 p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm"
                >
                  <Eye size={16} /> Ko'rish
                </button>

                <button
                  onClick={() => openEditModal(wagon)}
                  className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => handleDeleteWagon(wagon.id)}
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
                  onClick={() => handleSort("created_at")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Sana
                    {getSortIcon("created_at")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("wagon_number")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    {indicatorFilter === "debt_taken" ? "Oluvchi" : indicatorFilter === "debt_given" ? "Sotuvchi" : "Vagon Raqami"}
                    {getSortIcon("wagon_number")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Indikator
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mahsulotlar
                </th>
                <th
                  onClick={() => handleSort("total")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Jami Summa
                    {getSortIcon("total")}
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
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Truck size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900">Vagonlar topilmadi</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {wagons.length === 0
                          ? "Yangi vagon qo'shishdan boshlang"
                          : "Filtrlarni o'zgartiring"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((wagon) => (
                  <tr key={wagon.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(wagon.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {wagon.indicator === "debt_taken" ? "👤" : wagon.indicator === "debt_given" ? "💼" : <Truck size={18} className="text-blue-600" />}
                        <div>
                          <p className="text-xs text-gray-500">{getPersonLabel(wagon.indicator)}</p>
                          <span className="font-semibold text-gray-900">{wagon.wagon_number}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getIndicatorColor(
                          wagon.indicator
                        )}`}
                      >
                        {getIndicatorLabel(wagon.indicator)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Package size={16} />
                        {wagon.products.length} ta
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {parseFloat(wagon.total.toString()).toLocaleString()} so'm
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => printWagon(wagon)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Chop Etish"
                        >
                          🖨️
                        </button>
                        <button
                          onClick={() => {
                            setSelectedWagon(wagon);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Ko'rish"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(wagon)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Tahrirlash"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteWagon(wagon.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="O'chirish"
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
        </>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white flex items-center justify-between rounded-t-xl flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Plus size={24} /> Yangi Vagon Yaratish
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <form onSubmit={handleCreateWagon} className="space-y-4 sm:space-y-6">
                {/* Wagon Number */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    {getPersonLabel(formData.indicator)} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.wagon_number}
                    onChange={(e) => setFormData({ ...formData, wagon_number: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      formData.indicator === "debt_taken" 
                        ? "Masalan: Ali Valiyev" 
                        : formData.indicator === "debt_given"
                        ? "Masalan: Vali Aliyev"
                        : "Masalan: VGN-12345"
                    }
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.indicator === "debt_taken" && "Sizdan oladigan shaxs nomi"}
                    {formData.indicator === "debt_given" && "Sizga sotuvchi shaxs nomi"}
                    {formData.indicator === "none" && "Vagon identifikatsiya raqami"}
                  </p>
                </div>

                {/* Indicator */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Indikator
                  </label>
                  <select
                    value={formData.indicator}
                    onChange={(e) =>
                      setFormData({ ...formData, indicator: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">Yo'q</option>
                    <option value="debt_taken">Olingan Qarz</option>
                    <option value="debt_given">Berilgan Qarz</option>
                  </select>
                </div>

                {/* Shop ID */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Do'kon ID (Shop ID)
                  </label>
                  <input
                    type="text"
                    value={formData.shop_id}
                    onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Do'kon identifikatsiyasi"
                  />
                </div>

                {/* Products */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Mahsulotlar <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {productRows.map((row, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          placeholder="ID"
                          value={row.product_id}
                          onChange={(e) => updateProductRow(index, "product_id", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Mahsulot nomi"
                          value={row.product_name}
                          onChange={(e) => updateProductRow(index, "product_name", e.target.value)}
                          className="sm:col-span-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Miqdor"
                          value={row.amount}
                          onChange={(e) => updateProductRow(index, "amount", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Narx"
                          value={row.price}
                          onChange={(e) => updateProductRow(index, "price", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="To'langan"
                          value={row.paid_amount}
                          onChange={(e) => updateProductRow(index, "paid_amount", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeProductRow(index)}
                          className="sm:col-span-1 p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          disabled={productRows.length === 1}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addProductRow}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus size={18} /> Mahsulot Qo'shish
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Bekor Qilish
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Yaratish
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedWagon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl md:max-w-3xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 sm:p-6 text-white flex items-center justify-between rounded-t-xl flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Edit2 size={24} /> Vagonni Tahrirlash
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <form onSubmit={handleUpdateWagon} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Vagon Raqami <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.wagon_number}
                    onChange={(e) => setFormData({ ...formData, wagon_number: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Indikator
                  </label>
                  <select
                    value={formData.indicator}
                    onChange={(e) =>
                      setFormData({ ...formData, indicator: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">Yo'q</option>
                    <option value="debt_taken">Olingan Qarz</option>
                    <option value="debt_given">Berilgan Qarz</option>
                  </select>
                </div>

                {/* Shop ID */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Do'kon ID (Shop ID)
                  </label>
                  <input
                    type="text"
                    value={formData.shop_id}
                    onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Do'kon identifikatsiyasi"
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Mahsulotlar <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {productRows.map((row, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          placeholder="ID"
                          value={row.product_id}
                          onChange={(e) => updateProductRow(index, "product_id", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Mahsulot nomi"
                          value={row.product_name}
                          onChange={(e) => updateProductRow(index, "product_name", e.target.value)}
                          className="sm:col-span-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Miqdor"
                          value={row.amount}
                          onChange={(e) => updateProductRow(index, "amount", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Narx"
                          value={row.price}
                          onChange={(e) => updateProductRow(index, "price", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="To'langan"
                          value={row.paid_amount}
                          onChange={(e) => updateProductRow(index, "paid_amount", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeProductRow(index)}
                          className="sm:col-span-1 p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          disabled={productRows.length === 1}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addProductRow}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus size={18} /> Mahsulot Qo'shish
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Bekor Qilish
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Edit2 size={18} /> Saqlash
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedWagon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6 text-white flex items-center justify-between sticky top-0">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Eye size={24} /> Vagon Tafsilotlari
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {/* Calculate paid amount from products */}
              {(() => {
                const calculatedPaidAmount = selectedWagon.products.reduce((sum, p) => sum + (p.paid_amount || 0), 0);
                const totalAmount = parseFloat(selectedWagon.total.toString());
                const remainingAmount = totalAmount - calculatedPaidAmount;
                
                return (
                  <>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Vagon Raqami</p>
                        <p className="text-lg font-bold text-blue-900">🚛 {selectedWagon.wagon_number}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Jami Summa</p>
                        <p className="text-lg font-bold text-green-900">
                          {totalAmount.toLocaleString()} so'm
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-600 mb-1">To'langan Summa</p>
                        <p className="text-lg font-bold text-purple-900">
                          {calculatedPaidAmount.toLocaleString()} so'm
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${remainingAmount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <p className="text-sm text-gray-600 mb-1">Qolgan Summa</p>
                        <p className={`text-lg font-bold ${remainingAmount > 0 ? 'text-red-900' : 'text-green-900'}`}>
                          {remainingAmount.toLocaleString()} so'm
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Indikator</p>
                        <p className="text-lg font-bold text-gray-900">
                          {getIndicatorLabel(selectedWagon.indicator)}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Yaratilgan Sana</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatDate(selectedWagon.created_at)}
                        </p>
                      </div>
                    </div>

              {/* Products Table */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Package size={20} /> Mahsulotlar
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                          Mahsulot
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                          Miqdor
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                          Narx
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                          Jami
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                          To'langan
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                          Qolgan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedWagon.products.map((product, index) => {
                        const paid = product.paid_amount || 0;
                        const remaining = product.subtotal - paid;
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {product.product_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {product.amount}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {product.price.toLocaleString()} so'm
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-right">
                              {product.subtotal.toLocaleString()} so'm
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-green-600 text-right">
                              {paid.toLocaleString()} so'm
                            </td>
                            <td className={`px-4 py-3 text-sm font-semibold text-right ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {remaining.toLocaleString()} so'm
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-blue-50 font-bold">
                        <td colSpan={4} className="px-4 py-3 text-right text-gray-900">
                          JAMI:
                        </td>
                        <td className="px-4 py-3 text-right text-blue-900 text-lg">
                          {totalAmount.toLocaleString()} so'm
                        </td>
                        <td className="px-4 py-3 text-right text-green-900 text-lg">
                          {calculatedPaidAmount.toLocaleString()} so'm
                        </td>
                        <td className={`px-4 py-3 text-right text-lg ${remainingAmount > 0 ? 'text-red-900' : 'text-green-900'}`}>
                          {remainingAmount.toLocaleString()} so'm
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => printWagon(selectedWagon)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
                >
                  🖨️ Chop Etish
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedWagon);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} /> Tahrirlash
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Yopish
                </button>
              </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WagonsPage;
