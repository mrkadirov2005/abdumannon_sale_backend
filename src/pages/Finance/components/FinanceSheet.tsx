import React from "react";
import type { Debt, FinanceRecord, FinanceSource, Wagon } from "../types";
import { formatUnitLabel, parseProductsFromString } from "../debtProducts";

export interface SheetTotal {
  label: string;
  value: string;
  className: string;
}

interface FinanceSheetProps {
  source: FinanceSource;
  wagons: Wagon[];
  debts: Debt[];
  records: FinanceRecord[];
  currency: "USD" | "RUB";
  totals: SheetTotal[];
}

interface SheetLine {
  name: string;
  quantity: number | null;
  unit: string;
  price: number | null;
  sum: number | null;
}

interface SheetGroup {
  key: string;
  // Cells merged across all product lines of the group (shown before / after the line cells)
  leading: React.ReactNode[];
  trailing: React.ReactNode[];
  lines: SheetLine[];
}

const LINE_COLUMNS = ["Маҳсулот", "Миқдор", "Бирлик", "Нарх", "Сумма"];

const cell = "border border-gray-300 px-2 py-1.5";
const headCell = "border border-gray-300 bg-gray-100 text-gray-500 font-normal text-xs text-center px-2 py-1 w-10";
const numCell = `${cell} text-right tabular-nums whitespace-nowrap`;

const formatDebtDate = (debt: Debt) =>
  `${debt.year}-${String(debt.month).padStart(2, "0")}-${String(debt.day).padStart(2, "0")}`;

export const FinanceSheet: React.FC<FinanceSheetProps> = ({ source, wagons, debts, records, currency, totals }) => {
  const formatMoney = (value: number) => `${Number(value).toLocaleString("en-US")} ${currency === "USD" ? "$" : "₽"}`;

  const isWagons = source === "wagons";
  const leadingColumns = isWagons ? ["№", "Вагон"] : ["№", "Сана"];
  const trailingColumns = isWagons ? ["Вагон жами", "Тўланган", "Қолдиқ"] : ["Қарз жами"];
  const columns = [...leadingColumns, ...LINE_COLUMNS, ...trailingColumns];

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
          lines: (wagon.products || []).map((p) => {
            const quantity = Number(p.amount ?? 0);
            const price = Number(p.price ?? 0);
            return {
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
        lines: parseProductsFromString(debt.product_names).map((p) => {
          // Plain comments (no "*" fields) come back with price 0 — show them as text only
          const sum = Number(p.totalPaid) || Number(p.quantity) * Number(p.price);
          const isComment = !p.price && !p.totalPaid;
          return {
            name: p.name,
            quantity: isComment ? null : p.quantity,
            unit: isComment ? "" : p.unit,
            price: isComment ? null : p.price,
            sum: isComment ? null : sum,
          };
        }),
      }));

  // Spreadsheet row numbers: row 1 is the column titles, then groups, payments, totals
  const groupRowCount = (group: SheetGroup) => Math.max(group.lines.length, 1);
  const groupStartRows = groups.reduce<number[]>(
    (acc, _group, i) => [...acc, i === 0 ? 2 : acc[i - 1] + groupRowCount(groups[i - 1])],
    []
  );
  const paymentsHeaderRow =
    groups.length === 0 ? 3 : groupStartRows[groups.length - 1] + groupRowCount(groups[groups.length - 1]);
  const totalsStartRow = paymentsHeaderRow + 1 + Math.max(records.length, 1);

  const leadingAlign = ["text-center", "whitespace-nowrap"];
  const trailingColors = isWagons ? ["font-semibold", "text-green-700", "text-orange-700"] : ["font-semibold"];

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-300 mb-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm text-gray-900">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={headCell}></th>
              {columns.map((_, i) => (
                <th key={i} className={headCell.replace(" w-10", "")}>{String.fromCharCode(65 + i)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Column titles (row 1) */}
            <tr className="bg-green-50 font-semibold">
              <td className={headCell}>1</td>
              {columns.map((title) => (
                <td key={title} className={`${cell} whitespace-nowrap`}>{title}</td>
              ))}
            </tr>

            {groups.length === 0 && (
              <tr>
                <td className={headCell}>2</td>
                <td colSpan={columns.length} className={`${cell} text-center text-gray-500 py-6`}>
                  {isWagons ? "Вагонлар йўқ" : "Қарзлар йўқ"}
                </td>
              </tr>
            )}

            {groups.map((group, groupIndex) => {
              const rows: (SheetLine | null)[] = group.lines.length > 0 ? group.lines : [null];
              const span = rows.length;
              const zebra = groupIndex % 2 === 1 ? "bg-gray-50" : "bg-white";

              return rows.map((line, lineIndex) => (
                <tr key={`${group.key}-${lineIndex}`} className={`${zebra} hover:bg-blue-50`}>
                  <td className={headCell}>{groupStartRows[groupIndex] + lineIndex}</td>
                  {lineIndex === 0 &&
                    group.leading.map((value, i) => (
                      <td key={i} rowSpan={span} className={`${cell} align-top ${leadingAlign[i] || ""}`}>
                        {value}
                      </td>
                    ))}
                  <td className={cell}>{line ? line.name : "—"}</td>
                  <td className={numCell}>{line?.quantity ?? ""}</td>
                  <td className={`${cell} whitespace-nowrap`}>{line?.unit ? formatUnitLabel(line.unit) : ""}</td>
                  <td className={numCell}>{line?.price != null ? formatMoney(line.price) : ""}</td>
                  <td className={numCell}>{line?.sum != null ? formatMoney(line.sum) : ""}</td>
                  {lineIndex === 0 &&
                    group.trailing.map((value, i) => (
                      <td key={i} rowSpan={span} className={`${numCell} align-top ${trailingColors[i] || ""}`}>
                        {value}
                      </td>
                    ))}
                </tr>
              ));
            })}

            {/* Payment history */}
            <tr className="bg-green-50 font-semibold">
              <td className={headCell}>{paymentsHeaderRow}</td>
              <td colSpan={columns.length} className={cell}>
                Пул бериш тарихи ({records.length})
              </td>
            </tr>
            {records.length === 0 ? (
              <tr>
                <td className={headCell}>{paymentsHeaderRow + 1}</td>
                <td colSpan={columns.length} className={`${cell} text-gray-500`}>Пул бериш тарихи йўқ</td>
              </tr>
            ) : (
              records.map((record, i) => {
                const amount = parseFloat(record.amount) || 0;
                const isIncome = record.type === "income";
                return (
                  <tr key={record.id} className="hover:bg-blue-50">
                    <td className={headCell}>{paymentsHeaderRow + 1 + i}</td>
                    <td className={`${cell} text-center`}>{i + 1}</td>
                    <td className={`${cell} whitespace-nowrap`}>{new Date(record.date).toLocaleDateString("uz-UZ")}</td>
                    <td colSpan={columns.length - 3} className={cell}>
                      {record.description?.split(": ")[1] || record.description}
                    </td>
                    <td className={`${numCell} font-semibold ${isIncome ? "text-green-700" : "text-red-700"}`}>
                      {isIncome ? "+" : "-"}
                      {formatMoney(amount)}
                    </td>
                  </tr>
                );
              })
            )}

            {/* Totals (same values as the summary cards) */}
            {totals.map((total, i) => (
              <tr key={total.label} className="bg-blue-50 font-bold">
                <td className={headCell}>{totalsStartRow + i}</td>
                <td colSpan={columns.length - 1} className={`${cell} text-right`}>{total.label}:</td>
                <td className={`${numCell} ${total.className}`}>{total.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
