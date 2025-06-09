import axios from 'axios';
import { Attendee } from "@/types/attendee";

// API parameters interface
export interface CourseAttendeeApiParams {
  trainingCenterId: string;
  courseId: string;
  attendeeId?: string;
}

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
 * Get all attendees for a course
 * @param params Object containing trainingCenterId and courseId
 * @returns Promise with the list of attendees
 */
export const getCourseAttendees = async ({
  trainingCenterId,
  courseId
}: CourseAttendeeApiParams): Promise<Attendee[]> => {
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get<Attendee[]>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/${courseId}/attendees`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching course attendees:", error);
    // Return empty array as fallback
    return [];
  }
}

/**
 * Get all archived attendees for a course
 * @param params Object containing trainingCenterId and courseId
 * @returns Promise with the list of attendees
 */
export const getArchivedCourseAttendees = async ({
  trainingCenterId,
  courseId
}: CourseAttendeeApiParams): Promise<Attendee[]> => {
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get<Attendee[]>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/${courseId}/attendees/archive`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching course attendees:", error);
    // Return empty array as fallback
    return [];
  }
}

/**
 * Get a specific attendee for a course
 * @param params Object containing trainingCenterId, courseId, and attendeeId
 * @returns Promise with the attendee data
 */
export const getCourseAttendee = async ({
  trainingCenterId,
  courseId,
  attendeeId
}: CourseAttendeeApiParams): Promise<Attendee> => {
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get<Attendee>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/${courseId}/attendees/${attendeeId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching course attendee:", error);
    throw error;
  }
};

/**
 * Assign an attendee to a course
 * @param params Object containing trainingCenterId, courseId, and attendeeId
 * @returns Promise with the response
 */
export const assignAttendeeToCourse = async ({
  trainingCenterId,
  courseId,
  attendeeId
}: CourseAttendeeApiParams): Promise<void> => {
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    await axios.post(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/${courseId}/attendees/${attendeeId}`,
      {}, // Empty body
      { headers } // Headers as the third parameter
    );
  } catch (error) {
    console.error("Error assigning attendee to course:", error);
    throw error;
  }
};

/**
 * Remove an attendee from a course
 * @param params Object containing trainingCenterId, courseId, and attendeeId
 * @returns Promise with the response
 */
export const removeAttendeeFromCourse = async ({
  trainingCenterId,
  courseId,
  attendeeId
}: CourseAttendeeApiParams): Promise<void> => {
  if (!attendeeId) {
    throw new Error('Attendee ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/${courseId}/attendees/${attendeeId}`,
      { headers: headers }
    );
  } catch (error) {
    console.error("Error removing attendee from course:", error);
    throw error;
  }
};
