import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import type { JSX } from "react";

import Layout from "../components/layout/Layout";
import Login from "../pages/Auth/Login";
import { getIsSuperUserFromStore } from "../redux/selectors";
import Integrations from "../pages/Branches/Integrations";
import SingleBranch from "../pages/SingleBranch/SingleBranch";
import DebtManagement from "../pages/debt/DebtsPage";
import BrandCRUD from "../pages/brands/brands";
import CategoryManager from "../pages/category/Categories";
import DatabaseBackup from "../pages/backup/BackupManager";

/* ===========================
   Lazy-loaded pages (ADMIN)
   =========================== */

const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Sales = lazy(() => import("../pages/Sales/Sales"));
const Products = lazy(() => import("../pages/Products/Products"));
const SaleBoard = lazy(() => import("../pages/SaleBoard/SaleBoard"));
const Users = lazy(() => import("../pages/Users/Users"));
const Profile = lazy(() => import("../pages/Profile/Profile"));
const ReportList = lazy(() => import("../pages/Reports/Reports"));

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
  const isSuperAdmin=useSelector(getIsSuperUserFromStore)
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
          <Route index element={isSuperAdmin?<Dashboard />:<SaleBoard></SaleBoard>} />
          <Route path="sales" element={<Sales />} />
          <Route path="products" element={<Products />} />
          <Route path="saleboard" element={<SaleBoard />} />
          <Route path="users" element={<Users />} />
          <Route path="profile" element={<Profile />} />
          <Route path="reports" element={<ReportList />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="branch" element={<SingleBranch />} />
          <Route path="debts" element={<DebtManagement />} />
          <Route path="brands" element={<BrandCRUD />} />
          <Route path="categories" element={<CategoryManager />} />
          <Route path="backup" element={<DatabaseBackup />} />


          


        </Route>
      </Routes>
    </Suspense>
  );
}
