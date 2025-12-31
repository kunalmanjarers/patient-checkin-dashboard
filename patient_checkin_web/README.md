# Patient Check-in Dashboard - Web App

A complete patient check-in management system built with HTML, CSS, and JavaScript. This web app connects to Google Sheets via Google Apps Script for data storage.

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Google Forms   │────▶│   Google Sheets      │◀────│ Google Apps     │
│  (Patient       │     │   (Database)         │     │ Script (API)    │
│   Check-in)     │     │                      │     │                 │
└─────────────────┘     └──────────────────────┘     └────────┬────────┘
                                                              │
                                                              ▼
                                                     ┌─────────────────┐
                                                     │  HTML/CSS/JS    │
                                                     │  (Frontend)     │
                                                     │  GitHub Pages   │
                                                     │  or Netlify     │
                                                     └─────────────────┘
```

## 📋 Prerequisites

- Google Account
- Google Sheet with patient data (linked to Google Form)
- GitHub account (for GitHub Pages) OR Netlify account

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Set Up Google Apps Script Backend

1. **Open your Google Sheet** (the one linked to your patient form)

2. **Go to Extensions → Apps Script**

3. **Delete any existing code** and paste the contents of `google_apps_script/Code.gs`

4. **Update the SPREADSHEET_ID** on line 13:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```
   Find your spreadsheet ID in the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_ID/edit
   ```

5. **Update COUNSELORS list** (lines 22-32) with your actual counselors

6. **Update USERS** (lines 35-39) with your login credentials:
   ```javascript
   const USERS = {
     'admin': { password: 'your_secure_password', name: 'Administrator', role: 'admin' },
     'frontdesk': { password: 'another_password', name: 'Front Desk', role: 'staff' }
   };
   ```

7. **Save the project** (Ctrl+S or Cmd+S)

8. **Deploy as Web App**:
   - Click **Deploy** → **New deployment**
   - Click the gear icon ⚙️ next to "Select type" → Choose **Web app**
   - Set **Description**: "Patient Check-in API v1"
   - Set **Execute as**: "Me"
   - Set **Who has access**: "Anyone"
   - Click **Deploy**

9. **Authorize the app**:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" → "Go to [Project Name] (unsafe)"
   - Click "Allow"

10. **Copy the Web App URL** - It looks like:
    ```
    https://script.google.com/macros/s/AKfycb.../exec
    ```

### Step 2: Configure the Frontend

1. **Open `js/config.js`**

2. **Replace the API_URL** with your Google Apps Script Web App URL:
   ```javascript
   API_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
   ```

3. **Update COUNSELORS list** to match your Google Apps Script

### Step 3: Deploy to GitHub Pages (Option A)

1. **Create a new GitHub repository**:
   - Go to https://github.com/new
   - Name: `patient-checkin-dashboard`
   - Set to **Public**
   - Click "Create repository"

2. **Upload your files**:
   - Click "uploading an existing file"
   - Drag and drop all files:
     ```
     index.html
     css/styles.css
     js/config.js
     js/api.js
     js/app.js
     ```
   - Click "Commit changes"

3. **Enable GitHub Pages**:
   - Go to repository **Settings** → **Pages**
   - Under "Source", select **main** branch
   - Click **Save**
   - Wait 1-2 minutes for deployment

4. **Access your app**:
   ```
   https://YOUR_USERNAME.github.io/patient-checkin-dashboard/
   ```

### Step 3: Deploy to Netlify (Option B)

1. **Create a Netlify account** at https://netlify.com

2. **Create a new site**:
   - Click "Add new site" → "Deploy manually"
   - Drag and drop your project folder
   - OR connect to your GitHub repository

3. **Your site will be live** at:
   ```
   https://random-name-123.netlify.app
   ```

4. **Optional: Custom domain**:
   - Go to Site settings → Domain management
   - Add your custom domain

---

## 📁 File Structure

```
patient-checkin-dashboard/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── config.js           # Configuration (API URL, etc.)
│   ├── api.js              # API communication
│   └── app.js              # Main application logic
├── google_apps_script/
│   └── Code.gs             # Google Apps Script backend
└── README.md               # This file
```

---

## ⚙️ Configuration

### Google Apps Script Configuration

In `Code.gs`, update these values:

| Variable | Description |
|----------|-------------|
| `SPREADSHEET_ID` | Your Google Sheet ID |
| `STATUS_COLUMN` | Column number for Status (P = 16) |
| `PATIENT_ID_COLUMN` | Column number for Patient ID (Q = 17) |
| `COUNSELOR_COLUMN` | Column number for Assigned Counselor (R = 18) |
| `NOTES_COLUMN` | Column number for Notes (S = 19) |
| `COUNSELORS` | List of counselor names |
| `USERS` | Login credentials |

### Frontend Configuration

In `js/config.js`, update these values:

| Variable | Description |
|----------|-------------|
| `API_URL` | Your Google Apps Script Web App URL |
| `COUNSELORS` | Should match the list in Apps Script |

---

## 🔐 Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| frontdesk | desk123 | Staff |
| therapist | therapy123 | Therapist |

⚠️ **Change these in production!**

---

## 📊 Features

- ✅ Patient Queue Management
- ✅ Status Workflow (Waiting → Assigned → In Session → Completed/Cancelled)
- ✅ Counselor Assignment
- ✅ Cancellation with Reason
- ✅ Patient Search
- ✅ Visit History Tracking
- ✅ Analytics Dashboard
- ✅ Real-time Wait Time
- ✅ Responsive Design

---

## 🔧 Troubleshooting

### "Failed to load data" Error

1. Check that your API URL is correct in `config.js`
2. Verify the Google Apps Script is deployed as "Anyone can access"
3. Check browser console for specific errors (F12 → Console)

### CORS Errors

Google Apps Script should handle CORS automatically. If you see CORS errors:
1. Redeploy the Apps Script with a new version
2. Make sure "Execute as" is set to "Me"

### Data Not Updating

1. Click the "Refresh Data" button
2. Check that the Google Sheet has the correct column structure
3. Verify the form submission trigger is working

### Charts Not Showing

Make sure Chart.js is loading correctly. Check the browser console for errors.

---

## 🔄 Updating the Deployment

### Updating Frontend (GitHub Pages)

1. Make changes to your files
2. Commit and push to GitHub
3. Changes will be live in 1-2 minutes

### Updating Backend (Google Apps Script)

1. Open Apps Script from your Google Sheet
2. Make changes to the code
3. Click **Deploy** → **Manage deployments**
4. Click the pencil icon ✏️ on your deployment
5. Change **Version** to "New version"
6. Click **Deploy**

---

## 📞 Support

For issues related to:
- **Google Sheets/Forms**: Check Google's documentation
- **GitHub Pages**: See GitHub Pages documentation
- **Netlify**: See Netlify documentation

---

## 📝 License

This project is provided as-is for educational and healthcare administrative purposes.
