import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import { toast } from "react-toastify";
import type { Branch }from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Branch[];
}

export interface AuthPayload {
  token: string | null | undefined;
  shop_id:string | null | undefined
}

export const getBranchesThunk = createAsyncThunk<
  ComingResponse,
  AuthPayload
>(
  "branches/get-branches",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.branches.getShopBranches}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
            "shop_id":`${payload.shop_id}`
          },
          body
          :JSON.stringify({
            shop_id:payload.shop_id
          })
        }
      );

      if (!response.ok) {
        const data= await response.json();
        const errorMsg = data.message || "Failed to fetch branches";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();

      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while fetching branches";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
