import axios from "axios";
import { Course } from "@/types/course";

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

// Helper function to get auth headers
const getAuthHeaders = (token: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Define the parameters for attendee course API calls
interface AttendeeCoursesApiParams {
  trainingCenterId: string;
  attendeeId: string;
}

// Define the parameters for removing an attendee from a course
interface RemoveAttendeeCourseParams extends AttendeeCoursesApiParams {
  courseId: string;
}

/**
 * Get all courses for a specific attendee
 */
export async function getAttendeeEnrolledCourses({
  trainingCenterId,
  attendeeId
}: AttendeeCoursesApiParams): Promise<Course[]> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    const response = await axios.get<Course[]>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/courses`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching attendee enrolled courses:", error);
    throw error;
  }
}

/**
 * Assign an attendee to a course
 */
export async function assignAttendeeToCourse({
  trainingCenterId,
  attendeeId
}: AttendeeCoursesApiParams, courseId: string): Promise<void> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    await axios.post(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/courses`,
      { courseId },
      { headers }
    );
  } catch (error) {
    console.error("Error assigning attendee to course:", error);
    throw error;
  }
}

/**
 * Remove an attendee from a course
 */
export async function removeAttendeeFromCourse({
  trainingCenterId,
  attendeeId,
  courseId
}: RemoveAttendeeCourseParams): Promise<void> {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/courses/${courseId}`,
      { headers }
    );
  } catch (error) {
    console.error("Error removing attendee from course:", error);
    throw error;
  }
}
