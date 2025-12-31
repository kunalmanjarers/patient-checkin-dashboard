/**
 * API Module - Handles all communication with Google Apps Script backend
 */

const API = {
    /**
     * Make API request to Google Apps Script
     */
    async request(action, params = {}) {
        try {
            const url = new URL(CONFIG.API_URL);
            url.searchParams.append('action', action);
            
            // Add all params to URL
            Object.keys(params).forEach(key => {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            });
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                redirect: 'follow'
            });
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('API Error:', error);
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
