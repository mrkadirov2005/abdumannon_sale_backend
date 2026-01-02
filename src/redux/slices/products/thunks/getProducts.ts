import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import { toast } from "react-toastify";
import type { Product } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Product[];
}

export interface LoginPayload {
  shop_id: string | null | undefined;
  token: string | null | undefined;
  branch:number
}

export const getProductsThunk = createAsyncThunk<
  ComingResponse,
  LoginPayload
>(
  "products/get-shopproducts",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.product.get_shop_products}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
            "shop_id": payload.shop_id ?? "no provided",
            "branch":`${payload.branch}`
          },
          body: JSON.stringify({
            shop_id: payload.shop_id,
            branch:payload.branch
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.message || "Failed to fetch products";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();
      toast.success("Products loaded successfully");

      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred while fetching products";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
