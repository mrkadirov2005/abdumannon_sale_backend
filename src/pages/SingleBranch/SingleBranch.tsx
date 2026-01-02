import React, { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { getBranchesFromStore, getSalesFromStore } from "../../redux/selectors";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import type { Sale } from "../../../types/types";

export default function SingleBranch() {
  const branch = useSelector(getBranchesFromStore).branch;
  const sales = useSelector(getSalesFromStore);

  // States for search, filter, sort
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"" | "all" | "cash" | "card" | "mobile">("all");
  const [sortKey, setSortKey] = useState<keyof Sale>("sale_time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Show toast when component loads with branch data
  useEffect(() => {
    if (branch) {
      toast.info(`Viewing branch: ${branch.name}`);
    }
  }, [branch?.id]);

  if (!branch) {
    toast.error("Branch data not found");
    return <p>Branch data not found</p>;
  }
  
  if (!sales) {
    toast.info("Loading sales data...");
    return <p>Loading sales...</p>;
  }

  const branchSales = sales.filter((item) => item.branch === branch.id);

  // Sum total sales
  const savdo = branchSales.reduce((acc, sale) => acc + (Number(sale.total_price) || 0), 0);

  // Calculate daily statistics
  const salesByDay: { [key: number]: number } = {};
  branchSales.forEach((sale) => {
    const day = sale.sale_day || 0;
    salesByDay[day] = (salesByDay[day] || 0) + Number(sale.total_price);
  });

  // Find peak sales day
  const dailyStats = Object.entries(salesByDay)
    .map(([day, total]) => ({ day: Number(day), total }))
    .sort((a, b) => b.total - a.total);
  
  const peakDay = dailyStats[0];
  const avgDailySales = dailyStats.length > 0 
    ? dailyStats.reduce((acc, curr) => acc + curr.total, 0) / dailyStats.length 
    : 0;

  // Filtered and sorted data for table
  const filteredData = useMemo(() => {
    let rows = [...branchSales];

    // Payment filter
    if (paymentFilter !== "all") {
      rows = rows.filter((r) => (r.payment_method ?? "") === paymentFilter);
    }

    // Search by sale_id
    if (search.trim()) {
      rows = rows.filter((r) => r.sale_id.toLowerCase().includes(search.toLowerCase()));
    }

    // Sort by selected key and order
    rows.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      // For date strings or strings
      if (sortKey === "sale_time") {
        // compare dates
        const dateA = new Date(String(aVal));
        const dateB = new Date(String(bVal));
        return sortOrder === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }

      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    return rows;
  }, [branchSales, paymentFilter, search, sortKey, sortOrder]);

  // Totals from filtered data
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, sale) => {
        acc.totalPrice += Number(sale.total_price) || 0;
        acc.totalProfit += Number(sale.profit) || 0;
        return acc;
      },
      { totalPrice: 0, totalProfit: 0 }
    );
  }, [filteredData]);

  // Sort handler
  const handleSort = (key: keyof Sale) => {
    if (sortKey === key) {
      // Toggle sort order
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Reset filters handler
  const handleResetFilters = () => {
    setSearch("");
    setPaymentFilter("all");
    toast.info("Filters cleared");
  };

  // Table headers
  const headers: { key: keyof Sale; label: string }[] = [
    { key: "sale_id", label: "Sale ID" },
    { key: "total_price", label: "Total" },
    { key: "profit", label: "Profit" },
    { key: "payment_method", label: "Payment" },
    { key: "sale_time", label: "Date" },
    { key: "admin_name", label: "Admin" }
  ];

  const isFilterActive = search !== "" || paymentFilter !== "all";

  return (
    <section>
      {/* Branch Details Table */}
      <TableContainer
        component={Paper}
        sx={{ maxWidth: "100%", margin: "auto", borderRadius: 2, boxShadow: 3, mt: 3 }}
      >
        <Typography variant="h6" sx={{ padding: 2 }}>
          Branch Details
        </Typography>
        <Table>
          <TableHead sx={{ backgroundColor: "#1976d2" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Nomi</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Joylashuvi</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Dokon ID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Sotuvchilar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow hover>
              <TableCell>{branch.name}</TableCell>
              <TableCell>{branch.location}</TableCell>
              <TableCell>{branch.shop_id}</TableCell>
              <TableCell>{branch.employees}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Sales Summary with Statistics Cards */}
      <div style={{ marginTop: 30, maxWidth: "100%", marginLeft: "auto", marginRight: "auto" }}>
        <Typography variant="h6" gutterBottom textAlign="center">
          Savdo ko'rsatgichlari
        </Typography>
        
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Sales Count */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 shadow-lg text-white">
            <p className="text-sm font-semibold opacity-90">Savdo soni</p>
            <p className="text-3xl font-bold mt-2">{branchSales.length}</p>
          </div>

          {/* Total Sales Amount */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 shadow-lg text-white">
            <p className="text-sm font-semibold opacity-90">Jami savdo</p>
            <p className="text-3xl font-bold mt-2">{savdo.toLocaleString()}</p>
            <p className="text-xs opacity-75 mt-1">so'm</p>
          </div>

          {/* Peak Sales Day */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 shadow-lg text-white">
            <p className="text-sm font-semibold opacity-90">Eng yaxshi kun</p>
            <p className="text-3xl font-bold mt-2">
              {peakDay ? `${peakDay.day}-kun` : "N/A"}
            </p>
            <p className="text-xs opacity-75 mt-1">
              {peakDay ? `${peakDay.total.toLocaleString()} so'm` : ""}
            </p>
          </div>

          {/* Average Daily Sales */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 shadow-lg text-white">
            <p className="text-sm font-semibold opacity-90">O'rtacha kunlik</p>
            <p className="text-3xl font-bold mt-2">{Math.round(avgDailySales).toLocaleString()}</p>
            <p className="text-xs opacity-75 mt-1">so'm/kun</p>
          </div>
        </div>

        {/* Detailed Stats Table */}
        <table
          style={{
            width: "100%",
            maxWidth: 600,
            margin: "0 auto",
            borderCollapse: "collapse",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <thead style={{ backgroundColor: "#1976d2", color: "white" }}>
            <tr>
              <th style={thStyle}>O'lchov</th>
              <th style={thStyle}>Qiymat</th>
            </tr>
          </thead>
          <tbody>
            <tr style={trStyle}>
              <td style={tdStyle}>Savdo soni</td>
              <td style={tdStyle}>{branchSales.length}</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>Jami savdo</td>
              <td style={tdStyle}>{savdo.toLocaleString()} so'm</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>Eng yaxshi kun</td>
              <td style={tdStyle}>
                {peakDay ? `${peakDay.day}-kun (${peakDay.total.toLocaleString()} so'm)` : "N/A"}
              </td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>O'rtacha kunlik savdo</td>
              <td style={tdStyle}>{Math.round(avgDailySales).toLocaleString()} so'm</td>
            </tr>
            <tr style={trStyle}>
              <td style={tdStyle}>Faol kunlar</td>
              <td style={tdStyle}>{dailyStats.length} kun</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Filters and Sales Table */}
      <div className="p-4 bg-white rounded-xl shadow mt-10">
        <Typography variant="h6" gutterBottom>
          Savdo tarixi
        </Typography>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4 items-center">
          <input
            type="text"
            placeholder="Search sale ID..."
            className="border px-3 py-2 rounded-md text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border px-3 py-2 rounded-md text-sm"
            value={paymentFilter}
            onChange={(e) =>
              setPaymentFilter(
                e.target.value as "" | "all" | "cash" | "card" | "mobile"
              )
            }
          >
            <option value="all">All payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile">Mobile</option>
            <option value="">Unknown</option>
          </select>

          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Totals */}
        <div className="flex gap-6 mb-4 text-sm font-medium">
          <div>Total Sales: {filteredData.length}</div>
          <div>Total Amount: {totals.totalPrice.toLocaleString()}</div>
          <div className="text-green-600">
            Total Profit: {totals.totalProfit.toLocaleString()}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                {headers.map((h) => (
                  <th
                    // @ts-ignore
                    key={h.key}
                    onClick={() => handleSort(h.key)}
                    className="cursor-pointer px-3 py-2 border text-left hover:bg-gray-200 select-none"
                  >
                    {h.label}
                    {sortKey === h.key && (
                      <span className="ml-1">{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No data found
                  </td>
                </tr>
              )}

              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border font-mono">{row.sale_id}</td>
                  <td className="px-3 py-2 border">{Number(row.total_price).toLocaleString()}</td>
                  <td className="px-3 py-2 border text-green-600">{Number(row.profit).toLocaleString()}</td>
                  <td className="px-3 py-2 border">{row.payment_method || "—"}</td>
                  <td className="px-3 py-2 border">{new Date(row.sale_time).toLocaleString()}</td>
                  <td className="px-3 py-2 border">{row.admin_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-3 text-xs text-gray-500">
          Showing {filteredData.length} of {branchSales.length} sales
        </div>
      </div>
    </section>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 15px",
  textAlign: "left",
  fontWeight: "600",
  fontSize: 16,
};

const tdStyle: React.CSSProperties = {
  padding: "12px 15px",
  borderBottom: "1px solid #ddd",
  fontSize: 14,
};

const trStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  cursor: "default",
};