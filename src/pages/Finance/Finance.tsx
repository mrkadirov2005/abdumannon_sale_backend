import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import {
  DollarSign,
  Plus,
  Trash2,
  Search,
  Folder,
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

interface Person {
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  wagons: Wagon[];
}

const Finance: React.FC = () => {
  const token = useSelector(accessTokenFromStore);
  const [wagons, setWagons] = useState<Wagon[]>([]);
  const [financeRecords, setFinanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"folders" | "list">("folders");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    type: "income",
    category: "sales",
    date: new Date().toISOString().split("T")[0],
  });

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(token && { Authorization: `${token}` }),
    ...(typeof window !== "undefined" && {
      uuid: localStorage.getItem("uuid") || "",
    }),
  });

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wagonsRes, financeRes] = await Promise.all([
        fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.wagons.getAll}`, {
          method: "GET",
          headers: getHeaders(),
        }),
        fetch(`${DEFAULT_ENDPOINT}/finance`, {
          method: "GET",
          headers: getHeaders(),
        }),
      ]);

      const wagonsData = await wagonsRes.json();
      const financeData = await financeRes.json();

      if (wagonsData.success) {
        setWagons(wagonsData.data);
      }
      if (financeData.data) {
        setFinanceRecords(financeData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Serverga ulanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Group wagons by wagon_number (person)
  const uniquePersons = useMemo(() => {
    const personsMap = new Map<string, Person>();

    wagons.forEach((wagon) => {
      const personName = wagon.wagon_number;
      if (!personsMap.has(personName)) {
        personsMap.set(personName, {
          name: personName,
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          wagons: [],
        });
      }

      const person = personsMap.get(personName)!;
      person.wagons.push(wagon);

      // Calculate totals from products
      const wagonTotal = parseFloat(wagon.total.toString());
      const paidAmount = parseFloat((wagon.paid_amount || 0).toString());

      person.totalAmount += wagonTotal;
      person.paidAmount += paidAmount;
      person.remainingAmount += wagonTotal - paidAmount;
    });

    // Add finance records to persons
    financeRecords.forEach((record) => {
      // Extract person name from description (format: "personName: description")
      const descriptionParts = record.description?.split(": ") || [];
      const personName = descriptionParts[0];

      if (personName && personsMap.has(personName)) {
        const person = personsMap.get(personName)!;
        // Finance records represent money given to the person
        if (record.type === "income") {
          person.paidAmount += parseFloat(record.amount);
          person.remainingAmount -= parseFloat(record.amount);
        }
      }
    });

    return Array.from(personsMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );
  }, [wagons, financeRecords]);

  // Filter persons by search
  const filteredPersons = useMemo(() => {
    return uniquePersons.filter((person) =>
      person.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniquePersons, searchQuery]);

  // Get selected person data
  const selectedPersonData = useMemo(() => {
    return uniquePersons.find((p) => p.name === selectedPerson) || null;
  }, [selectedPerson, uniquePersons]);

  const handleDeleteFinanceRecord = async (id: number) => {
    if (!window.confirm("Ushbu yozuvni o'chirishni xohlaysizmi?")) return;

    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}/finance/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Yozuv o'chirildi");
        fetchData();
      } else {
        toast.error(data.error || "O'chirishda xatolik");
      }
    } catch (error) {
      console.error("Error deleting finance record:", error);
      toast.error("O'chirishda xatolik");
    }
  };

  const handleDeleteWagon = async (wagonId: string) => {
    if (!window.confirm("Ushbu vagonni o'chirishni xohlaysizmi?")) return;

    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}/wagons/delete`, {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify({ id: wagonId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Vagon o'chirildi");
        fetchData();
      } else {
        toast.error(data.message || "O'chirishda xatolik");
      }
    } catch (error) {
      console.error("Error deleting wagon:", error);
      toast.error("O'chirishda xatolik");
    }
  };

  const handleAddPayment = async () => {
    if (!selectedPerson || !formData.amount) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    try {
      console.log("Sending finance record:", {
        ...formData,
        amount: parseFloat(formData.amount),
      });

      const response = await fetch(`${DEFAULT_ENDPOINT}/finance`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          description: `${selectedPerson}: ${formData.description}`,
          type: formData.type,
          category: formData.category,
          date: formData.date,
        }),
      });

      const data = await response.json();
      console.log("Finance response:", data);

      if (response.ok) {
        toast.success("Pul qo'shildi");
        setShowPaymentModal(false);
        setFormData({
          amount: "",
          description: "",
          type: "income",
          category: "sales",
          date: new Date().toISOString().split("T")[0],
        });
        fetchData();
      } else {
        toast.error(data.error || "Pul qo'shishda xatolik");
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Pul qo'shishda xatolik");
    }
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
            💰 Moliyaviy Boshqaruv
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Pul moviy ma'lumotlarini boshqarish va sleduvchi
          </p>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div
          onClick={() => {
            setViewMode("folders");
            setSelectedPerson(null);
          }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg text-white cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm md:text-base font-semibold opacity-90">
              Jami Summa
            </p>
            <DollarSign size={20} className="opacity-50" />
          </div>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">
            {uniquePersons
              .reduce((sum, p) => sum + p.totalAmount, 0)
              .toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm opacity-75 mt-1">
            {uniquePersons.length} ta shaxs
          </p>
        </div>

        <div
          onClick={() => setViewMode("list")}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-3 sm:p-4 md:p-5 shadow-lg text-white cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm md:text-base font-semibold opacity-90">
              Jami Qoldiq
            </p>
            <DollarSign size={20} className="opacity-50" />
          </div>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">
            {uniquePersons
              .reduce((sum, p) => sum + p.remainingAmount, 0)
              .toLocaleString()}
          </p>
          <p className="text-xs sm:text-sm opacity-75 mt-1">To'lanmagan</p>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
            Ko'rinish Rejimi
          </h3>
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
              <Folder size={18} /> Papkalar
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
              <DollarSign size={18} /> Barcha Yozuvlar
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Shaxs nomi bo'yicha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      {viewMode === "folders" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredPersons.map((person) => (
            <div
              key={person.name}
              onClick={() => setSelectedPerson(person.name)}
              className={`p-4 rounded-lg cursor-pointer transition transform hover:scale-105 ${
                selectedPerson === person.name
                  ? "bg-blue-100 border-2 border-blue-500 shadow-lg"
                  : "bg-white border border-gray-200 shadow"
              }`}
            >
              <div className="text-3xl mb-2">📁</div>
              <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                {person.name}
              </h3>
              <p className="text-xs md:text-sm text-blue-600 font-bold mt-1">
                Summa: {person.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs md:text-sm text-green-600 font-bold">
                Qoldiq: {person.remainingAmount.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Vagon Raqami
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Jami Summa
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    To'langan
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Qoldiq
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody>
                {wagons.map((wagon) => (
                  <tr
                    key={wagon.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {wagon.wagon_number}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {parseFloat(wagon.total.toString()).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">
                      {parseFloat((wagon.paid_amount || 0).toString()).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                      {(
                        parseFloat(wagon.total.toString()) -
                        parseFloat((wagon.paid_amount || 0).toString())
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteWagon(wagon.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="O'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Panel */}
      {selectedPerson && selectedPersonData && viewMode === "folders" && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            {selectedPerson}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="text-gray-600 text-sm mb-1">Jami Summa</p>
              <p className="text-3xl font-bold text-blue-600">
                {selectedPersonData.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-gray-600 text-sm mb-1">To'langan</p>
              <p className="text-3xl font-bold text-green-600">
                {selectedPersonData.paidAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="text-gray-600 text-sm mb-1">Qoldiq Summa</p>
              <p className="text-3xl font-bold text-orange-600">
                {selectedPersonData.remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Vagonlar ({selectedPersonData.wagons.length})
          </h3>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Vagon
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Mahsulotlar
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Jami
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    To'langan
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Qoldiq
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Amallar
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedPersonData.wagons.map((wagon) => (
                  <tr
                    key={wagon.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {wagon.wagon_number}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {wagon.products.length}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {parseFloat(wagon.total.toString()).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">
                      {parseFloat((wagon.paid_amount || 0).toString()).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                      {(
                        parseFloat(wagon.total.toString()) -
                        parseFloat((wagon.paid_amount || 0).toString())
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center space-x-2 flex justify-center">
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Pul qo'shish"
                      >
                        <Plus size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteWagon(wagon.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="O'chirish"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">
            Pul berish tarixi ({financeRecords.filter(r => r.description?.startsWith(selectedPerson)).length})
          </h3>

          <div className="space-y-2">
            {financeRecords
              .filter((record) => record.description?.startsWith(selectedPerson))
              .length === 0 ? (
              <p className="text-gray-500">Pul berish tarixi yo'q</p>
            ) : (
              financeRecords
                .filter((record) => record.description?.startsWith(selectedPerson))
                .map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {record.description?.split(": ")[1] || record.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.date).toLocaleDateString("uz-UZ")}
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <p
                        className={`font-bold text-lg ${
                          record.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {record.type === "income" ? "+" : "-"}
                        {parseFloat(record.amount).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFinanceRecord(record.id)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {selectedPerson} ga pul berish
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Summa *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Izohlar
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Pul berish sababi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Turi
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="income">Kirim</option>
                  <option value="expense">Chiqim</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kategoriya
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="sales, purchase, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sana
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Qo'shish
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setFormData({
                    amount: "",
                    description: "",
                    type: "income",
                    category: "sales",
                    date: new Date().toISOString().split("T")[0],
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
