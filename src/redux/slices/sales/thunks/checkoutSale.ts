import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../../../config/endpoints";
import type { CartItem } from "../types";

export const checkoutSale = createAsyncThunk(
  "sales/checkoutSale",
  async (
    payload: {
      products: CartItem[];
      admin_number: string;
      admin_name: string;
      shop_id: string;
      payment_method: string;
      token?: string;
      branch:number;
      profit?: number;
    },
    thunkAPI
  ) => {
    try {
      const { products, admin_name, admin_number, shop_id, payment_method, token, branch, profit: customProfit } = payload;

      if (!products.length) {
        return thunkAPI.rejectWithValue("Cart is empty");
      }

      // ---- Calculate totals ----
      const total_price = products.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const total_net_price = products.reduce(
        (sum, item) => sum + item.netPrice * item.quantity,
        0
      );

      const profit = customProfit !== undefined ? customProfit : total_price;
      // Use the custom profit if provided, otherwise default to total_price

      // ---- Date & time fields ----
      const now = new Date();
      const sale_date = now.toISOString();
      const sale_day = now.getDate();
      const sales_month = now.getMonth() + 1;
      const sales_year = now.getFullYear();
      const sale_time = now.toISOString();

      // ---- Convert cart to backend product format ----
      const productsMapped = products.map((item) => ({
        product_name: item.name,
        amount: item.quantity,
        sell_price: item.price,
        net_price: item.netPrice,
        productid: item.productid,
        sell_quantity: item.quantity,
        shop_id: shop_id,
      }));

      // ---- FINAL payload EXACTLY matching backend schema ----

      const requestPayload = {
        sale: {
          admin_number,
          admin_name,
          total_price,
          total_net_price,
          profit,
          sale_time,
          sale_day,
          sales_month,
          sales_year,
          shop_id,
        },
        products: productsMapped,
        shop_id,
        sale_date,
        payment_method,
        branch,        // adjust if needed

      };

      console.log("📤 Sending payload:", requestPayload);

      const res = await axios.post(
        `${DEFAULT_ENDPOINT}${ENDPOINTS.sales.createSale}`,
        requestPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? token : "",
          },
        }
      );

      toast.success("Checkout completed successfully");
      return res.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data || err.message || "Checkout failed";
      toast.error(errorMsg);
      return thunkAPI.rejectWithValue(errorMsg);
    }
  }
);
