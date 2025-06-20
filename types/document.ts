// Document types
export interface Document {
  id: string;
  name: string;
  number: string;
  issueDate?: string;
  expiryDate?: string;
  isVerified: boolean;
  verified?: boolean;
  attendeeId: string;
  path?: string;
  documentFiles?: FileItem[]; // Changed from files to documentFiles to match backend
}

// Training Center Document types
export interface TrainingCenterDocument {
  id: string;
  trainingCenterId: string;
  name: string;
  number: string;
  issueDate?: string;
  expiryDate?: string;
  createdDate: string;
  path?: string;
  isVerified: boolean;
  documentFiles?: FileItem[]; // For consistency with attendee documents
}

// File types
export interface FileItem {
  id?: string;
  name?: string;
  size?: number;
  contentType?: string;
  createdAt?: string;
  updatedAt?: string;
  url?: string;
  // For files returned by includeFiles API
  headers?: {
    'Content-Type'?: string[];
    'Content-Length'?: string[];
    'Content-Disposition'?: string[];
    'Cache-Control'?: string[];
    [key: string]: string[] | undefined;
  };
  body?: string;
}

// API parameters
export interface DocumentApiParams {
  trainingCenterId: string;
  attendeeId: string;
  documentId?: string;
  includeFiles?: boolean;
}

export interface TrainingCenterDocumentApiParams {
  trainingCenterId: string;
  documentId?: string;
  includeFiles?: boolean;
}

export interface FileApiParams {
  trainingCenterId: string;
  attendeeId: string;
  documentId: string;
  fileId?: string;
}

export interface TrainingCenterFileApiParams {
  trainingCenterId: string;
  documentId: string;
  fileId?: string;
}

// Request types
export interface CreateDocumentRequest {
  name: string;
  number?: string;
  issueDate?: string;
  expiryDate?: string;
  verified?: boolean;
}

export interface CreateTrainingCenterDocumentRequest {
  name: string;
  number: string;
  issueDate?: string;
  expiryDate?: string;
  isVerified: boolean;
}

export interface UpdateTrainingCenterDocumentRequest {
  name: string;
  number: string;
  issueDate?: string;
  expiryDate?: string;
  isVerified: boolean;
}

