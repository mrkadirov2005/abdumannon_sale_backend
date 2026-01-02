import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearTokens, logout } from "../../redux/slices/auth/authSlice";
import { getIsSuperUserFromStore, getUserFromStore } from "../../redux/selectors";
import type { AppDispatch } from "../../redux/store";
import { Logout } from "@mui/icons-material";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { useState } from "react";
import { Button } from "@mui/material";
import { Fullscreen } from "lucide-react";

export default function Navbar() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector(getUserFromStore);
  const isSuperAdmin = useSelector(getIsSuperUserFromStore);
  const [loading, setLoading] = useState(false);

  const getUserDisplayName = () => {
    if (!user) return "Admin";
    const { first_name, last_name, name, lastname, uuid } = user as any;
    const fullName = `${first_name || name || ""} ${last_name || lastname || ""}`.trim();
    return fullName || name || uuid || "Admin";
  };

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.logout}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: isSuperAdmin ? "superuser" : "admin",
          uuid: user?.uuid,
        }),
      });

      if (!response.ok) {
        alert("Error logging out, please retry or contact the system manager.");
        setLoading(false);
        return;
      }

      dispatch(clearTokens());
      dispatch(logout());

      try {
        localStorage.removeItem("persist:root");
      } catch {}

      navigate("/auth/login");
      setTimeout(() => window.location.reload(), 50);
    } catch {
      alert("Network error, please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <h3 className="text-lg font-medium">Welcome, {getUserDisplayName()}</h3>
      <div className="flex items-center gap-4">
        <Button   onClick={() => {
    const el = document.documentElement as HTMLElement;

    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen(); // Safari
    } else if ((el as any).msRequestFullscreen) {
      (el as any).msRequestFullscreen(); // Old Edge
    }
    
  }}
  variant="outlined"
>
{<Fullscreen />}
</Button>
        <button
          disabled={loading}
          onClick={handleLogout}
          className="px-4 py-2 border rounded text-sm"
          aria-label="Logout"
          title="Logout"
        >
                  
          <Logout />
        </button>
      </div>
    </header>
  );
}
