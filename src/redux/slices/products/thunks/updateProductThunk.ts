import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import { toast } from "react-toastify";
import type { Product } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Product;
}

export interface updateProduct {
  product: Product;
  token: string | null | undefined;
}

export const UpdateProductThunk = createAsyncThunk<
  ComingResponse,
  updateProduct
>(
  "products/put-updateSingleProduct",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.product.update}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
          },
          body:JSON.stringify(payload.product)
        }
      );

      if (!response.ok) {
        const data= await response.json();
     const errorMsg = data.message || "Failed to update product";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();
      toast.success("Product updated successfully");

      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while updating product";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
