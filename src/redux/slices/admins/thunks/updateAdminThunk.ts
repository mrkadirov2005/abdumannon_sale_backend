import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import { toast } from "react-toastify";
import type { Admin } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Admin[];
}

export interface UpdateAdmin {
  admin: Admin;
  token: string | null | undefined;
}

export const updateShopAdminsThunk = createAsyncThunk<
  ComingResponse,
  UpdateAdmin
>(
  "admin/update-shopAdmins",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.admins.update}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
          },
          body:JSON.stringify({...payload.admin})
        }
      );

      if (!response.ok) {
        const data= await response.json();
         const errorMsg = data.message || "Failed to update admin";
        
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data :ComingResponse= await response.json();
      toast.success("Admin updated successfully");
      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while updating admin";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
