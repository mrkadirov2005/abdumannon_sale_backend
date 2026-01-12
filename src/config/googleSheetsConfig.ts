/**
 * Google Sheets Configuration
 * 
 * Steps to setup:
 * 
 * 1. Create a Google Sheet:
 *    - Go to https://sheets.google.com
 *    - Create a new spreadsheet
 *    - Name it "Finance Management" (or any name)
 *    - Copy the Spreadsheet ID from the URL
 * 
 * 2. Set up Google Apps Script:
 *    - Go to Extensions > Apps Script
 *    - Copy the GoogleAppsScript.gs content into the editor
 *    - Replace "YOUR_SPREADSHEET_ID" with your actual spreadsheet ID
 *    - Save the project (name it "Finance API")
 * 
 * 3. Deploy as Web App:
 *    - Click "Deploy" > "New deployment"
 *    - Type: "Web app"
 *    - Execute as: Your Google account
 *    - Who has access: "Anyone"
 *    - Click "Deploy"
 *    - Copy the deployment URL
 * 
 * 4. Add the deployment URL below:
 */

export const GOOGLE_SHEETS_CONFIG = {
  // Replace with your Google Apps Script web app URL
  // Format: https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/userweb
  API_URL: "https://script.google.com/macros/s/AKfycbxF0CuwATBNjTOHIXPWOPxKZImnxviUejQVCLiWDN59V3kh94ZEPQkzbgrgaLmqe1Ks/exec",
  
  // Your Google Sheet ID (from the sheet URL)
  SPREADSHEET_ID: "1DNTIWTQg9dRO-d3dmJgNEJKQjZH-2X_WpncWSwH_G1I",
  
  // Sheet name (must match your Apps Script sheet name)
  SHEET_NAME: "Finance",
};

/**
 * Alternative method using Google Sheets API directly:
 * 
 * If you prefer to use the Google Sheets API:
 * 
 * 1. Enable Google Sheets API in Google Cloud Console
 * 2. Create OAuth 2.0 credentials
 * 3. Use the credentials in your React app
 * 4. Install @react-oauth/google package
 * 
 * But the Apps Script method above is simpler and requires no authentication setup
 */
