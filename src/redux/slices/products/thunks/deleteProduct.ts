import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import { toast } from "react-toastify";
import type { Product } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Product[];
}

export interface LoginPayload {
  product_id: string | null | undefined;
  token: string | null | undefined;
}

export const deleteProductsThunk = createAsyncThunk<
  ComingResponse,
  LoginPayload
>(
  "products/delete-shopproducts",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.product.delete_product}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
          },
          body:JSON.stringify({id:payload.product_id})
        }
      );

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = `${data.message || "Failed to delete product"}`;
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();
      toast.success("Product deleted successfully");

      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while deleting product";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
