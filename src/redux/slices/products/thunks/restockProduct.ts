import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import { toast } from "react-toastify";
import type { Product } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Product[];
}

export interface restockProduct {
  total: number;
  availability:number;
  token: string | null | undefined;
  id:string
}

export const restockProductThunk = createAsyncThunk<
  ComingResponse,
  restockProduct
>(
  "products/put-restockSingleProduct",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.product.restock}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
          },
          body:JSON.stringify({availability:payload.availability,total:payload.total,id:payload.id})
        }
      );

      if (!response.ok) {
        const isOk = await response.json();
        const errorMsg = isOk.error || "Failed to restock product";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();
      toast.success("Product restocked successfully");

      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while restocking";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
