import { createSlice } from "@reduxjs/toolkit";
import { getReportsThunk } from "./thunks/getAllReportsThunk";
import type { Report } from "../../../../types/types";

type AuthState = {
  isLoading: boolean;
  error: string | undefined;
  reports: Report[];
  report: Report;
  status: "pending" | "rejected" | "fulfilled" | "idle";
};

const initialState: AuthState = {
  isLoading: false,
  error: "",
  reports: [],
  report: {
    day: 0,
    id: 0,
    log: "",
    month: 0,
    shop_id: "",
    target_id: "",
    year: 0,
  },
  status: "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Add any synchronous reducers if needed here
  },
  extraReducers: (builder) => {
    builder
      .addCase(getReportsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = "";
        state.status = "pending";
      })
      .addCase(getReportsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reports = action.payload.data as unknown as Report[];
        state.status = "fulfilled";
      })
      .addCase(getReportsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        state.status = "rejected";
      });
  },
});

export const {} = authSlice.actions;

export default authSlice.reducer;
