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
    
    // Colors for charts
    CHART_COLORS: {
        primary: '#1E3A5F',
        accent: '#00B4D8',
        success: '#06D6A0',
        warning: '#FFD166',
        danger: '#EF476F',
        purple: '#9B59B6',
        gray: '#6C757D'
    }
};

// Validate configuration
if (CONFIG.API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
    console.warn('⚠️ Please update CONFIG.API_URL in config.js with your Google Apps Script Web App URL');
}
