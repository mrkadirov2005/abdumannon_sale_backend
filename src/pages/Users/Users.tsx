import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  accessTokenFromStore,
  getAdminsFromStore,
  getshopidfromstrore,
} from "../../redux/selectors";
import type { AppDispatch } from "../../redux/store";
import { getShopAdminsThunk } from "../../redux/slices/admins/thunks/getAdminsthunk";
import { updateShopAdminsThunk } from "../../redux/slices/admins/thunks/updateAdminThunk";
import { type Permission, type Admin } from "../../../types/types";
import { getAllPermissions } from "../../middleware/fetcherFunctions";
import { deleteShopAdminsThunk } from "../../redux/slices/admins/thunks/deleteAdminThunk";
import { toast } from "react-toastify";
import { Calendar, DollarSign, X, Eye, ChevronDown, Edit2, Trash2, Plus, Search } from "lucide-react";
import UpdateAdminForm from "../../components/admin/UpdateAdminForm";


export default function Admins() {
  const adminsFromStore = useSelector(getAdminsFromStore);
  const [admins, setAdmins] = useState<Admin[]>(adminsFromStore);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showExpandedModal, setShowExpandedModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = useSelector(accessTokenFromStore);
  const shop_id = useSelector(getshopidfromstrore);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    setIsLoading(true);
    dispatch(getShopAdminsThunk({ shop_id, token }));

    async function fetchPermissions() {
      if (token) {
        try {
          const response = await getAllPermissions(token);
          if (Array.isArray(response)) {
            setPermissions(response);
          } else {
            toast.error("Ruxsatlarni yuklab bo'lmadi");
            setPermissions([]);
          }
        } catch (error) {
          toast.error("Ruxsatlarni yuklab bo'lmadi");
          console.error(error);
          setPermissions([]);
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchPermissions();
  }, [token, shop_id, dispatch]);

  useEffect(() => {
    setAdmins(adminsFromStore);
  }, [adminsFromStore]);

  const filteredAdmins = admins.filter((admin) => {
    const fullName = `${admin.first_name} ${admin.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      admin.phone_number?.toLowerCase().includes(query) ||
      admin.uuid?.toLowerCase().includes(query)
    );
  });

  const handleOpenCreateModal = () => {
    // Keep for future create functionality
  };

  const handleOpenEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowDetailModal(false);
    setShowExpandedModal(false);
    setShowUpdateForm(true);
  };


  async function addAdminPermission(admin: Admin, permissionName: string) {
    if (!permissionName) {
      toast.warning("Iltimos, ruxsatni tanlang");
      return;
    }

    if (admin.permissions.includes(permissionName)) {
      toast.info(`${admin.first_name} allaqachon bu ruxsatga ega`);
      return;
    }

    const updatedAdmin: Admin = {
      ...admin,
      permissions: [...admin.permissions, permissionName],
    };

    try {
      await dispatch(updateShopAdminsThunk({ token, admin: updatedAdmin })).unwrap();
      toast.success(`Added ${permissionName} to ${admin.first_name}`);

      if (selectedAdmin?.uuid === admin.uuid) {
        setSelectedAdmin(updatedAdmin);
      }
    } catch (error: any) {
      toast.error(`Ruxsatni qo'shishda xato: ${error.message || error}`);
    }
  }

  async function removeAdminPermission(admin: Admin, permissionName: string) {
    const updatedAdmin: Admin = {
      ...admin,
      permissions: admin.permissions.filter((p) => p !== permissionName),
    };

    try {
      await dispatch(updateShopAdminsThunk({ token, admin: updatedAdmin })).unwrap();
      toast.success(`${permissionName} ${admin.first_name}dan o'chirildi`);

      if (selectedAdmin?.uuid === admin.uuid) {
        setSelectedAdmin(updatedAdmin);
      }
    } catch (error: any) {
      toast.error(`Ruxsatni o'chirishda xato: ${error.message || error}`);
    }
  }

  const handleDeleteAdmin = async (admin: Admin) => {
    if (
      !window.confirm(
        `Siz ${admin.first_name} ${admin.last_name}ni o'chirishga ishonchingiz komilmi?`
      )
    ) {
      return;
    }

    try {
      await dispatch(deleteShopAdminsThunk({ token, uuid: admin.uuid })).unwrap();
      toast.success(`${admin.first_name} ${admin.last_name} muvaffaqiyatli o'chirildi`);
      setShowDetailModal(false);
      setShowExpandedModal(false);
      setSelectedAdmin(null);
    } catch (error: any) {
      toast.error(`Admin-ni o'chirishda xato: ${error.message || error}`);
    }
  };

  const handleViewAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowDetailModal(true);
  };

  const handleViewExpandedAdmin = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowExpandedModal(true);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {isLoading && <div className="w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 mb-4"></div>}

      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Foydalanuvchilar</h1>
          <p className="text-gray-600">Administratorlar va ularning ruxsatlarini boshqarish</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} /> Yangi admin
        </button>
      </header>

      {/* SEARCH & FILTER */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism, telefon yoki UUID bo'yicha qidirish..."
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
        </div>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAdmins.length === 0 ? (
          <div className="col-span-full">
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3 text-3xl">
                👤
              </div>
              <p className="text-lg font-medium text-gray-900">Foydalanuvchilar topilmadi</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery
                  ? "Boshqa qidiruv so'rovini sinab ko'ring"
                  : "Yuqoridagi tugmani bosib birinchi foydalanuvchini yarating"}
              </p>
            </div>
          </div>
        ) : (
          filteredAdmins.map((u) => (
            <div
              key={u.uuid}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col"
            >
              {/* CARD HEADER */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {u.first_name.charAt(0)}
                    {u.last_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-xs text-blue-100">
                      {u.isloggedin ? "✓ Tizimga kirgan" : "⊘ Oflayn"}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD CONTENT */}
              <div className="p-4 space-y-4 flex-1">
                {/* CONTACT INFO */}
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">Telefon</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {u.phone_number || "—"}
                  </p>
                </div>

                {/* SALARY INFO */}
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">Maosh</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {u.salary > 0 ? `${u.salary.toLocaleString()} so'm` : "—"}
                  </p>
                </div>

                {/* WORK START DATE */}
                <div className="border-b border-gray-200 pb-3">
                  <p className="text-xs font-medium text-gray-600 mb-1">Ish boshlanishi</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {u.work_start
                      ? new Date(u.work_start).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                </div>

                {/* PERMISSIONS */}
                <div className="pb-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    Ruxsatlar ({u.permissions.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {u.permissions.length === 0 ? (
                      <span className="text-gray-400 text-xs italic">Ruxsatlar yo'q</span>
                    ) : (
                      u.permissions.slice(0, 2).map((perm) => (
                        <span
                          key={perm}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-300"
                        >
                          {perm}
                        </span>
                      ))
                    )
                    }
                    {u.permissions.length > 2 && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded border border-gray-300">
                        +{u.permissions.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                {/* ADD PERMISSION */}
                <div>
                  <select
                    className="w-full border border-gray-300 p-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition"
                    onChange={(e) => {
                      if (e.target.value) {
                        addAdminPermission(u, e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      + Ruxsat qo'shish
                    </option>
                    {permissions
                      .filter((p) => !u.permissions.includes(p.name))
                      .map((p, idx) => (
                        <option key={idx} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* CARD ACTIONS */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-center gap-2">
                <button
                  onClick={() => handleViewAdmin(u)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                  title="Tezkor ko'rish"
                >
                  <Eye size={18} />
                </button>

                <button
                  onClick={() => handleViewExpandedAdmin(u)}
                  className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors duration-200"
                  title="To'liq ma'lumotlarni ko'rish"
                >
                  <ChevronDown size={18} />
                </button>

                <button
                  onClick={() => handleOpenEditModal(u)}
                  className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors duration-200"
                  title="Adminni tahrirlash"
                >
                  <Edit2 size={18} />
                </button>

                <button
                  onClick={() => handleDeleteAdmin(u)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                  title="Adminni o'chirish"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* UPDATE ADMIN FORM MODAL */}
      {showUpdateForm && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-pink-400 to-red-400 p-6 text-white flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✏️</span>
                <h2 className="text-xl font-bold">Foydalanuvchini tahrirlash</h2>
              </div>
              <button
                onClick={() => setShowUpdateForm(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6">
              <UpdateAdminForm
                admin={selectedAdmin}
                onSuccess={() => setShowUpdateForm(false)}
                onCancel={() => setShowUpdateForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {showDetailModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedAdmin.first_name.charAt(0)}
                  {selectedAdmin.last_name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold">Tafsilotlar</h2>
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
              {/* PERSONAL INFO */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-3">Shaxsiy ma'lumotlar</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-blue-700">Ismi:</span>
                    <span className="text-sm font-semibold text-blue-900">
                      {selectedAdmin.first_name} {selectedAdmin.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-blue-700">Telefon:</span>
                    <span className="text-sm font-semibold text-blue-900">
                      {selectedAdmin.phone_number || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-blue-700">Holati:</span>
                    <span
                      className={`text-sm font-semibold ${
                        selectedAdmin.isloggedin ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {selectedAdmin.isloggedin ? "✓ Faol" : "⊘ Oflayn"}
                    </span>
                  </div>
                </div>
              </div>

              {/* WORK INFO */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-purple-900 mb-3">Ish ma'lumotlari</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-purple-700">Boshlanish sanasi:</span>
                    <span className="text-sm font-semibold text-purple-900">
                      {selectedAdmin.work_start
                        ? new Date(selectedAdmin.work_start).toLocaleDateString("uz-UZ", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-purple-700">Tugatish sanasi:</span>
                    <span className="text-sm font-semibold text-purple-900">
                      {selectedAdmin.work_end
                        ? new Date(selectedAdmin.work_end).toLocaleDateString("uz-UZ", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* FINANCIAL INFO */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-green-900 mb-3">Moliyaviy ma'lumotlar</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-green-700">Maosh:</span>
                    <span className="text-sm font-semibold text-green-900">
                      {selectedAdmin.salary > 0 ? `${selectedAdmin.salary.toLocaleString()} so'm` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-green-700">Bu oy to'landi:</span>
                    <span
                      className={`text-sm font-semibold ${
                        selectedAdmin.ispaidthismonth ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {selectedAdmin.ispaidthismonth ? "✓ Ha" : "✗ Yo'q"}
                    </span>
                  </div>
                </div>
              </div>

              {/* PERMISSIONS */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-orange-900 mb-3">
                  Ruxsatlar ({selectedAdmin.permissions.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedAdmin.permissions.length === 0 ? (
                    <p className="text-sm text-orange-600 italic">Ruxsatlar yo'q</p>
                  ) : (
                    selectedAdmin.permissions.map((perm) => (
                      <span key={perm} className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
                        {perm}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2 justify-between sticky bottom-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Yopish
              </button>
              <button
                onClick={() => handleViewExpandedAdmin(selectedAdmin)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
              >
                <ChevronDown size={18} /> To'liq ma'lumotlarni ko'rish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED FULL VIEW MODAL */}
      {showExpandedModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {selectedAdmin.first_name.charAt(0)}
                  {selectedAdmin.last_name.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold">To'liq profil</h2>
              </div>
              <button
                onClick={() => setShowExpandedModal(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={28} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6 space-y-6">
              {/* PERSONAL INFO */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Shaxsiy ma'lumotlar</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1">Ismi</p>
                    <p className="text-xl font-bold text-blue-900">{selectedAdmin.first_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1">Familiyasi</p>
                    <p className="text-xl font-bold text-blue-900">{selectedAdmin.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1">Telefon raqami</p>
                    <p className="text-lg font-semibold text-blue-900">{selectedAdmin.phone_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1">Holati</p>
                    <p
                      className={`text-lg font-bold ${
                        selectedAdmin.isloggedin ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {selectedAdmin.isloggedin ? "✓ Faol" : "⊘ Oflayn"}
                    </p>
                  </div>
                </div>
              </div>

              {/* WORK INFORMATION */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-5">
                <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} /> Ish ma'lumotlari
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-purple-700 mb-1">Ish boshlanish sanasi</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {selectedAdmin.work_start
                        ? new Date(selectedAdmin.work_start).toLocaleDateString("uz-UZ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-700 mb-1">Ish tugatish sanasi</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {selectedAdmin.work_end
                        ? new Date(selectedAdmin.work_end).toLocaleDateString("uz-UZ", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-700 mb-1">Filial</p>
                    <p className="text-lg font-semibold text-purple-900">{selectedAdmin.branch || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-700 mb-1">Dukan ID</p>
                    <p className="text-lg font-mono text-purple-900">{selectedAdmin.shop_id || "—"}</p>
                  </div>
                </div>
              </div>

              {/* FINANCIAL INFORMATION */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-5">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} /> Moliyaviy ma'lumotlar
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Maosh</p>
                    <p className="text-2xl font-bold text-green-900">{selectedAdmin.salary > 0 ? `${selectedAdmin.salary.toLocaleString()} so'm` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Jami savdolar</p>
                    <p className="text-2xl font-bold text-green-900">{selectedAdmin.sales > 0 ? `${selectedAdmin.sales.toLocaleString()} so'm` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Xarajatlar</p>
                    <p className="text-lg font-semibold text-green-900">{selectedAdmin.expenses > 0 ? `${selectedAdmin.expenses.toLocaleString()} so'm` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Bonuslar</p>
                    <p className="text-lg font-semibold text-green-900">{selectedAdmin.bonuses > 0 ? `${selectedAdmin.bonuses.toLocaleString()} so'm` : "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-green-700 mb-1">Bu oy to'landi</p>
                    <p
                      className={`text-lg font-bold ${
                        selectedAdmin.ispaidthismonth ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {selectedAdmin.ispaidthismonth ? "✓ To'landi" : "✗ To'lanmadi"}
                    </p>
                  </div>
                </div>
              </div>

              {/* PERMISSIONS */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-5">
                <h3 className="text-lg font-bold text-orange-900 mb-4">
                  Belgilangan ruxsatlar ({selectedAdmin.permissions.length})
                </h3>
                <div className="flex flex-wrap gap-3 mb-4">
                  {selectedAdmin.permissions.length === 0 ? (
                    <p className="text-lg text-orange-600 italic">Ruxsatlar belgilanmadi</p>
                  ) : (
                    selectedAdmin.permissions.map((perm) => (
                      <div
                        key={perm}
                        className="flex items-center gap-2 bg-orange-200 text-orange-900 px-3 py-1.5 rounded-full text-sm font-medium"
                      >
                        <span>{perm}</span>
                        <button
                          onClick={() => removeAdminPermission(selectedAdmin, perm)}
                          className="text-orange-900 hover:text-red-600 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* YANGI RUXSAT QO'SHISH */}
                <div className="pt-4 border-t border-orange-300">
                  <label className="block text-sm font-medium text-orange-900 mb-2">Yangi ruxsat qo'shish</label>
                  <select
                    className="w-full border border-orange-300 p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        addAdminPermission(selectedAdmin, e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Ruxsatni tanlang
                    </option>
                    {permissions
                      .filter((p) => !selectedAdmin.permissions.includes(p.name))
                      .map((p, idx) => (
                        <option key={idx} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* SYSTEM INFORMATION */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tizim ma'lumotlari</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-3 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">ID:</span>
                    <span className="font-mono text-gray-900 font-semibold">{selectedAdmin.id}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">UUID:</span>
                    <span className="font-mono text-gray-900 break-all text-right max-w-xs font-semibold">
                      {selectedAdmin.uuid || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">Yaratilgan:</span>
                    <span className="font-mono text-gray-900 font-semibold">
                      {new Date(selectedAdmin.createdat).toLocaleString("uz-UZ")}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-300">
                    <span className="text-gray-600 font-medium">Yangilangan:</span>
                    <span className="font-mono text-gray-900 font-semibold">
                      {new Date(selectedAdmin.updatedat).toLocaleString("uz-UZ")}
                    </span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-600 font-medium">Parol:</span>
                    <span className="font-mono text-gray-900 font-semibold">
                      {selectedAdmin.password ? "●●●●●●●●" : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* PROFILE IMAGE */}
              {selectedAdmin.img_url && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <p className="text-sm font-bold text-gray-700 mb-3">Profil rasmi</p>
                  <img
                    src={selectedAdmin.img_url}
                    alt={`${selectedAdmin.first_name} ${selectedAdmin.last_name}`}
                    className="w-full h-64 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>

            {/* MODAL ACTIONS */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-2 justify-end sticky bottom-0 flex-wrap">
              <button
                onClick={() => setShowExpandedModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                Yopish
              </button>
              <button
                onClick={() => {
                  setShowExpandedModal(false);
                  handleOpenEditModal(selectedAdmin);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium flex items-center gap-2"
              >
                <Edit2 size={18} /> Tahrirlash
              </button>
              <button
                onClick={() => handleDeleteAdmin(selectedAdmin)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
              >
                <Trash2 size={18} /> O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}