/**
 * Error handling utilities for the Seafarer Management System
 * 
 * This file contains centralized error handling functions used across the application
 * to ensure consistent error messaging and logging.
 */

import { toast } from "@/components/ui/use-toast"

/**
 * Error types for categorizing different kinds of errors
 */
export enum ErrorType {
  API = "API Error",
  VALIDATION = "Validation Error",
  AUTHENTICATION = "Authentication Error",
  NETWORK = "Network Error",
  UNKNOWN = "Unknown Error"
}

/**
 * Interface for standardized error handling
 */
export interface ErrorDetails {
  type: ErrorType;
  message: string;
  code?: string | number;
  context?: Record<string, any>;
}

/**
 * Handles API errors with consistent messaging and logging
 * @param error The error object from the API call
 * @param context Additional context about the error
 * @returns Standardized error details
 */
export function handleApiError(error: any, context?: Record<string, any>): ErrorDetails {
  console.error("API Error:", error, context);
  
  let message = "An error occurred while communicating with the server";
  let code: string | number | undefined = undefined;
  
  // Handle different types of API errors
  if (error.response) {
    // Server responded with an error status
    code = error.response.status;
    
    if (error.response.data && error.response.data.message) {
      message = error.response.data.message;
    } else {
      switch (error.response.status) {
        case 400:
          message = "Bad request. Please check your input.";
          break;
        case 401:
          message = "Unauthorized. Please log in again.";
          break;
        case 403:
          message = "You don't have permission to access this resource.";
          break;
        case 404:
          message = "The requested resource was not found.";
          break;
        case 500:
          message = "Server error. Please try again later.";
          break;
        default:
          message = `Server error (${error.response.status}). Please try again later.`;
      }
    }
  } else if (error.request) {
    // Request was made but no response received
    message = "No response from server. Please check your internet connection.";
    code = "NO_RESPONSE";
  } else if (error.message) {
    // Error setting up the request
    message = error.message;
    code = "REQUEST_SETUP";
  }
  
  return {
    type: ErrorType.API,
    message,
    code,
    context
  };
}

/**
 * Handles validation errors with consistent messaging
 * @param error The validation error object
 * @param context Additional context about the error
 * @returns Standardized error details
 */
export function handleValidationError(error: any, context?: Record<string, any>): ErrorDetails {
  console.error("Validation Error:", error, context);
  
  let message = "Please check your input and try again";
  
  if (error.message) {
    message = error.message;
  } else if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
    message = error.errors[0].message || message;
  }
  
  return {
    type: ErrorType.VALIDATION,
    message,
    context
  };
}

/**
 * Handles network errors with consistent messaging
 * @param error The network error object
 * @param context Additional context about the error
 * @returns Standardized error details
 */
export function handleNetworkError(error: any, context?: Record<string, any>): ErrorDetails {
  console.error("Network Error:", error, context);
  
  return {
    type: ErrorType.NETWORK,
    message: "Network error. Please check your internet connection and try again.",
    context
  };
}

/**
 * Displays an error toast with consistent styling
 * @param errorDetails The error details to display
 */
export function showErrorToast(errorDetails: ErrorDetails): void {
  toast({
    variant: "destructive",
    title: errorDetails.type,
    description: errorDetails.message,
  });
}

/**
 * Handles sailor ID validation errors
 * @param sailorId The sailor ID to validate
 * @param context Additional context about the error
 * @returns Error details if validation fails, null otherwise
 */
export function validateSailorId(sailorId: string | null | undefined, context?: Record<string, any>): ErrorDetails | null {
  if (!sailorId) {
    const errorDetails = {
      type: ErrorType.VALIDATION,
      message: "Missing sailor information. Please ensure a sailor is selected.",
      context
    };
    console.error("Sailor ID Validation Error:", errorDetails);
    return errorDetails;
  }
  return null;
}

/**
 * Handles document validation errors
 * @param documentId The document ID to validate
 * @param context Additional context about the error
 * @returns Error details if validation fails, null otherwise
 */
export function validateDocumentId(documentId: string | null | undefined, context?: Record<string, any>): ErrorDetails | null {
  if (!documentId) {
    const errorDetails = {
      type: ErrorType.VALIDATION,
      message: "Missing document information. Please ensure a document is selected.",
      context
    };
    console.error("Document ID Validation Error:", errorDetails);
    return errorDetails;
  }
  return null;
}
