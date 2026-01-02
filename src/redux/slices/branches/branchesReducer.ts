import { createSlice } from "@reduxjs/toolkit";
import {  type Branch } from "../../../../types/types";
import { getBranchesThunk } from "./thunks/GetBranchesThunk";

type BranchesState = {
  isLoading: boolean;
  error: string | null;
  branches: Branch[];
  branch: Branch;
  status: "pending" | "rejected" | "fulfilled" | "idle";
};

const initialState: BranchesState = {
  isLoading: false,
  error: null,
  branches:[],
  branch:{} as Branch,
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
    setSingleBranch(state,action){
        state.branch=action.payload
    }
  },
  extraReducers: (builder) => {
    builder.addCase(getBranchesThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      state.status = "pending";
    });
    builder.addCase(getBranchesThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.error = null;
      state.branches = action.payload.data;
      state.status = "fulfilled";
    });
    builder.addCase(getBranchesThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = `${action.error.code }`
      state.status = "rejected";
    });
  },
});

export const { setSingleBranch } = CategorySlice.actions;

export default CategorySlice.reducer;
