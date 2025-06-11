import axios from 'axios';
import { 
  Attendee, 
  AttendeeWithDetails,
  CreateAttendeeRequest, 
  GetAttendeesResponse, 
  UpdateAttendeeRequest,
  AttendeeApiParams,
  PaginationParams,
  PaginatedAttendeesResponse
} from '@/types/attendee';

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
 * Fetch all attendees for a training center (legacy non-paginated version)
 * @param trainingCenterId The ID of the training center
 * @returns Promise with the list of attendees
 * @deprecated Use getPaginatedAttendees instead
 */
export const getAttendees = async (trainingCenterId: string): Promise<Attendee[]> => {
  try {
    const token = getAuthToken();
    console.log('DEBUG: Auth token for API request:', token ? 'Token found' : 'No token');
    
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log('DEBUG: Request headers:', headers);
    
    const response = await axios.get<GetAttendeesResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching attendees:', error);
    throw error;
  }
};

/**
 * Fetch paginated attendees for a training center with all related data
 * @param trainingCenterId The ID of the training center
 * @param params Pagination parameters (page, size, sortBy)
 * @returns Promise with paginated attendees response including remarks, courses, and waitlist records
 */
export const getPaginatedAttendees = async (
  trainingCenterId: string, 
  params: PaginationParams = {}
): Promise<PaginatedAttendeesResponse> => {
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    // Default values
    const page = params.page ?? 1;
    const size = params.size ?? 1000;
    const sortBy = params.sortBy ?? 'name';
    
    const response = await axios.get<PaginatedAttendeesResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees`,
      { 
        headers,
        params: {
          page,
          size,
          sortBy
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching paginated attendees with details:', error);
    throw error;
  }
};

/**
 * Fetch a single attendee by ID (basic version without related data)
 * @param params Object containing trainingCenterId and attendeeId
 * @returns Promise with the basic attendee data
 */
export const getAttendeeById = async (params: AttendeeApiParams): Promise<Attendee> => {
  const { trainingCenterId, attendeeId } = params;
  
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get<Attendee>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching attendee with ID ${attendeeId}:`, error);
    throw error;
  }
};

/**
 * Create a new attendee
 * @param params Object containing trainingCenterId
 * @param attendeeData The attendee data to create
 * @returns Promise with the created attendee
 */
export const createAttendee = async (
  params: AttendeeApiParams,
  attendeeData: CreateAttendeeRequest
): Promise<Attendee> => {
  const { trainingCenterId } = params;
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.post<Attendee>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees`,
      attendeeData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating attendee:', error);
    throw error;
  }
};

/**
 * Update an existing attendee
 * @param params Object containing trainingCenterId and attendeeId
 * @param attendeeData The updated attendee data
 * @returns Promise with the updated attendee
 */
export const updateAttendee = async (
  params: AttendeeApiParams,
  attendeeData: UpdateAttendeeRequest
): Promise<Attendee> => {
  const { trainingCenterId, attendeeId } = params;
  
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.put<Attendee>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}`,
      attendeeData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating attendee with ID ${attendeeId}:`, error);
    throw error;
  }
};

/**
 * Delete an attendee
 * @param params Object containing trainingCenterId and attendeeId
 * @returns Promise with the response
 */
export const deleteAttendee = async (params: AttendeeApiParams): Promise<void> => {
  const { trainingCenterId, attendeeId } = params;
  
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}`,
      { headers }
    );
  } catch (error) {
    console.error(`Error deleting attendee with ID ${attendeeId}:`, error);
    throw error;
  }
};
