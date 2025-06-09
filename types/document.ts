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
}

// File types
export interface FileItem {
  id: string;
  name: string;
  size: number;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
}

// API parameters
export interface DocumentApiParams {
  trainingCenterId: string;
  attendeeId: string;
  documentId?: string;
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

// Document types for dropdown
export const DOCUMENT_TYPES = [
  'Passport',
  'Identity Card',
  'Driving License',
  'Certificate',
  'Medical Certificate',
  'Training Certificate',
  'Other'
];
