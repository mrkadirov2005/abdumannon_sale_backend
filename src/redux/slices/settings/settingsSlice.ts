import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type SettingsState = {
  general: {
    storeName: string;
    currency: string;
    timezone: string;
    dateFormat: string;
  };
};

const initialState: SettingsState = {
  general: {
    storeName: "",
    currency: "USD",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
  },
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    updateGeneralSettings: (state, action: PayloadAction<Partial<SettingsState["general"]>>) => {
      state.general = { ...state.general, ...action.payload };
    },
    resetSettings: () => initialState,
  },
});

export const {
  updateGeneralSettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;

