import { createSlice } from '@reduxjs/toolkit'
import {type Admin,exampleAdmin} from "../../../../types/types";
import { getShopAdminsThunk } from './thunks/getAdminsthunk';
import { updateShopAdminsThunk } from './thunks/updateAdminThunk';
import { deleteShopAdminsThunk } from './thunks/deleteAdminThunk';
import { addShopAdminsThunk } from './thunks/addAdminThunk';
import { ModalCodes } from '../../../config/modals';
export interface AdminInitialState {
  isLoading: boolean;
  error:string | null;
  admins: Admin[];
  modals:Number[];

}

const initialState: AdminInitialState = {
  isLoading:false,
  error:null,
  admins:[exampleAdmin],
  modals:[]
}

export const AdminsSlice = createSlice({
  name: 'admins',
  initialState,
  reducers: {
    CloseAdminModal:(state,action)=>{
      state.modals=state.modals.filter(item=>item!=action.payload)
    },
    openAdminModal:(state,action)=>{
      state.modals.push(action.payload)
    }

  },
  extraReducers(builder){
    builder.addCase(getShopAdminsThunk.fulfilled,(state,action)=>{
        state.error=null;
        state.isLoading=false;
        state.admins=action.payload.data
    });
    builder.addCase(getShopAdminsThunk.rejected,(state,action)=>{
        state.error=`${action.error.message}`;
        // state.admins=[];
        state.isLoading=false;
    })
    builder.addCase(getShopAdminsThunk.pending,(state)=>{
        state.isLoading=true;
        state.error=null;
        // state.admins=[];
    })
// update admin thunk
     builder.addCase(updateShopAdminsThunk.fulfilled,(state,action)=>{
        state.error=null;
        state.isLoading=false;
        for(let i=0;i<state.admins.length;i++){
          if(state.admins[i].uuid==action.payload.data[0].uuid){
            state.admins[i]=action.payload.data[0];
          }
        }
    });
    builder.addCase(updateShopAdminsThunk.rejected,(state,action)=>{
        state.error=`${action.error.message}`;
        // state.admins=[];
        state.isLoading=false;
    })
    builder.addCase(updateShopAdminsThunk.pending,(state)=>{
        state.isLoading=true;
        state.error=null;
        // state.admins=[];
    })
 // delete shop admins thunk
        builder.addCase(deleteShopAdminsThunk.fulfilled,(state,action)=>{
        state.error=null;
        state.isLoading=false;
        state.admins=state.admins.filter(item=>item.uuid!=action.payload.data[0].uuid)
    });
    builder.addCase(deleteShopAdminsThunk.rejected,(state,action)=>{
        state.error=`${action.error.message}`;
        // state.admins=[];
        state.isLoading=false;
    })
    builder.addCase(deleteShopAdminsThunk.pending,(state)=>{
        state.isLoading=true;
        state.error=null;
        // state.admins=[];
    })

// add admin

        builder.addCase(addShopAdminsThunk.fulfilled,(state,action)=>{
        state.error=null;
        state.isLoading=false;
        state.admins=action.payload.data
        // close admin modals
        state.modals=state.modals.filter(item=>item!=ModalCodes.admin.add_admin)
    });
    builder.addCase(addShopAdminsThunk.rejected,(state,action)=>{
        state.error=`${action.error.message}`;
        // state.admins=[];
        state.isLoading=false;
    })
    builder.addCase(addShopAdminsThunk.pending,(state)=>{
        state.isLoading=true;
        state.error=null;
        // state.admins=[];
    })
  }
})

// Action creators are generated for each case reducer function
export const { CloseAdminModal,openAdminModal } = AdminsSlice.actions

export default AdminsSlice.reducer