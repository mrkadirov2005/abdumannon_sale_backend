import React from "react";
import { Plus, Trash2, Printer } from "lucide-react";
import type { Person, FinanceRecord, Debt } from "../types";

interface DetailsPanelProps {
  person: Person;
  financeRecords: FinanceRecord[];
  onAddPayment: () => void;
  onDeleteWagon: (wagonId: string) => void;
  onDeleteFinanceRecord: (recordId: number) => void;
  source: "wagons" | "debts";
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  person,
  financeRecords,
  onAddPayment,
  onDeleteWagon,
  onDeleteFinanceRecord,
  source,
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

  const personFinanceRecords = financeRecords.filter((record) =>
    record.description?.startsWith(person.name)
  );

  const debts: Debt[] = person.debts || [];

  const printWagon = (wagon: Person["wagons"][number]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const parts = wagon.wagon_number.split(",");
    const wagonNumber = parts[1] || wagon.wagon_number;
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
        <title>Vagon - ${wagonNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f5f5f5; }
          .meta { color: #555; margin-bottom: 8px; }
          @media print { button { display: none; } body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>Vagon: ${wagonNumber}</h1>
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

  const printAllWagons = () => {
    if (!person.wagons || person.wagons.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const wagonsHtml = person.wagons
      .map((wagon, wagonIndex) => {
        const parts = wagon.wagon_number.split(",");
        const wagonNumber = parts[1] || wagon.wagon_number;
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

        return `
          <div class="section">
            <h3>Vagon #${wagonIndex + 1}: ${wagonNumber}</h3>
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
          </div>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vagonlar - ${person.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f5f5f5; }
          .section { margin-top: 20px; }
          .meta { color: #555; margin-bottom: 6px; }
          @media print { button { display: none; } body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>${person.name} - Vagonlar</h1>
        ${wagonsHtml}
        <button onclick="window.print()">Chop Etish</button>
      </body>
      </html>
    `);
    printWindow.document.close();
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

  const printAllDebts = () => {
    if (debts.length === 0) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const debtsHtml = debts
      .map((debt, idx) => {
        const date = `${debt.year}-${String(debt.month).padStart(2, "0")}-${String(
          debt.day
        ).padStart(2, "0")}`;
        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${debt.name}</td>
            <td>${date}</td>
            <td style="text-align: right;">${debt.amount.toLocaleString()}</td>
            <td>${debt.isreturned ? "Qaytarilgan" : "Qaytarilmagan"}</td>
          </tr>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Qarzlar - ${person.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f5f5f5; }
          @media print { button { display: none; } body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>${person.name} - Qarzlar</h1>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Mijoz</th>
              <th>Sana</th>
              <th style="text-align: right;">Summa</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            ${debtsHtml}
          </tbody>
        </table>
        <button onclick="window.print()">Chop Etish</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };
  const printPerson = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const wagonsHtml = (person.wagons || [])
      .map((wagon, wagonIndex) => {
        const parts = wagon.wagon_number.split(",");
        const wagonNumber = parts[1] || wagon.wagon_number;

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

        return `
          <div class="section">
            <h3>Vagon #${wagonIndex + 1}: ${wagonNumber}</h3>
            <div class="meta">
              <span>Jami: ${Number(wagon.total).toLocaleString()}</span>
              <span>To'langan: ${Number(wagon.paid_amount || 0).toLocaleString()}</span>
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
          </div>
        `;
      })
      .join("");

    const debtsHtml = debts
      .map((debt, idx) => {
        const date = `${debt.year}-${String(debt.month).padStart(2, "0")}-${String(
          debt.day
        ).padStart(2, "0")}`;
        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${date}</td>
            <td style="text-align: right;">${debt.amount.toLocaleString()}</td>
            <td>${debt.isreturned ? "Qaytarilgan" : "Qaytarilmagan"}</td>
          </tr>
        `;
      })
      .join("");

    const paymentsHtml = personFinanceRecords
      .map((record, idx) => {
        const desc = record.description?.split(": ")[1] || record.description || "";
        const date = new Date(record.date).toLocaleDateString("uz-UZ");
        const amount = `${record.type === "income" ? "+" : "-"}${Number(
          record.amount
        ).toLocaleString()}`;
        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${desc}</td>
            <td>${date}</td>
            <td style="text-align: right;">${amount}</td>
          </tr>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Moliya - ${person.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { margin-bottom: 4px; }
          .meta { display: flex; gap: 16px; color: #555; margin-bottom: 8px; }
          .section { margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f5f5f5; }
          .summary { margin-top: 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .card { border: 1px solid #ddd; padding: 8px; border-radius: 6px; }
          @media print { button { display: none; } body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>${person.name}</h1>
        <div class="summary">
          <div class="card">Jami: ${person.totalAmount.toLocaleString()}</div>
          <div class="card">To'langan: ${person.paidAmount.toLocaleString()}</div>
          <div class="card">Qoldiq: ${person.remainingAmount.toLocaleString()}</div>
        </div>

        ${source === "wagons" ? wagonsHtml : `
          <div class="section">
            <h3>Qarzlar (${debts.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sana</th>
                  <th style="text-align: right;">Summa</th>
                  <th>Holat</th>
                </tr>
              </thead>
              <tbody>
                ${debtsHtml || `<tr><td colspan="4">Qarzlar topilmadi</td></tr>`}
              </tbody>
            </table>
          </div>
        `}

        <div class="section">
          <h3>Pul berish tarixi (${personFinanceRecords.length})</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Izoh</th>
                <th>Sana</th>
                <th style="text-align: right;">Miqdor</th>
              </tr>
            </thead>
            <tbody>
              ${paymentsHtml || `<tr><td colspan="4">Pul berish tarixi yo'q</td></tr>`}
            </tbody>
          </table>
        </div>

        <button onclick="window.print()">Chop Etish</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="mt-6 bg-white rounded-lg shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          {person.name}
        </h2>
        <button
          onClick={printPerson}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Printer size={16} /> Chop Etish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-gray-600 text-sm mb-1">Jami Summa</p>
          <p className="text-3xl font-bold text-blue-600">
            {person.totalAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-gray-600 text-sm mb-1">To'langan</p>
          <p className="text-3xl font-bold text-green-600">
            {person.paidAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <p className="text-gray-600 text-sm mb-1">Qoldiq Summa</p>
          <p className="text-3xl font-bold text-orange-600">
            {person.remainingAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {source === "wagons" ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Vagonlar ({person.wagons?.length || 0})
            </h3>
            <button
              onClick={printAllWagons}
              className="flex items-center gap-2 px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Printer size={14} /> Hammasini Chop Etish
            </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    Vagon
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Mahsulotlar
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">
                    Jami
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
                {(person.wagons || []).map((wagon) => {
                  const parts = wagon.wagon_number.split(",");
                  const wagonNumber = parts[1] || wagon.wagon_number;

                  return (
                    <tr key={wagon.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {wagonNumber}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {wagon.products.length}
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
                      <td className="px-4 py-3 text-center space-x-2 flex justify-center">
                        <button
                          onClick={() => printWagon(wagon)}
                          className="text-purple-600 hover:text-purple-800 transition"
                          title="Chop Etish"
                        >
                          <Printer size={18} />
                        </button>
                        <button
                          onClick={onAddPayment}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="Pul qo'shish"
                        >
                          <Plus size={18} />
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Qarzlar ({debts.length})
            </h3>
            <button
              onClick={printAllDebts}
              className="flex items-center gap-2 px-3 py-2 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Printer size={14} /> Hammasini Chop Etish
            </button>
          </div>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
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
                    <td className="px-4 py-3 text-center space-x-2">
                      <button
                        onClick={() => printDebt(debt)}
                        className="text-purple-600 hover:text-purple-800 transition"
                        title="Chop Etish"
                      >
                        <Printer size={18} />
                      </button>
                      <button
                        onClick={onAddPayment}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Pul qo'shish"
                      >
                        <Plus size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">
        Pul berish tarixi ({personFinanceRecords.length})
      </h3>

      <div className="space-y-2">
        {personFinanceRecords.length === 0 ? (
          <p className="text-gray-500">Pul berish tarixi yo'q</p>
        ) : (
          personFinanceRecords.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {record.description?.split(": ")[1] || record.description}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(record.date).toLocaleDateString("uz-UZ")}
                </p>
              </div>
              <div className="text-right mr-4">
                <p
                  className={`font-bold text-lg ${
                    record.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {record.type === "income" ? "+" : "-"}
                  {parseFloat(record.amount).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => onDeleteFinanceRecord(record.id)}
                className="text-red-600 hover:text-red-800 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
