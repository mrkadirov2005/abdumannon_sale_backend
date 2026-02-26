import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/store";
import { clearTokens, logout } from "./redux/slices/auth/authSlice";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// Global fetch wrapper to handle revoked/expired tokens immediately
const originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 401 || response.status === 403) {
    store.dispatch(clearTokens());
    store.dispatch(logout());
    localStorage.removeItem("Token");
    localStorage.removeItem("uuid");
    if (window.location.pathname !== "/auth/login") {
      window.location.assign("/auth/login");
    }
  }
  return response;
};

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);
