/**
 * GOOGLE SHEETS CONFIGURATION - FILL THIS IN
 * 
 * To get your values:
 * 1. Spreadsheet ID: From your Google Sheet URL
 *    - URL: https://docs.google.com/spreadsheets/d/[COPY_THIS]/edit
 * 
 * 2. Deployment URL: From Google Apps Script deployment
 *    - Format: https://script.google.com/macros/d/[DEPLOYMENT_ID]/userweb
 */

// ==========================================
// ✅ CONFIGURATION - UPDATE THESE VALUES
// ==========================================

export const GOOGLE_SHEETS_CONFIG = {
  // 📌 Your Google Sheet ID
  // Example: "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p"
  SPREADSHEET_ID: "YOUR_SPREADSHEET_ID_HERE",

  // 📌 Your Google Apps Script Web App URL
  // Example: "https://script.google.com/macros/d/1A2B3C4D5E6F7G8H9/userweb"
  API_URL: "YOUR_DEPLOYMENT_URL_HERE",

  // Sheet name (usually "Finance")
  SHEET_NAME: "Finance",
};

// ==========================================
// 🔍 HOW TO GET YOUR VALUES
// ==========================================

/**
 * STEP 1: GET SPREADSHEET ID
 * 
 * 1. Open your Google Sheet
 * 2. Look at the URL in the browser
 * 3. Find the ID between /d/ and /edit
 * 
 * Example URL:
 * https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p/edit#gid=0
 *                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 *                                    THIS IS YOUR SPREADSHEET ID
 */

/**
 * STEP 2: GET DEPLOYMENT URL
 * 
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Click Deploy button (top right)
 * 4. If creating new:
 *    - Select Type: Web app
 *    - Execute as: Your account
 *    - Who has access: Anyone
 *    - Click Deploy
 * 5. Copy the URL from "Deployment" section
 * 
 * Example URL:
 * https://script.google.com/macros/d/1A2B3C4D5E6F7G8H9/userweb
 *                                   ^^^^^^^^^^^^^^^^
 *                                   YOUR DEPLOYMENT ID
 */

/**
 * STEP 3: PASTE THE VALUES ABOVE
 * 
 * Replace:
 * - YOUR_SPREADSHEET_ID_HERE → paste your Spreadsheet ID
 * - YOUR_DEPLOYMENT_URL_HERE → paste your full Deployment URL
 */

// ==========================================
// ✅ VERIFICATION CHECKLIST
// ==========================================

/**
 * ☐ Google Sheet created
 * ☐ Apps Script code deployed
 * ☐ Spreadsheet ID copied
 * ☐ Deployment URL copied
 * ☐ Values pasted in this file
 * ☐ React app restarted
 * ☐ Finance page loads without errors
 * ☐ Data appears in Google Sheet
 */
