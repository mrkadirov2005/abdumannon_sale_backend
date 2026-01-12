import { GOOGLE_SHEETS_CONFIG } from "../config/googleSheetsConfig";

interface PaymentRecord {
  id: string;
  amount: number;
  description: string;
  paid_at: string;
}

interface PersonFinance {
  person_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payments: PaymentRecord[];
  wagons: any[];
  indicator: "debt_taken" | "debt_given" | "none";
  created_at?: string;
  updated_at?: string;
}

export const googleSheetsService = {
  /**
   * Fetch all finance records from Google Sheets
   */
  async getFinanceRecords(): Promise<PersonFinance[]> {
    try {
      const url = `${GOOGLE_SHEETS_CONFIG.API_URL}?action=getRecords`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        return data.data || [];
      } else {
        console.error("Failed to fetch records:", data.message);
        return [];
      }
    } catch (error) {
      console.error("Error fetching finance records:", error);
      return [];
    }
  },

  /**
   * Save or update a finance record in Google Sheets
   */
  async saveFinanceRecord(record: PersonFinance): Promise<boolean> {
    try {
      const response = await fetch(GOOGLE_SHEETS_CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "saveRecord",
          ...record,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Record saved successfully");
        return true;
      } else {
        console.error("Failed to save record:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Error saving finance record:", error);
      return false;
    }
  },

  /**
   * Add a payment to an existing finance record
   */
  async addPayment(
    personName: string,
    payment: PaymentRecord
  ): Promise<boolean> {
    try {
      const response = await fetch(GOOGLE_SHEETS_CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "addPayment",
          personName,
          payment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Payment added successfully");
        return true;
      } else {
        console.error("Failed to add payment:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      return false;
    }
  },

  /**
   * Delete a finance record from Google Sheets
   */
  async deleteFinanceRecord(personName: string): Promise<boolean> {
    try {
      const response = await fetch(GOOGLE_SHEETS_CONFIG.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "deleteRecord",
          personName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Record deleted successfully");
        return true;
      } else {
        console.error("Failed to delete record:", data.message);
        return false;
      }
    } catch (error) {
      console.error("Error deleting finance record:", error);
      return false;
    }
  },
};
