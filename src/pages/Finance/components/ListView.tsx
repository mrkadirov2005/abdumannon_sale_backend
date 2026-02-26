import React from "react";
import { Trash2, Printer } from "lucide-react";
import type { Wagon, Debt } from "../types";

interface ListViewProps {
  wagons: Wagon[];
  debts: Debt[];
  source: "wagons" | "debts";
  onDeleteWagon: (wagonId: string) => void;
}

export const ListView: React.FC<ListViewProps> = ({
  wagons,
  debts,
  source,
  onDeleteWagon,
}) => {
  const formatUnitLabel = (unit: string | undefined | null) => {
    const normalized = unit || "pcs";
    switch (normalized) {
      case "kg":
        return "Kg";
      case "t":
        return "Tonna";
      case "l":
        return "Litr";
      case "pcs":
      default:
        return "Dona";
    }
  };

  const printDebt = (debt: Debt) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const date = `${debt.year}-${String(debt.month).padStart(2, "0")}-${String(
      debt.day
    ).padStart(2, "0")}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Qarz - ${debt.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f5f5f5; }
          @media print { button { display: none; } body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>Qarz</h1>
        <table>
          <thead>
            <tr>
              <th>Mijoz</th>
              <th>Sana</th>
              <th>Summa</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${debt.name}</td>
              <td>${date}</td>
              <td>${debt.amount.toLocaleString()}</td>
              <td>${debt.isreturned ? "Qaytarilgan" : "Qaytarilmagan"}</td>
            </tr>
          </tbody>
        </table>
        <button onclick="window.print()">Chop Etish</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printWagon = (wagon: Wagon) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const productsHtml = (wagon.products || [])
      .map((product, idx) => {
        const name = product.product_name || product.name || "";
        const quantity = Number(product.amount ?? 0);
        const unit = formatUnitLabel(product.unit);
        const price = Number(product.price ?? 0);
        const subtotal =
          product.subtotal !== undefined
            ? Number(product.subtotal)
            : quantity * price;

        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${name}</td>
            <td style="text-align: right;">${quantity} ${unit}</td>
            <td style="text-align: right;">${price.toLocaleString()}</td>
            <td style="text-align: right;">${subtotal.toLocaleString()}</td>
          </tr>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vagon - ${wagon.wagon_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f5f5f5; }
          .meta { color: #555; margin-bottom: 8px; }
          @media print { button { display: none; } body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>Vagon: ${wagon.wagon_number}</h1>
        <div class="meta">
          Jami: ${Number(wagon.total).toLocaleString()} |
          To'langan: ${Number(wagon.paid_amount || 0).toLocaleString()}
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Mahsulot</th>
              <th style="text-align: right;">Miqdor</th>
              <th style="text-align: right;">Narx</th>
              <th style="text-align: right;">Jami</th>
            </tr>
          </thead>
          <tbody>
            ${productsHtml || `<tr><td colspan="5">Mahsulotlar topilmadi</td></tr>`}
          </tbody>
        </table>
        <button onclick="window.print()">Chop Etish</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (source === "debts") {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm md:text-base">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Mijoz
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Sana
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Summa
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Holat
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Amallar
                </th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt) => (
                <tr key={debt.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {debt.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {`${debt.year}-${String(debt.month).padStart(2, "0")}-${String(debt.day).padStart(2, "0")}`}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {debt.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        debt.isreturned
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {debt.isreturned ? "Qaytarilgan" : "Qaytarilmagan"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => printDebt(debt)}
                      className="text-purple-600 hover:text-purple-800 transition"
                      title="Chop Etish"
                    >
                      <Printer size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm md:text-base">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Vagon Raqami
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Jami Summa
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                To'langan
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Qoldiq
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                Amallar
              </th>
            </tr>
          </thead>
          <tbody>
            {wagons.map((wagon) => (
              <tr key={wagon.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {wagon.wagon_number}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {parseFloat(wagon.total.toString()).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-green-600 font-semibold">
                  {parseFloat((wagon.paid_amount || 0).toString()).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                  {(
                    parseFloat(wagon.total.toString()) -
                    parseFloat((wagon.paid_amount || 0).toString())
                  ).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => printWagon(wagon)}
                    className="text-purple-600 hover:text-purple-800 transition mr-2"
                    title="Chop Etish"
                  >
                    <Printer size={18} />
                  </button>
                  <button
                    onClick={() => onDeleteWagon(wagon.id)}
                    className="text-red-600 hover:text-red-800 transition"
                    title="O'chirish"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
