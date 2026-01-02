import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginAdmin, loginSuperUser } from "../../redux/slices/auth/thunks/aut_login";
import { setError } from "../../redux/slices/auth/authSlice";
import type { AppDispatch, RootState } from "../../redux/store";

export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<boolean>(true); // true = superuser, false = admin

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const submitter = role ? loginSuperUser : loginAdmin;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    dispatch(setError(null));

    const result = await dispatch(
      submitter({ name, password })
    );

    if (
      loginSuperUser.fulfilled.match(result) ||
      loginAdmin.fulfilled.match(result)
    ) {
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen flex gap-10 flex-col items-center justify-center bg-gray-50">
      
      <select
        value={role ? "superuser" : "admin"}
        onChange={(e) => setRole(e.target.value === "superuser")}
        className="absolute top-5 right-5 text-white font-bold outline-0 border-0 bg-orange-500 rounded-md px-3 py-1"
      >
        <option value="superuser">Superuser</option>
        <option value="admin">Admin</option>
      </select>

      <img className="w-20 h-20 rounded-full" src="/logo.png" alt="logo" />

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-gray-800 text-white p-6 rounded shadow"
      >
        <h1 className="text-2xl text-center mb-4">Log In</h1>

        {error && (
          <p className="text-red-600 text-sm mb-3">{error}</p>
        )}

        <label className="block mb-2 text-sm">Name</label>
        <input
          required
          disabled={isLoading}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-black px-3 py-2 border rounded mb-3"
          placeholder="Type your phone number or username"
        />

        <label className="block mb-2 text-sm">Password</label>
        <input
          type="password"
          required
          disabled={isLoading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full text-black px-3 py-2 border rounded mb-4"
          placeholder="********"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 bg-blue-600 text-white rounded"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="w-screen h-10 bg-orange-800 absolute bottom-0 flex items-center justify-center text-center text-white text-sm">
        <p>
          If you have any issues, please contact administrator by calling
          123467 or via Telegram @sdfsd
        </p>
      </div>
    </div>
  );
}
