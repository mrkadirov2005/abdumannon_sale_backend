import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { SalesState, CartItem } from "./types";
import { checkoutSale } from "./thunks/checkoutSale";
import { getSales } from "./thunks/getSales";
import { getSaleById } from "./thunks/getSaleById";

const initialState: SalesState = {
  cart: [],
  loading: false,
  error: null,
  lastSale: null,
  sales: [],
  selectedSale: null,
  status:"idle"
};

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const item = action.payload;
      const existing = state.cart.find((i) => i.productid === item.productid);

      if (existing) {
        existing.quantity += 1;
      } else {
        state.cart.push({ ...item, quantity: 1 });
      }
    },

    removeFromCart(state, action: PayloadAction<string>) {
      state.cart = state.cart.filter((i) => i.productid !== action.payload);
    },

    clearCart(state) {
      state.cart = [];
    },

    updateQuantity(
      state,
      action: PayloadAction<{ productid: string; quantity: number }>
    ) {
      const item = state.cart.find((i) => i.productid === action.payload.productid);
      if (item) item.quantity = action.payload.quantity;
    },

    updatePrice(
      state,
      action: PayloadAction<{ productid: string; price: number }>
    ) {
      const item = state.cart.find((i) => i.productid === action.payload.productid);
      if (item) item.price = action.payload.price;
    },

    setSales(state,action){
      state.sales=action.payload
    }

  },

  extraReducers: (builder) => {
    // Checkout Sale
    builder.addCase(checkoutSale.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.status="pending"
    });

    builder.addCase(checkoutSale.fulfilled, (state, action) => {
      state.loading = false;
      state.error = null; // Clear any previous errors on success
      state.lastSale = action.payload?.data || action.payload;
      state.cart = [];
      state.status="fulfilled"
    });

    builder.addCase(checkoutSale.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.status="rejected"
    });

    // Get Sales
    builder.addCase(getSales.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(getSales.fulfilled, (state, action) => {
      state.loading = false;
      state.sales = action.payload?.data || action.payload || [];
    });

    builder.addCase(getSales.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Get Sale By ID
    builder.addCase(getSaleById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    builder.addCase(getSaleById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedSale = action.payload?.data || action.payload;
    });

    builder.addCase(getSaleById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { addToCart, removeFromCart, clearCart, updateQuantity, updatePrice, setSales } =
  salesSlice.actions;

export default salesSlice.reducer;

