import axios from 'axios';
import { TrainingCenterDocument, TrainingCenterDocumentApiParams, CreateTrainingCenterDocumentRequest, UpdateTrainingCenterDocumentRequest } from '@/types/document';
import { getAuthToken, getAuthHeaders } from '@/services/courseTemplateService';

// Base API URL - should be configured from environment variables in a real app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.seai.co';

// API version path
const API_VERSION_PATH = '/api/v1';

/**
 * Get all documents for a training center
 * @param params API parameters including training center ID
 * @returns Promise with array of training center documents
 */
export const getTrainingCenterDocuments = async (params: TrainingCenterDocumentApiParams): Promise<TrainingCenterDocument[]> => {
  const { trainingCenterId, includeFiles } = params;
  
  if (!trainingCenterId) {
    throw new Error('Training center ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    // First, get all documents (without files)
    const response = await axios.get<TrainingCenterDocument[]>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents`,
      { headers }
    );

    
    
    const documents = response.data;
    
    // If includeFiles is true, fetch each document by ID with includeFiles=true
    if (includeFiles) {
     
      
      const documentsWithFiles = await Promise.all(
        documents.map(async (doc) => {
          try {
            // Fetch the document by ID with includeFiles=true
            const documentWithFiles = await getTrainingCenterDocumentById({
              trainingCenterId,
              documentId: doc.id,
              includeFiles: true
            });
            
            
            
            return documentWithFiles;
          } catch (fileError) {
            console.warn(`Failed to fetch files for document ${doc.id}:`, fileError);
            return {
              ...doc,
              documentFiles: []
            };
          }
        })
      );
      
      return documentsWithFiles;
    }
    
    return documents;
  } catch (error) {
    console.error('Error fetching training center documents:', error);
    throw error;
  }
};

/**
 * Get a specific training center document by ID
 * @param params API parameters including training center ID and document ID
 * @returns Promise with training center document data
 */
export const getTrainingCenterDocumentById = async (params: TrainingCenterDocumentApiParams): Promise<TrainingCenterDocument> => {
  const { trainingCenterId, documentId, includeFiles } = params;
  
  if (!trainingCenterId || !documentId) {
    throw new Error('Training center ID and document ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
         const url = `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}${includeFiles ? '?includeFiles=true' : ''}`;
    
    
    const response = await axios.get<TrainingCenterDocument>(url, { headers });
    
    
    
    // Map the backend 'files' property to our 'documentFiles' property
    const backendFiles = (response.data as any).files || [];
    
    
    // Transform backend file format to our FileItem format
    const documentFiles = backendFiles.map((file: any, index: number) => {
      const headers = file.headers || {};
      const contentType = headers['Content-Type']?.[0] || 'application/octet-stream';
      const contentLength = headers['Content-Length']?.[0];
      const contentDisposition = headers['Content-Disposition']?.[0] || '';
      
      // Extract filename from Content-Disposition header
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `file-${index + 1}`;
      
      return {
        id: filename, // Use filename as ID for now
        name: filename,
        contentType: contentType,
        size: contentLength ? parseInt(contentLength, 10) : 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        body: file.body // Keep the base64 body for preview
      };
    });
    
    const mappedData = {
      ...response.data,
      documentFiles: documentFiles
    };
    
    
    
    return mappedData;
  } catch (error) {
    console.error(`Error fetching training center document ID ${documentId}:`, error);
    throw error;
  }
};

/**
 * Create a new document for a training center
 * @param params API parameters including training center ID
 * @param data Document data to create
 * @returns Promise with created training center document
 */
export const createTrainingCenterDocument = async (params: TrainingCenterDocumentApiParams, data: CreateTrainingCenterDocumentRequest): Promise<TrainingCenterDocument> => {
  const { trainingCenterId } = params;
  
  if (!trainingCenterId) {
    throw new Error('Training center ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.post<TrainingCenterDocument>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents`,
      data,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error creating training center document:', error);
    throw error;
  }
};

/**
 * Update an existing training center document
 * @param params API parameters including training center ID and document ID
 * @param data Document data to update
 * @returns Promise with updated training center document
 */
export const updateTrainingCenterDocument = async (params: TrainingCenterDocumentApiParams, data: UpdateTrainingCenterDocumentRequest): Promise<void> => {
  const { trainingCenterId, documentId } = params;
  
  if (!trainingCenterId || !documentId) {
    throw new Error('Training center ID and document ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    await axios.put(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}`,
      data,
      { headers }
    );
  } catch (error) {
    console.error(`Error updating training center document ID ${documentId}:`, error);
    throw error;
  }
};

/**
 * Delete a training center document
 * @param params API parameters including training center ID and document ID
 * @returns Promise with success status
 */
export const deleteTrainingCenterDocument = async (params: TrainingCenterDocumentApiParams): Promise<void> => {
  const { trainingCenterId, documentId } = params;
  
  if (!trainingCenterId || !documentId) {
    throw new Error('Training center ID and document ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}`,
      { headers }
    );
  } catch (error) {
    console.error(`Error deleting training center document ID ${documentId}:`, error);
    throw error;
  }
};

/**
 * Delete all training center documents
 * @param params API parameters including training center ID
 * @returns Promise with success status
 */
export const deleteAllTrainingCenterDocuments = async (params: TrainingCenterDocumentApiParams): Promise<void> => {
  const { trainingCenterId } = params;
  
  if (!trainingCenterId) {
    throw new Error('Training center ID is required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents`,
      { headers }
    );
  } catch (error) {
    console.error('Error deleting all training center documents:', error);
    throw error;
  }
}; 