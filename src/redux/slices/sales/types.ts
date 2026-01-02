export interface CartItem {
  productid: string;
  name: string;
  price: number;
  netPrice: number;
  quantity: number;
}

export interface Sale {
  id?: string;
  items: CartItem[];
  total: number;
  admin_number?: string;
  admin_name?: string;
  shop_id?: string;
  payment_method?: string;
  createdat?: string;
  [key: string]: any;
  branch:number
}

export interface SalesState {
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  lastSale: Sale | null;
  sales: Sale[];
  selectedSale: Sale | null;
  status:"fulfilled" | "rejected" | "pending" |"idle"
}

export const initialSalesState: SalesState = {
  cart: [],
  loading: false,
  error: null,
  lastSale: null,
  sales: [],
  selectedSale: null,
  status:"idle"
};