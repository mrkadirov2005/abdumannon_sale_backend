import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  accessTokenFromStore,
  getIsSuperUserFromStore,
  getshopidfromstrore,
  getUserFromStore,
} from "../../redux/selectors";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import type { Admin, SuperUser } from "../../../types/types";
import { FiSearch, FiDownload } from "react-icons/fi";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

/* ================= TYPES ================= */

interface ReportItem {
  target_id: string;
  day: number;
  month: number;
  year: number;
  shop_id: string;
  log: string;
  uuid: string;
}

interface ApiResponse {
  message: string;
  data: ReportItem[];
}

type SortKey = "date" | "target_id" | "uuid" | "shop_id";
type SortDirection = "asc" | "desc";

/* ================= TOAST UTILITY ================= */

const toast = {
  success: (message: string) => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
      style: {
        background: "linear-gradient(to right, #00b09b, #96c93d)",
      },
    }).showToast();
  },
  error: (message: string) => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
      style: {
        background: "linear-gradient(to right, #ff5f6d, #ffc371)",
      },
    }).showToast();
  },
  info: (message: string) => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
      style: {
        background: "linear-gradient(to right, #3b82f6, #60a5fa)",
      },
    }).showToast();
  },
};

/* ================= COMPONENT ================= */

export default function ReportList() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filters
  const [filterTargetId, setFilterTargetId] = useState("");
  const [filterShopId, setFilterShopId] = useState("");
  const [filterUUID, setFilterUUID] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [searchLog, setSearchLog] = useState("");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const token = useSelector(accessTokenFromStore);
  const shop_id = useSelector(getshopidfromstrore);
  const user = useSelector(getUserFromStore);
  const isSuperUser = useSelector(getIsSuperUserFromStore);

  /* ================= FETCH ================= */

  useEffect(() => {
    async function fetchReports() {
      try {
        if (!token || !shop_id || !user) {
          toast.error("Autentifikatsiya ma'lumotlari yo'q");
          return;
        }

        const adminName = isSuperUser
          ? (user as SuperUser).name
          : (user as Admin).first_name;

        const res = await fetch(
          `${DEFAULT_ENDPOINT}${ENDPOINTS.reports.get_all_reports}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authorization: token,
            },
            body: JSON.stringify({
              shop_id,
              name: adminName,
              uuid: user.uuid,
              role: isSuperUser ? "superuser" : "admin",
            }),
          }
        );

        if (!res.ok) {
          throw new Error(`Hisobot yuklab bo'lmadi: ${res.status}`);
        }

        const data: ApiResponse = await res.json();
        setReports(data.data || []);
        toast.success(`Muvaffaqiyatli ${data.data?.length || 0} ta hisobot yuklandi`);
      } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : "Hisobot yuklab bo'lmadi";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [token, shop_id, user, isSuperUser]);

  /* ================= HELPERS ================= */

  const formatDate = (r: ReportItem) =>
    `${r.year}-${String(r.month).padStart(2, "0")}-${String(r.day).padStart(2, "0")}`;

  const getTimestamp = (r: ReportItem) =>
    new Date(formatDate(r)).getTime();

  /* ================= FILTER OPTIONS ================= */

  const uniqueTargetIds = useMemo(
    () => [...new Set(reports.map((r) => r.target_id))],
    [reports]
  );

  const uniqueShopIds = useMemo(
    () => [...new Set(reports.map((r) => r.shop_id))],
    [reports]
  );

  const uniqueUUIDs = useMemo(
    () => [...new Set(reports.map((r) => r.uuid))],
    [reports]
  );

  const uniqueDates = useMemo(
    () => [...new Set(reports.map((r) => formatDate(r)))].sort().reverse(),
    [reports]
  );

  /* ================= FILTER + SORT ================= */

  const filteredAndSorted = useMemo(() => {
    let list = [...reports];

    if (filterTargetId) list = list.filter((r) => r.target_id === filterTargetId);
    if (filterShopId) list = list.filter((r) => r.shop_id === filterShopId);
    if (filterUUID) list = list.filter((r) => r.uuid === filterUUID);
    if (filterDate) list = list.filter((r) => formatDate(r) === filterDate);
    if (searchLog) {
      const searchTerm = searchLog.toLowerCase();
      list = list.filter((r) =>
        r.log.toLowerCase().includes(searchTerm) ||
        r.target_id.toLowerCase().includes(searchTerm) ||
        r.shop_id.toLowerCase().includes(searchTerm) ||
        r.uuid.toLowerCase().includes(searchTerm) ||
        formatDate(r).includes(searchTerm)
      );
    }

    list.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortKey) {
        case "date":
          return (getTimestamp(a) - getTimestamp(b)) * dir;
        case "target_id":
          return a.target_id.localeCompare(b.target_id) * dir;
        case "uuid":
          return a.uuid.localeCompare(b.uuid) * dir;
        case "shop_id":
          return a.shop_id.localeCompare(b.shop_id) * dir;
        default:
          return 0;
      }
    });

    return list;
  }, [
    reports,
    filterTargetId,
    filterShopId,
    filterUUID,
    filterDate,
    searchLog,
    sortKey,
    sortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedData = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isAnyFilterActive =
    filterTargetId || filterShopId || filterUUID || filterDate || searchLog;

  // Summary stats
  const stats = useMemo(() => {
    const dates = filteredAndSorted.map(r => formatDate(r));
    const uniqueDatesSet = new Set(dates);
    const uniqueUsersSet = new Set(filteredAndSorted.map(r => r.uuid));
    const uniqueTargetsSet = new Set(filteredAndSorted.map(r => r.target_id));
    
    const datesSorted = Array.from(uniqueDatesSet).sort();
    
    return {
      totalRecords: filteredAndSorted.length,
      dateRange: datesSorted.length > 0 
        ? `${datesSorted[0]} to ${datesSorted[datesSorted.length - 1]}`
        : "N/A",
      uniqueUsers: uniqueUsersSet.size,
      uniqueTargets: uniqueTargetsSet.size,
    };
  }, [filteredAndSorted]);

  const getLogCategory = (log: string): { label: string; color: string } => {
    const logLower = log.toLowerCase();
    if (logLower.includes("login") || logLower.includes("logged in")) {
      return { label: "Login", color: "bg-blue-100 text-blue-700" };
    }
    if (logLower.includes("logout") || logLower.includes("logged out")) {
      return { label: "Logout", color: "bg-gray-100 text-gray-700" };
    }
    if (logLower.includes("error") || logLower.includes("failed")) {
      return { label: "Error", color: "bg-red-100 text-red-700" };
    }
    if (logLower.includes("created") || logLower.includes("added")) {
      return { label: "Create", color: "bg-green-100 text-green-700" };
    }
    if (logLower.includes("updated") || logLower.includes("modified")) {
      return { label: "Update", color: "bg-yellow-100 text-yellow-700" };
    }
    if (logLower.includes("deleted") || logLower.includes("removed")) {
      return { label: "Delete", color: "bg-red-100 text-red-700" };
    }
    return { label: "Activity", color: "bg-purple-100 text-purple-700" };
  };

  // Clear all filters handler
  const handleClearFilters = () => {
    setFilterTargetId("");
    setFilterShopId("");
    setFilterUUID("");
    setFilterDate("");
    setSearchLog("");
    setCurrentPage(1);
    toast.info("Barcha filterlar o'chirildi");
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Sana", "Maqsad ID", "Dukan ID", "Foydalanuvchi", "Jurnal"];
    const rows = filteredAndSorted.map((item) => [
      formatDate(item),
      item.target_id,
      item.shop_id,
      item.uuid.substring(0, 16),
      item.log.substring(0, 50),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `hisobot_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV sifatida yuklandi");
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      totalRecords: filteredAndSorted.length,
      stats,
      reports: filteredAndSorted.map((item) => ({
        date: formatDate(item),
        targetId: item.target_id,
        shopId: item.shop_id,
        userId: item.uuid,
        log: item.log,
      })),
    };

    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `hisobot_${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("JSON sifatida yuklandi");
  };

  /* ================= UI STATES ================= */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Hisobot yuklanimoqda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-0 py-0">
        <div className="px-4 py-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-3 border border-slate-700 shadow-sm">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Jami yozuvlar</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalRecords}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-900 to-blue-900 rounded-lg p-3 border border-blue-800 shadow-sm">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Noyob foydalanuvchilar</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.uniqueUsers}</p>
          </div>
          
          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg p-3 border border-slate-700 shadow-sm">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Noyob maqsadlar</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.uniqueTargets}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-900 to-blue-900 rounded-lg p-3 border border-blue-800 shadow-sm">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Sana oralig'i</p>
            <p className="text-xs font-bold text-white mt-1 break-words">{stats.dateRange}</p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          {/* Search and Filters in One Row */}
          <div className="flex items-end gap-3 mb-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-2.5 text-blue-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Sana, dukan, foydalanuvchi, maqsad yoki jurnal qidirish..."
                  value={searchLog}
                  onChange={(e) => {
                    setSearchLog(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                />
              </div>
            </div>

            {/* Compact Filter Dropdowns */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                <span className="inline-block w-1 h-1 bg-blue-500 rounded-full mr-1"></span>
                Sana
              </label>
              <select
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  filterDate ? "border-blue-400 bg-blue-50" : "border-gray-300"
                }`}
              >
                <option value="">All</option>
                {uniqueDates.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                <span className="inline-block w-1 h-1 bg-green-500 rounded-full mr-1"></span>
                Maqsad
              </label>
              <select
                value={filterTargetId}
                onChange={(e) => {
                  setFilterTargetId(e.target.value);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  filterTargetId ? "border-green-400 bg-green-50" : "border-gray-300"
                }`}
              >
                <option value="">All</option>
                {uniqueTargetIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                <span className="inline-block w-1 h-1 bg-purple-500 rounded-full mr-1"></span>
                Dukan
              </label>
              <select
                value={filterShopId}
                onChange={(e) => {
                  setFilterShopId(e.target.value);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  filterShopId ? "border-purple-400 bg-purple-50" : "border-gray-300"
                }`}
              >
                <option value="">All</option>
                {uniqueShopIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                <span className="inline-block w-1 h-1 bg-orange-500 rounded-full mr-1"></span>
                Foydalanuvchi
              </label>
              <select
                value={filterUUID}
                onChange={(e) => {
                  setFilterUUID(e.target.value);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  filterUUID ? "border-orange-400 bg-orange-50" : "border-gray-300"
                }`}
              >
                <option value="">All</option>
                {uniqueUUIDs.map((id) => (
                  <option key={id} value={id}>
                    {id.substring(0, 12)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {isAnyFilterActive && (
            <div className="flex flex-wrap gap-2 items-center">
              {filterDate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  Date: {filterDate}
                </span>
              )}
              {filterTargetId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  Target: {filterTargetId}
                </span>
              )}
              {filterShopId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                  Shop: {filterShopId}
                </span>
              )}
              {filterUUID && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                  User: {filterUUID.substring(0, 12)}...
                </span>
              )}
              {searchLog && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                  Search: "{searchLog}"
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="ml-auto px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
              >
                Hammasini o'chirish
              </button>
            </div>
          )}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xs font-medium text-gray-600">
            Saralash uchun ustun sarlavhasini bosing • {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "yozuv" : "yozuvlar"}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              <FiDownload /> CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold border border-green-300 text-green-600 rounded-lg hover:bg-green-50 transition"
            >
              <FiDownload /> JSON
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {paginatedData.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Hisob-kitob topilmadi</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th 
                        onClick={() => {
                          if (sortKey === "date") {
                            setSortDirection(d => d === "asc" ? "desc" : "asc");
                          } else {
                            setSortKey("date");
                            setSortDirection("desc");
                          }
                        }}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-2">
                          Sana
                          {sortKey === "date" && (
                            <span className="text-blue-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (sortKey === "target_id") {
                            setSortDirection(d => d === "asc" ? "desc" : "asc");
                          } else {
                            setSortKey("target_id");
                            setSortDirection("asc");
                          }
                        }}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-2">
                          Maqsad ID
                          {sortKey === "target_id" && (
                            <span className="text-green-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (sortKey === "shop_id") {
                            setSortDirection(d => d === "asc" ? "desc" : "asc");
                          } else {
                            setSortKey("shop_id");
                            setSortDirection("asc");
                          }
                        }}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-2">
                          Dukan ID
                          {sortKey === "shop_id" && (
                            <span className="text-purple-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (sortKey === "uuid") {
                            setSortDirection(d => d === "asc" ? "desc" : "asc");
                          } else {
                            setSortKey("uuid");
                            setSortDirection("asc");
                          }
                        }}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-2">
                          Foydalanuvchi
                          {sortKey === "uuid" && (
                            <span className="text-orange-600">{sortDirection === "asc" ? "↑" : "↓"}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-700">Jurnal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((item) => {
                      const logCategory = getLogCategory(item.log);
                      return (
                        <tr key={`${item.uuid}-${item.target_id}-${item.day}`} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-2.5 text-xs text-gray-900 font-semibold">
                            {formatDate(item)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-600">{item.target_id}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-600">{item.shop_id}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-600 truncate max-w-xs" title={item.uuid}>
                            {item.uuid.substring(0, 16)}...
                          </td>
                          <td className="px-4 py-2.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${logCategory.color}`}>
                                {logCategory.label}
                              </span>
                              <span className="text-gray-600 line-clamp-1 ml-2">{item.log.substring(0, 30)}...</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700">
                    Sahifa <span className="font-bold text-blue-600">{currentPage}</span> dan <span className="font-bold text-blue-600">{totalPages}</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 transition"
                    >
                      ← Oldingi
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg hover:bg-green-50 hover:text-green-600 hover:border-green-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 transition"
                    >
                      Keyingi →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}