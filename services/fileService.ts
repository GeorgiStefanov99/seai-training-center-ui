import axios from 'axios';
import { FileItem, FileApiParams } from '@/types/document';
import { getAuthToken, getAuthHeaders } from '@/services/courseTemplateService';

// Base API URL - should be configured from environment variables in a real app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.seai.co';

// API version path
const API_VERSION_PATH = '/api/v1';

/**
 * Extract file ID from Content-Disposition header
 * @param disposition Content-Disposition header value
 * @returns File ID or null if not found
 */
export const extractFileIdFromContentDisposition = (disposition: string | string[] | undefined): string | null => {
  if (!disposition) return null;
  const disp = Array.isArray(disposition) ? disposition[0] : disposition;
  const match = disp.match(/filename="([^"]+)"/i);
  return match ? match[1] : null;
};

/**
 * Extract file ID or name from various file object formats
 * @param file File object with potential ID information
 * @returns File ID or null if not found
 */
export const extractFileIdOrName = (file: any): string | null => {
  if (!file) return null;
  
  // Check for direct ID properties
  if (file.fileId) return file.fileId;
  if (file.id) return file.id;
  
  // Check for fileName property
  if (file.fileName) {
    if (Array.isArray(file.fileName)) {
      if (file.fileName.length > 0) {
        const first = file.fileName[0];
        const match = typeof first === 'string' && first.match(/filename="([^"]+)"/i);
        if (match && match[1]) return match[1];
        return first;
      }
    } else if (typeof file.fileName === 'string') {
      return file.fileName;
    }
  }
  
  // Check for Content-Disposition header
  let disposition = file.headers && (file.headers['Content-Disposition'] || file.headers['content-disposition']);
  if (Array.isArray(disposition)) disposition = disposition[0];
  if (disposition && typeof disposition === 'string') {
    const match = disposition.match(/filename="([^"]+)"/i);
    if (match && match[1]) return match[1];
  }
  
  // If we get here, we couldn't find an ID
  console.warn('Could not extract file ID from file object:', file);
  return null;
};

/**
 * Get all files for a document
 * @param params API parameters including training center ID, attendee ID, and document ID
 * @returns Promise with array of files
 */
export const getDocumentFiles = async (params: FileApiParams): Promise<FileItem[]> => {
  const { trainingCenterId, attendeeId, documentId } = params;
  
  if (!trainingCenterId || !attendeeId || !documentId) {
    throw new Error('Training center ID, attendee ID, and document ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}/files`,
      { headers }
    );
    
    // Transform the response to match our FileItem interface
    const files: FileItem[] = response.data.map((fileResponse: any, index: number) => {
      // Extract file ID using our robust helper function
      const fileId = extractFileIdOrName(fileResponse);
      
      // Extract content type
      const contentType = fileResponse.headers?.['Content-Type']?.[0] || 
                         fileResponse.headers?.['content-type']?.[0] || 
                         'application/octet-stream';
      
      // Extract content length
      const contentLength = parseInt(
        fileResponse.headers?.['Content-Length']?.[0] || 
        fileResponse.headers?.['content-length']?.[0] || 
        '0', 
        10
      );
      
      // Generate a name if not available
      const fileName = fileId || `file-${index + 1}`;
      
      // Create a debug preview of the body (first 50 chars)
      const bodyPreview = typeof fileResponse.body === 'string' && fileResponse.body.length > 0 
        ? `${fileResponse.body.substring(0, 50)}...` 
        : 'No body content';
      
      return {
        id: fileId || `file-${index + 1}`,
        name: fileName,
        size: contentLength,
        contentType: contentType,
        createdAt: new Date().toISOString(), // Not available in response
        updatedAt: new Date().toISOString(), // Not available in response
        // Store the original response for debugging
        _originalResponse: fileResponse
      };
    });
    
    return files;
  } catch (error) {
    console.error('Error fetching document files:', error);
    throw error;
  }
};

/**
 * Get a specific file by ID
 * @param params API parameters including training center ID, attendee ID, document ID, and file ID
 * @returns Promise with file data
 */
