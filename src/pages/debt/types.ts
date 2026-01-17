// pages/debt/types.ts

export interface Product {
  id: string;
  name: string;
  quantity: number;
  price: number;
  totalPaid: number;
}

export interface ProductEntry {
  id: string;
  name: string;
  quantity: number;
  price: number;
  totalPaid: number;
}

export interface Debt {
  id: string;
  day: number;
  month: number;
  year: number;
  name: string;
  amount: number;
  product_names: string;
  branch_id: number;
  shop_id: number;
  admin_id: string;
  isreturned: boolean;
  created_at: string;
}

export interface DebtStatistics {
  total_debts: string;
  unreturned_count: string;
  returned_count: string;
  total_amount: string;
  unreturned_amount: string;
  returned_amount: string;
  given_debts_count?: string;
  given_debts_amount?: string;
  taken_debts_count?: string;
  taken_debts_amount?: string;
}

export interface DebtorSummary {
  name: string;
  totalDebts: number;
  totalAmount: number;
  unreturnedAmount: number;
  returnedAmount: number;
  debts: Debt[];
}

export interface FormData {
  name: string;
  amount: string;
  product_names: ProductEntry[] | string[];
  branch_id: number;
}

export type SortKey = "date" | "name" | "amount" | "isreturned" | "created_at";
export type SortDirection = "asc" | "desc";
export type ViewMode = "list" | "folders" | "statistics";
export type DebtTypeFilter = "all" | "given" | "taken";
