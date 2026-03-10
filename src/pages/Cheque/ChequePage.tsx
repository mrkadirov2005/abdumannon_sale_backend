import { useState } from "react";
import { DEFAULT_SUPPLIER_HTML, generateChequeNumber, printCheque } from "../../components/ui/ChequeProvider";

type ProductRow = {
  name: string;
  quantity: string;
  unit: string;
  price: string;
};

export default function ChequePage() {
  const [buyer, setBuyer] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [buyerRight, setBuyerRight] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([
    { name: "", quantity: "", unit: "pcs", price: "" },
  ]);

  const updateRow = (index: number, field: keyof ProductRow, value: string) => {
    setProducts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addRow = () => {
    setProducts((prev) => [...prev, { name: "", quantity: "", unit: "pcs", price: "" }]);
  };

  const removeRow = (index: number) => {
    setProducts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handlePrint = () => {
    if (!buyer.trim()) {
      alert("Mijoz nomini kiriting");
      return;
    }

    const validProducts = products.filter(
      (p) => p.name.trim() && p.quantity.trim() && p.price.trim()
    );

    if (validProducts.length === 0) {
      alert("Kamida bitta mahsulot kiriting");
      return;
    }

    const mapped = validProducts.map((p) => {
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
      title: "Накладная",
      number: generateChequeNumber(),
      date,
      supplier: DEFAULT_SUPPLIER_HTML,
      buyer: buyer.trim(),
      buyerLabel: "Покупатель",
      buyerRight: buyerRight.trim() || undefined,
      products: mapped,
      extraNote: extraNote.trim() || undefined,
      signatureLeft: "Руководитель",
      signatureRight: "Бухгалтер",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 md:p-8">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Chek yaratish</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <input
            type="text"
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            placeholder="Mijoz nomi"
            className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <input
            type="text"
            value={buyerRight}
            onChange={(e) => setBuyerRight(e.target.value)}
            placeholder="Masalan: To'lov usuli"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <input
            type="text"
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            placeholder="Qo'shimcha izoh"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="space-y-3 mb-6">
          {products.map((p, index) => (
            <div key={index} className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={p.name}
                onChange={(e) => updateRow(index, "name", e.target.value)}
                placeholder="Mahsulot"
                className="col-span-12 sm:col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                step="0.01"
                value={p.quantity}
                onChange={(e) => updateRow(index, "quantity", e.target.value)}
                placeholder="Miqdor"
                className="col-span-4 sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={p.unit}
                onChange={(e) => updateRow(index, "unit", e.target.value)}
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
                onChange={(e) => updateRow(index, "price", e.target.value)}
                placeholder="Narx"
                className="col-span-4 sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="col-span-12 sm:col-span-1 px-2 py-2 text-red-600 bg-red-50 rounded-lg text-sm"
                disabled={products.length === 1}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="w-full px-3 py-2 bg-gray-100 rounded-lg text-sm"
          >
            + Mahsulot qo'shish
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            Chop etish
          </button>
        </div>
      </div>
    </div>
  );
}
