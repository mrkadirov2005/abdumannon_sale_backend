export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  cost_price?: number;
  sell_price?: number;
  net_price?: number;
  category_id?: number;
  product_id?: string;
  product_name?: string;
  amount?: number;
  subtotal?: number;
  unit?: string;
}

export interface Wagon {
  id: string;
  wagon_number: string;
  user_id: number;
  total: number;
  paid_amount?: number;
  products: Product[];
}

export interface Debt {
  id: string;
  name: string;
  amount: number;
  day: number;
  month: number;
  year: number;
  isreturned: boolean;
}

export interface Person {
  name: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  wagons?: Wagon[];
  debts?: Debt[];
}

export interface FinanceRecord {
  id: number;
  amount: string;
  description?: string;
  type: "income" | "expense";
  category: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface FormData {
  amount: string;
  description: string;
  type: "income" | "expense";
  category: string;
  date: string;
}

export type ViewMode = "folders" | "list";
