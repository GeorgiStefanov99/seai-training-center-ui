/**
 * Authentication utilities for the Seafarer Management System
 * 
 * This file contains centralized authentication-related functions used across the application
 * to ensure consistent auth handling and token management.
 */

import { redirectToHome } from "./api-utils";
import { ErrorType } from "./error-utils";

/**
 * Interface for user data
 */
export interface UserData {
  id: string;
  email: string;
  name?: string;
  role?: string;
  permissions?: string[];
  [key: string]: any;
}

/**
 * Interface for authentication token data
 */
export interface TokenData {
  token: string;
  expiresAt?: number;
}

/**
 * Gets the current authentication token from localStorage
 * @returns The authentication token or null if not found
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Sets the authentication token in localStorage
 * @param token The authentication token to set
 * @param expiresIn Expiration time in seconds (optional)
 */
export function setAuthToken(token: string, expiresIn?: number): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('token', token);
  
  // If expiration time is provided, store it
  if (expiresIn) {
    const expiresAt = Date.now() + (expiresIn * 1000);
    localStorage.setItem('tokenExpiresAt', expiresAt.toString());
  }
}

/**
 * Gets the current user data from localStorage
 * @returns The user data or null if not found
 */
export function getCurrentUser(): UserData | null {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Sets the current user data in localStorage
 * @param user The user data to set
 */
export function setCurrentUser(user: UserData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Checks if the user is authenticated
 * @returns True if the user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  
  // Check if token is expired
  const expiresAt = localStorage.getItem('tokenExpiresAt');
  if (expiresAt) {
    const expiryTime = parseInt(expiresAt, 10);
    if (Date.now() > expiryTime) {
      // Token is expired, clear auth data
      clearAuthData();
      return false;
    }
  }
  
  return true;
}

/**
 * Clears all authentication data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiresAt');
}

/**
 * Logs out the user and redirects to home page
 */
export function logout(): void {
  clearAuthData();
  redirectToHome();
}

/**
 * Checks if the user has the required role
 * @param requiredRole The role to check for
 * @returns True if the user has the required role
 */
export function hasRole(requiredRole: string): boolean {
  const user = getCurrentUser();
  if (!user || !user.role) return false;
  
  return user.role === requiredRole;
}

/**
 * Checks if the user has the required permission
 * @param requiredPermission The permission to check for
 * @returns True if the user has the required permission
 */
export function hasPermission(requiredPermission: string): boolean {
  const user = getCurrentUser();
  if (!user || !user.permissions) return false;
  
  return user.permissions.includes(requiredPermission);
}

/**
 * Creates an Authorization header with the current token
 * @returns Authorization header object or empty object if no token
 */
export function getAuthHeader(): Record<string, string> {
  const token = getAuthToken();
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Decodes a JWT token to get its payload
 * @param token The JWT token to decode
 * @returns The decoded payload or null if invalid
 */
export function decodeToken(token: string): any {
  try {
    // Get the payload part of the JWT (second part)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
