import React, { useState } from "react";
import { Plus, Pencil, Check, X, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import {
  RU_UNIT_OPTIONS,
  ruUnitLabel,
  type SheetGroup,
  type SheetLine,
  type SheetPayment,
  type SheetTotal,
} from "./sheetTypes";

interface ExcelSheetProps {
  leadingColumns: string[];
  trailingColumns: string[];
  groups: SheetGroup[];
  emptyText: string;
  payments: SheetPayment[];
  paymentsTitle: string;
  paymentsEmptyText: string;
  totals: SheetTotal[];
  addLabel: string;
  onAdd: () => void;
  // Optional second "+" action shown next to the first one
  secondaryAddLabel?: string;
  onSecondaryAdd?: () => void;
  formatMoney: (value: number) => string;
}

const LINE_COLUMNS = ["Товар", "Кол-во", "Ед.", "Цена", "Сумма"];

const cell = "border border-gray-300 px-2 py-1.5";
const headCell = "border border-gray-300 bg-gray-100 text-gray-500 font-normal text-xs text-center px-2 py-1";
const numCell = `${cell} text-right tabular-nums whitespace-nowrap`;
const input = "w-full min-w-0 px-1.5 py-1 text-sm border border-blue-400 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";

interface LineDraft {
  type: "line";
  name: string;
  quantity: string;
  unit: string;
  price: string;
  amount: string;
}

interface PaymentDraft {
  type: "payment";
  date: string;
  description: string;
  amount: string;
}

type Draft = LineDraft | PaymentDraft;

const toNumber = (value: string) => Number(value.replace(",", ".").replace(/\s/g, ""));

export const ExcelSheet: React.FC<ExcelSheetProps> = ({
  leadingColumns,
  trailingColumns,
  groups,
  emptyText,
  payments,
  paymentsTitle,
  paymentsEmptyText,
  totals,
  addLabel,
  onAdd,
  secondaryAddLabel,
  onSecondaryAdd,
  formatMoney,
}) => {
  const [selected, setSelected] = useState<{ row: string; col: string } | null>(null);
  const [editing, setEditing] = useState<{ row: string; draft: Draft } | null>(null);
  const [saving, setSaving] = useState(false);

  const columns = [...leadingColumns, ...LINE_COLUMNS, ...trailingColumns];
  // Data columns + the actions column on the right
  const fullSpan = columns.length + 1;

  // Spreadsheet row numbers: row 1 is the column titles, then groups, payments, totals
  const groupRowCount = (group: SheetGroup) => Math.max(group.lines.length, 1);
  const groupStartRows = groups.reduce<number[]>(
    (acc, _group, i) => [...acc, i === 0 ? 2 : acc[i - 1] + groupRowCount(groups[i - 1])],
    []
  );
  const paymentsHeaderRow =
    groups.length === 0 ? 3 : groupStartRows[groups.length - 1] + groupRowCount(groups[groups.length - 1]);
  const totalsStartRow = paymentsHeaderRow + 1 + Math.max(payments.length, 1);

  const selectCell = (row: string, col: string) => {
    if (editing) return;
    setSelected({ row, col });
  };

  const cellProps = (row: string, col: string, className: string) => {
    const isSelected = selected?.row === row && selected.col === col && !editing;
    return {
      onClick: () => selectCell(row, col),
      className: `${className} cursor-cell ${isSelected ? "outline outline-2 -outline-offset-2 outline-blue-600" : ""}`,
    };
  };

  const cancelEdit = () => setEditing(null);

  const startLineEdit = (row: string, line: SheetLine | null, group: SheetGroup) => {
    setEditing({
      row,
      draft: {
        type: "line",
        name: line?.name ?? "",
        quantity: line?.quantity != null ? String(line.quantity) : "",
        unit: line?.unit || "pcs",
        price: line?.price != null ? String(line.price) : "",
        amount: String(group.edit?.amount ?? ""),
      },
    });
  };

  const startPaymentEdit = (payment: SheetPayment) => {
    if (!payment.edit) return;
    setEditing({
      row: payment.key,
      draft: {
        type: "payment",
        date: payment.edit.initialDate,
        description: payment.edit.initialDescription,
        amount: String(payment.amount),
      },
    });
  };

  const updateDraft = (patch: Partial<LineDraft> | Partial<PaymentDraft>) => {
    setEditing((prev) => (prev ? { ...prev, draft: { ...prev.draft, ...patch } as Draft } : prev));
  };

  const finishSave = async (save: () => Promise<boolean>) => {
    setSaving(true);
    try {
      if (await save()) {
        setEditing(null);
        setSelected(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveLine = (group: SheetGroup, lineIndex: number, line: SheetLine | null, draft: LineDraft) => {
    if (!group.edit) return;
    const { edit } = group;
    const name = draft.name.replace(/[|*]/g, " ").trim();

    if (line?.kind === "comment") {
      const amount = toNumber(draft.amount);
      if (!name) return void toast.error("Введите комментарий");
      if (!Number.isFinite(amount) || amount <= 0) return void toast.error("Неверная сумма");
      const rawItems = [...edit.rawItems];
      rawItems[lineIndex] = name;
      return void finishSave(() => edit.onSave({ amount, rawItems }));
    }

    const quantity = toNumber(draft.quantity);
    const price = toNumber(draft.price);
    if (!name) return void toast.error("Введите название товара");
    if (!Number.isFinite(quantity) || quantity <= 0) return void toast.error("Количество должно быть больше 0");
    if (!Number.isFinite(price) || price < 0) return void toast.error("Неверная цена");

    // A debt without product lines is shown as one empty row that stands for the whole amount
    const oldSum = line ? line.sum ?? 0 : edit.amount;
    const newSum = quantity * price;
    const amount = edit.amount - oldSum + newSum;
    const raw = `${name}*${quantity}*${price}*0*${draft.unit || "pcs"}`;
    const rawItems = line ? edit.rawItems.map((item, i) => (i === lineIndex ? raw : item)) : [raw];

    void finishSave(() => edit.onSave({ amount, rawItems }));
  };

  const savePayment = (payment: SheetPayment, draft: PaymentDraft) => {
    if (!payment.edit) return;
    const { edit } = payment;
    const amount = toNumber(draft.amount);
    if (!draft.date) return void toast.error("Введите дату");
    if (!Number.isFinite(amount) || amount <= 0) return void toast.error("Неверная сумма");
    void finishSave(() => edit.onSave({ date: draft.date, description: draft.description.trim(), amount }));
  };

  const onKeyDown = (e: React.KeyboardEvent, save: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const renderActions = (
    row: string,
    canEdit: boolean,
    onEdit: () => void,
    onSave: () => void,
    onDelete?: () => void,
    deleteLabel = "Удалить"
  ) => {
    if (editing?.row === row) {
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
          >
            <Check size={14} /> {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <button
            onClick={cancelEdit}
            disabled={saving}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <X size={14} /> Отмена
          </button>
        </div>
      );
    }
    if (editing || selected?.row !== row) return null;
    if (!canEdit && !onDelete) return <span className="text-xs text-gray-400">Только просмотр</span>;
    return (
      <div className="flex items-center gap-1">
        {canEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            <Pencil size={14} /> Редактировать
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              setSelected(null);
              onDelete();
            }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
          >
            <Trash2 size={14} /> {deleteLabel}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-300 mb-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-sm text-gray-900">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={`${headCell} w-10`}></th>
              {columns.map((_, i) => (
                <th key={i} className={headCell}>{String.fromCharCode(65 + i)}</th>
              ))}
              <th className={`${headCell} w-56`}></th>
            </tr>
          </thead>
          <tbody>
            {/* Column titles (row 1) */}
            <tr className="bg-green-50 font-semibold">
              <td className={`${headCell} w-10`}>1</td>
              {columns.map((title) => (
                <td key={title} className={`${cell} whitespace-nowrap`}>{title}</td>
              ))}
              <td className={cell}></td>
            </tr>

            {groups.length === 0 && (
              <tr>
                <td className={`${headCell} w-10`}>2</td>
                <td colSpan={fullSpan} className={`${cell} text-center text-gray-500 py-6`}>{emptyText}</td>
              </tr>
            )}

            {groups.map((group, groupIndex) => {
              const rows: (SheetLine | null)[] = group.lines.length > 0 ? group.lines : [null];
              const span = rows.length;
              const zebra = groupIndex % 2 === 1 ? "bg-gray-50" : "bg-white";

              return rows.map((line, lineIndex) => {
                const rowKey = `${group.key}-${lineIndex}`;
                const firstRowKey = `${group.key}-0`;
                const draft = editing?.row === rowKey && editing.draft.type === "line" ? editing.draft : null;
                const isComment = line?.kind === "comment";
                const save = () => draft && saveLine(group, lineIndex, line, draft);

                return (
                  <tr key={rowKey} className={draft ? "bg-yellow-50" : `${zebra} hover:bg-blue-50`}>
                    <td className={`${headCell} w-10`}>{groupStartRows[groupIndex] + lineIndex}</td>
                    {lineIndex === 0 &&
                      group.leading.map((value, i) => (
                        <td
                          key={i}
                          rowSpan={span}
                          {...cellProps(firstRowKey, `lead-${i}`, `${cell} align-top ${i === 0 ? "text-center" : "whitespace-nowrap"}`)}
                        >
                          {value}
                        </td>
                      ))}

                    {draft ? (
                      <>
                        <td className={cell}>
                          <input
                            autoFocus
                            className={input}
                            value={draft.name}
                            placeholder={isComment ? "Комментарий" : "Товар"}
                            onChange={(e) => updateDraft({ name: e.target.value })}
                            onKeyDown={(e) => onKeyDown(e, save)}
                          />
                        </td>
                        {isComment ? (
                          <>
                            <td className={cell}></td>
                            <td className={cell}></td>
                            <td className={cell}></td>
                            <td className={cell}>
                              <input
                                className={`${input} text-right`}
                                inputMode="decimal"
                                value={draft.amount}
                                placeholder="Сумма"
                                onChange={(e) => updateDraft({ amount: e.target.value })}
                                onKeyDown={(e) => onKeyDown(e, save)}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className={cell}>
                              <input
                                className={`${input} text-right w-20`}
                                inputMode="decimal"
                                value={draft.quantity}
                                onChange={(e) => updateDraft({ quantity: e.target.value })}
                                onKeyDown={(e) => onKeyDown(e, save)}
                              />
                            </td>
                            <td className={cell}>
                              <select
                                className={input}
                                value={draft.unit}
                                onChange={(e) => updateDraft({ unit: e.target.value })}
                              >
                                {RU_UNIT_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className={cell}>
                              <input
                                className={`${input} text-right w-24`}
                                inputMode="decimal"
                                value={draft.price}
                                onChange={(e) => updateDraft({ price: e.target.value })}
                                onKeyDown={(e) => onKeyDown(e, save)}
                              />
                            </td>
                            <td className={`${numCell} text-gray-500`}>
                              {formatMoney((toNumber(draft.quantity) || 0) * (toNumber(draft.price) || 0))}
                            </td>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <td {...cellProps(rowKey, "name", cell)}>{line ? line.name : "—"}</td>
                        <td {...cellProps(rowKey, "qty", numCell)}>{line?.quantity ?? ""}</td>
                        <td {...cellProps(rowKey, "unit", `${cell} whitespace-nowrap`)}>
                          {line?.kind === "product" ? ruUnitLabel(line.unit) : ""}
                        </td>
                        <td {...cellProps(rowKey, "price", numCell)}>{line?.price != null ? formatMoney(line.price) : ""}</td>
                        <td {...cellProps(rowKey, "sum", numCell)}>{line?.sum != null ? formatMoney(line.sum) : ""}</td>
                      </>
                    )}

                    {lineIndex === 0 &&
                      group.trailing.map((value, i) => (
                        <td
                          key={i}
                          rowSpan={span}
                          {...cellProps(firstRowKey, `trail-${i}`, `${numCell} align-top ${group.trailingClassNames?.[i] || ""}`)}
                        >
                          {value}
                        </td>
                      ))}

                    <td className={`${cell} whitespace-nowrap`}>
                      {renderActions(
                        rowKey,
                        Boolean(group.edit),
                        () => startLineEdit(rowKey, line, group),
                        save,
                        group.onDelete,
                        "Удалить долг"
                      )}
                    </td>
                  </tr>
                );
              });
            })}

            {/* Payments */}
            <tr className="bg-green-50 font-semibold">
              <td className={`${headCell} w-10`}>{paymentsHeaderRow}</td>
              <td colSpan={fullSpan} className={cell}>
                {paymentsTitle} ({payments.length})
              </td>
            </tr>
            {payments.length === 0 ? (
              <tr>
                <td className={`${headCell} w-10`}>{paymentsHeaderRow + 1}</td>
                <td colSpan={fullSpan} className={`${cell} text-gray-500`}>{paymentsEmptyText}</td>
              </tr>
            ) : (
              payments.map((payment, i) => {
                const draft = editing?.row === payment.key && editing.draft.type === "payment" ? editing.draft : null;
                const save = () => draft && savePayment(payment, draft);
                const amountClass = payment.isIncome ? "text-green-700" : "text-red-700";

                return (
                  <tr key={payment.key} className={draft ? "bg-yellow-50" : "hover:bg-blue-50"}>
                    <td className={`${headCell} w-10`}>{paymentsHeaderRow + 1 + i}</td>
                    <td {...cellProps(payment.key, "no", `${cell} text-center`)}>{i + 1}</td>
                    {draft ? (
                      <>
                        <td className={cell}>
                          <input
                            type="date"
                            className={input}
                            value={draft.date}
                            onChange={(e) => updateDraft({ date: e.target.value })}
                            onKeyDown={(e) => onKeyDown(e, save)}
                          />
                        </td>
                        <td colSpan={columns.length - 3} className={cell}>
                          <input
                            autoFocus
                            className={input}
                            value={draft.description}
                            placeholder="Комментарий"
                            onChange={(e) => updateDraft({ description: e.target.value })}
                            onKeyDown={(e) => onKeyDown(e, save)}
                          />
                        </td>
                        <td className={cell}>
                          <input
                            className={`${input} text-right`}
                            inputMode="decimal"
                            value={draft.amount}
                            onChange={(e) => updateDraft({ amount: e.target.value })}
                            onKeyDown={(e) => onKeyDown(e, save)}
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td {...cellProps(payment.key, "date", `${cell} whitespace-nowrap`)}>{payment.date}</td>
                        <td colSpan={columns.length - 3} {...cellProps(payment.key, "desc", cell)}>
                          {payment.description}
                        </td>
                        <td {...cellProps(payment.key, "amount", `${numCell} font-semibold ${amountClass}`)}>
                          {payment.isIncome ? "+" : "-"}
                          {formatMoney(payment.amount)}
                        </td>
                      </>
                    )}
                    <td className={`${cell} whitespace-nowrap`}>
                      {renderActions(payment.key, Boolean(payment.edit), () => startPaymentEdit(payment), save, payment.onDelete)}
                    </td>
                  </tr>
                );
              })
            )}

            {/* Totals */}
            {totals.map((total, i) => (
              <tr key={total.label} className="bg-blue-50 font-bold">
                <td className={`${headCell} w-10`}>{totalsStartRow + i}</td>
                <td colSpan={columns.length - 1} className={`${cell} text-right`}>{total.label}:</td>
                <td className={`${numCell} ${total.className}`}>{total.value}</td>
                <td className={cell}></td>
              </tr>
            ))}

            {/* Add new record */}
            <tr>
              <td className={`${headCell} w-10`}>
                <Plus size={14} className="mx-auto" />
              </td>
              <td colSpan={fullSpan} className="border border-gray-300 p-0">
                <div className="flex divide-x divide-gray-300">
                  <button
                    onClick={onAdd}
                    className="flex-1 flex items-center gap-2 px-2 py-2 text-blue-700 font-medium hover:bg-blue-50 transition"
                  >
                    <Plus size={16} /> {addLabel}
                  </button>
                  {secondaryAddLabel && onSecondaryAdd && (
                    <button
                      onClick={onSecondaryAdd}
                      className="flex-1 flex items-center gap-2 px-2 py-2 text-green-700 font-medium hover:bg-green-50 transition"
                    >
                      <Plus size={16} /> {secondaryAddLabel}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
