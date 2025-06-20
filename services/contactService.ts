import axios from 'axios';
import { 
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  CreateContactResponse,
  GetContactsResponse,
  ContactApiParams
} from '@/types/contact';

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
 * Fetch all contacts for a training center
 * @param trainingCenterId The ID of the training center
 * @returns Promise with array of contacts
 */
export const getAllContacts = async (trainingCenterId: string): Promise<GetContactsResponse> => {
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get<GetContactsResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/contacts`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

/**
 * Fetch a single contact by ID
 * @param params Object containing trainingCenterId and contactId
 * @returns Promise with the contact data
 */
export const getContactById = async (params: ContactApiParams): Promise<Contact> => {
  const { trainingCenterId, contactId } = params;
  
  if (!contactId) {
    throw new Error('Contact ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get<Contact>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/contacts/${contactId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching contact with ID ${contactId}:`, error);
    throw error;
  }
};

/**
 * Create a new contact
 * @param params Object containing trainingCenterId
 * @param contactData The contact data to create
 * @returns Promise with the created contact
 */
export const createContact = async (
  params: ContactApiParams,
  contactData: CreateContactRequest
): Promise<CreateContactResponse> => {
  const { trainingCenterId } = params;
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.post<CreateContactResponse>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/contacts`,
      contactData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
};

/**
 * Update an existing contact
 * @param params Object containing trainingCenterId and contactId
 * @param contactData The updated contact data
 * @returns Promise with the updated contact
 */
export const updateContact = async (
  params: ContactApiParams,
  contactData: UpdateContactRequest
): Promise<Contact> => {
  const { trainingCenterId, contactId } = params;
  
  if (!contactId) {
    throw new Error('Contact ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.put<Contact>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/contacts/${contactId}`,
      contactData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating contact with ID ${contactId}:`, error);
    throw error;
  }
};

/**
 * Delete a contact
 * @param params Object containing trainingCenterId and contactId
 * @returns Promise with the response
 */
export const deleteContact = async (params: ContactApiParams): Promise<void> => {
  const { trainingCenterId, contactId } = params;
  
  if (!contactId) {
    throw new Error('Contact ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/contacts/${contactId}`,
      { headers }
    );
  } catch (error) {
    console.error(`Error deleting contact with ID ${contactId}:`, error);
    throw error;
  }
};

/**
 * Delete all contacts for a training center
 * @param trainingCenterId The ID of the training center
 * @returns Promise with the response
 */
export const deleteAllContacts = async (trainingCenterId: string): Promise<void> => {
  try {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/contacts`,
      { headers }
    );
  } catch (error) {
    console.error('Error deleting all contacts:', error);
    throw error;
  }
}; 