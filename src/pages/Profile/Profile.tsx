import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  accessTokenFromStore,
  getUserFromStore,
  getshopidfromstrore,
} from "../../redux/selectors";
import type { Admin, SuperUser } from "../../../types/types";
import { FiUser, FiPhone, FiMail, FiCalendar, FiDollarSign, FiTrendingUp, FiShoppingBag, FiCheck, FiSave } from "react-icons/fi";
import { updateGeneralSettings } from "../../redux/slices/settings/settingsSlice";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";

export default function Profile() {
  const dispatch = useDispatch();
  const user = useSelector(getUserFromStore);
  const shop_id = useSelector(getshopidfromstrore);
  const isSuperAdmin = useSelector((state: RootState) => state.auth.isSuperAdmin);
  const shopSettings = useSelector((state: RootState) => state.settings.general);

  const [activeTab, setActiveTab] = useState<"profile" | "shop">("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });

  // Shop settings state
  const [storeName, setStoreName] = useState(shopSettings.storeName);
  const [currency, setCurrency] = useState(shopSettings.currency);
  const [timezone, setTimezone] = useState(shopSettings.timezone);
  const [dateFormat, setDateFormat] = useState(shopSettings.dateFormat);
  const [isSavingShop, setIsSavingShop] = useState(false);
  const [showShopSuccess, setShowShopSuccess] = useState(false);

  const token=useSelector(accessTokenFromStore)
  useEffect(() => {
    if (user) {
      const admin = user as Admin;
      const superUser = user as SuperUser;
      
      // Handle both Admin and SuperUser types
      setFormData({
        firstName: admin.first_name || superUser.name || "",
        lastName: admin.last_name || superUser.lastname || "",
        phoneNumber: admin.phone_number || superUser.phonenumber || "",
        email: superUser.email || "",
      });
    }
    
    // If user is not super admin and somehow on shop tab, switch to profile
    if (!isSuperAdmin && activeTab === "shop") {
      setActiveTab("profile");
    }
  }, [user, isSuperAdmin, activeTab]);

  useEffect(() => {
    setStoreName(shopSettings.storeName);
    setCurrency(shopSettings.currency);
    setTimezone(shopSettings.timezone);
    setDateFormat(shopSettings.dateFormat);
  }, [shopSettings]);

  const handleSaveShop = async () => {
    setIsSavingShop(true);
    try {
      // Get the authorization token from localStorage or your auth state
      ; // Adjust based on where you store your token
      
      const response = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.shop.update}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": `${token}` , 
          "uuid": shop_id ?? "",
        },
        body: JSON.stringify({
          id: shop_id, // Shop ID from Redux store
          name: storeName, // Updated store name
          
        }),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch(updateGeneralSettings({
          storeName,
          currency,
          timezone,
          dateFormat,
        }));
        setIsSavingShop(false);
        setShowShopSuccess(true);
        setTimeout(() => setShowShopSuccess(false), 3000);
      } else {
        setIsSavingShop(false);
        alert(data.message || "Failed to update shop");
      }
    } catch (err) {
      console.error("Error updating shop:", err);
      setIsSavingShop(false);
      alert("Server error while updating shop");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    // TODO: Add API call to update user profile
    // For now, just show success message
    alert("Profile update functionality will be added when API is ready");
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      const admin = user as Admin;
      const superUser = user as SuperUser;
      setFormData({
        firstName: admin.first_name || superUser.name || "",
        lastName: admin.last_name || superUser.lastname || "",
        phoneNumber: admin.phone_number || superUser.phonenumber || "",
        email: superUser.email || "",
      });
    }
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No user data available. Please login again.</p>
        </div>
      </div>
    );
  }

  const admin = user as Admin;
  const superUser = user as SuperUser;
  const displayName = 
    `${admin.first_name || superUser.name || ""} ${admin.last_name || superUser.lastname || ""}`.trim() ||
    superUser.name ||
    admin.uuid ||
    superUser.uuid ||
    "User";

  const displayPhone = admin.phone_number || superUser.phonenumber || admin.uuid || superUser.uuid || "N/A";
  const displayEmail = superUser.email || "N/A";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiUser className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
          </div>
          <p className="text-gray-600 ml-12">Manage your profile and shop information</p>
        </header>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === "profile"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Profile
              </button>
              {isSuperAdmin && (
                <button
                  onClick={() => setActiveTab("shop")}
                  className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === "shop"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FiShoppingBag className="w-4 h-4" />
                    Shop Settings
                  </span>
                </button>
              )}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 pt-8">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-white/20">
                      {admin.img_url || superUser.img_url ? (
                        <img
                          src={admin.img_url || superUser.img_url || ""}
                          alt="Profile"
                          className="w-28 h-28 rounded-full object-cover"
                        />
                      ) : (
                        <FiUser className="w-16 h-16 text-blue-600" />
                      )}
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                        title="Edit Profile"
                      >
                        <FiUser className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{displayName}</h2>
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                    <p className="text-sm font-medium text-white">
                      {isSuperAdmin ? "Super Admin" : "Admin"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats for Admin */}
              {!isSuperAdmin && admin && (
                <div className="p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    Performance
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <FiDollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Salary</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(admin.salary || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FiTrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Total Sales</p>
                          <p className="text-sm font-semibold text-gray-900">{admin.sales || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FiDollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Bonuses</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(admin.bonuses || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Profile Details or Shop Settings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 lg:p-8">
                {activeTab === "profile" ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Personal Information</h3>
                        <p className="text-sm text-gray-500 mt-1">Manage your account details</p>
                      </div>
                    </div>

                <div className="space-y-6">
                  {/* First Name / Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {isSuperAdmin ? "Name" : "First Name"}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder={isSuperAdmin ? "Enter name" : "Enter first name"}
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <FiUser className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">{formData.firstName || "Not set"}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Name / Lastname */}
                  {!isSuperAdmin && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter last name"
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                          <FiUser className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900">{formData.lastName || "Not set"}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <FiPhone className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">{displayPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Email (SuperUser only) */}
                  {isSuperAdmin && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter email"
                        />
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                          <FiMail className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900">{displayEmail}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-6"></div>

                  {/* Read-only Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                      Account Information
                    </h4>

                    {/* User ID */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        User ID
                      </label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="font-mono text-sm text-gray-600">
                          {admin.id || superUser.id || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* UUID */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        User ID (UUID)
                      </label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <FiUser className="text-gray-400 flex-shrink-0" />
                        <span className="font-mono text-sm text-gray-600 break-all">
                          {admin.uuid || superUser.uuid || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Shop Name (SuperUser only) */}
                    {isSuperAdmin && (superUser.shopname || "N/A") && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Shop Name
                        </label>
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                          <FiShoppingBag className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900">{superUser.shopname || "N/A"}</span>
                        </div>
                      </div>
                    )}

                    {/* Shop ID */}
                    {shop_id && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Shop ID
                        </label>
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="font-mono text-sm text-gray-600">{shop_id}</span>
                        </div>
                      </div>
                    )}

                    {/* Image URL */}
                    {(admin.img_url || superUser.img_url) && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Profile Image URL
                        </label>
                        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="font-mono text-sm text-gray-600 break-all">
                            {admin.img_url || superUser.img_url || "N/A"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Login Status */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Login Status
                      </label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className={`w-2 h-2 rounded-full ${superUser.isloggedin ? "bg-green-500" : "bg-red-500"}`}></div>
                        <span className="text-gray-900">
                          {superUser.isloggedin ? "Logged In" : "Logged Out"}
                        </span>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Member Since
                      </label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <FiCalendar className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">
                          {admin.createdat || superUser.createdat
                            ? new Date(admin.createdat || superUser.createdat || "").toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Updated Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Updated
                      </label>
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                        <FiCalendar className="text-gray-400 flex-shrink-0" />
                        <span className="text-gray-900">
                          {admin.updatedat || superUser.updatedat
                            ? new Date(admin.updatedat || superUser.updatedat || "").toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="mt-8 pt-6 border-t border-gray-200 flex gap-3">
                        <button
                          onClick={handleSave}
                          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-sm"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Shop Settings</h3>
                      <p className="text-gray-600">Configure your store's basic information and preferences</p>
                    </div>

                    <div className="space-y-6">
                      {/* Store Name */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <FiShoppingBag className="w-4 h-4" />
                          Store Name
                        </label>
                        <input
                          type="text"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter your store name"
                        />
                        <p className="text-xs text-gray-500">This name will appear in invoices and receipts</p>
                      </div>

                      {/* Currency */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <FiDollarSign className="w-4 h-4" />
                          Default Currency
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                        >
                          <option value="USD">USD - US Dollar ($)</option>
                          <option value="UZS">UZS - Uzbekistani Som (so'm)</option>
                          <option value="EUR">EUR - Euro (€)</option>
                          <option value="GBP">GBP - British Pound (£)</option>
                        </select>
                        <p className="text-xs text-gray-500">All prices will be displayed in this currency</p>
                      </div>

                      {/* Timezone */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Timezone
                        </label>
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                          <option value="Asia/Tashkent">Asia/Tashkent</option>
                        </select>
                      </div>

                      {/* Date Format */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Date Format
                        </label>
                        <select
                          value={dateFormat}
                          onChange={(e) => setDateFormat(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      {/* Save Button */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleSaveShop}
                            disabled={isSavingShop}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSavingShop ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Saving...</span>
                              </>
                            ) : showShopSuccess ? (
                              <>
                                <FiCheck className="w-4 h-4" />
                                <span>Saved!</span>
                              </>
                            ) : (
                              <>
                                <FiSave className="w-4 h-4" />
                                <span>Save Changes</span>
                              </>
                            )}
                          </button>
                          {showShopSuccess && (
                            <span className="text-sm text-green-600 font-medium">Settings saved successfully!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

