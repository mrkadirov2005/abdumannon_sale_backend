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
  const [chequeMode, setChequeMode] = useState<"manual" | "auto">("manual");
  const [manualCheque, setManualCheque] = useState({
    buyer: "",
    date: new Date().toISOString().split("T")[0],
    buyerRight: "",
    extraNote: "",
  });
  const [manualProducts, setManualProducts] = useState<Array<{
    name: string;
    quantity: string;
    unit: string;
    price: string;
  }>>([{ name: "", quantity: "", unit: "pcs", price: "" }]);

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
        sale.payment_method === "cash" ? "ÐÐ°Ð»Ð¸Ñ‡Ð½Ñ‹Ðµ" :
        sale.payment_method === "card" ? "ÐšÐ°Ñ€Ñ‚Ð°" : "ÐœÐ¾Ð±Ð¸Ð»ÑŒÐ½Ð°Ñ";

      const chequeNumber = generateChequeNumber();
      const buyerName = escapeHtml(String(sale.customer_name || sale.buyer || sale.client_name || sale.admin_name || "Mijoz"));

      printCheque({
        title: "ÐÐ°ÐºÐ»Ð°Ð´Ð½Ð°Ñ",
        number: chequeNumber,
        date: sale.sale_time || new Date(),
        supplier: DEFAULT_SUPPLIER_HTML,
        buyer: buyerName,
        buyerLabel: "ÐŸÐ¾ÐºÑƒÐ¿Ð°Ñ‚ÐµÐ»ÑŒ",
        buyerRight: `Ð¡Ð¿Ð¾ÑÐ¾Ð± Ð¾Ð¿Ð»Ð°Ñ‚Ñ‹: ${paymentLabel}`,
        products: products.map((p: any) => ({
          name: p.product_name,
          quantity: p.amount,
          unit: p.unit || "pcs",
          price: p.sell_price,
          total: p.sell_price * p.amount,
        })),
        extraNote: "Ð’Ð¾Ð·Ð²Ñ€Ð°Ñ‚ Ñ‚Ð¾Ð²Ð°Ñ€Ð° Ð² Ñ‚ÐµÑ‡ÐµÐ½Ð¸Ðµ 14 Ð´Ð½ÐµÐ¹",
        signatureLeft: "Ð ÑƒÐºÐ¾Ð²Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒ",
        signatureRight: "Ð‘ÑƒÑ…Ð³Ð°Ð»Ñ‚ÐµÑ€",
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

  const handlePrintManualCheque = () => {
    const buyer = manualCheque.buyer.trim();
    if (!buyer) {
      alert("Mijoz nomini kiriting");
      return;
    }

    const validProducts = manualProducts.filter(
      (p) => p.name.trim() && p.quantity.trim() && p.price.trim()
    );

    if (validProducts.length === 0) {
      alert("Kamida bitta mahsulot kiriting");
      return;
    }

    const products = validProducts.map((p) => {
      const qty = parseFloat(p.quantity);
      const price = parseFloat(p.price);
      return {
        name: p.name.trim(),
        quantity: Number.isFinite(qty) ? qty : 0,
        unit: p.unit || "pcs",
        price: Number.isFinite(price) ? price : 0,
        total: (Number.isFinite(qty) ? qty : 0) * (Number.isFinite(price) ? price : 0),
      };
    });

    printCheque({
      title: "ÐÐ°ÐºÐ»Ð°Ð´Ð½Ð°Ñ",
      number: generateChequeNumber(),
      date: manualCheque.date || new Date(),
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer,
      buyerLabel: "ÐŸÐ¾ÐºÑƒÐ¿Ð°Ñ‚ÐµÐ»ÑŒ",
      buyerRight: manualCheque.buyerRight || undefined,
      products,
      extraNote: manualCheque.extraNote || undefined,
      signatureLeft: "Ð ÑƒÐºÐ¾Ð²Ð¾Ð´Ð¸Ñ‚ÐµÐ»ÑŒ",
      signatureRight: "Ð‘ÑƒÑ…Ð³Ð°Ð»Ñ‚ÐµÑ€",
    });

    setIsChequeModalOpen(false);
    setManualCheque({
      buyer: "",
      date: new Date().toISOString().split("T")[0],
      buyerRight: "",
      extraNote: "",
    });
    setManualProducts([{ name: "", quantity: "", unit: "pcs", price: "" }]);
  };

  const updateManualProduct = (index: number, field: string, value: string) => {
    setManualProducts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addManualProduct = () => {
    setManualProducts((prev) => [
      ...prev,
      { name: "", quantity: "", unit: "pcs", price: "" },
    ]);
  };

  const removeManualProduct = (index: number) => {
    setManualProducts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <h3 className="text-lg font-medium">привет, {getUserDisplayName()}</h3>
      <div className="flex items-center gap-4" >

        <Button
          onClick={() => setIsChequeModalOpen(true)}
          variant="outlined"
        >
          Накладная
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
              <h3 className="text-lg font-bold text-gray-900">Накладная создание</h3>
              <button
                onClick={() => setIsChequeModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                Ã—
              </button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="flex gap-2">
                <button
                  onClick={() => setChequeMode("manual")}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                    chequeMode === "manual"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Qo'lda
                </button>
                <button
                  onClick={() => setChequeMode("auto")}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium ${
                    chequeMode === "auto"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Sotuv ID
                </button>
              </div>
            </div>
            {chequeMode === "auto" ? (
              <div className="p-5 space-y-3">
                <input
                  type="text"
                  value={chequeSaleId}
                  onChange={(e) => setChequeSaleId(e.target.value)}
                  placeholder="SALE001 yoki sale_id"
                  className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <p className="text-xs text-gray-500">
                  Sotuv ID bo'yicha avtomatik to'ldiriladi: sana, mijoz va mahsulotlar.
                </p>
                <div className="pt-2 flex justify-end gap-3">
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
            ) : (
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={manualCheque.buyer}
                    onChange={(e) => setManualCheque({ ...manualCheque, buyer: e.target.value })}
                    placeholder="Mijoz nomi"
                    className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="date"
                    value={manualCheque.date}
                    onChange={(e) => setManualCheque({ ...manualCheque, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    value={manualCheque.buyerRight}
                    onChange={(e) => setManualCheque({ ...manualCheque, buyerRight: e.target.value })}
                    placeholder="Masalan: To×lov usuli"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="text"
                    value={manualCheque.extraNote}
                    onChange={(e) => setManualCheque({ ...manualCheque, extraNote: e.target.value })}
                    placeholder="Qo×shimcha izoh"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  {manualProducts.map((p, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => updateManualProduct(index, "name", e.target.value)}
                        placeholder="Mahsulot"
                        className="col-span-12 sm:col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={p.quantity}
                        onChange={(e) => updateManualProduct(index, "quantity", e.target.value)}
                        placeholder="Miqdor"
                        className="col-span-4 sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <select
                        value={p.unit}
                        onChange={(e) => updateManualProduct(index, "unit", e.target.value)}
                        className="col-span-4 sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="pcs">Dona</option>
                        <option value="kg">Kg</option>
                        <option value="t">Tonna</option>
                        <option value="l">Litr</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={p.price}
                        onChange={(e) => updateManualProduct(index, "price", e.target.value)}
                        placeholder="Narx"
                        className="col-span-4 sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeManualProduct(index)}
                        className="col-span-12 sm:col-span-1 px-2 py-2 text-red-600 bg-red-50 rounded-lg text-sm"
                        disabled={manualProducts.length === 1}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addManualProduct}
                    className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm"
                  >
                    + Mahsulot qo'shish
                  </button>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    onClick={() => setIsChequeModalOpen(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition"
                  >
                    Yopish
                  </button>
                  <button
                    onClick={handlePrintManualCheque}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                  >
                    Chop etish
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


