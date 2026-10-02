import type { ReactNode } from "react";

export const RU_UNIT_OPTIONS = [
  { value: "pcs", label: "шт" },
  { value: "kg", label: "кг" },
  { value: "t", label: "т" },
  { value: "l", label: "л" },
];

export const ruUnitLabel = (unit: string | undefined | null) => {
  const normalized = unit || "pcs";
  return RU_UNIT_OPTIONS.find((opt) => opt.value === normalized)?.label || normalized;
};

/** One product line of a debt / wagon. "comment" lines are free text without quantity or price. */
export interface SheetLine {
  kind: "product" | "comment";
  name: string;
  quantity: number | null;
  unit: string;
  price: number | null;
  sum: number | null;
}

/** New product list and total for a debt after one of its lines was edited. */
export interface SheetDebtUpdate {
  amount: number;
  rawItems: string[];
}

export interface SheetGroup {
  key: string;
  // Cells merged across all lines of the group (before / after the line cells)
  leading: ReactNode[];
  trailing: ReactNode[];
  trailingClassNames?: string[];
  lines: SheetLine[];
  // Present when the group's lines can be edited
  edit?: {
    amount: number;
    rawItems: string[];
    onSave: (update: SheetDebtUpdate) => Promise<boolean>;
  };
}

export interface SheetPaymentDraft {
  date: string;
  description: string;
  amount: number;
}

export interface SheetPayment {
  key: string;
  date: string;
  description: string;
  amount: number;
  isIncome: boolean;
  edit?: {
    initialDate: string;
    initialDescription: string;
    onSave: (draft: SheetPaymentDraft) => Promise<boolean>;
  };
}

export interface SheetTotal {
  label: string;
  value: string;
  className: string;
}
