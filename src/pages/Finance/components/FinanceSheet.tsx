import React from "react";
import type { Debt, FinanceRecord, FinanceSource, Wagon } from "../types";
import { normalizeProductNames, parseProductsFromString } from "../debtProducts";
import { ExcelSheet } from "../../../components/sheet/ExcelSheet";
import type {
  SheetDebtUpdate,
  SheetGroup,
  SheetPayment,
  SheetPaymentDraft,
  SheetTotal,
} from "../../../components/sheet/sheetTypes";

interface FinanceSheetProps {
  source: FinanceSource;
  wagons: Wagon[];
  debts: Debt[];
  records: FinanceRecord[];
  currency: "USD" | "RUB";
  totals: SheetTotal[];
  onAddPayment: () => void;
  canEditDebt: (debt: Debt) => boolean;
  onSaveDebt: (debt: Debt, update: SheetDebtUpdate) => Promise<boolean>;
  onSavePayment: (record: FinanceRecord, draft: SheetPaymentDraft) => Promise<boolean>;
}

const formatDebtDate = (debt: Debt) =>
  `${debt.year}-${String(debt.month).padStart(2, "0")}-${String(debt.day).padStart(2, "0")}`;

// "Name: [scope] details" -> "details" (same as the payment edit modal)
const extractEditableDescription = (description?: string) => {
  if (!description) return "";
  const parts = description.split(": ");
  if (parts.length <= 1) return description;
  return parts.slice(1).join(": ").replace(/^\[(valyutchik|qarzlarim)\]\s*/i, "");
};

export const FinanceSheet: React.FC<FinanceSheetProps> = ({
  source,
  wagons,
  debts,
  records,
  currency,
  totals,
  onAddPayment,
  canEditDebt,
  onSaveDebt,
  onSavePayment,
}) => {
  const formatMoney = (value: number) => `${Number(value).toLocaleString("en-US")} ${currency === "USD" ? "$" : "₽"}`;
  const isWagons = source === "wagons";

  // Wagons are edited on the wagons page, so their rows are view-only here
  const groups: SheetGroup[] = isWagons
    ? wagons.map((wagon, index) => {
        const parts = wagon.wagon_number.split(",");
        const wagonNumber = parts[1] || wagon.wagon_number;
        const total = parseFloat(String(wagon.total)) || 0;
        const paid = parseFloat(String(wagon.paid_amount || 0)) || 0;
        return {
          key: wagon.id,
          leading: [index + 1, wagonNumber],
          trailing: [formatMoney(total), formatMoney(paid), formatMoney(total - paid)],
          trailingClassNames: ["font-semibold", "text-green-700", "text-orange-700"],
          lines: (wagon.products || []).map((p) => {
            const quantity = Number(p.amount ?? 0);
            const price = Number(p.price ?? 0);
            return {
              kind: "product" as const,
              name: p.product_name || p.name || "",
              quantity,
              unit: p.unit || "pcs",
              price,
              sum: p.subtotal !== undefined ? Number(p.subtotal) : quantity * price,
            };
          }),
        };
      })
    : debts.map((debt, index) => ({
        key: debt.id,
        leading: [index + 1, formatDebtDate(debt)],
        trailing: [formatMoney(debt.amount)],
        trailingClassNames: ["font-semibold"],
        lines: parseProductsFromString(debt.product_names).map((p) => {
          // Plain comments (no "*" fields) come back with price 0 — show them as text only
          const isComment = !p.price && !p.totalPaid;
          return {
            kind: isComment ? ("comment" as const) : ("product" as const),
            name: p.name,
            quantity: isComment ? null : p.quantity,
            unit: isComment ? "" : p.unit,
            price: isComment ? null : p.price,
            sum: isComment ? null : Number(p.totalPaid) || Number(p.quantity) * Number(p.price),
          };
        }),
        edit: canEditDebt(debt)
          ? {
              amount: Number(debt.amount) || 0,
              rawItems: normalizeProductNames(debt.product_names),
              onSave: (update: SheetDebtUpdate) => onSaveDebt(debt, update),
            }
          : undefined,
      }));

  const payments: SheetPayment[] = records.map((record) => ({
    key: `pay-${record.id}`,
    date: new Date(record.date).toLocaleDateString("ru-RU"),
    description: record.description?.split(": ")[1] || record.description || "",
    amount: parseFloat(record.amount) || 0,
    isIncome: record.type === "income",
    edit: {
      initialDate: String(record.date).split("T")[0],
      initialDescription: extractEditableDescription(record.description),
      onSave: (draft: SheetPaymentDraft) => onSavePayment(record, draft),
    },
  }));

  return (
    <ExcelSheet
      leadingColumns={isWagons ? ["№", "Вагон"] : ["№", "Дата"]}
      trailingColumns={isWagons ? ["Итого по вагону", "Оплачено", "Остаток"] : ["Итого долга"]}
      groups={groups}
      emptyText={isWagons ? "Вагонов нет" : "Долгов нет"}
      payments={payments}
      paymentsTitle="История платежей"
      paymentsEmptyText="Платежей нет"
      totals={totals}
      addLabel="Добавить платёж"
      onAdd={onAddPayment}
      formatMoney={formatMoney}
    />
  );
};
