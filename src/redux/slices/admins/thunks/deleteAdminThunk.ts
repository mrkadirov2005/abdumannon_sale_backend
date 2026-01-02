import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import { toast } from "react-toastify";
import type { Admin } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  data: Admin[];
}

export interface DeleteAdmin {
  uuid: string | null;
  token: string | null | undefined;
}

export const deleteShopAdminsThunk = createAsyncThunk<
  ComingResponse,
  DeleteAdmin
>(
  "admin/delete-shopAdmins",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.admins.delete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
          },
          body:JSON.stringify({uuid:payload.uuid})
        }
      );

      if (!response.ok) {
        const data= await response.json();
       
        const errorMsg = data.message || "Failed to delete admin";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data :ComingResponse= await response.json();
      toast.success("Admin deleted successfully");
      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while deleting admin";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
