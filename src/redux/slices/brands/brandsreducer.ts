import { createSlice } from "@reduxjs/toolkit";
import { type Brand, exampleBrand } from "../../../../types/types";
import { getBrandsThunk } from "./thunk/getAllBrands";

type CategoryState = {
  isLoading: boolean;
  error: string | null;
  brands: Brand[];
  brand: Brand;
  status: "pending" | "rejected" | "fulfilled" | "idle";
};

const initialState: CategoryState = {
  isLoading: false,
  error: null,
  brands: [exampleBrand],
  brand: exampleBrand,
  status: "idle",
};

const CategorySlice = createSlice({
  name: "brand",
  initialState,
  reducers: {
    // Uncomment and implement if you want to set a single selected category
    // setSingleCategory(state, action: PayloadAction<Category>) {
    //   state.category = action.payload;
    // },
  },
  extraReducers: (builder) => {
    builder.addCase(getBrandsThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      state.status = "pending";
    });
    builder.addCase(getBrandsThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = null;
      state.brands = action.payload.data;
      state.status = "fulfilled";
    });
    builder.addCase(getBrandsThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = `${action.error.code }`
      state.status = "rejected";
    });
  },
});

// export const { setSingleCategory } = CategorySlice.actions;

export default CategorySlice.reducer;
