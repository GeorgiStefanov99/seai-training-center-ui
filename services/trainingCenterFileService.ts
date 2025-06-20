import axios from 'axios';
import { TrainingCenterFileApiParams, FileItem } from '@/types/document';
import { getAuthToken, getAuthHeaders } from '@/services/courseTemplateService';

// Base API URL - should be configured from environment variables in a real app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.seai.co';

// API version path
const API_VERSION_PATH = '/api/v1';

// Cache configuration
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour
const fileContentCache: {[key: string]: {content: string, contentType: string, timestamp: number}} = {};

// Content type mapping for file extensions
const contentTypeMap: {[key: string]: string} = {
  'pdf': 'application/pdf',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'bmp': 'image/bmp',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'xml': 'application/xml',
  'json': 'application/json',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed'
};

/**
 * Get content type from file name
 * @param fileName File name
 * @returns Content type string or null
 */
const getContentTypeFromFileName = (fileName: string): string | null => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? contentTypeMap[extension] || null : null;
};

/**
 * Extract file ID or name from file object for identification
 * @param file File object
 * @returns File identifier string
 */
export const extractTrainingCenterFileIdOrName = (file: any): string => {
  return file.id || file.fileId || file.name || file.fileName || 'unknown';
};

/**
 * Get all files for a training center document
 * @param params API parameters including training center ID and document ID
 * @returns Promise with array of files
 */
export const getTrainingCenterDocumentFiles = async (params: TrainingCenterFileApiParams): Promise<FileItem[]> => {
  const { trainingCenterId, documentId } = params;
  
  if (!trainingCenterId || !documentId) {
    throw new Error('Training center ID and document ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}/files`,
      { headers }
    );
    
    // Transform the response to match our FileItem interface
    const files: FileItem[] = response.data.map((file: any, index: number) => {
      const id = extractTrainingCenterFileIdOrName(file) || `file-${index + 1}`;
      const name = file.name || file.fileName || `File ${index + 1}`;
      const contentType = file.contentType || 
        (file.headers && (file.headers['Content-Type']?.[0] || file.headers['content-type']?.[0])) ||
        (name ? getContentTypeFromFileName(name) : null) ||
        'application/octet-stream';
      const size = file.size || 
        file.contentLength || 
        (file.headers && parseInt(file.headers['Content-Length']?.[0] || file.headers['content-length']?.[0] || '0', 10)) ||
        0;
      
      return {
        ...file,
        id,
        name,
        contentType,
        size,
        createdAt: file.createdAt || new Date().toISOString(),
        updatedAt: file.updatedAt || new Date().toISOString()
      };
    });
    
    return files;
  } catch (error) {
    console.error('Error fetching training center document files:', error);
    throw error;
  }
};

/**
 * Get a specific file by ID
 * @param params API parameters including training center ID, document ID, and file ID
 * @returns Promise with file data
 */