export const getFileById = async (params: FileApiParams): Promise<FileItem> => {
  const { trainingCenterId, attendeeId, documentId, fileId } = params;
  
  if (!trainingCenterId || !attendeeId || !documentId || !fileId) {
    throw new Error('Training center ID, attendee ID, document ID, and file ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    const response = await axios.get<FileItem>(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}/files/${fileId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching file ID ${fileId}:`, error);
    throw error;
  }
};

/**
 * Get download URL for a file
 * @param params API parameters including training center ID, attendee ID, document ID, and file ID
 * @returns Promise with download URL
 */
export const getFileDownloadUrl = async (params: FileApiParams): Promise<string> => {
  const { trainingCenterId, attendeeId, documentId, fileId } = params;
  
  if (!trainingCenterId || !attendeeId || !documentId || !fileId) {
    throw new Error('Training center ID, attendee ID, document ID, and file ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    // Use the download-url endpoint if available
    try {
      const response = await axios.get<string>(
        `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}/files/${fileId}/download-url`,
        { headers }
      );
      
      return response.data;
    } catch (downloadUrlError) {
      console.warn('Download URL endpoint failed, falling back to direct download:', downloadUrlError);
      
      // If the download-url endpoint fails, return the direct file URL
      return `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}/files/${fileId}`;
    }
  } catch (error) {
    console.error('Error generating file download URL:', error);
    throw error;
  }
};

// File content cache to avoid repeated API calls for the same file
const fileContentCache: Record<string, { content: string; contentType: string; timestamp: number }> = {};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

// MIME type mapping for common file extensions
const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  html: 'text/html',
  htm: 'text/html',
  xml: 'application/xml',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip'
};

/**
 * Get content type based on file extension
 * @param fileName File name with extension
 * @returns Content type string or null if not recognized
 */
const getContentTypeFromFileName = (fileName: string): string | null => {
  if (!fileName) return null;
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  
  return MIME_TYPES[extension] || null;
};

/**
 * Generate a cache key for a file
 * @param params File API parameters
 * @returns Cache key string
 */
const generateCacheKey = (params: FileApiParams): string => {
  const { trainingCenterId, attendeeId, documentId, fileId } = params;
  return `${trainingCenterId}_${attendeeId}_${documentId}_${fileId}`;
};

/**
 * Get file content as base64 encoded string with caching
 * @param params API parameters including training center ID, attendee ID, document ID, and file ID
 * @returns Promise with file content as base64 and content type
 */
export const getFileContent = async (params: FileApiParams): Promise<{ content: string, contentType: string }> => {
  const { trainingCenterId, attendeeId, documentId, fileId } = params;
  
  if (!trainingCenterId || !attendeeId || !documentId || !fileId) {
    throw new Error('Training center ID, attendee ID, document ID, and file ID are required');
  }
  
  // Check cache first
  const cacheKey = generateCacheKey(params);
  const cachedData = fileContentCache[cacheKey];
  
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_EXPIRATION_MS) {
    return { content: cachedData.content, contentType: cachedData.contentType };
  }
  
  try {
    // Get file metadata first to determine content type and name
    let fileName = '';
    let knownContentType = '';
    
    try {
      const fileData = await getFileById(params);
      fileName = fileData.name || '';
      knownContentType = fileData.contentType || '';
    } catch (metadataError) {
      console.warn('Could not retrieve file metadata:', metadataError);
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
    
    // Use the direct file download endpoint (not /content)
    
    // Get the actual file content
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}/files/${fileId}`,
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
      content = Buffer.from(response.data).toString('base64');
      
      // Validate base64 content
      if (!content || content.length === 0) {
        throw new Error('Base64 conversion resulted in empty string');
      }
      
      // Store in cache
      fileContentCache[cacheKey] = {
        content,
        contentType,
        timestamp: Date.now()
      };
      
      return { content, contentType };
    } catch (conversionError) {
      console.error('Error converting file content to base64:', conversionError);
      throw new Error('Failed to convert file content to base64');
    }
  } catch (error) {
    console.error(`Error fetching content for file ID ${fileId}:`, error);
    
    // Try to provide a more helpful error message
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) {
        throw new Error(`File not found (ID: ${fileId})`);
      } else if (status === 403) {
        throw new Error('You do not have permission to access this file');
      } else if (status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
    }
    
    throw error;
  }
};

/**
 * Upload a file to a document
 * @param params API parameters including training center ID, attendee ID, and document ID
 * @param file File to upload
 * @returns Promise with uploaded file data
 */
export const uploadFile = async (params: FileApiParams, file: File): Promise<FileItem> => {
  const { trainingCenterId, attendeeId, documentId } = params;
  
  if (!trainingCenterId || !attendeeId || !documentId) {
    throw new Error('Training center ID, attendee ID, and document ID are required');
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
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}/files`,
      formData,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Delete a file
 * @param params API parameters including training center ID, attendee ID, document ID, and file ID
 * @returns Promise with success status
 */
export const deleteFile = async (params: FileApiParams): Promise<void> => {
  const { trainingCenterId, attendeeId, documentId, fileId } = params;
  
  if (!trainingCenterId || !attendeeId || !documentId || !fileId) {
    throw new Error('Training center ID, attendee ID, document ID, and file ID are required');
  }
  
  try {
    const token = getAuthToken();
    const headers = getAuthHeaders(token);
    
    await axios.delete(
      `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/attendees/${attendeeId}/documents/${documentId}/files/${fileId}`,
      { headers }
    );
  } catch (error) {
    console.error(`Error deleting file ID ${fileId}:`, error);
    throw error;
  }
};
