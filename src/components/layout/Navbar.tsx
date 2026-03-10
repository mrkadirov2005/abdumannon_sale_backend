import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearTokens, logout } from "../../redux/slices/auth/authSlice";
import { accessTokenFromStore, getAuthFromStore, getIsSuperUserFromStore, getUserFromStore } from "../../redux/selectors";
import type { AppDispatch } from "../../redux/store";
import { Logout } from "@mui/icons-material";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { useState } from "react";
import { Button } from "@mui/material";
import { Fullscreen } from "lucide-react";
import { DEFAULT_SUPPLIER_HTML, generateChequeNumber, printCheque } from "../ui/ChequeProvider";

export default function Navbar() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector(getUserFromStore);
  const isSuperAdmin = useSelector(getIsSuperUserFromStore);
  const accessToken = useSelector(accessTokenFromStore);
  const authData = useSelector(getAuthFromStore);
  const [loading, setLoading] = useState(false);
  const [isChequeModalOpen, setIsChequeModalOpen] = useState(false);
  const [chequeSaleId, setChequeSaleId] = useState("");
  const [printingCheque, setPrintingCheque] = useState(false);

  const getUserDisplayName = () => {
    if (!user) return "Admin";
    const { first_name, last_name, name, lastname, uuid } = user as any;
    const fullName = `${first_name || name || ""} ${last_name || lastname || ""}`.trim();
    return fullName || name || uuid || "Admin";
  };

  const escapeHtml = (value: string): string => {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
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

  const handlePrintCheque = async () => {
    const saleId = chequeSaleId.trim();
    if (!saleId) {
      alert("Chek ID kiriting");
      return;
    }
    if (printingCheque) return;

    setPrintingCheque(true);
    try {
      const salesEndpoint = isSuperAdmin ? ENDPOINTS.sales.getSales : ENDPOINTS.sales.getAdminSales;
      const salesBody = !isSuperAdmin
        ? {
            shop_id: authData.user?.shop_id,
            admin_name: authData.isSuperAdmin ? (user as any)?.last_name : authData.user?.uuid,
          }
        : {
            shop_id: authData.user?.shop_id,
          };

      const salesRes = await fetch(`${DEFAULT_ENDPOINT}${salesEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: accessToken ?? "",
          uuid: user?.uuid || "",
        },
        body: JSON.stringify(salesBody),
      });

      const salesJson = await salesRes.json();
      if (!salesRes.ok) {
        throw new Error(salesJson.message || "Sotuvlarni yuklashda xatolik");
      }

      const salesList = Array.isArray(salesJson.data) ? salesJson.data : [];
      const sale =
        salesList.find((s: any) => String(s.sale_id).toLowerCase() === saleId.toLowerCase()) ||
        salesList.find((s: any) => String(s.id) === saleId);

      if (!sale) {
        alert("Sotuv topilmadi");
        return;
      }

      const productsRes = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.sales.getSaleById}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: accessToken ?? "",
          uuid: user?.uuid || "",
        },
        body: JSON.stringify({ sale_id: sale.sale_id }),
      });

      const productsJson = await productsRes.json();
      if (!productsRes.ok) {
        throw new Error(productsJson.message || "Mahsulotlarni yuklashda xatolik");
      }

      const products = Array.isArray(productsJson.products) ? productsJson.products : [];

      const paymentLabel =
        sale.payment_method === "cash" ? "Наличные" :
        sale.payment_method === "card" ? "Карта" : "Мобильная";

      const chequeNumber = generateChequeNumber();
      const buyerName = escapeHtml(String(sale.customer_name || sale.buyer || sale.client_name || sale.admin_name || "Mijoz"));

      printCheque({
        title: "Накладная",
        number: chequeNumber,
        date: sale.sale_time || new Date(),
        supplier: DEFAULT_SUPPLIER_HTML,
        buyer: buyerName,
        buyerLabel: "Покупатель",
        buyerRight: `Способ оплаты: ${paymentLabel}`,
        products: products.map((p: any) => ({
          name: p.product_name,
          quantity: p.amount,
          unit: p.unit || "pcs",
          price: p.sell_price,
          total: p.sell_price * p.amount,
        })),
        extraNote: "Возврат товара в течение 14 дней",
        signatureLeft: "Руководитель",
        signatureRight: "Бухгалтер",
      });

      setIsChequeModalOpen(false);
      setChequeSaleId("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Xatolik yuz berdi";
      alert(message);
    } finally {
      setPrintingCheque(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <h3 className="text-lg font-medium">привет, {getUserDisplayName()}</h3>
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setIsChequeModalOpen(true)}
          variant="outlined"
        >
          Chek
        </Button>
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
      {isChequeModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsChequeModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-bold text-gray-900">Chek chop etish</h3>
              <button
                onClick={() => setIsChequeModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-5 space-y-3">
              <input
                type="text"
                value={chequeSaleId}
                onChange={(e) => setChequeSaleId(e.target.value)}
                placeholder="SALE001 yoki sale_id"
                className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <p className="text-xs text-gray-500">
                Sotuv ID bo‘yicha avtomatik to‘ldiriladi: sana, mijoz va mahsulotlar.
              </p>
            </div>
            <div className="p-5 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsChequeModalOpen(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition"
              >
                Yopish
              </button>
              <button
                onClick={handlePrintCheque}
                disabled={printingCheque}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:bg-gray-400"
              >
                {printingCheque ? "..." : "Chop etish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
