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
import {
  MY_DEBTS_ADMIN_ID,
  VALYUTCHIK_ADMIN_ID,
  buildLedgerPersons,
  debtAdminId,
  getMyDebtRecordScope,
  normalizePersonName,
} from "./personLedger";

const getHeaders = () => {
  const token = localStorage.getItem("Token");
//   const uuid = localStorage.getItem("uuid");

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `${token}` }),
  };
};

// All lists are shown oldest first (newest at the bottom)
const toTime = (value?: string) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(time) ? 0 : time;
};

const sortOldestFirst = <T,>(list: T[], getTime: (item: T) => number): T[] =>
  Array.isArray(list) ? [...list].sort((a, b) => getTime(a) - getTime(b)) : list;

const MY_DEBT_SCOPE_TAG_QARZLARIM = "[qarzlarim]";
const MY_DEBT_SCOPE_TAG_VALYUTCHIK = "[valyutchik]";

const extractPersonNameFromDescription = (description?: string) => {
  if (!description) return "";
  const parts = description.split(":");
  const rawName = (parts[0] || "").trim();
  return rawName;
};

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

  const getDefaultFormData = useCallback((): FormData => {
    return {
      amount: "",
      description: "",
      type: "income",
      category: source === "myDebts" || source === "valyutchik" ? "my_debt" : "sales",
      date: new Date().toISOString().split("T")[0],
    };
  }, [source]);

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

      setWagons(
        sortOldestFirst<Wagon>(wagonsData.data || wagonsData, (wagon) => toTime(wagon.created_at))
      );
      setFinanceRecords(
        sortOldestFirst<FinanceRecord>(
          financeData.data || financeData,
          (record) => toTime(record.date) || toTime(record.created_at)
        )
      );
      const rawDebts = debtsData.data || debtsData;
      const normalizedDebts = Array.isArray(rawDebts)
        ? rawDebts.map((debt) => ({
            ...debt,
            admin_id:
              String(debt.admin_id ?? "")
                .trim()
                .toLowerCase() === MY_DEBTS_ADMIN_ID
                ? MY_DEBTS_ADMIN_ID
                : String(debt.admin_id ?? "")
                    .trim()
                    .toLowerCase() === VALYUTCHIK_ADMIN_ID
                ? VALYUTCHIK_ADMIN_ID
                : "qarzdorlar",
          }))
        : rawDebts;
      setDebts(
        sortOldestFirst<Debt>(normalizedDebts, (debt) =>
          new Date(debt.year, (debt.month || 1) - 1, debt.day || 1).getTime()
        )
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [shop_id]);

  const baseDebtsValyutchik = useMemo(
    () => debts.filter((d) => d.admin_id === VALYUTCHIK_ADMIN_ID),
    [debts]
  );

  const buildPersonsFromDebts = useCallback(
    (debtsList: Debt[], isMyDebtSource: boolean) => {
      const personsMap = new Map<string, Person>();
      const isRecordRelevantForSource = (record: FinanceRecord) => {
        if (isMyDebtSource) {
          if (record.category !== "my_debt") return false;
          const scope = getMyDebtRecordScope(record.description);
          // valyutchik should only see its own tagged my_debt payments
          if (source === "valyutchik") return scope === "valyutchik";
          // qarzlarim should not include valyutchik payments; untagged legacy records default to qarzlarim
          if (source === "myDebts") return scope !== "valyutchik";
          return true;
        }
        return record.category !== "my_debt";
      };

      debtsList.forEach((debt) => {
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
      });

      financeRecords.filter(isRecordRelevantForSource).forEach((record) => {
        const rawPersonName = extractPersonNameFromDescription(record.description);
        const personNameKey = normalizePersonName(rawPersonName);

        if (personNameKey && personsMap.has(personNameKey)) {
          const person = personsMap.get(personNameKey)!;
          const amount = parseFloat(record.amount);
          if (!Number.isNaN(amount)) {
            if (record.type === "income") {
              person.paidAmount += amount;
              person.remainingAmount -= amount;
            } else {
              person.paidAmount -= amount;
              person.remainingAmount += amount;
            }
          }
        }
      });

      personsMap.forEach((person) => {
        if (person.paidAmount < 0) person.paidAmount = 0;
        const remaining = person.totalAmount - person.paidAmount;
        person.remainingAmount = remaining;
      });

      return Array.from(personsMap.values()).sort(
        (a, b) => b.totalAmount - a.totalAmount
      );
    },
    [financeRecords]
  );

  // Everyone from Қарздорлар and Қарзларим with one shared balance
  const ledgerPersons = useMemo(
    () => buildLedgerPersons(debts, financeRecords),
    [debts, financeRecords]
  );

  // A client with client payments must not become a lender: it would change
  // how those payments are read (see personLedger.ts)
  const isClientWithPayments = useCallback(
    (name: string) => {
      const key = normalizePersonName(name);
      return ledgerPersons.some(
        (person) =>
          normalizePersonName(person.name) === key &&
          !person.isLender &&
          (person.records || []).length > 0
      );
    },
    [ledgerPersons]
  );

  const uniquePersons = useMemo(() => {
    if (source === "wagons") {
      const personsMap = new Map<string, Person>();

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

      // Apply finance records (non my_debt) to wagons persons
      financeRecords
        .filter((record) => record.category !== "my_debt")
        .forEach((record) => {
          const rawPersonName = extractPersonNameFromDescription(record.description);
          const personNameKey = normalizePersonName(rawPersonName);
          if (personNameKey && personsMap.has(personNameKey)) {
            const person = personsMap.get(personNameKey)!;
            const amount = parseFloat(record.amount);
            if (!Number.isNaN(amount)) {
              if (record.type === "income") {
                person.paidAmount += amount;
                person.remainingAmount -= amount;
              } else {
                person.paidAmount -= amount;
                person.remainingAmount += amount;
              }
            }
          }
        });

      personsMap.forEach((person) => {
        if (person.paidAmount < 0) person.paidAmount = 0;
        person.remainingAmount = person.totalAmount - person.paidAmount;
      });

      return Array.from(personsMap.values()).sort(
        (a, b) => b.totalAmount - a.totalAmount
      );
    }

    if (source === "valyutchik") {
      return buildPersonsFromDebts(baseDebtsValyutchik, true);
    }

    // Қарздорлар / Қарзларим: each person is on the side their balance puts them
    return ledgerPersons
      .filter((person) => person.side === source)
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [source, wagons, financeRecords, ledgerPersons, baseDebtsValyutchik, buildPersonsFromDebts]);

  const myDebtsCardTotals = useMemo(() => {
    const sumTotals = (list: Person[]) =>
      list.reduce(
        (acc, p) => {
          acc.totalAmount += p.totalAmount;
          acc.paidAmount += p.paidAmount;
          acc.remainingAmount += p.remainingAmount;
          return acc;
        },
        { totalAmount: 0, paidAmount: 0, remainingAmount: 0 }
      );

    // Keep card totals consistent with what we show in the myDebts persons list.
    return sumTotals(uniquePersons);
  }, [
    uniquePersons,
  ]);

  // "Барча Ёзувлар": the debts of the people on this tab (client and qarzlarim alike)
  const visibleDebts = useMemo(() => {
    if (source === "myDebts" || source === "debts") {
      const allowed = new Set(
        uniquePersons.map((person) => normalizePersonName(person.name))
      );
      return debts.filter(
        (debt) =>
          debtAdminId(debt) !== VALYUTCHIK_ADMIN_ID &&
          allowed.has(normalizePersonName(debt.name))
      );
    }

    return source === "valyutchik" ? baseDebtsValyutchik : debts;
  }, [baseDebtsValyutchik, debts, source, uniquePersons]);

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

  const submitFinanceRecord = useCallback(
    async (
      selectedPersonName: string,
      paymentData: FormData
    ) => {
      if (!selectedPersonName || !paymentData.amount) {
        toast.error("Iltimos, barcha maydonlarni to'ldiring");
        return null;
      }

      try {
        const amount = parseFloat(paymentData.amount);
        if (Number.isNaN(amount)) {
          toast.error("Summa noto'g'ri kiritilgan");
          return null;
        }

        // The caller picks the category from the person (lender → my_debt, client → sales);
        // edits keep the record's own category so its meaning doesn't change
        const categoryToSend = source === "valyutchik" ? "my_debt" : paymentData.category || "sales";

        const needsScopeTag = categoryToSend === "my_debt";
        const scopeTag =
          source === "valyutchik"
            ? `${MY_DEBT_SCOPE_TAG_VALYUTCHIK} `
            : `${MY_DEBT_SCOPE_TAG_QARZLARIM} `;
        const scopedDetails = needsScopeTag
          ? `${scopeTag}${paymentData.description || ""}`.trim()
          : (paymentData.description || "").trim();

        const response = await fetch(`${DEFAULT_ENDPOINT}/finance`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            amount,
            description: `${selectedPersonName}: ${scopedDetails}`.trim(),
            type: paymentData.type,
            category: categoryToSend,
            date: paymentData.date,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          return { ok: true as const, data };
        }

        return {
          ok: false as const,
          error: data.error || data.message || "Pul qo'shishda xatolik",
        };
      } catch (error) {
        console.error("Error adding payment:", error);
        return { ok: false as const, error: "Pul qo'shishda xatolik" };
      }
    },
    [source]
  );

  const removeFinanceRecord = useCallback(
    async (
      id: number,
      options?: {
        confirm?: boolean;
        notify?: boolean;
        refresh?: boolean;
      }
    ) => {
      const shouldConfirm = options?.confirm ?? true;
      const shouldNotify = options?.notify ?? true;
      const shouldRefresh = options?.refresh ?? true;

      if (shouldConfirm && !window.confirm("Ushbu yozuvni o'chirishni xohlaysizmi?")) {
        return false;
      }

      try {
        const response = await fetch(`${DEFAULT_ENDPOINT}/finance/${id}`, {
          method: "DELETE",
          headers: getHeaders(),
        });

        const data = await response.json();

        if (response.ok) {
          if (shouldNotify) {
            toast.success("Yozuv o'chirildi");
          }
          if (shouldRefresh) {
            fetchData();
          }
          return true;
        }

        if (shouldNotify) {
          toast.error(data.error || "O'chirishda xatolik");
        }
        return false;
      } catch (error) {
        console.error("Error deleting finance record:", error);
        if (shouldNotify) {
          toast.error("O'chirishda xatolik");
        }
        return false;
      }
    },
    [fetchData]
  );

  const handleDeleteFinanceRecord = useCallback(
    async (id: number) => {
      await removeFinanceRecord(id);
    },
    [removeFinanceRecord]
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
    async (
      selectedPersonName: string,
      paymentData: FormData = formData
    ) => {
      const result = await submitFinanceRecord(selectedPersonName, paymentData);

      if (!result) return false;

      if (result.ok) {
        toast.success("Pul qo'shildi");
        setShowPaymentModal(false);
        setFormData(getDefaultFormData());
        fetchData();
        return true;
      }

      toast.error(result.error);
      return false;
    },
    [fetchData, formData, getDefaultFormData, submitFinanceRecord]
  );

  const handleReplaceFinanceRecord = useCallback(
    async (
      recordId: number,
      selectedPersonName: string,
      paymentData: FormData
    ) => {
      const createResult = await submitFinanceRecord(selectedPersonName, paymentData);

      if (!createResult) return false;

      if (!createResult.ok) {
        toast.error(createResult.error);
        return false;
      }

      const deleted = await removeFinanceRecord(recordId, {
        confirm: false,
        notify: false,
        refresh: false,
      });

      if (!deleted) {
        toast.error("Eski yozuvni o'chirib bo'lmadi");
        fetchData();
        return false;
      }

      toast.success("Yozuv yangilandi");
      setShowPaymentModal(false);
      setFormData(getDefaultFormData());
      fetchData();
      return true;
    },
    [fetchData, getDefaultFormData, removeFinanceRecord, submitFinanceRecord]
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
      date: string,
      adminOverride?: "qarzlarim" | "qarzdorlar"
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
            admin_id:
              adminOverride === "qarzdorlar"
                ? "qarzdorlar"
                : source === "valyutchik"
                ? VALYUTCHIK_ADMIN_ID
                : MY_DEBTS_ADMIN_ID,
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

  const handleUpdateMyDebt = useCallback(
    async (debt: Debt, updates: { amount: number; comment: string }) => {
      if (!debt?.id) return false;

      // Only my own debts (qarzlarim / valyutchik) are editable, on whichever tab
      // the person is shown (a lender who was overpaid is listed under Қарздорлар)
      const admin = debtAdminId(debt);
      if (admin !== MY_DEBTS_ADMIN_ID && admin !== VALYUTCHIK_ADMIN_ID) {
        toast.error("Bu bo'limda qarzni tahrirlab bo'lmaydi");
        return false;
      }

      const amount = Number(updates.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Summa noto'g'ri kiritilgan");
        return false;
      }

      try {
        const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.debts.update}`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            id: debt.id,
            // Keep the lender/name stable from Finance to avoid silently moving rows between people.
            name: debt.name,
            amount,
            product_names: updates.comment || "",
            branch_id: 1,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          toast.success("Qarz yangilandi");
          fetchData();
          return true;
        }

        toast.error(data?.message || data?.error || "Qarzni yangilashda xatolik");
        return false;
      } catch (error) {
        console.error("Error updating debt:", error);
        toast.error("Qarzni yangilashda xatolik");
        return false;
      }
    },
    [fetchData]
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
    handleReplaceFinanceRecord,
    handleDeleteWagon,
    handleDeleteDebt,
    handleAddPayment,
    handleAddMyDebt,
    handleUpdateMyDebt,
    markDebtsReturned,
    myDebtsCardTotals,
    ledgerPersons,
    isClientWithPayments,
  };
};
