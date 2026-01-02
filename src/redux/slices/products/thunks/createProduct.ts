import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import { toast } from "react-toastify";
import type { Product } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Product[];
}

export interface updateProduct {
  product: Product;
  token: string | null | undefined;
}

export const createSingleProductThunk = createAsyncThunk<
  ComingResponse,
  updateProduct
>(
  "products/POST-createSingleProduct",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.product.create}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
          },
          body:JSON.stringify(payload.product)
        }
      );

      if (!response.ok) {
       const data= await response.json();
    const errorMsg = data.message || "Failed to create product";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();
      toast.success("Product created successfully");

      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while creating product";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
