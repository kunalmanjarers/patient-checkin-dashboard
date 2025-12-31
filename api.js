/**
 * API Module - Handles all communication with Google Apps Script backend
 */

// Debug logger
function debugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`, data || '');
    
    if (CONFIG.DEBUG_MODE && typeof addDebugLog === 'function') {
        addDebugLog(message, data);
    }
}

const API = {
    /**
     * Make API request to Google Apps Script
     */
    async request(action, params = {}) {
        const startTime = Date.now();
        debugLog(`🚀 API Request: ${action}`, params);
        
        // Check if API URL is configured
        if (!CONFIG.API_URL || CONFIG.API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
            const error = 'API URL not configured. Please update CONFIG.API_URL in js/config.js';
            debugLog(`❌ ${error}`);
            return { success: false, error: error };
        }
        
        try {
            const url = new URL(CONFIG.API_URL);
            url.searchParams.append('action', action);
            
            // Add all params to URL
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });
            
            debugLog(`📡 Fetching: ${url.toString().substring(0, 100)}...`);
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                redirect: 'follow'
            });
            
            debugLog(`📥 Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            debugLog(`📄 Raw response (first 500 chars): ${text.substring(0, 500)}`);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                debugLog(`❌ JSON Parse Error: ${parseError.message}`);
                debugLog(`📄 Full response text: ${text}`);
                return { success: false, error: `Invalid JSON response: ${parseError.message}` };
            }
            
            const elapsed = Date.now() - startTime;
            debugLog(`✅ API Success: ${action} (${elapsed}ms)`, data);
            
            return data;
            
        } catch (error) {
            const elapsed = Date.now() - startTime;
            debugLog(`❌ API Error (${elapsed}ms): ${error.message}`);
            
            // Provide more helpful error messages
            let userMessage = error.message;
            if (error.message.includes('Failed to fetch')) {
                userMessage = 'Network error. Possible causes:\n' +
                    '1. API URL is incorrect\n' +
                    '2. Google Apps Script is not deployed\n' +
                    '3. CORS issue - make sure "Who has access" is set to "Anyone"';
            }
            
            return { success: false, error: userMessage };
        }
    },
    
    /**
     * Test API connection
     */
    async testConnection() {
        debugLog('🔧 Testing API connection...');
        
        if (!CONFIG.API_URL || CONFIG.API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE') {
            return { 
                success: false, 
                error: 'API URL not configured',
                help: 'Update CONFIG.API_URL in js/config.js with your Google Apps Script Web App URL'
            };
        }
        
        try {
            const result = await this.request('getCounselors');
            if (result.success) {
                debugLog('✅ API connection successful!', result);
                return { success: true, message: 'API connection working!', data: result };
            } else {
                return { success: false, error: result.error };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Login user
     */
    async login(username, password) {
        return this.request('login', { username, password });
    },
    
    /**
     * Get today's check-ins
     */
    async getTodaysCheckins() {
        return this.request('getTodaysCheckins');
    },
    
    /**
     * Get all patients (unique)
     */
    async getAllPatients() {
        return this.request('getAllPatients');
    },
    
    /**
     * Get patient history
     */
    async getPatientHistory(patientId) {
        return this.request('getPatientHistory', { patientId });
    },
    
    /**
     * Search patients
     */
    async searchPatients(term) {
        return this.request('searchPatients', { term });
    },
    
    /**
     * Update patient status
     */
    async updateStatus(row, status) {
        return this.request('updateStatus', { row, status });
    },
    
    /**
     * Assign counselor to patient
     */
    async assignCounselor(row, counselor) {
        return this.request('assignCounselor', { row, counselor });
    },
    
    /**
     * Save notes for a patient visit
     */
    async saveNotes(row, notes) {
        return this.request('saveNotes', { row, notes });
    },
    
    /**
     * Get analytics data
     */
    async getAnalytics(days = 30) {
        return this.request('getAnalytics', { days });
    },
    
    /**
     * Get counselors list
     */
    async getCounselors() {
        return this.request('getCounselors');
    }
};
