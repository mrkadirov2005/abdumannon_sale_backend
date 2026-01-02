import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import { toast } from "react-toastify";
import type { Admin } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Admin[];
}

export interface LoginPayload {
  shop_id: string | null | undefined;
  token: string | null | undefined;
}

export const getShopAdminsThunk = createAsyncThunk<
  ComingResponse,
  LoginPayload
>(
  "admin/get-shopAdmins",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.admins.get_all}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
            "shop_id": payload.shop_id ?? "",
          },
          body: JSON.stringify({
            shop_id: payload.shop_id
          })
        }
      );

      if (!response.ok) {
       const data= await response.json();
        const errorMsg = data.message || "Failed to fetch admins";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data :ComingResponse= await response.json();
      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while fetching admins";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
