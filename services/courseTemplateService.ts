import axios from 'axios';
import { 
  CourseTemplate, 
  CreateCourseTemplateRequest, 
  GetCourseTemplatesResponse, 
  UpdateCourseTemplateRequest,
  CourseTemplateApiParams,
  ActiveCourse,
  GetActiveCoursesResponse,
  GetWaitlistRecordsResponse
} from '@/types/course-template';

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
export const getAuthHeaders = (token: string | null): { Authorization: string } | {} => {
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Base API URL - should be configured from environment variables in a real app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.seai.co';

// API version path
const API_VERSION_PATH = '/api/v1';

/**
 * Fetch all course templates for a training center
 * @param trainingCenterId The ID of the training center
 * @returns Promise with the list of course templates
 */
export const getCourseTemplates = async (trainingCenterId: string): Promise<CourseTemplate[]> => {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<GetCourseTemplatesResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/templates`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching course templates:', error);
    throw error;
  }
};

/**
 * Fetch a single course template by ID
 * @param params Object containing trainingCenterId and courseTemplateId
 * @returns Promise with the course template data
 */
export const getCourseTemplateById = async (params: CourseTemplateApiParams): Promise<CourseTemplate> => {
  const { trainingCenterId, courseTemplateId } = params;
  
  if (!courseTemplateId) {
    throw new Error('Course template ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<CourseTemplate>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/templates/${courseTemplateId}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching course template with ID ${courseTemplateId}:`, error);
    throw error;
  }
};

/**
 * Create a new course template
 * @param params Object containing trainingCenterId
 * @param templateData The course template data to create
 * @returns Promise with the created course template
 */
export const createCourseTemplate = async (
  params: CourseTemplateApiParams,
  templateData: CreateCourseTemplateRequest
): Promise<CourseTemplate> => {
  const { trainingCenterId } = params;
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.post<CourseTemplate>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/templates`,
      templateData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating course template:', error);
    throw error;
  }
};

/**
 * Update an existing course template
 * @param params Object containing trainingCenterId and courseTemplateId
 * @param templateData The updated course template data
 * @returns Promise with the updated course template
 */
export const updateCourseTemplate = async (
  params: CourseTemplateApiParams,
  templateData: UpdateCourseTemplateRequest
): Promise<CourseTemplate> => {
  const { trainingCenterId, courseTemplateId } = params;
  
  if (!courseTemplateId) {
    throw new Error('Course template ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.put<CourseTemplate>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/templates/${courseTemplateId}`,
      templateData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating course template with ID ${courseTemplateId}:`, error);
    throw error;
  }
};

/**
 * Delete a course template
 * @param params Object containing trainingCenterId and courseTemplateId
 * @returns Promise with the response
 */
export const deleteCourseTemplate = async (params: CourseTemplateApiParams): Promise<void> => {
  const { trainingCenterId, courseTemplateId } = params;
  
  if (!courseTemplateId) {
    throw new Error('Course template ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/templates/${courseTemplateId}`,
      { headers }
    );
  } catch (error) {
    console.error(`Error deleting course template with ID ${courseTemplateId}:`, error);
    throw error;
  }
};

/**
 * Fetch active courses for a template
 * @param params Object containing trainingCenterId and courseTemplateId
 * @returns Promise with the list of active courses
 */
export const getActiveCoursesForTemplate = async (params: CourseTemplateApiParams): Promise<GetActiveCoursesResponse> => {
  const { trainingCenterId, courseTemplateId } = params;
  
  if (!trainingCenterId || !courseTemplateId) {
    throw new Error('Training center ID and course template ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<GetActiveCoursesResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/template/${courseTemplateId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching active courses for template:', error);
    throw error;
  }
};

/**
 * Get waitlist records for a specific course template
 * @param params - API parameters including training center ID and course template ID
 * @returns Promise with array of waitlist records
 */
export const getWaitlistRecordsForTemplate = async (params: CourseTemplateApiParams): Promise<GetWaitlistRecordsResponse> => {
  const { trainingCenterId, courseTemplateId } = params;
  
  if (!trainingCenterId || !courseTemplateId) {
    throw new Error('Training center ID and course template ID are required');
  }
  
  try {
    // Get auth token
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    // Make API request
    const response = await axios.get<GetWaitlistRecordsResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/waitlist-records/by-course-template/${courseTemplateId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching waitlist records for template:', error);
    throw error;
  }
};
