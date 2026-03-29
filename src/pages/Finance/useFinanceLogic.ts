import { useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import type {
  Wagon,
  Person,
  FinanceRecord,
  FormData,
  Debt,
  FinanceSource,
} from "./types";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { useSelector } from "react-redux";
import { getshopidfromstrore } from "../../redux/selectors";

const getHeaders = () => {
  const token = localStorage.getItem("Token");
//   const uuid = localStorage.getItem("uuid");

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `${token}` }),
  };
};

const MY_DEBTS_ADMIN_ID = "qarzlarim";
const VALYUTCHIK_ADMIN_ID = "valyutchik";

const normalizePersonName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

export const useFinanceLogic = (source: FinanceSource) => {
  const [wagons, setWagons] = useState<Wagon[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [financeRecords, setFinanceRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const shop_id = useSelector(getshopidfromstrore);
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
      const [wagonsRes, financeRes, debtsRes] = await Promise.all([
        fetch(`${DEFAULT_ENDPOINT}/wagons/all`, { headers: getHeaders() }),
        fetch(`${DEFAULT_ENDPOINT}/finance`, { headers: getHeaders() }),
        fetch(`${DEFAULT_ENDPOINT}/debts/all`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ shop_id }),
        }),
      ]);

      const wagonsData = await wagonsRes.json();
      const financeData = await financeRes.json();
      const debtsData = await debtsRes.json();

      setWagons(wagonsData.data || wagonsData);
      setFinanceRecords(financeData.data || financeData);
      const rawDebts = debtsData.data || debtsData;
      const normalizedDebts = Array.isArray(rawDebts)
        ? rawDebts.map((debt) => ({
            ...debt,
            admin_id:
              debt.admin_id === MY_DEBTS_ADMIN_ID
                ? MY_DEBTS_ADMIN_ID
                : debt.admin_id === VALYUTCHIK_ADMIN_ID
                ? VALYUTCHIK_ADMIN_ID
                : "qarzdorlar",
          }))
        : rawDebts;
      setDebts(normalizedDebts);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [shop_id]);

  const visibleDebts = useMemo(() => {
    if (source === "myDebts") {
      return debts.filter((d) => d.admin_id === MY_DEBTS_ADMIN_ID);
    }
    if (source === "valyutchik") {
      return debts.filter((d) => d.admin_id === VALYUTCHIK_ADMIN_ID);
    }
    if (source === "debts") {
      return debts.filter(
        (d) => d.admin_id !== MY_DEBTS_ADMIN_ID && d.admin_id !== VALYUTCHIK_ADMIN_ID
      );
    }
    return debts;
  }, [debts, source]);

  const uniquePersons = useMemo(() => {
    const personsMap = new Map<string, Person>();

    if (source === "wagons") {
      wagons.forEach((wagon) => {
        const parts = wagon.wagon_number.split(",");
        const rawPersonName = (parts[0] || wagon.wagon_number).trim();
        const personNameKey = normalizePersonName(rawPersonName);

        if (!personsMap.has(personNameKey)) {
          personsMap.set(personNameKey, {
            name: rawPersonName,
            totalAmount: 0,
            paidAmount: 0,
            remainingAmount: 0,
            wagons: [],
          });
        }

        const person = personsMap.get(personNameKey)!;
        person.wagons!.push(wagon);

        const wagonTotal = parseFloat(wagon.total.toString());
        const paidAmount = parseFloat((wagon.paid_amount || 0).toString());

        person.totalAmount += wagonTotal;
        person.paidAmount += paidAmount;
        person.remainingAmount += wagonTotal - paidAmount;
      });
    } else {
      visibleDebts.forEach((debt) => {
        const rawPersonName = debt.name.trim();
        const personNameKey = normalizePersonName(rawPersonName);

        if (!personsMap.has(personNameKey)) {
          personsMap.set(personNameKey, {
            name: rawPersonName,
            totalAmount: 0,
            paidAmount: 0,
            remainingAmount: 0,
            debts: [],
          });
        }

        const person = personsMap.get(personNameKey)!;
        person.debts!.push(debt);

        person.totalAmount += debt.amount;
        if (debt.isreturned) {
          person.paidAmount += debt.amount;
        } else {
          person.remainingAmount += debt.amount;
        }
      });
    }

    // Apply finance records to persons
    financeRecords.forEach((record) => {
      const descriptionParts = record.description?.split(": ") || [];
      const rawPersonName = (descriptionParts[0] || "").trim();
      const personNameKey = normalizePersonName(rawPersonName);

      if (personNameKey && personsMap.has(personNameKey)) {
        const person = personsMap.get(personNameKey)!;
        if (record.type === "income") {
          const amount = parseFloat(record.amount);
          person.paidAmount += amount;
          person.remainingAmount -= amount;
        }
      }
    });

    return Array.from(personsMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );
  }, [source, wagons, visibleDebts, financeRecords]);

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

        const categoryToSend = source === "myDebts" || source === "valyutchik"
          ? "my_debt"
          : formData.category;

        const response = await fetch(`${DEFAULT_ENDPOINT}/finance`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            amount: parseFloat(formData.amount),
            description: `${selectedPersonName}: ${formData.description}`,
            type: formData.type,
            category: categoryToSend,
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
            category: source === "myDebts" || source === "valyutchik" ? "my_debt" : "sales",
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
    [formData, fetchData, source]
  );

  const handleDeleteDebt = useCallback(
    async (debtId: string) => {
      if (!window.confirm("Ушбу қарз ёзувини ўчиришни хоҳлайсизми?")) return;

      try {
        const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.delete}`, {
          method: "DELETE",
          headers: {
            ...getHeaders(),
            id: debtId,
          },
          body: JSON.stringify({ id: debtId }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success("Қарз ёзуви ўчирилди");
          fetchData();
        } else {
          toast.error(data.error || data.message || "Ўчиришда хатолик");
        }
      } catch (error) {
        console.error("Error deleting debt:", error);
        toast.error("Ўчиришда хатолик");
      }
    },
    [fetchData]
  );

  const markDebtsReturned = useCallback(async (debtsToMark: Debt[]) => {
    const pending = debtsToMark.filter((d) => !d.isreturned);
    if (pending.length === 0) return;

    try {
      await Promise.all(
        pending.map((debt) =>
          fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.mark_returned}`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ id: debt.id }),
          })
        )
      );
      fetchData();
    } catch (error) {
      console.error("Error marking debts as returned:", error);
      toast.error("Qarz holatini yangilashda xatolik");
    }
  }, [fetchData]);

  const handleAddMyDebt = useCallback(
    async (
      lender: string,
      amount: number,
      comment: string,
      isReturned: boolean,
      date: string
    ) => {
      if (!lender?.trim() || !amount) {
        toast.error("Iltimos, qarz beruvchi va summani kiriting");
        return;
      }

      try {
        const nameValue = lender.trim();
        const parsedDate = date ? new Date(date) : new Date();
        const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
        const day = safeDate.getDate();
        const month = safeDate.getMonth() + 1;
        const year = safeDate.getFullYear();
        const created_at = safeDate.toISOString().split("T")[0];
        const response = await fetch(`${DEFAULT_ENDPOINT}/debts/create`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            name: nameValue,
            amount,
            product_names: comment ? [comment] : [],
            branch_id: 1,
            shop_id,
            admin_id: source === "valyutchik" ? VALYUTCHIK_ADMIN_ID : MY_DEBTS_ADMIN_ID,
            isreturned: isReturned,
            day,
            month,
            year,
            created_at,
          }),
        });

        const data = await response.json();

        if (response.ok && data?.data) {
          toast.success("Qarz qo'shildi");
          fetchData();
        } else {
          toast.error(data?.message || data?.error || "Qarz qo'shishda xatolik");
        }
      } catch (error) {
        console.error("Error adding my debt:", error);
        toast.error("Qarz qo'shishda xatolik");
      }
    },
    [fetchData, shop_id, source]
  );

  return {
    // State
    wagons,
    debts: visibleDebts,
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
    handleDeleteDebt,
    handleAddPayment,
    handleAddMyDebt,
    markDebtsReturned,
  };
};
