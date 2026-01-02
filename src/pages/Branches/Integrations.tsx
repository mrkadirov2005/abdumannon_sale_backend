import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type AppDispatch } from "../../redux/store";
import { getBranchesThunk } from "../../redux/slices/branches/thunks/GetBranchesThunk";
import { getAuthFromStore, getBranchesFromStore } from "../../redux/selectors";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";
import { toast } from "react-toastify";
import { Plus, Edit2, Trash2, Eye, Search, ArrowUpDown, ChevronUp, ChevronDown, MapPin, Users, Building2, Download, X } from "lucide-react";

/* ================= TYPES ================= */

interface Branch {
  id: string;
  name: string;
  location: string;
  employees: number;
  shop_id: number;
  created_at?: string;
}

type SortKey = "name" | "location" | "employees";
type SortDirection = "asc" | "desc";

/* ================= COMPONENT ================= */

export default function Integrations() {
  const dispatch = useDispatch<AppDispatch>();

  const authData = useSelector(getAuthFromStore);
  const branches = useSelector(getBranchesFromStore).branches;

  // State
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    employees: "1",
  });

  /* ================= FETCH BRANCHES ================= */

  const fetchBranches = async () => {
    try {
      setLoading(true);
      if (!authData.accessToken || !authData.user?.shop_id) {
        toast.error("Missing authentication data");
        return;
      }

      dispatch(
        getBranchesThunk({
          token: authData.accessToken,
          shop_id: authData.user.shop_id,
        })
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch branches");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchById = async (branchId: string) => {
    try {
      const toastId = toast.loading("📋 Loading branch details...");
      const url = `${DEFAULT_ENDPOINT}${ENDPOINTS.branches.getById}`;
      console.log("Fetch URL:", url);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: authData.accessToken ?? "",
        },
        body: JSON.stringify({ id: branchId }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch branch");
      }

      const json = await res.json();
      setSelectedBranch(json.branch);
      setShowDetailModal(true);
      toast.update(toastId, {
        render: "✅ Branch details loaded",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to fetch branch details: ${err.message}`);
    }
  };

  useEffect(() => {
   
    if (!authData.accessToken || !authData.user?.shop_id) return;
    fetchBranches();
  }, [authData.accessToken, authData.user?.shop_id]);

  /* ================= CRUD OPERATIONS ================= */

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.location || !formData.employees) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const toastId = toast.loading("💾 Creating branch...");
      const url = `${DEFAULT_ENDPOINT}${ENDPOINTS.branches.create}`;
      console.log("Create URL:", url);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: authData.accessToken ?? "",
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          employees: parseInt(formData.employees),
          shop_id: authData.user?.shop_id,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create branch");
      }

      const json = await res.json();
      toast.update(toastId, {
        render: `✅ Branch "${json.branch.name}" created successfully`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Reset form and close modal
      setFormData({ name: "", location: "", employees: "1" });
      setShowCreateModal(false);

      // Refresh branches
      fetchBranches();
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Failed to create branch: ${err.message}`);
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBranch || !formData.name || !formData.location) {
      toast.error("Missing required fields");
      return;
    }

    try {
      const toastId = toast.loading("✏️ Updating branch...");
      const url = `${DEFAULT_ENDPOINT}${ENDPOINTS.branches.update}`;
      console.log("Update URL:", url);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: authData.accessToken ?? "",
          shop_id: authData.user?.shop_id?.toString() ?? "",
        },
        body: JSON.stringify({
          id: selectedBranch.id,
          name: formData.name,
          location: formData.location,
          employees: parseInt(formData.employees),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update branch");
      }

      toast.update(toastId, {
        render: "✅ Branch updated successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setShowEditModal(false);
      setFormData({ name: "", location: "", employees: "1" });
      setSelectedBranch(null);
      fetchBranches();
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ Failed to update branch: ${err.message}`);
    }
  };

  const handleDeleteBranch = async (branchId: string, branchName: string): Promise<void> => {
    if (!confirm(`Are you sure you want to delete branch "${branchName}"?`)) return;

    try {
      const toastId = toast.loading("🗑️ Deleting branch...");
      const url = `${DEFAULT_ENDPOINT}${ENDPOINTS.branches.delete}`;
      console.log("Delete URL:", url);
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: authData.accessToken ?? "",
          id: branchId,
          shop_id: authData.user?.shop_id?.toString() ?? "",
        },
      });

      if (!res.ok) {
        throw new Error("Failed to delete branch");
      }

      toast.update(toastId, {
        render: `✅ Branch "${branchName}" deleted successfully`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setShowDetailModal(false);
      fetchBranches();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(err);
      toast.error(`❌ Failed to delete branch: ${errorMessage}`);
    }
  };

  const openEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location,
      employees: branch.employees.toString(),
    });
    setShowEditModal(true);
  };

  /* ================= HELPERS ================= */

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown size={16} className="opacity-30" />;
    return sortDirection === "asc" ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const exportToCSV = () => {
    try {
      const headers = ["Name", "Location", "Employees", "Shop ID"];
      const rows = filteredAndSorted.map((branch) => [
        branch.name,
        branch.location,
        branch.employees,
        branch.shop_id,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `branches_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success("✅ Branches exported to CSV");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export branches");
    }
  };

  /* ================= FILTER + SORT ================= */

  const filteredAndSorted = useMemo(() => {
    if (!branches) return [];

    let list = [...branches];

    // Search filter
    if (searchTerm) {
      list = list.filter(
        (branch) =>
          branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    list.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return a.name?.localeCompare(b.name ?? "") ?? 0 * dir;
        case "location":
          return a.location?.localeCompare(b.location ?? "") ?? 0 * dir;
        case "employees":
          return ((a.employees ?? 0) - (b.employees ?? 0)) * dir;
        default:
          return 0;
      }
    });

    return list;
  }, [branches, searchTerm, sortKey, sortDirection]);

  /* ================= UI ================= */

  if (loading && !branches) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Branch Management</h1>
          <p className="text-gray-600">Manage your business branches</p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: "", location: "", employees: "1" });
            setShowCreateModal(true);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} /> New Branch
        </button>
      </header>

      {/* Statistics Cards */}
      {branches && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold opacity-90">Total Branches</p>
              <Building2 size={24} className="opacity-50" />
            </div>
            <p className="text-4xl font-bold">{branches.length}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold opacity-90">Total Employees</p>
              <Users size={24} className="opacity-50" />
            </div>
            <p className="text-4xl font-bold">{branches.reduce((sum, b) => sum + (b.employees || 0), 0)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 shadow-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold opacity-90">Avg Employees/Branch</p>
              <Users size={24} className="opacity-50" />
            </div>
            <p className="text-4xl font-bold">
              {branches.length > 0
                ? Math.round(branches.reduce((sum, b) => sum + (b.employees || 0), 0) / branches.length)
                : 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center mb-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 border border-green-300 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium flex items-center gap-2"
          >
            <Download size={18} /> Export
          </button>
        </div>

        {/* Filters Info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-gray-600 font-medium">Results</p>
            <p className="text-2xl font-bold text-blue-900">{filteredAndSorted.length}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-gray-600 font-medium">Total Branches</p>
            <p className="text-2xl font-bold text-purple-900">{branches?.length || 0}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-gray-600 font-medium">Employees</p>
            <p className="text-2xl font-bold text-green-900">
              {branches?.reduce((sum, b) => sum + (b.employees || 0), 0) || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Branch Name
                    {getSortIcon("name")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("location")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Location
                    {getSortIcon("location")}
                  </div>
                </th>
                <th
                  onClick={() => handleSort("employees")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    Employees
                    {getSortIcon("employees")}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Shop ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Building2 size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg font-medium text-gray-900">No branches found</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {branches?.length === 0 ? "Start by creating a new branch" : "Try adjusting your search"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{branch.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{branch.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{branch.employees}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {branch.shop_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => fetchBranchById(branch.id as unknown as string)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(branch as unknown as Branch)}
                          className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id as unknown as string, branch.name as unknown as string)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE BRANCH MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus size={24} /> Create Branch
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", location: "", employees: "1" });
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6">
              <form onSubmit={handleCreateBranch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter branch name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter location"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employees <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.employees}
                    onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </form>
            </div>

            {/* MODAL ACTIONS */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", location: "", employees: "1" });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBranch}
                disabled={!formData.name || !formData.location || !formData.employees}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus size={18} /> Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BRANCH MODAL */}
      {showEditModal && selectedBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Edit2 size={24} /> Edit Branch
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBranch(null);
                  setFormData({ name: "", location: "", employees: "1" });
                }}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6">
              <form onSubmit={handleUpdateBranch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employees</label>
                  <input
                    type="number"
                    value={formData.employees}
                    onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                </div>
              </form>
            </div>

            {/* MODAL ACTIONS */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedBranch(null);
                  setFormData({ name: "", location: "", employees: "1" });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBranch}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center gap-2"
              >
                <Edit2 size={18} /> Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex items-center justify-between sticky top-0">
              <div className="flex-1">
                <h2 className="text-xl font-bold">{selectedBranch.name}</h2>
                <p className="text-xs opacity-90 mt-1">{selectedBranch.location}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6 space-y-4">
              {/* Name */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-700 mb-1">Branch Name</p>
                <p className="text-lg font-bold text-blue-900">{selectedBranch.name}</p>
              </div>

              {/* Location */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-700 mb-1">Location</p>
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-purple-600" />
                  <p className="text-lg font-bold text-purple-900">{selectedBranch.location}</p>
                </div>
              </div>

              {/* Employees */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-medium text-green-700 mb-1">Employees</p>
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-green-600" />
                  <p className="text-lg font-bold text-green-900">{selectedBranch.employees}</p>
                </div>
              </div>

              {/* Shop ID */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-1">Shop ID</p>
                <p className="text-sm font-mono text-gray-900">{selectedBranch.shop_id}</p>
              </div>

              {/* Branch ID */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-700 mb-1">Branch ID</p>
                <p className="text-sm font-mono text-gray-900">{selectedBranch.id}</p>
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2 justify-between sticky bottom-0 flex-wrap">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Close
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedBranch);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center gap-2"
                >
                  <Edit2 size={18} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteBranch(selectedBranch.id, selectedBranch.name)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
                >
                  <Trash2 size={18} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
