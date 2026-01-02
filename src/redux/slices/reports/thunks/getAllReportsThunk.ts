import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
// import type {Report } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Report[];
}

export interface LoginPayload {
  shop_id: string | null | undefined;
  token: string | null | undefined;
}

export const getReportsThunk = createAsyncThunk<
  ComingResponse,
  LoginPayload
>(
  "reports/get-reports",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.reports.get_all_reports}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
            "shop_id": payload.shop_id ?? "",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.message || "Failed to fetch reports";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();

      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while fetching reports";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
