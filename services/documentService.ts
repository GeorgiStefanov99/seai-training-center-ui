import axios from 'axios';
import { Document, DocumentApiParams, CreateDocumentRequest } from '@/types/document';
import { getAuthToken, getAuthHeaders } from '@/services/courseTemplateService';

// Base API URL - should be configured from environment variables in a real app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.seai.co';

// API version path
const API_VERSION_PATH = '/api/v1';

/**
 * Get all documents for an attendee
 * @param params API parameters including training center ID and attendee ID
 * @returns Promise with array of documents
 */
export const getAttendeeDocuments = async (params: DocumentApiParams): Promise<Document[]> => {
  const { trainingCenterId, attendeeId, includeFiles } = params;
  
  if (!trainingCenterId || !attendeeId) {
    throw new Error('Training center ID and attendee ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<Document[]>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents${includeFiles ? '?includeFiles=true' : ''}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching attendee documents:', error);
    throw error;
  }
};

/**
 * Get a specific document by ID
 * @param params API parameters including training center ID, attendee ID, and document ID
 * @returns Promise with document data
 */
export const getDocumentById = async (params: DocumentApiParams): Promise<Document> => {
  const { trainingCenterId, attendeeId, documentId } = params;
  
  if (!trainingCenterId || !attendeeId || !documentId) {
    throw new Error('Training center ID, attendee ID, and document ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<Document>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching document ID ${documentId}:`, error);
    throw error;
  }
};

/**
 * Create a new document for an attendee
 * @param params API parameters including training center ID and attendee ID
 * @param data Document data to create
 * @returns Promise with created document
 */
export const createDocument = async (params: DocumentApiParams, data: CreateDocumentRequest): Promise<Document> => {
  const { trainingCenterId, attendeeId } = params;
  
  if (!trainingCenterId || !attendeeId) {
    throw new Error('Training center ID and attendee ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.post<Document>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents`,
      data,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Update an existing document
 * @param params API parameters including training center ID, attendee ID, and document ID
 * @param data Document data to update
 * @returns Promise with updated document
 */
export const updateDocument = async (params: DocumentApiParams, data: Partial<Document>): Promise<Document> => {
  const { trainingCenterId, attendeeId, documentId } = params;
  
  if (!trainingCenterId || !attendeeId || !documentId) {
    throw new Error('Training center ID, attendee ID, and document ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.put<Document>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}`,
      data,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error updating document ID ${documentId}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 * @param params API parameters including training center ID, attendee ID, and document ID
 * @returns Promise with success status
 */
export const deleteDocument = async (params: DocumentApiParams): Promise<void> => {
  const { trainingCenterId, attendeeId, documentId } = params;
  
  if (!trainingCenterId || !attendeeId || !documentId) {
    throw new Error('Training center ID, attendee ID, and document ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}`,
      { headers }
    );
  } catch (error) {
    console.error(`Error deleting document ID ${documentId}:`, error);
    throw error;
  }
};
