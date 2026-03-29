import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  Package,
  Folder,
  User,
  ChevronRight,
} from "lucide-react";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { useSelector } from "react-redux";
import { accessTokenFromStore } from "../../redux/selectors";
import { DEFAULT_SUPPLIER_HTML, generateChequeNumber, printCheque } from "../../components/ui/ChequeProvider";

const splitWagonNumber = (value: string) => {
  const parts = value.split(",");
  const clientName = (parts[0] || "").trim();
  const wagonNumber = (parts[1] || parts[0] || "").trim();
  return { clientName, wagonNumber };
};

const composeWagonNumber = (clientName: string, wagonNumber: string) => {
  const name = clientName.trim();
  const number = wagonNumber.trim();
  if (!name) return number;
  if (!number) return name;
  return `${name}, ${number}`;
};

// Types
interface Product {
  product_id: string;
  product_name: string;
  amount: number;
  price: number;
  subtotal: number;
  paid_amount?: number;
  unit?: string;
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

const WagonsPage: React.FC = () => {
  const formatNumber = (value: number, minFraction = 0, maxFraction = 0) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction,
    });

  const formatMoney = (value: number) => `${formatNumber(value, 2, 2)} $`;
  const formatQuantity = (value: number) => {
    const numeric = Number(value || 0);
    if (Number.isInteger(numeric)) return formatNumber(numeric, 0, 0);
    return formatNumber(numeric, 4, 4);
  };

  const parseDecimalInput = (raw: string) => {
    const normalized = raw.replace(",", ".").trim();
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const formatDecimalInput = (raw: string, fractionDigits: number) => {
    if (!raw) return raw;
    const numeric = parseDecimalInput(raw);
    if (numeric === null) return raw;
    return numeric.toFixed(fractionDigits);
  };

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

  // State Management
  const [wagons, setWagons] = useState<Wagon[]>([]);
  const [loading, setLoading] = useState(true);
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
    client_name: "",
    wagon_number: generateChequeNumber(),
    indicator: "none" as "debt_taken" | "debt_given" | "none",
    branch: null as number | null,
    created_at: new Date().toISOString().split("T")[0],
  });

  const [productRows, setProductRows] = useState<Array<{
    product_id: string;
    product_name: string;
    amount: string;
    price: string;
    paid_amount: string;
    unit: string;
  }>>([{ product_id: "", product_name: "", amount: "", price: "", paid_amount: "", unit: "pcs" }]);

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
      } else {
        toast.error("Вагонларни юклашда хатолик");
      }
    } catch (error) {
      console.error("Error fetching wagons:", error);
      toast.error("Серверга уланишда хатолик");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWagons();
  }, []);

  // Create Wagon
  const handleCreateWagon = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate products
    const validProducts = productRows.filter(
      (row) => row.product_id && row.product_name && row.amount && row.price
    );

    if (validProducts.length === 0) {
      toast.error("Камида битта маҳсулот қўшинг");
      return;
    }

    const products = validProducts.map((row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      amount: parseFloat(row.amount),
      price: parseFloat(row.price),
      paid_amount: parseFloat(row.paid_amount) || 0, // Send paid_amount as numeric value
      unit: row.unit || "pcs",
    }));

    // Calculate total paid amount - sum of all paid amounts
    const totalPaidAmount = validProducts.reduce((sum, p) => sum + (parseFloat(p.paid_amount) || 0), 0);

    const baseWagonNumber = formData.wagon_number?.trim() || generateChequeNumber();
    const fullWagonNumber = composeWagonNumber(formData.client_name || "", baseWagonNumber);

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
          wagon_number: fullWagonNumber,
          indicator: "none",
          branch: formData.branch,
          created_at: formData.created_at,
          paid_amount: totalPaidAmount,
          products,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Вагон муваффақиятли яратилди");
        setShowCreateModal(false);
        resetForm();
        fetchWagons();
      } else {
        toast.error(data.message || "Vagon yaratishda xatolik");
      }
    } catch (error) {
      console.error("Error creating wagon:", error);
      toast.error("Серверга уланишда хатолик");
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
      paid_amount: parseFloat(row.paid_amount) || 0, // Send paid_amount as numeric value (0 if empty)
      unit: row.unit || "pcs",
    }));

    // Calculate total paid amount - sum of all paid amounts
    const totalPaidAmount = validProducts.reduce((sum, p) => sum + (parseFloat(p.paid_amount) || 0), 0);

    const baseWagonNumber = formData.wagon_number?.trim() || generateChequeNumber();
    const fullWagonNumber = composeWagonNumber(formData.client_name || "", baseWagonNumber);

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
          wagon_number: fullWagonNumber,
          indicator: formData.indicator,
          branch: formData.branch,
          created_at: formData.created_at,
          paid_amount: totalPaidAmount,
          products,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Вагон муваффақиятли янгиланди");
        setShowEditModal(false);
        resetForm();
        fetchWagons();
      } else {
        toast.error(data.message || "Vagon yangilashda xatolik");
      }
    } catch (error) {
      console.error("Error updating wagon:", error);
      toast.error("Серверга уланишда хатолик");
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
        toast.success("Вагон ўчирилди");
        fetchWagons();
      } else {
        toast.error(data.message || "Vagon o'chirishda xatolik");
      }
    } catch (error) {
      console.error("Error deleting wagon:", error);
      toast.error("Серверга уланишда хатолик");
    }
  };

  // Open Edit Modal
  const openEditModal = (wagon: Wagon) => {
    setSelectedWagon(wagon);
    const { clientName, wagonNumber } = splitWagonNumber(wagon.wagon_number);
    
    setFormData({
      client_name: clientName,
      wagon_number: wagonNumber,
      indicator: wagon.indicator,
      branch: wagon.branch,
      created_at: wagon.created_at
        ? new Date(wagon.created_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setProductRows(
      wagon.products.map((p) => {
        const paidAmt = p.paid_amount !== undefined && p.paid_amount !== null ? p.paid_amount : 0;
        return {
          product_id: p.product_id,
          product_name: p.product_name,
          amount: p.amount.toString(),
          price: p.price.toString(),
          paid_amount: paidAmt.toString(),
          unit: p.unit || "pcs",
        };
      })
    );
    setShowEditModal(true);
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      client_name: "",
      wagon_number: generateChequeNumber(),
      indicator: "none",
      branch: null,
      created_at: new Date().toISOString().split("T")[0],
    });
    setProductRows([{ product_id: "", product_name: "", amount: "", price: "", paid_amount: "", unit: "pcs" }]);
    setSelectedWagon(null);
  };

  // Add Product Row
  const addProductRow = () => {
    setProductRows([
      ...productRows,
      { product_id: "", product_name: "", amount: "", price: "", paid_amount: "", unit: "pcs" },
    ]);
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

    // Filter by selected person (client name - part before comma)
    if (selectedPerson) {
      list = list.filter((w) => {
        const clientName = splitWagonNumber(w.wagon_number).clientName || w.wagon_number;
        return clientName.toLowerCase() === selectedPerson.toLowerCase();
      });
    }

    // Sort by newest first
    list.sort((a, b) => {
      const aVal = new Date(a.created_at).getTime();
      const bVal = new Date(b.created_at).getTime();
      return bVal - aVal;
    });

    return list;
  }, [wagons, selectedPerson]);

  // Get unique persons (wagon numbers grouped by client name)
  const getUniquePersons = useMemo(() => {
    const personsMap = new Map<string, { name: string; totalWagons: number; totalAmount: number; wagons: Wagon[] }>();

    wagons.forEach((wagon) => {
      const clientNameRaw = splitWagonNumber(wagon.wagon_number).clientName || wagon.wagon_number;
      const key = clientNameRaw.trim().toLowerCase();
      const displayName = clientNameRaw.trim();

      if (personsMap.has(key)) {
        const existing = personsMap.get(key)!;
        existing.totalWagons++;
        existing.totalAmount += parseFloat(wagon.total.toString());
        existing.wagons.push(wagon);
      } else {
        personsMap.set(key, {
          name: displayName,
          totalWagons: 1,
          totalAmount: parseFloat(wagon.total.toString()),
          wagons: [wagon],
        });
      }
    });

    return Array.from(personsMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [wagons]);

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


  // Print Wagon
  const printWagon = (wagon: Wagon) => {
    const clientName = splitWagonNumber(wagon.wagon_number).clientName;

    printCheque({
      title: "Накладная",
      number: generateChequeNumber(),
      date: wagon.created_at,
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: clientName || "_______________",
      products: wagon.products.map((p) => ({
        name: p.product_name,
        quantity: p.amount,
        unit: p.unit || "pcs",
        price: p.price,
        total: p.subtotal,
      })),
      totalAmount: parseFloat(wagon.total.toString()),
      extraNote: "Возврат товара в течение 14 дней",
      signatureLeft: "Руководитель",
      signatureRight: "Бухгалтер",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Юкланмоқда...</p>
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
            🚛 Вагонлар Бошқаруви
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Вагонлар ва юклар ма'лумотларини бошқариш
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus size={20} /> Янги Вагон
        </button>
      </header>

            {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Жами Вагонлар</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">{wagons.length}</p>
          </div>
          <Truck size={28} className="text-blue-600" />
        </div>
      </div>

            {/* FOLDERS VIEW */}
      {!selectedPerson && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Folder className="text-blue-600" size={24} />
              Шахслар ({getUniquePersons.length})
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Вагонларини кўриш учун шахсга босинг</p>
          </div>

          <div className="divide-y divide-gray-200">
            {getUniquePersons.length === 0 ? (
              <div className="p-8 sm:p-10 md:p-12 text-center">
                <User size={48} className="text-gray-300 mb-4 mx-auto" />
                <p className="text-base sm:text-lg md:text-xl font-medium text-gray-900">Шахслар топилмади</p>
                <p className="text-sm md:text-base text-gray-500 mt-1">Янги вагон қўшишдан бошланг</p>
              </div>
            ) : (
              getUniquePersons.map((person) => (
                <div
                  key={person.name}
                  onClick={() => {
                    setSelectedPerson(person.name);
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
                          {person.totalWagons} вагон
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                      {/* <div className="text-right">
                        <p className="text-xs sm:text-sm md:text-base font-medium text-gray-600">Jami Summa</p>
                        <p className="text-sm sm:text-lg md:text-xl font-bold text-blue-900">
                          {formatMoney(person.totalAmount)} $
                        </p>
                      </div> */}
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
      {selectedPerson && (
        <>
          {selectedPerson && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg">
                  {selectedPerson.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs sm:text-sm md:text-base font-medium text-blue-700">Вагонлари кўрсатилмоқда:</p>
                  <p className="text-base sm:text-lg md:text-xl font-bold text-blue-900">{selectedPerson}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPerson(null)}
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
            <Truck size={48} className="text-gray-300 mb-4 mx-auto" />
            <p className="text-lg font-medium text-gray-900">Вагонлар топилмади</p>
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
                  <h3 className="font-semibold text-gray-900 text-base md:text-lg">
                    🚛 {splitWagonNumber(wagon.wagon_number).wagonNumber || wagon.wagon_number}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500">{formatDate(wagon.created_at)}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Маҳсулотлар:</span>
                  <span className="font-semibold text-gray-900">{wagon.products.length} та</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-600 font-bold">Жами Сумма:</span>
                  <span className="font-bold text-blue-600 text-base md:text-lg">
                    {formatMoney(parseFloat(wagon.total.toString()))}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => printWagon(wagon)}
                  className="flex-1 p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm"
                >
                  🖨️ Чоп
                </button>

                <button
                  onClick={() => {
                    setSelectedWagon(wagon);
                    setShowDetailModal(true);
                  }}
                  className="flex-1 p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1 text-sm"
                >
                  <Eye size={16} /> Кўриш
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Сана
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Вагон Рақами
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Маҳсулотлар
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Жами Сумма
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Амаллар
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Truck size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900">Вагонлар топилмади</p>
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
                        <div>
                          <span className="font-semibold text-gray-900">
                            {splitWagonNumber(wagon.wagon_number).wagonNumber || wagon.wagon_number}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Package size={16} />
                        {wagon.products.length} та
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {formatMoney(parseFloat(wagon.total.toString()))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => printWagon(wagon)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Чоп Етиш"
                        >
                          🖨️
                        </button>
                        <button
                          onClick={() => {
                            setSelectedWagon(wagon);
                            setShowDetailModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Кўриш"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(wagon)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Таҳрирлаш"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteWagon(wagon.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Ўчириш"
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
                <Plus size={24} /> Янги Вагон Яратиш
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
                {/* Client Name */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Клиент Номи <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Масалан: Али Валиев"
                    required
                  />
                </div>

                {/* Wagon Number */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Вагон Рақами <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.wagon_number}
                    onChange={(e) => setFormData({ ...formData, wagon_number: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Масалан: ВГН-12345"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Сана <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.created_at}
                    onChange={(e) => setFormData({ ...formData, created_at: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Products */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Маҳсулотлар <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {productRows.map((row, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          placeholder="ИД"
                          value={row.product_id}
                          onChange={(e) => updateProductRow(index, "product_id", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Маҳсулот номи"
                          value={row.product_name}
                          onChange={(e) => updateProductRow(index, "product_name", e.target.value)}
                          className="sm:col-span-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="^[0-9]*[.,]?[0-9]*$"
                          placeholder="Миқдор"
                          value={row.amount}
                          onChange={(e) => updateProductRow(index, "amount", e.target.value)}
                          onBlur={(e) =>
                            updateProductRow(
                              index,
                              "amount",
                              formatDecimalInput(e.target.value, 4)
                            )
                          }
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={row.unit}
                          onChange={(e) => updateProductRow(index, "unit", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {UNIT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="^[0-9]*[.,]?[0-9]*$"
                          placeholder="Нарх"
                          value={row.price}
                          onChange={(e) => updateProductRow(index, "price", e.target.value)}
                          onBlur={(e) =>
                            updateProductRow(
                              index,
                              "price",
                              formatDecimalInput(e.target.value, 2)
                            )
                          }
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
                      <Plus size={18} /> Маҳсулот Қўшиш
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
                    Бекор Қилиш
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Яратиш
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
                <Edit2 size={24} /> Вагонни Таҳрирлаш
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
                    Клиент Номи <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Масалан: Али Валиев"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Вагон Рақами <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.wagon_number}
                    onChange={(e) => setFormData({ ...formData, wagon_number: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Масалан: ВГН-12345"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Сана <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.created_at}
                    onChange={(e) => setFormData({ ...formData, created_at: e.target.value })}
                    className="w-full px-4 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                    Маҳсулотлар <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {productRows.map((row, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          placeholder="ИД"
                          value={row.product_id}
                          onChange={(e) => updateProductRow(index, "product_id", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Маҳсулот номи"
                          value={row.product_name}
                          onChange={(e) => updateProductRow(index, "product_name", e.target.value)}
                          className="sm:col-span-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="^[0-9]*[.,]?[0-9]*$"
                          placeholder="Миқдор"
                          value={row.amount}
                          onChange={(e) => updateProductRow(index, "amount", e.target.value)}
                          onBlur={(e) =>
                            updateProductRow(
                              index,
                              "amount",
                              formatDecimalInput(e.target.value, 4)
                            )
                          }
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={row.unit}
                          onChange={(e) => updateProductRow(index, "unit", e.target.value)}
                          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {UNIT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="^[0-9]*[.,]?[0-9]*$"
                          placeholder="Нарх"
                          value={row.price}
                          onChange={(e) => updateProductRow(index, "price", e.target.value)}
                          onBlur={(e) =>
                            updateProductRow(
                              index,
                              "price",
                              formatDecimalInput(e.target.value, 2)
                            )
                          }
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
                      <Plus size={18} /> Маҳсулот Қўшиш
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
                    Бекор Қилиш
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
                  >
                    <Edit2 size={18} /> Сақлаш
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
                <Eye size={24} /> Вагон Тафсилотлари
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {(() => {
                const totalAmount = parseFloat(selectedWagon.total.toString());

                return (
                  <>
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-600 mb-1">Вагон Рақами</p>
                        <p className="text-lg font-bold text-blue-900">
                          🚛 {splitWagonNumber(selectedWagon.wagon_number).wagonNumber || selectedWagon.wagon_number}
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Жами Сумма</p>
                        <p className="text-lg font-bold text-green-900">
                          {formatMoney(totalAmount)}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">Яратилган Сана</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatDate(selectedWagon.created_at)}
                        </p>
                      </div>
                    </div>

              {/* Products Table */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Package size={20} /> Маҳсулотлар
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                          Маҳсулот
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                          Миқдор
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                          Нарх
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 border-b">
                          Жами
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedWagon.products.map((product, index) => {
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {product.product_name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {formatQuantity(product.amount)} {formatUnitLabel(product.unit)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {formatMoney(product.price)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600 text-right">
                              {formatMoney(product.subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-blue-50 font-bold">
                        <td colSpan={4} className="px-4 py-3 text-right text-gray-900">
                          ЖАМИ:
                        </td>
                        <td className="px-4 py-3 text-right text-blue-900 text-lg">
                          {formatMoney(parseFloat(selectedWagon.total.toString()))}
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
                  🖨️ Чоп Етиш
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedWagon);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Edit2 size={18} /> Таҳрирлаш
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Ёпиш
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
