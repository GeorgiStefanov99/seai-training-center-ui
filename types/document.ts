// Document types
export interface Document {
  id: string;
  name: string;
  number: string;
  issueDate?: string;
  expiryDate?: string;
  isVerified: boolean;
  attendeeId: string;
  path?: string;
  files?: FileItem[];
  documentFiles?: any[]; // API returns documentFiles instead of files
  verified?: boolean; // API uses verified instead of isVerified
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

export interface FileApiParams {
  trainingCenterId: string;
  attendeeId: string;
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

