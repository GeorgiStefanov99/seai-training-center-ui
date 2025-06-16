import axios from "axios";
import { getAuthToken } from "@/services/waitlistService";
import { addMonths, format, subMonths, subYears } from "date-fns";
import { getArchivedCourses } from "@/services/courseService";
import { getArchivedCourseAttendees } from "@/services/courseAttendeeService";
import { Course } from "@/types/course";
import { Attendee } from "@/types/attendee";

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
  percentage: number; // Percentage of total courses
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
    // Fetch archived courses for the training center
    const courses = await getArchivedCourses(trainingCenterId);
    
    // Filter courses by date range if provided
    const filteredCourses = courses.filter((course: Course) => {
      if (!startDate && !endDate) return true;
      
      const courseStartDate = new Date(course.startDate);
      const courseEndDate = new Date(course.endDate);
      
      if (startDate && endDate) {
        const filterStartDate = new Date(startDate);
        const filterEndDate = new Date(endDate);
        // Course overlaps with the date range
        return (
          (courseStartDate >= filterStartDate && courseStartDate <= filterEndDate) ||
          (courseEndDate >= filterStartDate && courseEndDate <= filterEndDate) ||
          (courseStartDate <= filterStartDate && courseEndDate >= filterEndDate)
        );
      } else if (startDate) {
        const filterStartDate = new Date(startDate);
        return courseEndDate >= filterStartDate;
      } else if (endDate) {
        const filterEndDate = new Date(endDate);
        return courseStartDate <= filterEndDate;
      }
      
      return true;
    });
    
    // Transform archived courses data to financial dashboard data format
    return await transformCoursesToFinancialData(filteredCourses, trainingCenterId);
  } catch (error) {
    console.error('Error fetching financial dashboard data:', error);
    throw error;
  }
}

/**
 * Transform archived courses data to financial dashboard data format
 */
