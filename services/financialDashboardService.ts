import axios from "axios";
import { getAuthToken } from "@/services/waitlistService";
import { addMonths, format, subMonths, subYears } from "date-fns";

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.seai.co";
const API_VERSION_PATH = "/api/v1";

// Interface for financial dashboard API parameters
export interface FinancialDashboardParams {
  trainingCenterId: string;
  startDate?: string;
  endDate?: string;
}

// Interface for course financial data
export interface CourseFinancialData {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  price: number;
  attendeeCount: number;
  totalRevenue: number;
  expenses: number;
  profit: number;
}

// Interface for monthly revenue data
export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

// Interface for yearly revenue data
export interface YearlyRevenueData {
  year: string;
  revenue: number;
  expenses: number;
  profit: number;
}

// Interface for course type revenue data
export interface CourseTypeRevenueData {
  type: string;
  revenue: number;
  count: number;
  avgAttendees: number;
  avgPrice: number;
}

// Interface for attendee payment data
export interface AttendeePaymentData {
  id: string;
  name: string;
  email: string;
  courseCount: number;
  totalPaid: number;
  unpaidAmount: number;
  lastPaymentDate: string;
}

// Interface for financial dashboard data response
export interface FinancialDashboardData {
  summary: {
    totalCourses: number;
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    avgStudentsPerCourse: number;
    avgCoursePrice: number;
    avgRevenuePerStudent: number;
  };
  courseFinancials: CourseFinancialData[];
  monthlyRevenue: MonthlyRevenueData[];
  yearlyRevenue: YearlyRevenueData[];
  courseTypeRevenue: CourseTypeRevenueData[];
  attendeePayments: AttendeePaymentData[];
  unpaidAttendees: AttendeePaymentData[];
}

/**
 * Get financial dashboard data for a training center
 */
export async function getFinancialDashboardData({
  trainingCenterId,
  startDate,
  endDate
}: FinancialDashboardParams): Promise<FinancialDashboardData> {
  try {
    // If we're in development mode and there's no API, use mock data
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_BASE_URL) {
      console.log('Using mock financial dashboard data in development mode');
      return getMockFinancialDashboardData();
    }

    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // In a real implementation, we would fetch financial data from a dedicated endpoint
    // For now, we'll use mock data since the actual financial endpoints don't exist yet
    return getMockFinancialDashboardData();

  } catch (error) {
    console.error('Error fetching financial dashboard data:', error);
    throw error;
  }
}

/**
 * Get mock financial dashboard data for development
 */
function getMockFinancialDashboardData(): FinancialDashboardData {
  const currentDate = new Date();
  const courseTypes = [
    "Basic Safety", 
    "Advanced Fire Fighting", 
    "Medical First Aid", 
    "Survival Craft", 
    "GMDSS", 
    "Ship Security Officer"
  ];
  
  // Generate mock course financial data
  const courseFinancials: CourseFinancialData[] = [];
  for (let i = 1; i <= 30; i++) {
    const startDate = subMonths(currentDate, Math.floor(Math.random() * 12));
    const endDate = addMonths(startDate, Math.floor(Math.random() * 2) + 1);
    const type = courseTypes[Math.floor(Math.random() * courseTypes.length)];
    const price = Math.floor(Math.random() * 500) + 500;
    const attendeeCount = Math.floor(Math.random() * 20) + 5;
    const totalRevenue = price * attendeeCount;
    const expenses = Math.floor(totalRevenue * (Math.random() * 0.4 + 0.3));
    
    courseFinancials.push({
      id: `course-${i}`,
      name: `${type} Course ${i}`,
      type,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      price,
      attendeeCount,
      totalRevenue,
      expenses,
      profit: totalRevenue - expenses
    });
  }
  
  // Generate monthly revenue data for the last 12 months
  const monthlyRevenue: MonthlyRevenueData[] = [];
  for (let i = 11; i >= 0; i--) {
    const month = subMonths(currentDate, i);
    const revenue = Math.floor(Math.random() * 20000) + 10000;
    const expenses = Math.floor(revenue * (Math.random() * 0.4 + 0.3));
    
    monthlyRevenue.push({
      month: format(month, 'MMM yyyy'),
      revenue,
      expenses,
      profit: revenue - expenses
    });
  }
  
  // Generate yearly revenue data for the last 5 years
  const yearlyRevenue: YearlyRevenueData[] = [];
  for (let i = 4; i >= 0; i--) {
    const year = subYears(currentDate, i);
    const revenue = Math.floor(Math.random() * 200000) + 100000;
    const expenses = Math.floor(revenue * (Math.random() * 0.4 + 0.3));
    
    yearlyRevenue.push({
      year: format(year, 'yyyy'),
      revenue,
      expenses,
      profit: revenue - expenses
    });
  }
  
  // Generate course type revenue data
  const courseTypeRevenue: CourseTypeRevenueData[] = courseTypes.map(type => {
    const typeCourses = courseFinancials.filter(course => course.type === type);
    const revenue = typeCourses.reduce((sum, course) => sum + course.totalRevenue, 0);
    const count = typeCourses.length;
    const totalAttendees = typeCourses.reduce((sum, course) => sum + course.attendeeCount, 0);
    const avgAttendees = count > 0 ? totalAttendees / count : 0;
    const avgPrice = count > 0 ? typeCourses.reduce((sum, course) => sum + course.price, 0) / count : 0;
    
    return {
      type,
      revenue,
      count,
      avgAttendees,
      avgPrice
    };
  });
  
  // Generate attendee payment data
  const attendeePayments: AttendeePaymentData[] = [];
  for (let i = 1; i <= 50; i++) {
    const courseCount = Math.floor(Math.random() * 5) + 1;
    const totalPaid = Math.floor(Math.random() * 3000) + 500;
    const unpaidAmount = Math.random() > 0.7 ? Math.floor(Math.random() * 1000) : 0;
    
    attendeePayments.push({
      id: `attendee-${i}`,
      name: `Attendee ${i}`,
      email: `attendee${i}@example.com`,
      courseCount,
      totalPaid,
      unpaidAmount,
      lastPaymentDate: subMonths(currentDate, Math.floor(Math.random() * 6)).toISOString()
    });
  }
  
  // Filter unpaid attendees
  const unpaidAttendees = attendeePayments.filter(attendee => attendee.unpaidAmount > 0);
  
  // Calculate summary metrics
  const totalCourses = courseFinancials.length;
  const totalRevenue = courseFinancials.reduce((sum, course) => sum + course.totalRevenue, 0);
  const totalExpenses = courseFinancials.reduce((sum, course) => sum + course.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalAttendees = courseFinancials.reduce((sum, course) => sum + course.attendeeCount, 0);
  const avgStudentsPerCourse = totalCourses > 0 ? totalAttendees / totalCourses : 0;
  const avgCoursePrice = totalCourses > 0 ? 
    courseFinancials.reduce((sum, course) => sum + course.price, 0) / totalCourses : 0;
  const avgRevenuePerStudent = totalAttendees > 0 ? totalRevenue / totalAttendees : 0;
  
  return {
    summary: {
      totalCourses,
      totalRevenue,
      totalExpenses,
      totalProfit,
      avgStudentsPerCourse,
      avgCoursePrice,
      avgRevenuePerStudent
    },
    courseFinancials,
    monthlyRevenue,
    yearlyRevenue,
    courseTypeRevenue,
    attendeePayments,
    unpaidAttendees
  };
}
