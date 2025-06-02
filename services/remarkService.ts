import axios from 'axios';
import { 
  Remark, 
  CreateRemarkRequest, 
  CreateRemarkResponse,
  RemarkApiParams
} from '@/types/remark';

// Storage keys from useAuth.tsx
const STORAGE_KEYS = {
  USER_ID: 'seai_user_id',
  ACCESS_TOKEN: 'seai_access_token',
  EMAIL: 'seai_email',
  AUTH_STATE: 'seai_auth_state'
};

// Helper function to get the authentication token from localStorage
const getAuthToken = (): string | null => {
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

// Base API URL - should be configured from environment variables in a real app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.seai.co';

// API version path
const API_VERSION_PATH = '/api/v1';

/**
 * Get all remarks for an attendee
 * @param params Object containing trainingCenterId and attendeeId
 * @returns Promise with the list of remarks
 */
export const getAttendeeRemarks = async (params: RemarkApiParams): Promise<Remark[]> => {
  const { trainingCenterId, attendeeId } = params;
  
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get<Remark[]>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/remarks`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching attendee remarks:', error);
    throw error;
  }
};

/**
 * Get a specific remark by ID
 * @param params Object containing trainingCenterId, attendeeId, and remarkId
 * @returns Promise with the remark data
 */
export const getRemarkById = async (params: RemarkApiParams): Promise<Remark> => {
  const { trainingCenterId, attendeeId, remarkId } = params;
  
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  if (!remarkId) {
    throw new Error('Remark ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get<Remark>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/remarks/${remarkId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching remark with ID ${remarkId}:`, error);
    throw error;
  }
};

/**
 * Create a new remark for an attendee
 * @param params Object containing trainingCenterId and attendeeId
 * @param remarkData The remark data to create
 * @returns Promise with the created remark
 */
export const createRemark = async (
  params: RemarkApiParams,
  remarkData: CreateRemarkRequest
): Promise<CreateRemarkResponse> => {
  const { trainingCenterId, attendeeId } = params;
  
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.post<CreateRemarkResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/remarks`,
      remarkData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating remark:', error);
    throw error;
  }
};

/**
 * Update an existing remark
 * @param params Object containing trainingCenterId, attendeeId, and remarkId
 * @param remarkData The updated remark data
 * @returns Promise with the updated remark
 */
export const updateRemark = async (
  params: RemarkApiParams,
  remarkData: CreateRemarkRequest
): Promise<Remark> => {
  const { trainingCenterId, attendeeId, remarkId } = params;
  
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  if (!remarkId) {
    throw new Error('Remark ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.put<Remark>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/remarks/${remarkId}`,
      remarkData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating remark with ID ${remarkId}:`, error);
    throw error;
  }
};

/**
 * Delete a specific remark
 * @param params Object containing trainingCenterId, attendeeId, and remarkId
 * @returns Promise with the response
 */
export const deleteRemark = async (params: RemarkApiParams): Promise<void> => {
  const { trainingCenterId, attendeeId, remarkId } = params;
  
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  if (!remarkId) {
    throw new Error('Remark ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/remarks/${remarkId}`,
      { headers }
    );
  } catch (error) {
    console.error(`Error deleting remark with ID ${remarkId}:`, error);
    throw error;
  }
};

/**
 * Delete all remarks for an attendee
 * @param params Object containing trainingCenterId and attendeeId
 * @returns Promise with the response
 */
export const deleteAllRemarks = async (params: RemarkApiParams): Promise<void> => {
  const { trainingCenterId, attendeeId } = params;
  
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/remarks`,
      { headers }
    );
  } catch (error) {
    console.error(`Error deleting all remarks for attendee with ID ${attendeeId}:`, error);
    throw error;
  }
};
