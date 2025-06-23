import axios from 'axios';
import { ResetPasswordRequest, ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordResponse } from "@/types/auth";

// Storage keys from useAuth.tsx
const STORAGE_KEYS = {
  USER_ID: 'seai_user_id',
  ACCESS_TOKEN: 'seai_access_token',
  EMAIL: 'seai_email',
  AUTH_STATE: 'seai_auth_state'
};

// Helper function to get the authentication token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try to get the token directly from localStorage
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    // If not found, try to get from the auth state object
    if (!token) {
      const authStateStr = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      if (authStateStr) {
        try {
          const authState = JSON.parse(authStateStr);
          return authState.accessToken;
        } catch (e) {
          console.error('Error parsing auth state:', e);
        }
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to get auth headers
export const getAuthHeaders = (token: string | null): { Authorization: string } | {} => {
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Base API URL - should be configured from environment variables in a real app
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.seai.co';

// API version path
const API_VERSION_PATH = '/api/v1';

export class PasswordService {
  /**
   * Request password reset for forgotten password
   */
  static async requestPasswordReset(email: string): Promise<ResetPasswordResponse> {
    try {
      const response = await axios.post<ResetPasswordResponse>(
        "/api/forgot-password",
        { email } as ResetPasswordRequest
      );

      return response.data;
    } catch (error: any) {
      console.error("Password reset request error:", error);
      throw error;
    }
  }

  /**
   * Change password for authenticated user
   */
  static async changePassword(
    trainingCenterId: string,
    changePasswordRequest: ChangePasswordRequest
  ): Promise<ResetPasswordResponse> {
    try {
      const token = getAuthToken();
      const headers = getAuthHeaders(token);

      const response = await axios.patch<ResetPasswordResponse>(
        `/api/change-password?trainingCenterId=${trainingCenterId}`,
        changePasswordRequest,
        { 
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  }

  /**
   * Reset password using token from email
   */
  static async resetPassword(
    token: string,
    resetPasswordRequest: ForgotPasswordRequest
  ): Promise<ResetPasswordResponse> {
    try {
      const response = await axios.patch<ResetPasswordResponse>(
        `/api/reset-password?token=${encodeURIComponent(token)}`,
        resetPasswordRequest
      );

      return response.data;
    } catch (error) {
      console.error("Reset password error:", error);
      throw error;
    }
  }

  /**
   * Client-side validation for password change
   */
  static validateChangePasswordRequest(request: ChangePasswordRequest): string | null {
    if (!request.oldPassword) {
      return "Old password is required";
    }
    if (!request.newPassword) {
      return "New password is required";
    }
    if (!request.confirmPassword) {
      return "Please confirm your new password";
    }
    if (request.newPassword !== request.confirmPassword) {
      return "Passwords do not match";
    }
    if (request.newPassword.length < 6) {
      return "New password must be at least 6 characters long";
    }
    return null;
  }

  /**
   * Client-side validation for password reset
   */
  static validateResetPasswordRequest(request: ForgotPasswordRequest): string | null {
    if (!request.newPassword) {
      return "New password is required";
    }
    if (!request.confirmPassword) {
      return "Please confirm your new password";
    }
    if (request.newPassword !== request.confirmPassword) {
      return "Passwords do not match";
    }
    if (request.newPassword.length < 6) {
      return "New password must be at least 6 characters long";
    }
    return null;
  }
} 