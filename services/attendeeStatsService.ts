import axios from 'axios';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.seai.co";
const API_VERSION_PATH = "/api/v1";

// Storage keys from useAuth.tsx
const STORAGE_KEYS = {
  USER_ID: 'seai_user_id',
  ACCESS_TOKEN: 'seai_access_token',
  EMAIL: 'seai_email',
  AUTH_STATE: 'seai_auth_state'
};

// Helper function to get the authentication token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try to get the token directly from localStorage
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    // If not found, try to get from the auth state object
    if (!token) {
      const authStateStr = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      if (authStateStr) {
        try {
          const authState = JSON.parse(authStateStr);
          return authState.accessToken;
        } catch (e) {
          console.error('Error parsing auth state:', e);
        }
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to get auth headers
const getAuthHeaders = (token: string | null) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Interface for API parameters
export interface AttendeeStatsApiParams {
  trainingCenterId: string;
  attendeeId: string;
}

// Interface for attendee stats response
export interface AttendeeStatsResponse {
  coursesCount: number;
  waitlistCount: number;
}

/**
 * Get course count for a specific attendee
 */
export async function getAttendeeCoursesCount({ 
  trainingCenterId, 
  attendeeId 
}: AttendeeStatsApiParams): Promise<number> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    // In a real implementation, this would be an actual API endpoint
    // For now, we'll simulate with a more realistic but still fixed response
    // In production, replace this with an actual API call
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return 1 for demonstration purposes
    return 1;
  } catch (error) {
    console.error("Error fetching attendee courses count:", error);
    return 0;
  }
}

/**
 * Get waitlist count for a specific attendee
 */
export async function getAttendeeWaitlistCount({ 
  trainingCenterId, 
  attendeeId 
}: AttendeeStatsApiParams): Promise<number> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    // In a real implementation, this would be an actual API endpoint
    // For now, we'll simulate with a more realistic but still fixed response
    // In production, replace this with an actual API call
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return 2 for demonstration purposes
    return 2;
  } catch (error) {
    console.error("Error fetching attendee waitlist count:", error);
    return 0;
  }
}

/**
 * Get both course and waitlist counts for a specific attendee in one call
 */
export async function getAttendeeStats({ 
  trainingCenterId, 
  attendeeId 
}: AttendeeStatsApiParams): Promise<AttendeeStatsResponse> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    // In a real implementation, this would be an actual API endpoint
    // For now, we'll simulate with a more realistic but still fixed response
    // In production, replace this with an actual API call
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Return fixed counts for demonstration purposes
    return {
      coursesCount: 1,
      waitlistCount: 2
    };
  } catch (error) {
    console.error("Error fetching attendee stats:", error);
    return {
      coursesCount: 0,
      waitlistCount: 0
    };
  }
}
