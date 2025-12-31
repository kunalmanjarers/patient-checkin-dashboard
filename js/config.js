/**
 * Configuration file for Patient Check-in Dashboard
 * 
 * IMPORTANT: Update API_URL with your Google Apps Script Web App URL
 * after deploying the backend.
 */

const CONFIG = {
    // ============================================
    // UPDATE THIS URL AFTER DEPLOYING APPS SCRIPT!
    // ============================================
    API_URL: 'https://script.google.com/macros/s/AKfycbzLdmvxMdFaNVwJ8KbP900kz-6dTh8M-2aYjukgKrJOiWP5Qynb0EJ3CHv4X9AX4fU6GA/exec',
    
    // ============================================
    // DEBUG MODE - Set to true to see debug panel
    // ============================================
    DEBUG_MODE: true,
    
    // Refresh interval in milliseconds (2 minutes)
    REFRESH_INTERVAL: 120000,
    
    // Default date range for analytics (days)
    DEFAULT_ANALYTICS_DAYS: 30,
    
    // Counselors list (should match Google Apps Script)
    COUNSELORS: [
        "-- Select Counselor --",
        "Dr. Sarah Johnson",
        "Dr. Michael Chen",
        "Dr. Emily Rodriguez",
        "Dr. James Wilson",
        "Dr. Lisa Thompson",
        "Dr. Robert Garcia",
        "Maria Santos, LCSW",
        "John Davis, LPC",
        "Amanda White, LMFT"
    ],
    
    // Status options
    STATUSES: ['Waiting', 'Assigned', 'In Session', 'Completed', 'Cancelled'],
    
    // Colors for charts - Project Reality Brand
    CHART_COLORS: {
        primary: '#2D8B6F',      // PR Green
        primaryDark: '#1E6B52',  // PR Green Dark
        accent: '#3B7DD8',       // PR Blue
        purple: '#7C5DC7',       // PR Purple
        success: '#10B981',      // Green
        warning: '#F59E0B',      // Amber
        danger: '#EF4444',       // Red
        gray: '#6B7280'          // Gray
    }
};

// Validate configuration
if (CONFIG.API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    console.error('❌ ERROR: Please update CONFIG.API_URL in config.js with your Google Apps Script Web App URL');
    alert('⚠️ Configuration Error!\n\nPlease update the API_URL in js/config.js with your Google Apps Script Web App URL.\n\nSee the debug panel for more info.');
}
