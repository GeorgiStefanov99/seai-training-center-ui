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

// Base API URL - directly to backend since we can't use API routes in static export
const API_BASE_URL = 'https://api.seai.co';
const API_VERSION_PATH = '/api/v1';

export class PasswordService {
  /**
   * Request password reset for forgotten password
   */
  static async requestPasswordReset(email: string): Promise<ResetPasswordResponse> {
    try {
      console.log('=== FRONTEND PASSWORD SERVICE DEBUG ===');
      console.log('Email being sent:', email);
      const payload = { email } as ResetPasswordRequest;
      console.log('Payload being sent to backend:', payload);
      
      const backendUrl = `${API_BASE_URL}${API_VERSION_PATH}/training-centers/forgot-password`;
      console.log('Backend URL:', backendUrl);
      
      const response = await axios.post<ResetPasswordResponse>(
        backendUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );


      console.log('=== END FRONTEND DEBUG ===');
      return response.data;
    } catch (error: any) {

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

      const backendUrl = `${API_BASE_URL}${API_VERSION_PATH}/training-centers/${trainingCenterId}/change-password`;
      
      const response = await axios.patch<ResetPasswordResponse>(
        backendUrl,
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
      const backendUrl = `${API_BASE_URL}${API_VERSION_PATH}/training-centers/reset-password?token=${encodeURIComponent(token)}`;
      
      const response = await axios.patch<ResetPasswordResponse>(
        backendUrl,
        resetPasswordRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
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