import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { loginSuperUser ,loginAdmin} from "./thunks/aut_login";
import type { SuperUser, Admin } from "../../../../types/types";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  user: SuperUser | Admin | null;
  isSuperAdmin:boolean;
};

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  permissions: [],
  user: null,
  isSuperAdmin:false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearTokens(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.permissions = [];
      state.user = null;
    },
    setPermissions(state, action: PayloadAction<string[]>) {
      state.permissions = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    logout(state){
      state.isAuthenticated=false
      state.accessToken=""
      state.error=""
      state.isLoading=false
      state.isSuperAdmin=false
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loginSuperUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      // Do NOT clear user here, keep existing user data during loading
    });
    builder.addCase(loginSuperUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.isSuperAdmin=true;

      const user = action.payload;
      state.user = user.user ?? user;  // adjust depending on your payload shape

      state.accessToken = user.accessToken ?? null;
      state.refreshToken = user.refreshToken ?? null;

      if ((user as any).permissions) {
        state.permissions = (user as any).permissions;
      }
    });
    builder.addCase(loginSuperUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error =
        (action.payload as string) ??
        action.error.message ??
        "Login failed";
      state.isAuthenticated = false;
      // Optional: do NOT clear user here so user data sticks around on failure
      // If you want to clear user on fail, uncomment below:
      // state.user = null;
    });
    builder.addCase(loginAdmin.pending, (state) => {
      state.isLoading = true;
      state.error = null;
      // Do NOT clear user here, keep existing user data during loading
    });
    builder.addCase(loginAdmin.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;

      const user = action.payload;
      const data=action.payload.user as unknown as Admin;
      state.user = user.user ?? user;  // adjust depending on your payload shape

      state.accessToken = user.accessToken ?? null;
      state.refreshToken = user.refreshToken ?? null;
      state.permissions=data.permissions;
    });
    builder.addCase(loginAdmin.rejected, (state, action) => {
      state.isLoading = false;
      state.error =
        (action.payload as string) ??
        action.error.message ??
        "Login failed";
      state.isAuthenticated = false;
      // Optional: do NOT clear user here so user data sticks around on failure
      // If you want to clear user on fail, uncomment below:
      // state.user = null;
    });
  },
});

export const {
  clearTokens,
  setPermissions,
  setError,
  setLoading,
  logout
} = authSlice.actions;

export default authSlice.reducer;
