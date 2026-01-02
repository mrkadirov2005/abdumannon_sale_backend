import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (method: string, details?: Record<string, any>) => void;
};

export default function PaymentModal({ isOpen, onClose, total, onConfirm }: Props) {
  const [method, setMethod] = useState("cash");
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Payment</h3>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="payment-method" className="block text-xs text-gray-500">Payment method</label>
            <select 
              id="payment-method"
              name="payment-method"
              value={method} 
              onChange={(e) => setMethod(e.target.value)} 
              className="w-full border px-3 py-2 rounded mt-1"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile Pay</option>
            </select>
          </div>

          {method === "card" && (
            <div className="space-y-2">
              <div>
                <label htmlFor="card-name" className="block text-xs text-gray-500">Name on card</label>
                <input 
                  id="card-name"
                  name="card-name"
                  type="text"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full border px-3 py-2 rounded" 
                />
              </div>
              <div>
                <label htmlFor="card-number" className="block text-xs text-gray-500">Card number</label>
                <input 
                  id="card-number"
                  name="card-number"
                  type="text"
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  className="w-full border px-3 py-2 rounded" 
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-lg font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)}</div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => onConfirm(method, { name, cardNumber })}
              className="flex-1 py-2 bg-green-600 text-white rounded"
            >
              Confirm Payment
            </button>

            <button onClick={onClose} className="py-2 px-4 border rounded">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
