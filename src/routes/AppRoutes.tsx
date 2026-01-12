import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import type { JSX } from "react";

import Layout from "../components/layout/Layout";
import Login from "../pages/Auth/Login";
import DebtManagement from "../pages/debt/DebtsPage";
import CategoryManager from "../pages/category/Categories";
import DatabaseBackup from "../pages/backup/BackupManager";
import WagonsPage from "../pages/wagons/wagon";
import FinancePage from "../pages/Finance/Finance";

/* ===========================
   Lazy-loaded pages (ADMIN)
   =========================== */

const Sales = lazy(() => import("../pages/Sales/Sales"));
const Products = lazy(() => import("../pages/Products/Products"));
const SaleBoard = lazy(() => import("../pages/SaleBoard/SaleBoard"));
const Profile = lazy(() => import("../pages/Profile/Profile"));

/* ===========================
   Auth Guard
   =========================== */

function RequireAuth({ children }: { children: JSX.Element }) {
  const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated);

  if (!isAuth) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

/* ===========================
   Routes
   =========================== */

export default function AppRoutes() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <Routes>
        {/* ---------- Public route ---------- */}
        <Route path="/auth/login" element={<Login />} />

        {/* ---------- Protected app ---------- */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="sales" element={<Sales />} />
          <Route path="products" element={<Products />} />
          <Route path="saleboard" element={<SaleBoard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="debts" element={<DebtManagement />} />
          <Route path="categories" element={<CategoryManager />} />
          <Route path="backup" element={<DatabaseBackup />} />
          <Route path="wagons" element={<WagonsPage />} />
          <Route path="finance" element={<FinancePage />} />



          


        </Route>
      </Routes>
    </Suspense>
  );
}
