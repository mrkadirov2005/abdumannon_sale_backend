import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { products as initialProducts, type Product } from "../../data/products";

type ProductsState = {
  items: Product[];
  isLoading: boolean;
  error?: string | null;
};

const initialState: ProductsState = {
  items: initialProducts,
  isLoading: false,
  error: null,
};

// Example async thunk placeholder (could fetch from API)
export const fetchProducts = createAsyncThunk("products/fetch", async () => {
  // In a real app fetch from API. Here return local data.
  return initialProducts;
});

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts(state, action: PayloadAction<Product[]>) {
      state.items = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
   
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProducts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message ?? "Failed to load products";
    });
  },
});

export const { setProducts, setLoading, setError } = productsSlice.actions;

export default productsSlice.reducer;
