import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "../../data/products";

export type CartItem = (Product & { quantity: number });

type CartState = {
  items: CartItem[];
  isLoading: boolean;
  error?: string | null;
};

const initialState: CartState = {
  items: [],
  isLoading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(state, action: PayloadAction<{ product: Product; qty?: number }>) {
      const { product, qty = 1 } = action.payload;
      const existing = state.items.find((i) => i.id === product.id);
      const stock = (product as any).stock ?? 99999;
      if (existing) {
        existing.quantity = Math.min(stock, existing.quantity + qty);
      } else {
        state.items.push({ ...product, quantity: Math.min(qty, stock) });
      }
    },
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    changeQty(state, action: PayloadAction<{ id: number; delta: number }>) {
      const { id, delta } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (item) {
        const stock = (item as any).stock ?? 99999;
        item.quantity = Math.max(1, Math.min(stock, item.quantity + delta));
      }
    },
    clearCart(state) {
      state.items = [];
    },
    setCart(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { addItem, removeItem, changeQty, clearCart, setCart, setLoading, setError } = cartSlice.actions;

export default cartSlice.reducer;
