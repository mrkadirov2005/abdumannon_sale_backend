import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";

export const getSales = createAsyncThunk(
  "sales/getSales",
  async (
    payload: { token?: string; shop_id?: string } = {},
    thunkAPI
  ) => {
    try {
      const res = await axios.get(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.getSales}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(payload.token && { Authorization: payload.token }),
            ...(payload.shop_id && { shop_id: payload.shop_id }),
          },
        }
      );
      return res.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to load sales";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
// Usage example (e.g., in a component or another thunk):
// dispatch(getSales());    