import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { getAuthFromStore, getUserFromStore } from "../../redux/selectors";
import {
  AdminPanelSettings,
  AutoGraph,
  BookmarkAddRounded,
  MonetizationOn,
  ProductionQuantityLimits,
  Report,
} from "@mui/icons-material";
import { FaCodeBranch, FaUser } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Sidebar({
  collapsed,
  setCollapsed,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const location = useLocation();
  const authData = useSelector(getAuthFromStore);
  const user = useSelector(getUserFromStore);

  const getUserDisplayName = () => {
    if (!user) return "User";
    const admin = user as any;
    return (
      `${admin.first_name || admin.name || ""} ${admin.last_name || admin.lastname || ""}`.trim() ||
      admin.name ||
      admin.uuid ||
      "User"
    );
  };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const MenuItem = ({ to, icon, label }: any) => (
    <Link
      to={to}
      className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
        isActive(to)
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow"
          : "text-gray-300 hover:bg-gray-700"
      }`}
    >
      <span className="text-lg opacity-90 group-hover:opacity-100">{icon}</span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      className="bg-gray-900 text-white h-screen fixed left-0 top-0 p-3 flex flex-col shadow-xl z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {!collapsed && (
          <div className="text-sm font-semibold truncate">
            {getUserDisplayName()}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
          aria-label="Toggle sidebar"
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {authData.isSuperAdmin && (
          <MenuItem to="/" icon={<AutoGraph />} label="Statistika" />
        )}

        <MenuItem to="/sales" icon={<MonetizationOn />} label="Savdo" />

        
          <MenuItem
            to="/saleboard"
            icon={<BookmarkAddRounded />}
            label="Savdolarim"
          />

        <MenuItem
          to="/products"
          icon={<ProductionQuantityLimits />}
          label="Mahsulotlar"
        />

        {authData.isSuperAdmin && (
          <MenuItem to="/reports" icon={<Report />} label="Hisobotlar" />
        )}

        {authData.isSuperAdmin && (
          <MenuItem
            to="/users"
            icon={<AdminPanelSettings />}
            label="Adminlar"
          />
        )}

          <MenuItem
            to="/brands"
            icon={<AdminPanelSettings />}
            label="Brandlar"
          />
          <MenuItem
            to="/categories"
            icon={<AdminPanelSettings />}
            label="Kategoriyalar"
          />

        {authData.isSuperAdmin && (
          <MenuItem
            to="/integrations"
            icon={<FaCodeBranch />}
            label="Filiallar"
          />
        )}
        
          <MenuItem
            to="/debts"
            icon={<FaCodeBranch />}
            label="Qarzdorlar"
          />
          { authData.isSuperAdmin && (
            <MenuItem
            to="/backup"
            icon={<FaCodeBranch />}
            label="Zaxiralash"
          />
          )}
        
      </nav>

      {/* Footer */}
      <div className="pt-3 border-t border-gray-700">
        <MenuItem to="/profile" icon={<FaUser />} label="Profile" />
      </div>
    </motion.aside>
  );
}
