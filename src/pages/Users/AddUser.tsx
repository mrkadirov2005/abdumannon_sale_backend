import { useState } from "react";
import { Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { addShopAdminsThunk } from "../../redux/slices/admins/thunks/addAdminThunk";
import { type AppDispatch } from "../../redux/store";
import { CloseAdminModal } from "../../redux/slices/admins/adminsReducer";
import { ModalCodes } from "../../config/modals";
import { Close } from "@mui/icons-material";
import { getAuthFromStore, getBranchesFromStore } from "../../redux/selectors";

interface Permission {
  name: string;
}

interface Props {
  permissionsList: Permission[] | Error | number;
  token: string | null;
}

export interface SendableAddAdminData {
  uuid: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  password: string;
  work_start?: string | null;
  work_end?: string | null;
  salary: number;
  permissions: string[];
  shop_id: string | number | readonly string[] | undefined;
  branch: number | ""; // allow empty string for default
}

export default function CreateAdminForm({ permissionsList, token }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const authData = useSelector(getAuthFromStore);
  const branches = useSelector(getBranchesFromStore).branches;

  const [form, setForm] = useState<SendableAddAdminData>({
    uuid: `${Math.random()}`,
    first_name: "",
    last_name: "",
    phone_number: "",
    password: "",
    work_start: null,
    work_end: null,
    salary: 0,
    permissions: [],
    // @ts-ignore
    shop_id: authData.user?.shop_id,
    branch: branches.length > 0 ? branches[0].id : "", // default first branch or empty
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // -------------------------
  // Handle input change
  // -------------------------
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "salary" ? Number(value) : value,
    }));
  }

  // -------------------------
  // Add permission
  // -------------------------
  function handleAddPermission(permission: string) {
    if (!permission) return;
    if (selectedPermissions.includes(permission)) return;

    setSelectedPermissions((prev) => [...prev, permission]);
  }

  // -------------------------
  // Remove permission
  // -------------------------
  function handleRemovePermission(permission: string) {
    setSelectedPermissions((prev) => prev.filter((p) => p !== permission));
  }

  // -------------------------
  // Submit (CORRECTED)
  // -------------------------
  function handleSubmit() {
    const payload: SendableAddAdminData = {
      ...form,
      permissions: selectedPermissions,
    };

    dispatch(addShopAdminsThunk({ token, admin: payload }));
    // dispatch(CloseAdminModal(ModalCodes.admin.add_admin))
  }

  return (
    <div className="p-6 bg-white rounded shadow max-w-xl mx-auto">
      <div className="flex justify-between pb-3 items-center">
        <h1 className="font-bold text-2xl">Create Admin</h1>
        <button
          onClick={() => dispatch(CloseAdminModal(ModalCodes.admin.add_admin))}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-blue-700"
        >
          <Close color="action"></Close>
        </button>
      </div>

      {/* UUID */}
      {/* You can add UUID display here if needed */}

      {/* FIRST NAME */}
      <input
        name="first_name"
        placeholder="First name"
        value={form.first_name}
        onChange={handleChange}
        className="border p-2 rounded w-full mb-3"
      />

      {/* LAST NAME */}
      <input
        name="last_name"
        placeholder="Last name"
        value={form.last_name}
        onChange={handleChange}
        className="border p-2 rounded w-full mb-3"
      />

      {/* PHONE NUMBER */}
      <input
        name="phone_number"
        placeholder="Phone number"
        value={form.phone_number}
        onChange={handleChange}
        className="border p-2 rounded w-full mb-3"
      />

      {/* PASSWORD */}
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        className="border p-2 rounded w-full mb-3"
      />

      {/* WORK START */}
      <input
        name="work_start"
        placeholder="Work start (optional)"
        value={form.work_start ?? ""}
        onChange={handleChange}
        className="border p-2 rounded w-full mb-3"
      />

      {/* WORK END */}
      <input
        name="work_end"
        placeholder="Work end (optional)"
        value={form.work_end ?? ""}
        onChange={handleChange}
        className="border p-2 rounded w-full mb-3"
      />

      {/* SALARY */}
      <input
        name="salary"
        type="number"
        placeholder="Salary"
        value={form.salary}
        onChange={handleChange}
        className="border p-2 rounded w-full mb-3"
      />

      {/* SHOP ID */}
      <input
        name="shop_id"
        placeholder="Shop ID"
        value={form.shop_id}
        readOnly
        onChange={handleChange}
        className="border p-2 rounded w-full mb-3"
      />

      {/* BRANCH SELECT */}
      <div className="mb-3">
        <label className="block mb-1 font-semibold">Branch</label>
        <select
          name="branch"
          value={form.branch}
          onChange={handleChange}
          className="border p-2 rounded w-full"
        >
          <option value="">Select a branch</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} — {branch.location}
            </option>
          ))}
        </select>
      </div>

      {/* PERMISSIONS */}
      <h2 className="text-lg font-semibold mt-4 mb-2">Permissions</h2>

      <select
        className="border p-2 rounded w-full mb-3"
        onChange={(e) => handleAddPermission(e.target.value)}
        value="" // Reset to default option after selection
      >
        <option value="">Select a permission</option>

        {Array.isArray(permissionsList) &&
          permissionsList.map((p, i) => (
            <option key={i} value={p.name}>
              {p.name}
            </option>
          ))}
      </select>

      {/* SELECTED PERMISSIONS */}
      <div className="flex flex-wrap gap-2">
        {selectedPermissions.map((p) => (
          <span
            key={p}
            className="px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-2"
          >
            {p}
            <button
              onClick={() => handleRemovePermission(p)}
              className="text-red-600"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* SUBMIT */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleSubmit}
        className="mt-4"
      >
        Create Admin
      </Button>
    </div>
  );
}
