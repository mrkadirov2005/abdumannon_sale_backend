import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { type Admin } from "../../../types/types";
import { updateShopAdminsThunk } from "../../redux/slices/admins/thunks/updateAdminThunk";
import { accessTokenFromStore } from "../../redux/selectors";
import type { AppDispatch } from "../../redux/store";
import { toast } from "react-toastify";

interface UpdateAdminFormProps {
  admin: Admin;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Helper function to safely parse dates
const parseDateString = (dateInput: any): string => {
  if (!dateInput) {
    return new Date().toISOString().split("T")[0];
  }
  
  try {
    const date = new Date(dateInput);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split("T")[0];
    }
    return date.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
};

export default function UpdateAdminForm({
  admin,
  onSuccess,
  onCancel,
}: UpdateAdminFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({
    first_name: admin.first_name || "",
    last_name: admin.last_name || "",
    phone_number: admin.phone_number || "",
    work_start: parseDateString(admin.work_start),
    work_end: admin.work_end ? parseDateString(admin.work_end) : null,
    salary: admin.salary || 0,
    isloggedin: admin.isloggedin || false,
    img_url: admin.img_url || "",
    branch: admin.branch || 0,
    ispaidthismonth: admin.ispaidthismonth || false,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const token = useSelector(accessTokenFromStore);
  const dispatch = useDispatch<AppDispatch>();

  // Update form when admin prop changes
  useEffect(() => {
    setFormData({
      first_name: admin.first_name || "",
      last_name: admin.last_name || "",
      phone_number: admin.phone_number || "",
      work_start: parseDateString(admin.work_start),
      work_end: admin.work_end ? parseDateString(admin.work_end) : null,
      salary: admin.salary || 0,
      isloggedin: admin.isloggedin || false,
      img_url: admin.img_url || "",
      branch: admin.branch || 0,
      ispaidthismonth: admin.ispaidthismonth || false,
    });
    setFormErrors({});
  }, [admin]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.first_name?.trim()) {
      errors.first_name = "Ism majburiy";
    }
    if (!formData.last_name?.trim()) {
      errors.last_name = "Familiya majburiy";
    }
    if (!formData.phone_number?.trim()) {
      errors.phone_number = "Telefon raqami majburiy";
    }
    if (!formData.work_start) {
      errors.work_start = "Ish boshlanish sanasi majburiy";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Merge updated data with existing admin data
      const updatedAdmin: Admin = {
        ...admin,
        first_name: formData.first_name || admin.first_name,
        last_name: formData.last_name || admin.last_name,
        phone_number: formData.phone_number || admin.phone_number,
        work_start: formData.work_start || admin.work_start,
        work_end: formData.work_end || admin.work_end,
        salary: formData.salary !== undefined ? formData.salary : admin.salary,
        isloggedin: formData.isloggedin !== undefined ? formData.isloggedin : admin.isloggedin,
        img_url: formData.img_url || admin.img_url,
        branch: formData.branch !== undefined ? formData.branch : admin.branch,
        ispaidthismonth: formData.ispaidthismonth !== undefined ? formData.ispaidthismonth : admin.ispaidthismonth,
      } as Admin;

      // Dispatch update to backend
      await dispatch(updateShopAdminsThunk({ token, admin: updatedAdmin })).unwrap();
      toast.success(`${formData.first_name} muvaffaqiyatli yangilandi!`);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(`Admin-ni yangilashda xato: ${error.message || error}`);
      console.error("Update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* FIRST NAME */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ismi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name || ""}
            onChange={handleFormChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
              formErrors.first_name
                ? "border-red-300 focus:ring-red-500 bg-red-50"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Ismini kiriting"
          />
          {formErrors.first_name && (
            <p className="text-xs text-red-600 mt-1">{formErrors.first_name}</p>
          )}
        </div>

        {/* LAST NAME */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Familiyasi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name || ""}
            onChange={handleFormChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
              formErrors.last_name
                ? "border-red-300 focus:ring-red-500 bg-red-50"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Familiyasini kiriting"
          />
          {formErrors.last_name && (
            <p className="text-xs text-red-600 mt-1">{formErrors.last_name}</p>
          )}
        </div>

        {/* PHONE NUMBER */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon raqami <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number || ""}
            onChange={handleFormChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
              formErrors.phone_number
                ? "border-red-300 focus:ring-red-500 bg-red-50"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="Telefon raqamini kiriting"
          />
          {formErrors.phone_number && (
            <p className="text-xs text-red-600 mt-1">{formErrors.phone_number}</p>
          )}
        </div>

        {/* WORK START DATE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ish boshlanish sanasi <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="work_start"
            value={formData.work_start || ""}
            onChange={handleFormChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
              formErrors.work_start
                ? "border-red-300 focus:ring-red-500 bg-red-50"
                : "border-gray-300 focus:ring-blue-500"
            }`}
          />
          {formErrors.work_start && (
            <p className="text-xs text-red-600 mt-1">{formErrors.work_start}</p>
          )}
        </div>

        {/* WORK END DATE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ish tugatish sanasi
          </label>
          <input
            type="date"
            name="work_end"
            value={formData.work_end || ""}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* SALARY */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maosh
          </label>
          <input
            type="number"
            name="salary"
            value={formData.salary || 0}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Maosh kiritish"
          />
        </div>

        {/* IMAGE URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profil rasmi URL-i
          </label>
          <input
            type="url"
            name="img_url"
            value={formData.img_url || ""}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* BRANCH */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filial ID
          </label>
          <input
            type="number"
            name="branch"
            value={formData.branch || 0}
            onChange={handleFormChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Filial ID raqamini kiriting"
          />
        </div>

        {/* ACTIVE STATUS */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <input
            type="checkbox"
            id="isloggedin"
            name="isloggedin"
            checked={formData.isloggedin || false}
            onChange={handleFormChange}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <label htmlFor="isloggedin" className="text-sm font-medium text-blue-900 cursor-pointer">
            Tizimda faol
          </label>
        </div>

        {/* PAID THIS MONTH */}
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <input
            type="checkbox"
            id="ispaidthismonth"
            name="ispaidthismonth"
            checked={formData.ispaidthismonth || false}
            onChange={handleFormChange}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <label htmlFor="ispaidthismonth" className="text-sm font-medium text-green-900 cursor-pointer">
            Bu oy maosh to'landi
          </label>
        </div>

        {/* FORM ACTIONS */}
        <div className="flex gap-2 justify-end pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Bekor qilish
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? "Saqlanmoqda..." : "Yangilash"}
          </button>
        </div>
      </form>
    </div>
  );
}
