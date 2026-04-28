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
const MY_DEBT_SCOPE_TAG_QARZLARIM = "[qarzlarim]";
const MY_DEBT_SCOPE_TAG_VALYUTCHIK = "[valyutchik]";

const normalizePersonName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const extractPersonNameFromDescription = (description?: string) => {
  if (!description) return "";
  const parts = description.split(":");
  const rawName = (parts[0] || "").trim();
  return rawName;
};

const getMyDebtRecordScope = (description?: string): "qarzlarim" | "valyutchik" | null => {
  if (!description) return null;
  const lower = description.toLowerCase();
  if (lower.includes(MY_DEBT_SCOPE_TAG_VALYUTCHIK)) return "valyutchik";
  if (lower.includes(MY_DEBT_SCOPE_TAG_QARZLARIM)) return "qarzlarim";
  return null;
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

      setWagons(wagonsData.data || wagonsData);
      setFinanceRecords(financeData.data || financeData);
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
      setDebts(normalizedDebts);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [shop_id]);

  const baseDebtsDefault = useMemo(
    () =>
      debts.filter(
        (d) => d.admin_id !== MY_DEBTS_ADMIN_ID && d.admin_id !== VALYUTCHIK_ADMIN_ID
      ),
    [debts]
  );
  const baseDebtsMy = useMemo(
    () => debts.filter((d) => d.admin_id === MY_DEBTS_ADMIN_ID),
    [debts]
  );
  const baseDebtsValyutchik = useMemo(
    () => debts.filter((d) => d.admin_id === VALYUTCHIK_ADMIN_ID),
    [debts]
  );

  const baseDebts = useMemo(() => {
    if (source === "myDebts") return baseDebtsMy;
    if (source === "valyutchik") return baseDebtsValyutchik;
    if (source === "debts") return baseDebtsDefault;
    return debts;
  }, [baseDebtsDefault, baseDebtsMy, baseDebtsValyutchik, debts, source]);

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

    if (source === "myDebts") {
      const myDebtsPersons = buildPersonsFromDebts(baseDebtsMy, true);
      const transferredOverpaid = buildPersonsFromDebts(baseDebtsDefault, false).filter(
        (person) => person.remainingAmount < 0
      );

      const myMap = new Map<string, Person>();
      myDebtsPersons.forEach((p) => myMap.set(normalizePersonName(p.name), p));

      const transferredMap = new Map<string, Person>();
      transferredOverpaid.forEach((p) =>
        transferredMap.set(normalizePersonName(p.name), p)
      );

      const merged: Person[] = [];
      const allKeys = new Set<string>([
        ...Array.from(myMap.keys()),
        ...Array.from(transferredMap.keys()),
      ]);

      allKeys.forEach((key) => {
        const my = myMap.get(key);
        const transferred = transferredMap.get(key);

        // If this person exists in myDebts AND has an overpaid balance in qarzdorlar,
        // show the transferred (qarzdorlar) payments as "taken", and the myDebts debts as "paid".
        // This matches the business meaning of "moved from qarzdorlar into qarzlarim".
        if (my && transferred) {
          const taken = transferred.paidAmount; // sum of non-my_debt finance records
          const paid = my.totalAmount; // sum of qarzlarim debts
          merged.push({
            ...my,
            totalAmount: taken,
            paidAmount: paid,
            remainingAmount: paid - taken, // negative => credit (shown as + in invert mode)
          });
          return;
        }

        if (my) {
          merged.push(my);
          return;
        }

        if (transferred) {
          // Overpaid in qarzdorlar but no myDebts rows; show credit only.
          const credit = Math.abs(transferred.remainingAmount);
          merged.push({
            ...transferred,
            totalAmount: credit,
            paidAmount: 0,
            remainingAmount: -credit,
          });
        }
      });

      return merged.sort((a, b) => b.totalAmount - a.totalAmount);
    }

    if (source === "valyutchik") {
      return buildPersonsFromDebts(baseDebtsValyutchik, true);
    }

    return buildPersonsFromDebts(baseDebtsDefault, false).filter(
      (person) => person.remainingAmount >= 0
    );
  }, [
    source,
    wagons,
    baseDebtsDefault,
    baseDebtsMy,
    baseDebtsValyutchik,
    buildPersonsFromDebts,
  ]);

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

  const visibleDebts = useMemo(() => {
    if (source === "myDebts") {
      const overpaidAllowed = new Set(
        buildPersonsFromDebts(baseDebtsDefault, false)
          .filter((person) => person.remainingAmount < 0)
          .map((person) => normalizePersonName(person.name))
      );
      return [
        ...baseDebtsMy,
        ...baseDebtsDefault.filter((debt) =>
          overpaidAllowed.has(normalizePersonName(debt.name))
        ),
      ];
    }

    if (source === "debts") {
      const allowed = new Set(
        uniquePersons.map((person) => normalizePersonName(person.name))
      );
      return baseDebtsDefault.filter((debt) =>
        allowed.has(normalizePersonName(debt.name))
      );
    }


    return baseDebts;
  }, [
    baseDebts,
    baseDebtsDefault,
    baseDebtsDefault,
    baseDebtsMy,
    source,
    uniquePersons,
  ]);

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
      paymentData: FormData,
      selectedPersonDebts?: Debt[]
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

        let categoryToSend = paymentData.category;
        if (source === "valyutchik") {
          categoryToSend = "my_debt";
        } else if (source === "myDebts") {
          const hasMyDebts = (selectedPersonDebts || []).some(
            (debt) => debt.admin_id === MY_DEBTS_ADMIN_ID
          );
          categoryToSend = hasMyDebts ? "my_debt" : "sales";
        }

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
      selectedPersonDebts?: Debt[],
      paymentData: FormData = formData
    ) => {
      const result = await submitFinanceRecord(
        selectedPersonName,
        paymentData,
        selectedPersonDebts
      );

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
      paymentData: FormData,
      selectedPersonDebts?: Debt[]
    ) => {
      const createResult = await submitFinanceRecord(
        selectedPersonName,
        paymentData,
        selectedPersonDebts
      );

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

      // Only allow editing debts that belong to my-debt sources.
      const isMyDebtSource = source === "myDebts" || source === "valyutchik";
      if (!isMyDebtSource) {
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
    [fetchData, source]
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
  };
};
