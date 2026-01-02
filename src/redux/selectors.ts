import type { RootState } from "./store";
export const getUserFromStore=(state:RootState)=>state.auth.user
getUserFromStore
export const getAuthFromStore=(state:RootState)=>state.auth
getAuthFromStore
export const accessTokenFromStore=(state:RootState)=>state.auth.accessToken
accessTokenFromStore
export const refresgTokenFromStore=(state:RootState)=>state.auth.refreshToken
refresgTokenFromStore
export const getshopidfromstrore=(state:RootState)=>state.auth.user?.shop_id
getshopidfromstrore
export const getProductsFromStore=(state:RootState)=>state.products.products
getProductsFromStore
export const getSingleProductFromStore=(state:RootState)=>state.products.product
getSingleProductFromStore
export const getCategoriesFromStore=(state:RootState)=>state.category.categories
getCategoriesFromStore
export const getBrandsFromStore=(state:RootState)=>state.brand.brands
getBrandsFromStore
export const getSalesCartFromStore=(state:RootState)=>state.sales.cart
getSalesCartFromStore
export const getSalesFromStore=(state:RootState)=>state.sales.sales
getSalesFromStore
export const getSalesLoadingFromStore=(state:RootState)=>state.sales.loading
getSalesLoadingFromStore
export const getSalesErrorFromStore=(state:RootState)=>state.sales.error
getSalesErrorFromStore
export const getLastSaleFromStore=(state:RootState)=>state.sales.lastSale
getLastSaleFromStore
export const getAdminsFromStore=(state:RootState)=>state.admin.admins
getAdminsFromStore
export const getAdminModalsFromStore=(state:RootState)=>state.admin.modals
getAdminModalsFromStore
export const getIsSingleProductOpenFromStore=(state:RootState)=>state.products.isSingleProductOpen
getIsSingleProductOpenFromStore
export const getProductsStatusFromStore=(state:RootState)=>state.products.status
getProductsStatusFromStore
export const getAdminPermissionsFromStore=(state:RootState)=>state.auth.permissions;
getAdminPermissionsFromStore
export const getIsSuperUserFromStore=(state:RootState)=>state.auth.isSuperAdmin
getIsSuperUserFromStore
// statuses
export const getIsProductPending=(state:RootState)=>state.products.status
getIsProductPending
export const getIsBrandPending=(state:RootState)=>state.brand.status
getIsBrandPending
export const getICategoryPending=(state:RootState)=>state.category.status
getICategoryPending
export const getIsStatisticsPending=(state:RootState)=>state.statistics.status;
getIsStatisticsPending
export const getIsCheckoutPending=(state:RootState)=>state.sales.status;
getIsCheckoutPending
// isloadin
export const getIsloadingDashboard=(state:RootState)=>state.statistics.isLoading;
getIsloadingDashboard

// get selectors
export const getBranchesFromStore=(state:RootState)=>state.branch;
getBranchesFromStore



