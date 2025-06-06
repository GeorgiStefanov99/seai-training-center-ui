import axios from 'axios';
import {
  Course,
  CourseApiParams,
  CreateCourseRequest,
  GetCoursesResponse,
  UpdateCourseRequest
} from '@/types/course';

// Import auth helpers from courseTemplateService
import { getAuthToken, getAuthHeaders } from '@/services/courseTemplateService';

// Base API URL - should be configured from environment variables in a real app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.seai.co';

// API version path
const API_VERSION_PATH = '/api/v1';

// Archive related types
export interface CreateArchiveRequest {
  finishRemark: string;
}

/**
 * Get all courses for a training center
 * @param trainingCenterId Training center ID
 * @returns Promise with array of courses
 */
export const getCourses = async (trainingCenterId: string): Promise<Course[]> => {
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<GetCoursesResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

/**
 * Get a specific course by ID
 * @param params API parameters including training center ID and course ID
 * @returns Promise with course data
 */
export const getCourseById = async (params: CourseApiParams): Promise<Course> => {
  const { trainingCenterId, courseId } = params;
  
  if (!trainingCenterId || !courseId) {
    throw new Error('Training center ID and course ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<Course>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/${courseId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching course ID ${courseId}:`, error);
    throw error;
  }
};

/**
 * Create a new course
 * @param params API parameters including training center ID
 * @param data Course data to create
 * @returns Promise with created course
 */
export const createCourse = async (params: CourseApiParams, data: CreateCourseRequest): Promise<Course> => {
  const { trainingCenterId } = params;
  
  if (!trainingCenterId) {
    throw new Error('Training center ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    // Log the request payload for debugging
    console.log('Creating course with data:', JSON.stringify(data, null, 2));
    
    const response = await axios.post<Course>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses`,
      data,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

/**
 * Update an existing course
 * @param params API parameters including training center ID and course ID
 * @param data Updated course data
 * @returns Promise with updated course
 */
export const updateCourse = async (params: CourseApiParams, data: UpdateCourseRequest): Promise<Course> => {
  const { trainingCenterId, courseId } = params;
  
  if (!trainingCenterId || !courseId) {
    throw new Error('Training center ID and course ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.put<Course>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/${courseId}`,
      data,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error updating course ID ${courseId}:`, error);
    throw error;
  }
};

/**
 * Delete a course
 * @param params API parameters including training center ID and course ID
 * @returns Promise with void
 */
export const deleteCourse = async (params: CourseApiParams): Promise<void> => {
  const { trainingCenterId, courseId } = params;
  
  if (!trainingCenterId || !courseId) {
    throw new Error('Training center ID and course ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/${courseId}`,
      { headers }
    );
  } catch (error) {
    console.error(`Error deleting course ID ${courseId}:`, error);
    throw error;
  }
};

/**
 * Get courses for a specific template
 * @param params API parameters including training center ID and template ID
 * @returns Promise with array of courses
 */
export const getCoursesForTemplate = async (params: CourseApiParams): Promise<Course[]> => {
  const { trainingCenterId, templateId } = params;
  
  if (!trainingCenterId || !templateId) {
    throw new Error('Training center ID and template ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<GetCoursesResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/template/${templateId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching courses for template ID ${templateId}:`, error);
    throw error;
  }
};

/**
 * Archive a course
 * @param params API parameters including training center ID and course ID
 * @param data Archive request data including finish remark
 * @returns Promise with void
 */
export const archiveCourse = async (params: CourseApiParams, data: CreateArchiveRequest): Promise<void> => {
  const { trainingCenterId, courseId } = params;
  
  if (!trainingCenterId || !courseId) {
    throw new Error('Training center ID and course ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    await axios.put(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/${courseId}/archive`,
      data,
      { headers }
    );
  } catch (error) {
    console.error(`Error archiving course ID ${courseId}:`, error);
    throw error;
  }
};

/**
 * Get all archived courses for a training center
 * @param trainingCenterId Training center ID
 * @returns Promise with array of archived courses
 */
export const getArchivedCourses = async (trainingCenterId: string): Promise<Course[]> => {
  if (!trainingCenterId) {
    throw new Error('Training center ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<GetCoursesResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/archive`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching archived courses:', error);
    throw error;
  }
};

/**
 * Get a specific archived course by ID
 * @param params API parameters including training center ID and course ID
 * @returns Promise with archived course data
 */
export const getArchivedCourseById = async (params: CourseApiParams): Promise<Course> => {
  const { trainingCenterId, courseId } = params;
  
  if (!trainingCenterId || !courseId) {
    throw new Error('Training center ID and course ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<Course>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/courses/archive/${courseId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching archived course ID ${courseId}:`, error);
    throw error;
  }
};