export const getTrainingCenterFileById = async (params: TrainingCenterFileApiParams): Promise<FileItem> => {
  const { trainingCenterId, documentId, fileId } = params;
  
  if (!trainingCenterId || !documentId || !fileId) {
    throw new Error('Training center ID, document ID, and file ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<FileItem>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}/files/${fileId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching training center file ID ${fileId}:`, error);
    throw error;
  }
};

/**
 * Get download URL for a training center file
 * @param params API parameters including training center ID, document ID, and file ID
 * @returns Promise with download URL
 */
export const getTrainingCenterFileDownloadUrl = async (params: TrainingCenterFileApiParams): Promise<string> => {
  const { trainingCenterId, documentId, fileId } = params;
  
  if (!trainingCenterId || !documentId || !fileId) {
    throw new Error('Training center ID, document ID, and file ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    // Use the download-url endpoint if available
    try {
      const response = await axios.get<string>(
        `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}/files/${fileId}/download-url`,
        { headers }
      );
      
      return response.data;
    } catch (downloadUrlError) {
      console.warn('Download URL endpoint failed, falling back to direct download:', downloadUrlError);
      
      // If the download-url endpoint fails, return the direct file URL
      return `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}/files/${fileId}`;
    }
  } catch (error) {
    console.error('Error generating training center file download URL:', error);
    throw error;
  }
};

/**
 * Generate a cache key for a training center file
 * @param params Training center file API parameters
 * @returns Cache key string
 */
const generateTrainingCenterCacheKey = (params: TrainingCenterFileApiParams): string => {
  const { trainingCenterId, documentId, fileId } = params;
  return `tc_${trainingCenterId}_${documentId}_${fileId}`;
};

/**
 * Get training center file content as base64 encoded string with caching
 * @param params API parameters including training center ID, document ID, and file ID
 * @returns Promise with file content as base64 and content type
 */
export const getTrainingCenterFileContent = async (params: TrainingCenterFileApiParams): Promise<{ content: string, contentType: string }> => {
  const { trainingCenterId, documentId, fileId } = params;
  
  if (!trainingCenterId || !documentId || !fileId) {
    throw new Error('Training center ID, document ID, and file ID are required');
  }
  
  // Check cache first
  const cacheKey = generateTrainingCenterCacheKey(params);
  const cachedData = fileContentCache[cacheKey];
  
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION_MS) {
    return { content: cachedData.content, contentType: cachedData.contentType };
  }
  
  try {
    // Get file metadata first to determine content type and name
    let fileName = '';
    let knownContentType = '';
    
    try {
      const fileData = await getTrainingCenterFileById(params);
      fileName = fileData.name || '';
      knownContentType = fileData.contentType || '';
    } catch (metadataError) {
      console.warn('Could not retrieve training center file metadata:', metadataError);
    }
    
    // Try to determine content type from file name if not available from metadata
    if (!knownContentType && fileName) {
      const contentTypeFromName = getContentTypeFromFileName(fileName);
      if (contentTypeFromName) {
        knownContentType = contentTypeFromName;
      }
    }
    
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    // Get the actual file content
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}/files/${fileId}`,
      { 
        headers,
        responseType: 'arraybuffer'
      }
    );
    
    // Determine content type with fallbacks
    const contentType = response.headers['content-type'] || knownContentType || 
      (fileName ? getContentTypeFromFileName(fileName) : null) || 'application/octet-stream';
    
    // Ensure we have valid data before converting
    if (!response.data) {
      console.error('No response data received');
      throw new Error('No file content received');
    }
    
    if (response.data.length === 0) {
      console.warn('Empty response data received, file may be empty');
      return { content: '', contentType };
    }
    
    // Convert to base64
    let content = '';
    try {
      const uint8Array = new Uint8Array(response.data);
      const chunkSize = 8192;
      let binaryString = '';
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      content = btoa(binaryString);
    } catch (conversionError) {
      console.error('Error converting file content to base64:', conversionError);
      throw new Error('Failed to process file content');
    }
    
    // Cache the result
    fileContentCache[cacheKey] = {
      content,
      contentType,
      timestamp: Date.now()
    };
    
    return { content, contentType };
  } catch (error) {
    console.error('Error getting training center file content:', error);
    throw error;
  }
};

/**
 * Upload a file to a training center document
 * @param params API parameters including training center ID and document ID
 * @param file File to upload
 * @returns Promise with uploaded file data
 */
export const uploadTrainingCenterFile = async (params: TrainingCenterFileApiParams, file: File): Promise<FileItem> => {
  const { trainingCenterId, documentId } = params;
  
  if (!trainingCenterId || !documentId) {
    throw new Error('Training center ID and document ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = {
      ...getAuthHeaders(token),
      'Content-Type': 'multipart/form-data',
    };
    
    const formData = new FormData();
    formData.append('file', file);
    
    
    const response = await axios.post<FileItem>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}/files`,
      formData,
      { headers }
    );
    
    console.log('File upload successful, response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading training center file:', error);
    throw error;
  }
};

/**
 * Delete a training center file
 * @param params API parameters including training center ID, document ID, and file ID
 * @returns Promise with success status
 */
export const deleteTrainingCenterFile = async (params: TrainingCenterFileApiParams): Promise<void> => {
  const { trainingCenterId, documentId, fileId } = params;
  
  if (!trainingCenterId || !documentId || !fileId) {
    throw new Error('Training center ID, document ID, and file ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}/files/${fileId}`,
      { headers }
    );
    
    // Clear cache for this file
    const cacheKey = generateTrainingCenterCacheKey(params);
    delete fileContentCache[cacheKey];
  } catch (error) {
    console.error(`Error deleting training center file ID ${fileId}:`, error);
    throw error;
  }
};

/**
 * Delete all files for a training center document
 * @param params API parameters including training center ID and document ID
 * @returns Promise with success status
 */
export const deleteAllTrainingCenterFiles = async (params: TrainingCenterFileApiParams): Promise<void> => {
  const { trainingCenterId, documentId } = params;
  
  if (!trainingCenterId || !documentId) {
    throw new Error('Training center ID and document ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/documents/${documentId}/files`,
      { headers }
    );
    
    // Clear cache for all files in this document
    Object.keys(fileContentCache).forEach(key => {
      if (key.startsWith(`tc_${trainingCenterId}_${documentId}_`)) {
        delete fileContentCache[key];
      }
    });
  } catch (error) {
    console.error('Error deleting all training center files:', error);
    throw error;
  }
}; 