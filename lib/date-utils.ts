/**
 * Date utility functions for the Seafarer Management System
 * 
 * This file contains centralized date handling functions used across the application
 * to ensure consistent date formatting, validation, and conversion.
 */

/**
 * Converts a date string to DD/MM/YYYY format for display
 * @param date Date string in any format (ISO, YYYY-MM-DD, etc.)
 * @returns Formatted date string in DD/MM/YYYY format
 */
export function formatDateForDisplay(date: string | null | undefined): string {
  if (!date) return '';
  
  // If it's already in dd/mm/yyyy format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return date;
  
  // Convert from ISO or yyyy-mm-dd to dd/mm/yyyy
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  } catch (error) {
    return '';
  }
}

/**
 * Converts a date string from DD/MM/YYYY format to ISO format for API communication
 * @param dateStr Date string in DD/MM/YYYY format
 * @returns ISO formatted date string
 */
export function formatDateForApi(dateStr: string): string {
  if (!dateStr) return '';
  
  // Convert from dd/mm/yyyy to ISO
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/').map(Number);
    // Create date with the exact day (avoid timezone issues)
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return date.toISOString();
  }
  
  // If it's already in ISO or yyyy-mm-dd format
  const date = new Date(dateStr);
  // Ensure we're using UTC with noon time to avoid date shifts
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0
  ));
  return utcDate.toISOString();
}

/**
 * Formats a date value as the user types, automatically adding slashes
 * @param value The input value from the date field
 * @returns Formatted date string with slashes added automatically
 */
export function formatDateValue(value: string): string {
  // Remove any non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Add slashes automatically
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/**
 * Formats a date input with automatic slashes as the user types
 * @param value The input value from the date field
 * @returns Formatted date string with slashes added automatically
 */
export const formatDateInput = (value: string): string => {
  // Remove any non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Format with slashes
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
};

/**
 * Validates if a date string is in valid DD/MM/YYYY format and represents a valid date
 * @param dateStr Date string to validate
 * @returns Boolean indicating if the date is valid
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return true; // Empty is valid
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
  
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.getDate() === day && 
         date.getMonth() === month - 1 && 
         date.getFullYear() === year;
}

/**
 * Calculates age based on birth date
 * @param birthDate Birth date string in any format
 * @returns Age in years or null if invalid date
 */
export function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;
  try {
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
}

/**
 * Formats a date for display in the UI with a different format (DD-MM-YYYY)
 * @param dateString Date string to format
 * @returns Formatted date string or status message
 */
export function formatDisplayDate(dateString: string | undefined): string {
  if (!dateString) return "Not set";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    return "Invalid date";
  }
}

/**
 * Validates a date and checks if it falls within acceptable range
 * @param dateStr Date string to validate
 * @param type Type of date (birth, availability, or assignment)
 * @returns Object with validation result and error message
 */
export function validateDateRange(dateStr: string, type: 'birth' | 'availability' | 'assignment'): { isValid: boolean; errorMessage?: string } {
  if (!dateStr) return { isValid: true };
  
  try {
    // First check if the date format is valid
    if (!isValidDate(dateStr)) {
      return { 
        isValid: false, 
        errorMessage: 'Please enter a valid date in DD/MM/YYYY format'
      };
    }
    
    // Parse the date
    const [day, month, year] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    const currentYear = new Date().getFullYear();
    
    // Check range based on date type
    if (type === 'birth') {
      if (year < 1900 || year > currentYear) {
        return { 
          isValid: false, 
          errorMessage: `Date of Birth year must be between 1900 and ${currentYear}`
        };
      }
    } else if (type === 'availability') {
      if (year < currentYear || year > currentYear + 5) {
        return { 
          isValid: false, 
          errorMessage: `Availability Date year must be between ${currentYear} and ${currentYear + 5}`
        };
      }
    } else if (type === 'assignment') {
      if (year < currentYear || year > currentYear + 5) {
        return { 
          isValid: false, 
          errorMessage: `Assignment Date year must be between ${currentYear} and ${currentYear + 5}`
        };
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      errorMessage: `Invalid date`
    };
  }
}
