/**
 * Duration utility functions for the Seafarer Management System
 * 
 * This file contains centralized duration calculation functions used across the application
 * to ensure consistent duration formatting and calculations.
 */

/**
 * Calculates the duration between two dates and formats it in a human-readable format
 * @param startDate Start date string in any format
 * @param endDate End date string in any format
 * @returns Formatted duration string (e.g., "2 y 3 m" or "5 d")
 */
export function calculateDuration(startDate: string | null | undefined, endDate: string | null | undefined): string {
  if (!startDate || !endDate) return "-"
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Check for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-"
  
  // Calculate the difference in milliseconds
  const diffTime = Math.abs(end.getTime() - start.getTime())
  
  // Convert to days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Calculate years, months and days
  const years = Math.floor(diffDays / 365)
  const remainingDays = diffDays % 365
  const months = Math.floor(remainingDays / 30)
  const days = remainingDays % 30
  
  // Format the output in compact format (e.g., "2 y 3 m")
  if (years === 0 && months === 0) {
    return `${days} d`
  } else if (years === 0) {
    return days > 0 ? `${months} m ${days} d` : `${months} m`
  } else if (months === 0) {
    return days > 0 ? `${years} y ${days} d` : `${years} y`
  } else {
    return days > 0 ? `${years} y ${months} m ${days} d` : `${years} y ${months} m`
  }
}

/**
 * Calculates the duration between two dates and formats it in a verbose format
 * @param startDate Start date string in any format
 * @param endDate End date string in any format
 * @returns Verbose formatted duration string (e.g., "2 years, 3 months, 5 days")
 */
export function calculateDurationVerbose(startDate: string | null | undefined, endDate: string | null | undefined): string {
  if (!startDate || !endDate) return "-"
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Check for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-"
  
  // Calculate the difference in milliseconds
  const diffTime = Math.abs(end.getTime() - start.getTime())
  
  // Convert to days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Calculate years, months and days
  const years = Math.floor(diffDays / 365)
  const remainingDays = diffDays % 365
  const months = Math.floor(remainingDays / 30)
  const days = remainingDays % 30
  
  // Format the output in verbose format (e.g., "2 years, 3 months, 5 days")
  if (years === 0 && months === 0) {
    return days === 0 ? "< 1 day" : `${days} days`
  } else if (years === 0) {
    return days > 0 ? `${months} months, ${days} days` : `${months} months`
  } else if (months === 0) {
    return days > 0 ? `${years} years, ${days} days` : `${years} years`
  } else {
    return days > 0 ? `${years} years, ${months} months, ${days} days` : `${years} years, ${months} months`
  }
}

/**
 * Sums up the durations between multiple start and end date pairs
 * @param startDates Array of start date strings
 * @param endDates Array of end date strings
 * @returns Formatted total duration string in verbose format
 */
export function sumDurations(startDates: (string | null | undefined)[], endDates: (string | null | undefined)[]): string {
  let totalDays = 0
  
  for (let i = 0; i < startDates.length; i++) {
    if (startDates[i] && endDates[i]) {
      const start = new Date(startDates[i]!)
      const end = new Date(endDates[i]!)
      
      // Skip invalid dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue
      
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      totalDays += diffDays
    }
  }
  
  // Calculate years, months and days
  const years = Math.floor(totalDays / 365)
  const remainingDays = totalDays % 365
  const months = Math.floor(remainingDays / 30)
  const days = remainingDays % 30
  
  // Format the output in verbose format
  if (years === 0 && months === 0) {
    return days === 0 ? "< 1 day" : `${days} days`
  } else if (years === 0) {
    return days > 0 ? `${months} months, ${days} days` : `${months} months`
  } else if (months === 0) {
    return days > 0 ? `${years} years, ${days} days` : `${years} years`
  } else {
    return days > 0 ? `${years} years, ${months} months, ${days} days` : `${years} years, ${months} months`
  }
}

/**
 * Sums up the durations between multiple start and end date pairs and returns in compact format
 * @param startDates Array of start date strings
 * @param endDates Array of end date strings
 * @returns Formatted total duration string in compact format (e.g., "2 y 3 m")
 */
export function sumDurationsCompact(startDates: (string | null | undefined)[], endDates: (string | null | undefined)[]): string {
  let totalDays = 0
  
  for (let i = 0; i < startDates.length; i++) {
    if (startDates[i] && endDates[i]) {
      const start = new Date(startDates[i]!)
      const end = new Date(endDates[i]!)
      
      // Skip invalid dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) continue
      
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      totalDays += diffDays
    }
  }
  
  // Calculate years, months and days
  const years = Math.floor(totalDays / 365)
  const remainingDays = totalDays % 365
  const months = Math.floor(remainingDays / 30)
  const days = remainingDays % 30
  
  // Format the output in compact format
  if (years === 0 && months === 0) {
    return `${days} d`
  } else if (years === 0) {
    return days > 0 ? `${months} m ${days} d` : `${months} m`
  } else if (months === 0) {
    return days > 0 ? `${years} y ${days} d` : `${years} y`
  } else {
    return days > 0 ? `${years} y ${months} m ${days} d` : `${years} y ${months} m`
  }
}

/**
 * Calculates the duration between two dates in months
 * @param startDate The start date (ISO string, Date object, or null/undefined)
 * @param endDate The end date (ISO string, Date object, or null/undefined)
 * @returns The duration in months or null if dates are invalid
 */
export function getDurationInMonths(startDate: string | Date | null | undefined, endDate: string | Date | null | undefined): number | null {
  if (!startDate || !endDate) return null;
  
  // Convert to Date objects if they are strings
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  // Check for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  
  // Calculate the difference in milliseconds
  const diffTime = Math.abs(end.getTime() - start.getTime());
  
  // Convert to days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Convert to months (approximate)
  return diffDays / 30;
}
