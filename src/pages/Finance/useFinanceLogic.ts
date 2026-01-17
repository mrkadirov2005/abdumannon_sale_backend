import { useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import type {
  Wagon,
  Person,
  FinanceRecord,
  FormData,
} from "./types";
import { DEFAULT_ENDPOINT } from "../../config/endpoints";

const getHeaders = () => {
  const token = localStorage.getItem("Token");
//   const uuid = localStorage.getItem("uuid");

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `${token}` }),
  };
};

export const useFinanceLogic = () => {
  const [wagons, setWagons] = useState<Wagon[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    description: "",
    type: "income",
    category: "sales",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [wagonsRes, financeRes] = await Promise.all([
        fetch(`${DEFAULT_ENDPOINT}/wagons/all`, { headers: getHeaders() }),
        fetch(`${DEFAULT_ENDPOINT}/finance`, { headers: getHeaders() }),
      ]);

      const wagonsData = await wagonsRes.json();
      const financeData = await financeRes.json();

      setWagons(wagonsData.data || wagonsData);
      setFinanceRecords(financeData.data || financeData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  // Group wagons by client name (part before comma in wagon_number)
  const uniquePersons = useMemo(() => {
    const personsMap = new Map<string, Person>();

    wagons.forEach((wagon) => {
      // Extract client name (part before comma), normalize to lowercase for grouping
      const parts = wagon.wagon_number.split(',');
      const rawPersonName = (parts[0] || wagon.wagon_number).trim();
      const personNameKey = rawPersonName.toLowerCase();
      
      if (!personsMap.has(personNameKey)) {
        personsMap.set(personNameKey, {
          name: rawPersonName, // Use the first occurrence's casing
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
          wagons: [],
        });
      }

      const person = personsMap.get(personNameKey)!;
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
      const rawPersonName = (descriptionParts[0] || "").trim();
      const personNameKey = rawPersonName.toLowerCase();

      if (personNameKey && personsMap.has(personNameKey)) {
        const person = personsMap.get(personNameKey)!;
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

  const handleDeleteFinanceRecord = useCallback(
    async (id: number) => {
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
    },
    [fetchData]
  );

  const handleDeleteWagon = useCallback(
    async (wagonId: string) => {
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
    },
    [fetchData]
  );

  const handleAddPayment = useCallback(
    async (selectedPersonName: string) => {
      if (!selectedPersonName || !formData.amount) {
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
            description: `${selectedPersonName}: ${formData.description}`,
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
    },
    [formData, fetchData]
  );

  return {
    // State
    wagons,
    financeRecords,
    loading,
    searchQuery,
    selectedPerson,
    showPaymentModal,
    formData,
    uniquePersons,
    filteredPersons,
    selectedPersonData,

    // Setters
    setSearchQuery,
    setSelectedPerson,
    setShowPaymentModal,
    setFormData,

    // Handlers
    fetchData,
    handleDeleteFinanceRecord,
    handleDeleteWagon,
    handleAddPayment,
  };
};
