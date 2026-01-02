import { createAsyncThunk } from "@reduxjs/toolkit";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import { toast } from "react-toastify";
import type { Admin } from "../../../../../types/types";
import type { SendableAddAdminData } from "../../../../pages/Users/AddUser";

interface ComingResponse {
  message: string;
  data: Admin[];
}

export interface addAdmin {
  admin: SendableAddAdminData;
  token: string | null | undefined;
}

export const addShopAdminsThunk = createAsyncThunk<
  ComingResponse,
  addAdmin
>(
  "admin/add-shopAdmins",
  async (payload, thunkAPI) => {
    console.log("token in thunk",payload.token)
    // API call to add admin
    // Return the added admin data on success
    // Handle errors appropriately
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.admins.add}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": payload.token ?? "",
          },
          body:JSON.stringify({...payload.admin})
        }
      );

      if (!response.ok) {
        const data= await response.json();
        const errorMsg = data.message || "Failed to add admin";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data :ComingResponse= await response.json();
      toast.success("Admin added successfully");
      return {
        message: data.message,
        data: data.data,
      } as ComingResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error occurred while adding admin";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
