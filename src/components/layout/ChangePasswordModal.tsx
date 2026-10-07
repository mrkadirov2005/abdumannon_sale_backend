import { useState, type FormEvent } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { accessTokenFromStore } from "../../redux/selectors";
import { DEFAULT_ENDPOINT, ENDPOINTS } from "../../config/endpoints";

const MIN_PASSWORD_LENGTH = 6;

const emptyForm = { current: "", next: "", repeat: "" };

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const accessToken = useSelector(accessTokenFromStore);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    if (form.next.length < MIN_PASSWORD_LENGTH) {
      setError(`Новый пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (form.next !== form.repeat) {
      setError("Новые пароли не совпадают");
      return;
    }
    if (form.next === form.current) {
      setError("Новый пароль должен отличаться от текущего");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${DEFAULT_ENDPOINT}${ENDPOINTS.auth.changePassword}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: accessToken ?? "",
        },
        body: JSON.stringify({ current_password: form.current, new_password: form.next }),
      });
      const result = await res.json().catch(() => null);

      if (!res.ok) {
        // Server messages are in Uzbek; show the common one in Russian
        setError(
          result?.message === "Joriy parol noto'g'ri"
            ? "Текущий пароль неверный"
            : result?.message || "Не удалось сменить пароль"
        );
        return;
      }

      toast.success("Пароль изменён");
      setForm(emptyForm);
      onClose();
    } catch {
      setError("Ошибка сети, попробуйте ещё раз");
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof emptyForm, label: string, autoComplete: string) => (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      <input
        type="password"
        required
        autoComplete={autoComplete}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden"
      >
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-bold text-gray-900">Сменить пароль</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {field("current", "Текущий пароль", "current-password")}
          {field("next", "Новый пароль", "new-password")}
          {field("repeat", "Повторите новый пароль", "new-password")}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}
