import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from "redux-persist";

import { SuperUserSlice } from "./slices/superadmin/superadminreducer";
import cartReducer from "./slices/cartSlice";
import productsReducer from "./slices/products/productsreducer";
import uiReducer from "./slices/uiSlice";
import authReducer from "./slices/auth/authSlice";
import category from "./slices/categories/categoriesReducer";
import brand from "./slices/brands/brandsreducer";
import statisticsReducer from "./slices/statistics/statisticsSlice";
import salesReducer from "./slices/sales/salesReducer";
import settingsReducer from "./slices/settings/settingsSlice";
import admin from "./slices/admins/adminsReducer";
import branch from "./slices/branches/branchesReducer"

//1 Combine all reducers
const rootReducer = combineReducers({
	cart: cartReducer,
	products: productsReducer,
	ui: uiReducer,
	auth: authReducer,
	superUser: SuperUserSlice.reducer,
	category,
	brand,
	statistics: statisticsReducer,
	sales: salesReducer,
	settings: settingsReducer,
	admin,
	branch,
});

// 2️⃣ Persist configuration
const persistConfig = {
	key: "root",
	storage,
	whitelist: ["auth", "ui", "cart", "settings"],
};

// 3️⃣ Wrap persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4️⃣ Create store (clean + correct)
export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
});

// 5️⃣ Persistor
export const persistor = persistStore(store);

// 6️⃣ Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
// Now you can import { store, persistor } from this file and use them in your application.