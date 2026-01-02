import { createSlice } from "@reduxjs/toolkit";
import { type Category, exampleCategory } from "../../../../types/types";
import { getCategoriesThunk } from "./thunk/getAllCategories";

type CategoryState = {
  isLoading: boolean;
  error: string | null;
  categories: Category[];
  category: Category;
  status: "pending" | "rejected" | "fulfilled" | "idle";
};

const initialState: CategoryState = {
  isLoading: false,
  error: null,
  categories: [exampleCategory],
  category: exampleCategory,
  status: "idle",
};

const CategorySlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    // Uncomment and implement if you want to set a single selected category
    // setSingleCategory(state, action: PayloadAction<Category>) {
    //   state.category = action.payload;
    // },
  },
  extraReducers: (builder) => {
    builder.addCase(getCategoriesThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      state.status = "pending";
    });
    builder.addCase(getCategoriesThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = null;
      state.categories = action.payload.data;
      state.status = "fulfilled";
    });
    builder.addCase(getCategoriesThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = `${action.error.code }`
      state.status = "rejected";
    });
  },
});

// export const { setSingleCategory } = CategorySlice.actions;

export default CategorySlice.reducer;