async function transformCoursesToFinancialData(courses: Course[], trainingCenterId: string): Promise<FinancialDashboardData> {
  // Debug: Log the courses to see their structure
  console.log('Courses data:', courses.map(course => ({ id: course.id, name: course.name, description: course.description })));
  const currentDate = new Date();
  
  // If no courses are found, return empty data structure
  if (!courses || courses.length === 0) {
    return {
      summary: {
        totalCourses: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        avgStudentsPerCourse: 0,
        avgCoursePrice: 0,
        avgRevenuePerStudent: 0
      },
      courseFinancials: [],
      monthlyRevenue: [],
      yearlyRevenue: [],
      courseTypeRevenue: [],
      attendeePayments: [],
      unpaidAttendees: []
    };
  }
  
  // Get attendees for each course
  const coursesWithAttendees = await Promise.all(courses.map(async (course) => {
    try {
      const attendees = await getArchivedCourseAttendees({
        trainingCenterId,
        courseId: course.id
      });
      return {
        course,
        attendees
      };
    } catch (error) {
      console.error(`Error fetching attendees for course ${course.id}:`, error);
      return {
        course,
        attendees: []
      };
    }
  }));
  
  // Extract course types from courses using the course name
  const courseTypes = Array.from(new Set(courses.map(course => {
    // Use the course name or 'Unknown' if name is empty
    return course.name || 'Unknown';
  })));
  
  // Initialize data structures for aggregating financial data
  const monthlyData = new Map<string, { revenue: number; expenses: number; profit: number }>();
  const yearlyData = new Map<string, { revenue: number; expenses: number; profit: number }>();
  const courseTypeData = new Map<string, { revenue: number; count: number; attendees: number; totalPrice: number }>();
  const attendeeMap = new Map<string, {
    id: string;
    name: string;
    email: string;
    courseCount: number;
    totalPaid: number;
    unpaidAmount: number;
    lastPaymentDate: string;
  }>();
  
  // Initialize last 12 months data
  for (let i = 11; i >= 0; i--) {
    const month = subMonths(currentDate, i);
    const monthKey = format(month, 'MMM yyyy');
    monthlyData.set(monthKey, { revenue: 0, expenses: 0, profit: 0 });
  }
  
  // Initialize last 5 years data
  for (let i = 4; i >= 0; i--) {
    const year = subYears(currentDate, i);
    const yearKey = format(year, 'yyyy');
    yearlyData.set(yearKey, { revenue: 0, expenses: 0, profit: 0 });
  }
  
  // Initialize course type data
  courseTypes.forEach(type => {
    courseTypeData.set(type, { revenue: 0, count: 0, attendees: 0, totalPrice: 0 });
  });
  
  // Transform courses to course financial data
  const courseFinancials: CourseFinancialData[] = coursesWithAttendees.map(({ course, attendees }) => {
    // Calculate financial data based on course information
    const price = course.price || 0;
    const attendeeCount = attendees.length;
    const totalRevenue = price * attendeeCount;
    // Estimate expenses as 40% of revenue (can be adjusted with real data)
    const expenses = Math.floor(totalRevenue * 0.4);
    const profit = totalRevenue - expenses;
    
    // Use the course name as the course type
    const courseType = course.name || 'Unknown';
    
    return {
      id: course.id,
      name: course.name,
      type: courseType,
      startDate: course.startDate,
      endDate: course.endDate,
      price,
      attendeeCount,
      totalRevenue,
      expenses,
      profit
    };
  });
  
  // Process each course and its attendees to populate the data structures
  coursesWithAttendees.forEach(({ course, attendees }) => {
    if (!course || !course.startDate || !course.endDate || !course.price) return;
    
    const courseStartDate = new Date(course.startDate);
    const courseEndDate = new Date(course.endDate);
    const courseMonth = format(courseStartDate, 'MMM yyyy');
    const courseYear = format(courseStartDate, 'yyyy');
    // Use the course name as the course type
    const courseType = course.name || 'Unknown';
    const coursePrice = course.price || 0;
    const attendeeCount = attendees.length;
    const courseRevenue = coursePrice * attendeeCount;
    const courseExpenses = Math.floor(courseRevenue * 0.4); // Estimate expenses as 40% of revenue
    const courseProfit = courseRevenue - courseExpenses;
    
    // Update monthly data if the course month is in our tracked months
    if (monthlyData.has(courseMonth)) {
      const monthData = monthlyData.get(courseMonth)!;
      monthlyData.set(courseMonth, {
        revenue: monthData.revenue + courseRevenue,
        expenses: monthData.expenses + courseExpenses,
        profit: monthData.profit + courseProfit
      });
    }
    
    // Update yearly data if the course year is in our tracked years
    if (yearlyData.has(courseYear)) {
      const yearData = yearlyData.get(courseYear)!;
      yearlyData.set(courseYear, {
        revenue: yearData.revenue + courseRevenue,
        expenses: yearData.expenses + courseExpenses,
        profit: yearData.profit + courseProfit
      });
    }
    
    // Update course type data
    if (courseTypeData.has(courseType)) {
      const typeData = courseTypeData.get(courseType)!;
      courseTypeData.set(courseType, {
        revenue: typeData.revenue + courseRevenue,
        count: typeData.count + 1,
        attendees: typeData.attendees + attendeeCount,
        totalPrice: typeData.totalPrice + coursePrice
      });
    } else {
      courseTypeData.set(courseType, {
        revenue: courseRevenue,
        count: 1,
        attendees: attendeeCount,
        totalPrice: coursePrice
      });
    }
    
    // Process each attendee
    attendees.forEach((attendee: Attendee) => {
      if (!attendee || !attendee.id) return;
      
      const attendeeId = attendee.id;
      const attendeeName = `${attendee.name || ''} ${attendee.surname || ''}`.trim();
      const attendeeEmail = attendee.email || '';
      
      // Assume all attendees in archived courses have paid
      // In a real implementation, you would check payment status
      const coursePaid = true;
      const coursePrice = course.price || 0;
      
      if (attendeeMap.has(attendeeId)) {
        const attendeeData = attendeeMap.get(attendeeId)!;
        attendeeData.courseCount += 1;
        attendeeData.totalPaid += coursePaid ? coursePrice : 0;
        attendeeData.unpaidAmount += !coursePaid ? coursePrice : 0;
        
        const lastPaymentDate = new Date(attendeeData.lastPaymentDate);
        const courseDate = new Date(course.endDate);
        if (coursePaid && courseDate > lastPaymentDate) {
          attendeeData.lastPaymentDate = course.endDate;
        }
      } else {
        attendeeMap.set(attendeeId, {
          id: attendeeId,
          name: attendeeName,
          email: attendeeEmail,
          courseCount: 1,
          totalPaid: coursePaid ? coursePrice : 0,
          unpaidAmount: !coursePaid ? coursePrice : 0,
          lastPaymentDate: coursePaid ? course.endDate : new Date(0).toISOString()
        });
      }
    });
  });
  
  // Convert maps to arrays for the response
  const monthlyRevenue: MonthlyRevenueData[] = Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.profit
    }))
    .sort((a, b) => {
      // Sort by date (month and year)
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  
  const yearlyRevenue: YearlyRevenueData[] = Array.from(yearlyData.entries())
    .map(([year, data]) => ({
      year,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.profit
    }))
    .sort((a, b) => a.year.localeCompare(b.year));
  
  // Calculate total number of courses for percentage calculation
  const totalCourseCount = Array.from(courseTypeData.values()).reduce((sum, data) => sum + data.count, 0);
  
  const courseTypeRevenue: CourseTypeRevenueData[] = Array.from(courseTypeData.entries())
    .map(([type, data]) => ({
      type,
      revenue: data.revenue,
      count: data.count,
      percentage: totalCourseCount > 0 ? Math.round((data.count / totalCourseCount) * 100) : 0,
      avgAttendees: data.count > 0 ? Math.round((data.attendees / data.count) * 10) / 10 : 0,
      avgPrice: data.count > 0 ? Math.round((data.totalPrice / data.count) * 100) / 100 : 0
    }))
    .sort((a, b) => b.revenue - a.revenue); // Sort by revenue (highest first)
  
  const attendeePayments: AttendeePaymentData[] = Array.from(attendeeMap.values())
    .sort((a, b) => b.totalPaid - a.totalPaid); // Sort by total paid (highest first)
    
  const unpaidAttendees: AttendeePaymentData[] = attendeePayments
    .filter(attendee => attendee.unpaidAmount > 0)
    .sort((a, b) => b.unpaidAmount - a.unpaidAmount); // Sort by unpaid amount (highest first)
  
  // Calculate summary metrics
  const totalCourses = courseFinancials.length;
  const totalRevenue = courseFinancials.reduce((sum, course) => sum + course.totalRevenue, 0);
  const totalExpenses = courseFinancials.reduce((sum, course) => sum + course.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const totalAttendees = courseFinancials.reduce((sum, course) => sum + course.attendeeCount, 0);
  const avgStudentsPerCourse = totalCourses > 0 ? Math.round((totalAttendees / totalCourses) * 10) / 10 : 0;
  const avgCoursePrice = totalCourses > 0 ? 
    Math.round((courseFinancials.reduce((sum, course) => sum + course.price, 0) / totalCourses) * 100) / 100 : 0;
  const avgRevenuePerStudent = totalAttendees > 0 ? Math.round((totalRevenue / totalAttendees) * 100) / 100 : 0;
  
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

// Mock data function has been removed as we're now using real data exclusively
