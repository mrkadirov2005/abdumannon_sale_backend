import React, { useState } from "react";
import { Plus, Trash2, Printer } from "lucide-react";
import type { Person, FinanceRecord, Debt, Wagon } from "../types";
import { DEFAULT_SUPPLIER_HTML, generateChequeNumber, printCheque } from "../../../components/ui/ChequeProvider";
import { DebtProductsModal } from "./DebtProductsModal";

interface DetailsPanelProps {
  person: Person;
  financeRecords: FinanceRecord[];
  onAddPayment: () => void;
  onAddMyDebtFromDebts: () => void;
  showPulQoshish: boolean;
  onDeleteWagon: (wagonId: string) => void;
  onDeleteFinanceRecord: (recordId: number) => void;
  onDeleteDebt: (debtId: string) => void;
  source: "wagons" | "debts" | "myDebts" | "valyutchik";
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  person,
  financeRecords,
  onAddPayment,
  onAddMyDebtFromDebts,
  showPulQoshish,
  onDeleteWagon,
  onDeleteFinanceRecord,
  onDeleteDebt,
  source,
}) => {
  const [showDebtProducts, setShowDebtProducts] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const normalizePersonName = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, " ");

  const isMyDebtSource = source === "myDebts" || source === "valyutchik";
  const MY_DEBTS_ADMIN_ID = "qarzlarim";
  const VALYUTCHIK_ADMIN_ID = "valyutchik";

  const getRecordPersonKey = (record: FinanceRecord) => {
    const rawName = record.description?.split(":")[0] || "";
    return normalizePersonName(rawName);
  };

  const formatCurrency = (value: number, currency: "USD" | "RUB") => {
    const suffix = currency === "USD" ? "$" : "₽";
    return `${Number(value).toLocaleString("en-US")} ${suffix}`;
  };
  const formatBalance = (
    value: number,
    currency: "USD" | "RUB",
    mode: "default" | "alwaysNegative" | "invert"
  ) => {
    if (mode === "alwaysNegative") {
      return `-${formatCurrency(Math.abs(value), currency)}`;
    }
    if (mode === "invert") {
      if (value > 0) {
        return `-${formatCurrency(value, currency)}`;
      }
      if (value < 0) {
        return `+${formatCurrency(Math.abs(value), currency)}`;
      }
      return formatCurrency(0, currency);
    }
    if (value > 0) {
      return `+${formatCurrency(value, currency)}`;
    }
    if (value < 0) {
      return `-${formatCurrency(Math.abs(value), currency)}`;
    }
    return formatCurrency(0, currency);
  };
  const currency = source === "wagons" || source === "valyutchik" ? "USD" : "RUB";

  const personKey = normalizePersonName(person.name);
  const personFinanceRecords = financeRecords.filter((record) => {
    if (source === "myDebts") {
      return getRecordPersonKey(record) === personKey;
    }
    if (isMyDebtSource && record.category !== "my_debt") return false;
    if (!isMyDebtSource && record.category === "my_debt") return false;
    return getRecordPersonKey(record) === personKey;
  });

  const debts: Debt[] = person.debts || [];

  const computeTotalsForDebts = (
    debtsList: Debt[],
    records: FinanceRecord[]
  ) => {
    let totalAmount = 0;
    let paidAmount = 0;

    debtsList.forEach((debt) => {
      totalAmount += debt.amount;
    });

    records.forEach((record) => {
      const amount = parseFloat(record.amount);
      if (Number.isNaN(amount)) return;
      if (record.type === "income") {
        paidAmount += amount;
      } else {
        paidAmount -= amount;
      }
    });

    if (paidAmount < 0) paidAmount = 0;
    const remainingAmount = totalAmount - paidAmount;

    return { totalAmount, paidAmount, remainingAmount };
  };

  const personRecordsMyDebt = financeRecords.filter((record) => {
    if (record.category !== "my_debt") return false;
    return getRecordPersonKey(record) === personKey;
  });

  const personRecordsOther = financeRecords.filter((record) => {
    if (record.category === "my_debt") return false;
    return getRecordPersonKey(record) === personKey;
  });

  const myDebtsForPerson = debts.filter(
    (debt) => debt.admin_id === MY_DEBTS_ADMIN_ID
  );

  const transferredDebtsForPerson = debts.filter(
    (debt) =>
      debt.admin_id !== MY_DEBTS_ADMIN_ID &&
      debt.admin_id !== VALYUTCHIK_ADMIN_ID
  );

  const myTotals = computeTotalsForDebts(
    myDebtsForPerson,
    personRecordsMyDebt
  );

  const transferredTotals = computeTotalsForDebts(
    transferredDebtsForPerson,
    personRecordsOther
  );

  const mergedDisplayTotals = {
    totalAmount: myTotals.totalAmount + transferredTotals.paidAmount,
    paidAmount: myTotals.paidAmount + transferredTotals.totalAmount,
    remainingAmount:
      myTotals.totalAmount +
      transferredTotals.paidAmount -
      (myTotals.paidAmount + transferredTotals.totalAmount),
  };

  const displayTotals =
    source === "myDebts"
      ? mergedDisplayTotals
      : {
          totalAmount: person.totalAmount,
          paidAmount: person.paidAmount,
          remainingAmount: person.remainingAmount,
        };

  const printWagon = (wagon: Wagon) => {
    printCheque({
      title: "Накладная",
      number: generateChequeNumber(),
      date: new Date().toLocaleDateString("ru-RU"),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: person.name,
      products: (wagon.products || []).map((p) => ({
        name: p.product_name || p.name || "",
        quantity: Number(p.amount ?? 0),
        unit: p.unit || "pcs",
        price: Number(p.price ?? 0),
        total: p.subtotal !== undefined ? Number(p.subtotal) : Number(p.amount ?? 0) * Number(p.price ?? 0),
      })),
      totalAmount: Number(wagon.total),
      status: `To'langan: ${Number(wagon.paid_amount || 0).toLocaleString("en-US")}`,
      signatureLeft: "Поставщик",
      signatureRight: "Получатель",
    });
  };

  const printAllWagons = () => {
    if (!person.wagons || person.wagons.length === 0) return;
    const allProducts = person.wagons.flatMap((wagon) => {
      const parts = wagon.wagon_number.split(",");
      const wagonNumber = parts[1] || wagon.wagon_number;
      return (wagon.products || []).map((p) => ({
        name: `[${wagonNumber}] ${p.product_name || p.name || ""}`,
        quantity: Number(p.amount ?? 0),
        unit: p.unit || "pcs",
        price: Number(p.price ?? 0),
        total: p.subtotal !== undefined ? Number(p.subtotal) : Number(p.amount ?? 0) * Number(p.price ?? 0),
      }));
    });
    const grandTotal = person.wagons.reduce((s, w) => s + Number(w.total), 0);
    printCheque({
      title: "Вагонлар рўйхати",
      number: generateChequeNumber(),
      date: new Date().toLocaleDateString("ru-RU"),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: person.name,
      products: allProducts,
      totalAmount: grandTotal,
      signatureLeft: "Поставщик",
      signatureRight: "Получатель",
    });
  };

  const printDebt = (debt: Debt) => {
    const date = `${debt.year}-${String(debt.month).padStart(2, "0")}-${String(debt.day).padStart(2, "0")}`;
    printCheque({
      title: "Накладная",
      number: generateChequeNumber(),
      date,
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: debt.name,
      products: [{
        name: debt.name,
        quantity: 1,
        unit: "pcs",
        price: debt.amount,
        total: debt.amount,
      }],
      totalAmount: debt.amount,
      status: debt.isreturned ? "✓ Қайтарилган" : "⏳ Қайтарилмаган",
      signatureLeft: "Поставщик",
      signatureRight: "Получатель",
    });
  };

  const printAllDebts = () => {
    if (debts.length === 0) return;
    printCheque({
      title: "Қарзлар рўйхати",
      number: generateChequeNumber(),
      date: new Date().toLocaleDateString("ru-RU"),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: person.name,
      products: debts.map((d) => {
        const date = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
        return {
          name: `${d.name} (${date}) ${d.isreturned ? "✓" : "⏳"}`,
          quantity: 1,
          unit: "pcs",
          price: d.amount,
          total: d.amount,
        };
      }),
      totalAmount: debts.reduce((s, d) => s + d.amount, 0),
      signatureLeft: "Поставщик",
      signatureRight: "Получатель",
    });
  };
  const printPerson = () => {
    let products: { name: string; quantity: number; unit: string; price: number; total: number }[] = [];

    if (source === "wagons") {
      products = (person.wagons || []).flatMap((wagon) => {
        const parts = wagon.wagon_number.split(",");
        const wagonNumber = parts[1] || wagon.wagon_number;
        return (wagon.products || []).map((p) => ({
          name: `[${wagonNumber}] ${p.product_name || p.name || ""}`,
          quantity: Number(p.amount ?? 0),
          unit: p.unit || "pcs",
          price: Number(p.price ?? 0),
          total: p.subtotal !== undefined ? Number(p.subtotal) : Number(p.amount ?? 0) * Number(p.price ?? 0),
        }));
      });
    } else {
      products = debts.map((d) => {
        const date = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
        return {
          name: `${d.name} (${date}) ${d.isreturned ? "✓" : "⏳"}`,
          quantity: 1,
          unit: "pcs",
          price: d.amount,
          total: d.amount,
        };
      });
    }

    // Add payment records as additional rows
    personFinanceRecords.forEach((record) => {
      const desc = record.description?.split(": ")[1] || record.description || "";
      const date = new Date(record.date).toLocaleDateString("uz-UZ");
      const amt = Number(record.amount);
      products.push({
        name: `💰 ${desc} (${date})`,
        quantity: 1,
        unit: "pcs",
        price: record.type === "income" ? amt : -amt,
        total: record.type === "income" ? amt : -amt,
      });
    });

    printCheque({
      title: "Молия ҳисоботи",
      number: generateChequeNumber(),
      date: new Date().toLocaleDateString("ru-RU"),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: person.name,
      products,
      totalAmount: person.totalAmount,
      status: `To'langan: ${person.paidAmount.toLocaleString("en-US")} | Qoldiq: ${formatBalance(
        person.remainingAmount,
        currency,
        source === "wagons"
          ? "alwaysNegative"
          : source === "myDebts" || source === "valyutchik"
          ? "invert"
          : "default"
      )}`,
      signatureLeft: "Поставщик",
      signatureRight: "Получатель",
    });
  };

  const handleOpenDebtProducts = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowDebtProducts(true);
  };

  const handleCloseDebtProducts = () => {
    setShowDebtProducts(false);
    setSelectedDebt(null);
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {person.name}
        </h2>
        <div className="flex items-center gap-2">
          {showPulQoshish && (
            <button
              onClick={onAddMyDebtFromDebts}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Pul qoshish
            </button>
          )}
          <button
            onClick={printPerson}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Printer size={16} /> Чоп Етиш
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-gray-600 text-sm mb-1">
            {source === "debts"
              ? "Абдуманнон (берган)"
              : source === "wagons"
              ? "Келган юк"
              : source === "myDebts" || source === "valyutchik"
              ? "Абдуманнон (олган)"
              : "Жами Сумма"}
          </p>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(displayTotals.totalAmount, currency)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-gray-600 text-sm mb-1">
            {source === "debts"
              ? "Клиент (берган)"
              : source === "myDebts" || source === "valyutchik"
              ? "Тўланган"
              : "Тўланган"}
          </p>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(displayTotals.paidAmount, currency)}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-gray-600 text-sm mb-1">Қолдиқ Сумма</p>
          <p className="text-3xl font-bold text-orange-600">
            {formatBalance(
              displayTotals.remainingAmount,
              currency,
              source === "wagons"
                ? "alwaysNegative"
                : source === "myDebts" || source === "valyutchik"
                ? "invert"
                : "default"
            )}
          </p>
        </div>
      </div>

      {source === "wagons" ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Вагонлар ({person.wagons?.length || 0})
            </h3>
            <button
              onClick={printAllWagons}
              className="flex items-center gap-2 px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Printer size={14} /> Ҳаммасини Чоп Етиш
            </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Вагон
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Маҳсулотлар
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Жами
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Тўланган
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Қолдиқ
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Амаллар
                  </th>
                </tr>
              </thead>
              <tbody>
                {(person.wagons || []).map((wagon) => {
                  const parts = wagon.wagon_number.split(",");
                  const wagonNumber = parts[1] || wagon.wagon_number;

                  return (
                    <tr key={wagon.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {wagonNumber}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {wagon.products.length}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(parseFloat(wagon.total.toString()), "USD")}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        {formatCurrency(parseFloat((wagon.paid_amount || 0).toString()), "USD")}
                      </td>
                      <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                        {formatCurrency(
                          parseFloat(wagon.total.toString()) -
                            parseFloat((wagon.paid_amount || 0).toString()),
                          "USD"
                        )}
                      </td>
                      <td className="px-4 py-3 text-center space-x-2 flex justify-center">
                        <button
                          onClick={() => printWagon(wagon)}
                          className="text-purple-600 hover:text-purple-800 transition"
                          title="Чоп Етиш"
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          onClick={onAddPayment}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Пул қўшиш"
                        >
                          <Plus size={18} />
                        </button>
                        <button
                          onClick={() => onDeleteWagon(wagon.id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Ўчириш"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Қарзлар ({debts.length})
            </h3>
            <button
              onClick={printAllDebts}
              className="flex items-center gap-2 px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Printer size={14} /> Ҳаммасини Чоп Етиш
            </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Сана
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Сумма
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    комментарий
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">
                    Амаллар
                  </th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt) => (
                  <tr key={debt.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-600">
                      {`${debt.year}-${String(debt.month).padStart(2, "0")}-${String(debt.day).padStart(2, "0")}`}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatCurrency(debt.amount, currency)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {debt.product_names ? (
                        <button
                          onClick={() => handleOpenDebtProducts(debt)}
                          className="text-blue-600 hover:text-blue-800 transition font-semibold"
                          title="Маҳсулотларни кўриш"
                        >
                          ...
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => printDebt(debt)}
                        className="text-purple-600 hover:text-purple-800 transition"
                        title="Чоп Етиш"
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        onClick={onAddPayment}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Пул қўшиш"
                      >
                        <Plus size={18} />
                      </button>
                      {(source === "debts" || source === "myDebts" || source === "valyutchik") && (
                        <button
                          onClick={() => onDeleteDebt(debt.id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Ўчириш"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">
        Пул бериш тарихи ({personFinanceRecords.length})
      </h3>

      <div className="space-y-2">
        {personFinanceRecords.length === 0 ? (
          <p className="text-gray-500">Пул бериш тарихи йўқ</p>
        ) : (
          personFinanceRecords.map((record) => (
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
                  {formatCurrency(parseFloat(record.amount), currency)}
                </p>
              </div>
              <button
                onClick={() => onDeleteFinanceRecord(record.id)}
                className="text-red-600 hover:text-red-800 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <DebtProductsModal
        isOpen={showDebtProducts}
        debt={selectedDebt}
        currency={currency}
        onClose={handleCloseDebtProducts}
      />
    </div>
  );
};




