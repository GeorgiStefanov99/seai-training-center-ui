import { toast } from "sonner"
import { ErrorType, handleApiError, handleNetworkError, showErrorToast } from "./error-utils"

/**
 * Base API URL from environment variable
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"

/**
 * Default headers for API requests
 */
export const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
}

/**
 * Redirects to the home page
 * This is used when a JWT token expires
 */
export function redirectToHome() {
  // Check if we're in the browser environment
  if (typeof window !== 'undefined') {
    // Clear any auth data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Show a toast notification
    toast.error("Your session has expired. Please log in again.");
    
    // Redirect to home page after a short delay to allow the toast to be seen
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  }
}

/**
 * Checks if an error is due to JWT expiration
 * @param error The error object or message
 * @returns True if the error is due to JWT expiration
 */
export function isJwtExpiredError(error: any): boolean {
  if (!error) return false;
  
  // Check error message
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || (error.response?.data?.message || '');
  
  return (
    errorMessage.includes('JWT token is expired!') ||
    (error.response?.status === 401)
  );
}

/**
 * Handles API response with consistent error handling and authentication checks
 * @param response The fetch Response object
 * @param useAuth Auth context for handling authentication issues (optional)
 * @returns Parsed response data or null
 */
export async function handleApiResponse(response: Response, useAuth: any = null) {
  if (response.status === 401) {
    // JWT expired or invalid
    if (useAuth && typeof useAuth.logout === 'function') {
      useAuth.logout();
    } else {
      // If no auth context is provided, handle the redirection directly
      redirectToHome();
    }
    
    throw new Error("Session expired. Please log in again.");
  }
  
  if (!response.ok) {
    let errorMessage = "An error occurred";
    let errorData = null;
    
    try {
      errorData = await response.json();
      errorMessage = errorData?.message || errorMessage;
      
      // Check for JWT expiration in error message
      if (isJwtExpiredError(errorMessage)) {
        if (useAuth && typeof useAuth.logout === 'function') {
          useAuth.logout();
        } else {
          redirectToHome();
        }
      }
    } catch (e) {
      // If JSON parsing fails, use default message
    }
    
    throw new Error(errorMessage);
  }

  // Handle successful response
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error("Failed to parse server response");
  }
}

/**
 * Makes an API request with standardized error handling
 * @param url The API endpoint URL
 * @param options Fetch options
 * @param useAuth Auth context for handling authentication issues (optional)
 * @returns Parsed response data
 */
export async function apiRequest(url: string, options: RequestInit = {}, useAuth: any = null) {
  try {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    // Get auth token if available
    let headers: Record<string, string> = { ...DEFAULT_HEADERS };
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
    
    return await handleApiResponse(response, useAuth);
  } catch (error: any) {
    // Check if this is a JWT expiration error
    if (isJwtExpiredError(error)) {
      if (useAuth && typeof useAuth.logout === 'function') {
        useAuth.logout();
      } else {
        redirectToHome();
      }
      throw error;
    }
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      const networkError = handleNetworkError(error, { url });
      showErrorToast(networkError);
      throw error;
    }
    
    const apiError = handleApiError(error, { url });
    showErrorToast(apiError);
    throw error;
  }
}

/**
 * Makes a GET request to the API
 * @param url The API endpoint URL
 * @param useAuth Auth context for handling authentication issues
 * @returns Parsed response data
 */
export async function apiGet(url: string, useAuth: any = null) {
  return apiRequest(url, { method: 'GET' }, useAuth);
}

/**
 * Makes a POST request to the API
 * @param url The API endpoint URL
 * @param data Request body data
 * @param useAuth Auth context for handling authentication issues
 * @returns Parsed response data
 */
export async function apiPost(url: string, data: any, useAuth: any = null) {
  return apiRequest(
    url, 
    { 
      method: 'POST',
      body: JSON.stringify(data),
    },
    useAuth
  );
}

/**
 * Makes a PUT request to the API
 * @param url The API endpoint URL
 * @param data Request body data
 * @param useAuth Auth context for handling authentication issues
 * @returns Parsed response data
 */
export async function apiPut(url: string, data: any, useAuth: any = null) {
  return apiRequest(
    url, 
    { 
      method: 'PUT',
      body: JSON.stringify(data),
    },
    useAuth
  );
}

/**
 * Makes a DELETE request to the API
 * @param url The API endpoint URL
 * @param useAuth Auth context for handling authentication issues
 * @returns Parsed response data
 */
export async function apiDelete(url: string, useAuth: any = null) {
  return apiRequest(url, { method: 'DELETE' }, useAuth);
}

/**
 * Handles API errors and displays a toast notification
 * @param error The error object
 * @param context Additional context about the error
 */
export function handleApiErrorWithToast(error: any, context?: Record<string, any>) {
  // Check if this is a JWT expiration error
  if (isJwtExpiredError(error)) {
    redirectToHome();
    return {
      type: ErrorType.AUTHENTICATION,
      message: "Session expired. Please log in again.",
      context
    };
  }
  
  const errorDetails = handleApiError(error, context);
  showErrorToast(errorDetails);
  return errorDetails;
}
