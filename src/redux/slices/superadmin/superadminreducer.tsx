import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {type SuperUser,exampleSuperUser} from "../../../../types/types";

export interface SuperUserInitialState {
  isLoading: boolean;
  error:string | null;
    superUser: SuperUser;

}

const initialState: SuperUserInitialState = {
  isLoading:false,
  error:null,
  superUser:exampleSuperUser,
}

export const SuperUserSlice = createSlice({
  name: 'superUser',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    }
  },
})

// Action creators are generated for each case reducer function
export const { setLoading, setError } = SuperUserSlice.actions

export default SuperUserSlice.reducer