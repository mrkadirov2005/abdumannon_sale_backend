import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import type { Category } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Category[];
}

export interface AuthPayload {
  token: string | null | undefined;
}

export const getCategoriesThunk = createAsyncThunk<
  ComingResponse,
  AuthPayload
>(
  "categories/get-categories",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.categories.getAllCategories}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.message || "Failed to fetch categories";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();

      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while fetching categories";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
