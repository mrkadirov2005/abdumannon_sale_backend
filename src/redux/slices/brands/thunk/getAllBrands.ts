import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import type { Brand }from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Brand[];
}

export interface AuthPayload {
  token: string | null | undefined;
}

export const getBrandsThunk = createAsyncThunk<
  ComingResponse,
  AuthPayload
>(
  "brands/get-brands",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.brands.getAllBrands}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
          },
        }
      );

      if (!response.ok) {
        const data= await response.json();
     const errorMsg = data.message || "Failed to fetch brands";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();

      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while fetching brands";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
