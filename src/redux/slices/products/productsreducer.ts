import { createSlice} from "@reduxjs/toolkit";
import { type Product, exampleProduct } from "../../../../types/types";
import { getProductsThunk } from "./thunks/getProducts";
import { UpdateProductThunk } from "./thunks/updateProductThunk";
import { restockProductThunk } from "./thunks/restockProduct";
import { deleteProductsThunk } from "./thunks/deleteProduct";
import { createSingleProductThunk } from "./thunks/createProduct";
type AuthState = {
  isLoading: boolean;
  error: string | undefined;
  products:Product[];
  product:Product;
  isSingleProductOpen:"idle" | "add" | "edit"
  status:"pending" | "rejected" |"fulfilled" |"idle"

};

const initialState: AuthState = {
  isLoading: false,
  error: "",
  products: [exampleProduct],
  product:exampleProduct,
  status:"idle",
  isSingleProductOpen:"idle"
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSingleProduct(state,action){
state.product=action.payload.product
state.isSingleProductOpen=action.payload.state
    },
    closeSingleProduct(state){
      state.isSingleProductOpen="idle"
      state.product=exampleProduct
    }
    
  },
  extraReducers: (builder) => {
   builder.addCase(getProductsThunk.fulfilled,(state,action)=>{
    state.error=""
    state.isLoading=false
    state.products=action.payload.data;
    state.status="fulfilled"
   })
    builder.addCase(getProductsThunk.rejected,(state,action)=>{
    state.error=""
    state.isLoading=false
    state.error=action.payload as string
    state.status="rejected"
   })
    builder.addCase(getProductsThunk.pending,(state)=>{
    state.error=""
    state.isLoading=true
    state.error=""
    state.status="pending"
   })
  //  update product
  builder.addCase(UpdateProductThunk.fulfilled,(state,action)=>{
    state.error=""
    state.isLoading=false
    for(let i=0;i<state.products.length;i++){
      if(state.products[i].id==action.payload.data.id){
        state.products[i]=action.payload.data
      }
    };
    state.status="fulfilled"
   })
    builder.addCase(UpdateProductThunk.rejected,(state,action)=>{
    state.error=""
    state.isLoading=false
    state.error=action.error.message
    state.status="rejected"
   })
    builder.addCase(UpdateProductThunk.pending,(state)=>{
    state.error=""
    state.isLoading=true
    state.error=""
    state.status="pending"
   })

  //  restock product
     builder.addCase(restockProductThunk.fulfilled,(state)=>{
    state.error=""
    state.isLoading=false
    // updating the restocked value should be done here but temoporatily implemented with fetch
    state.status="fulfilled"
   })
    builder.addCase(restockProductThunk.rejected,(state,action)=>{
    state.error=""
    state.isLoading=false
    state.error=action.error.message
    state.status="rejected"
   })
    builder.addCase(restockProductThunk.pending,(state)=>{
    state.error=""
    state.isLoading=true
    state.error=""
    state.status="pending"
   })

  //  delete product
   builder.addCase(deleteProductsThunk.fulfilled,(state,action)=>{
    state.error=""
    state.isLoading=false
    state.products=state.products.filter(item=>item.id!=action.payload.data[0].id)
    state.status="fulfilled"
   })
    builder.addCase(deleteProductsThunk.rejected,(state,action)=>{
    state.error=""
    state.isLoading=false
    state.error=action.error.message
    state.status="rejected"
   })
    builder.addCase(deleteProductsThunk.pending,(state)=>{
    state.error=""
    state.isLoading=true
    state.error=""
    state.status="pending"
   })
  //  create product 
    builder.addCase(createSingleProductThunk.fulfilled,(state,action)=>{
    state.error=""
    state.isLoading=false
    state.products=[...state.products,action.payload.data[0]];
    state.status="fulfilled"
   })
    builder.addCase(createSingleProductThunk.rejected,(state,action)=>{
    state.error=""
    state.isLoading=false
    state.error=action.error.message
    state.status="rejected"
   })
    builder.addCase(createSingleProductThunk.pending,(state)=>{
    state.error=""
    state.isLoading=true
    state.error=""
    state.status="pending"
   })

  },
});

export const {
  setSingleProduct,
  closeSingleProduct
} = authSlice.actions;

export default authSlice.reducer;
