import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import type { SuperUser } from "../../../../../types/types";

interface ComingResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: SuperUser
}

export interface LoginPayload {
  name: string;
  password: string;
}

export const loginSuperUser = createAsyncThunk<
  ComingResponse,   // RETURN TYPE
  LoginPayload      // ARGUMENT TYPE
>(
  "superuser/login",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.auth.login.superuser}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorMsg = "Invalid credentials";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();

      toast.success("Login successful");

      // Must match ComingResponse
      return {
        message: data.message,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user:data.user
      } as ComingResponse;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);





export const loginAdmin = createAsyncThunk<
  ComingResponse,   // RETURN TYPE
  LoginPayload      // ARGUMENT TYPE
>(
  "admin/login",
  async (payload, thunkAPI) => {
    try {
      const response = await fetch(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.auth.login.admin}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorMsg = "Invalid credentials";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

      const data = await response.json();

      toast.success("Admin login successful");

      // Must match ComingResponse
      return {
        message: data.message,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user:data.user
      } as ComingResponse;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Network error";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
