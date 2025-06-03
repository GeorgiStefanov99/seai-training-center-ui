import axios from "axios";
import { WaitlistRecord, GetWaitlistRecordsResponse } from "@/types/course-template";

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

// Interface for API parameters
export interface WaitlistApiParams {
  trainingCenterId: string;
  waitlistRecordId?: string;
  courseTemplateId?: string;
  attendeeId?: string;
  timestamp?: number; // For cache busting
}

// Interface for new attendee request
export interface AttendeeRequest {
  name: string;
  surname: string;
  email: string;
  telephone: string;
  rank: string;
  remark?: {
    remarkText: string;
  };
}

// Interface for creating a waitlist record with a new attendee
export interface CreateWaitlistWithNewAttendeeRequest {
  attendeeRequest: AttendeeRequest;
  status?: string;
}

/**
 * Get all waitlist records for a training center
 */
export async function getWaitlistRecords({ trainingCenterId, timestamp }: WaitlistApiParams): Promise<WaitlistRecord[]> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    // Add timestamp as query parameter to prevent caching
    const url = `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/waitlist-records`;
    const params = timestamp ? { _t: timestamp } : {};
    
    const response = await axios.get<GetWaitlistRecordsResponse>(url, { 
      headers,
      params
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching waitlist records:", error);
    throw error;
  }
}

/**
 * Get waitlist records for a specific course template
 */
export async function getWaitlistRecordsByTemplate({ 
  trainingCenterId, 
  courseTemplateId 
}: WaitlistApiParams): Promise<WaitlistRecord[]> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    const response = await axios.get<GetWaitlistRecordsResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/waitlist-records/by-course-template/${courseTemplateId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching waitlist records by template:", error);
    throw error;
  }
}

/**
 * Get a specific waitlist record by ID
 */
export async function getWaitlistRecordById({ 
  trainingCenterId, 
  waitlistRecordId 
}: WaitlistApiParams): Promise<WaitlistRecord> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    const response = await axios.get<WaitlistRecord>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/waitlist-records/${waitlistRecordId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching waitlist record:", error);
    throw error;
  }
}

/**
 * Create a new waitlist record for a course template
 */
export async function createWaitlistRecord({ 
  trainingCenterId, 
  courseTemplateId 
}: WaitlistApiParams, data: any): Promise<WaitlistRecord> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    const response = await axios.post<WaitlistRecord>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/waitlist-records/course-templates/${courseTemplateId}`,
      data,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating waitlist record:", error);
    throw error;
  }
}

/**
 * Create a waitlist record for a specific attendee and course template
 */
export async function createWaitlistRecordForAttendee({ 
  trainingCenterId, 
  attendeeId,
  courseTemplateId 
}: WaitlistApiParams, data: any): Promise<WaitlistRecord> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    const response = await axios.post<WaitlistRecord>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/waitlist-records/attendees/${attendeeId}/course-templates/${courseTemplateId}`,
      data,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating waitlist record for attendee:", error);
    throw error;
  }
}

/**
 * Delete a waitlist record
 */
export async function deleteWaitlistRecord({ 
  trainingCenterId, 
  waitlistRecordId 
}: WaitlistApiParams): Promise<void> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/waitlist-records/${waitlistRecordId}`,
      { headers }
    );
  } catch (error) {
    console.error("Error deleting waitlist record:", error);
    throw error;
  }
}

/**
 * Update a waitlist record
 */
export async function updateWaitlistRecord({ 
  trainingCenterId, 
  waitlistRecordId 
}: WaitlistApiParams, data: any): Promise<WaitlistRecord> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    const response = await axios.put<WaitlistRecord>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/waitlist-records/${waitlistRecordId}`,
      data,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating waitlist record:", error);
    throw error;
  }
}

/**
 * Create a waitlist record with a new attendee
 * This creates a new attendee and adds them to the waitlist for a course template
 */
export async function createWaitlistRecordWithNewAttendee({ 
  trainingCenterId, 
  courseTemplateId 
}: WaitlistApiParams, data: CreateWaitlistWithNewAttendeeRequest): Promise<WaitlistRecord> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    // Prepare the request payload with attendeeRequest
    const payload = {
      attendeeRequest: {
        name: data.attendeeRequest.name,
        surname: data.attendeeRequest.surname,
        email: data.attendeeRequest.email,
        telephone: data.attendeeRequest.telephone,
        rank: data.attendeeRequest.rank,
        ...(data.attendeeRequest.remark ? { remark: data.attendeeRequest.remark } : {})
      }
    };
    
    const response = await axios.post<WaitlistRecord>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/waitlist-records/course-templates/${courseTemplateId}`,
      payload,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating waitlist record with new attendee:", error);
    throw error;
  }
}

/**
 * Get waitlist records for a specific attendee
 * @param params - API parameters including training center ID and attendee ID
 * @returns Promise with array of waitlist records
 */
export async function getWaitlistRecordsByAttendee({ 
  trainingCenterId, 
  attendeeId 
}: WaitlistApiParams): Promise<WaitlistRecord[]> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    const response = await axios.get<WaitlistRecord[]>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/waitlist-records/by-attendee/${attendeeId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching waitlist records by attendee:", error);
    throw error;
  }
}

// Helper function to get auth headers
export const getAuthHeaders = (token: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};
