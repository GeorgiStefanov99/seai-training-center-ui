import axios from "axios";
import { getAuthToken } from "@/services/waitlistService";
import { getPaginatedAttendees } from "@/services/attendeeService";
import { getWaitlistRecords } from "@/services/waitlistService";
import { getCourseTemplates } from "@/services/courseTemplateService";
import { WaitlistRecord, ActiveCourse } from "@/types/course-template";
import { Attendee, AttendeeRank } from "@/types/attendee";
import { CourseTemplate } from "@/types/course-template";

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.seai.co";
const API_VERSION_PATH = "/api/v1";

// Interface for dashboard API parameters
export interface DashboardApiParams {
  trainingCenterId: string;
  timeframe?: string; // e.g., 'week', 'month', 'year'
}

// Interface for dashboard metrics
export interface DashboardMetrics {
  totalAttendees: number;
  totalCourses: number;
  activeCourses: number;
  upcomingCourses: number;
  waitlistCount: number;
  waitingCount: number;
  enrolledCount: number;
  cancelledCount: number;
  capacityUtilization: number;
}

// Interface for enrollment data
export interface EnrollmentData {
  id: string;
  attendeeId: string;
  attendeeName: string;
  attendeeRank: string;
  courseId: string;
  courseName: string;
  enrollmentDate: string;
}

// Interface for rank distribution data
export interface RankDistributionData {
  rank: string;
  count: number;
}

// Interface for dashboard data response
export interface DashboardData {
  metrics: DashboardMetrics;
  recentWaitlist: WaitlistRecord[];
  upcomingCourses: ActiveCourse[];
  recentEnrollments: EnrollmentData[];
  rankDistribution: RankDistributionData[];
}

/**
 * Get dashboard data for a training center by aggregating data from multiple endpoints
 */
export async function getDashboardData({ 
  trainingCenterId,
  timeframe = 'month'
}: DashboardApiParams): Promise<DashboardData> {
  try {
    // If we're in development mode and there's no API, use mock data
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_BASE_URL) {
      console.log('Using mock dashboard data in development mode');
      return getMockDashboardData();
    }

    // Fetch data from multiple endpoints in parallel
    let attendees: Attendee[] = [], waitlistRecords: WaitlistRecord[] = [], courseTemplates: CourseTemplate[] = [];
    let totalAttendees = 0;
    try {
      const results = await Promise.all([
        getPaginatedAttendees(trainingCenterId, { page: 1, size: 1, sortBy: 'name' }).catch(err => {
          console.error('Error fetching paginated attendees:', err);
          return { attendees: [], totalElements: 0 };
        }),
        getWaitlistRecords({ trainingCenterId, timestamp: Date.now() }).catch(err => {
          console.error('Error fetching waitlist records:', err);
          return [];
        }),
        getCourseTemplates(trainingCenterId).catch(err => {
          console.error('Error fetching course templates:', err);
          return [];
        })
      ]);
      // Use paginated attendees for count
      const paginatedAttendees = results[0];
      totalAttendees = paginatedAttendees.totalElements || 0;
      attendees = paginatedAttendees.attendees || [];
      waitlistRecords = Array.isArray(results[1]) ? results[1] : [];
      courseTemplates = Array.isArray(results[2]) ? results[2] : [];
      console.log('Dashboard data fetched (paginated):', {
        attendeesCount: attendees.length,
        totalAttendees,
        waitlistCount: waitlistRecords.length,
        templatesCount: courseTemplates.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data components:', error);
      // Continue with empty arrays to avoid breaking the dashboard
    }

    // Get active courses from course templates
    const activeCourses = Array.isArray(courseTemplates) ? courseTemplates
      .filter(template => template && typeof template === 'object' && template.id && template.name)
      .map(template => ({
        id: `active-${template.id}`,
        templateId: template.id,
        name: template.name,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "SCHEDULED" as const,
        maxSeats: template.maxSeats || 20,
        availableSeats: Math.floor((template.maxSeats || 20) * 0.3),
        enrolledAttendees: Math.floor((template.maxSeats || 20) * 0.7)
      })) : [];

    const totalCourses = courseTemplates.length;
    const activeCoursesCount = activeCourses.length;
    const upcomingCoursesCount = activeCourses.filter((course: ActiveCourse) => 
      new Date(course.startDate) > new Date()).length;
    
    const waitlistCount = waitlistRecords.length;
    const waitingCount = waitlistRecords.filter((record: WaitlistRecord) => 
      record.status === "WAITING").length;
    const enrolledCount = waitlistRecords.filter((record: WaitlistRecord) => 
      record.status === "ENROLLED").length;
    const cancelledCount = waitlistRecords.filter((record: WaitlistRecord) => 
      record.status === "CANCELLED").length;
    
    let capacityUtilization = 0;
    if (activeCourses.length > 0) {
      const totalSeats = activeCourses.reduce((sum: number, course: ActiveCourse) => sum + course.maxSeats, 0);
      const filledSeats = activeCourses.reduce((sum: number, course: ActiveCourse) => sum + (course.enrolledAttendees || 0), 0);
      capacityUtilization = Math.round((filledSeats / totalSeats) * 100) || 0;
    }

    const rankCounts: Record<string, number> = {};
    if (Array.isArray(attendees)) {
      attendees.forEach((attendee: Attendee) => {
        const rank = attendee.rank || 'OTHER';
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
      });
    } else {
      console.warn('Attendees is not an array, skipping rank distribution calculation');
    }

    const rankDistribution = Object.entries(rankCounts).map(([rank, count]) => ({
      rank,
      count
    }));

    const recentWaitlist = Array.isArray(waitlistRecords) ? [...waitlistRecords]
      .filter(record => record && typeof record === 'object')
      .sort((a: WaitlistRecord, b: WaitlistRecord) => {
        const dateA = a && a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b && b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5) : [];

    const upcomingCourses = Array.isArray(activeCourses) ? [...activeCourses]
      .filter((course: ActiveCourse) => course && course.startDate && new Date(course.startDate) > new Date())
      .sort((a: ActiveCourse, b: ActiveCourse) => {
        const dateA = a && a.startDate ? new Date(a.startDate).getTime() : 0;
        const dateB = b && b.startDate ? new Date(b.startDate).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 5) : [];

    const recentEnrollments = Array.isArray(waitlistRecords) ? waitlistRecords
      .filter((record: WaitlistRecord) => 
        record && 
        typeof record === 'object' && 
        record.status === "ENROLLED" && 
        record.attendeeResponse && 
        typeof record.attendeeResponse === 'object'
      )
      .map((record: WaitlistRecord) => ({
        id: record.id || `enrollment-${Math.random().toString(36).substring(2, 9)}`,
        attendeeId: record.attendeeResponse?.id || 'unknown',
        attendeeName: `${record.attendeeResponse?.name || ''} ${record.attendeeResponse?.surname || ''}`.trim() || 'Unknown Attendee',
        attendeeRank: record.attendeeResponse?.rank || 'OTHER',
        courseId: record.courseTemplateId || 'unknown',
        courseName: Array.isArray(courseTemplates) ? 
          courseTemplates.find((t: CourseTemplate) => t && t.id === record.courseTemplateId)?.name || 'Unknown Course' : 
          'Unknown Course',
        enrollmentDate: record.timestamp || new Date().toISOString()
      }))
      .sort((a: EnrollmentData, b: EnrollmentData) => {
        const dateA = a && a.enrollmentDate ? new Date(a.enrollmentDate).getTime() : 0;
        const dateB = b && b.enrollmentDate ? new Date(b.enrollmentDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5) : [];

    return {
      metrics: {
        totalAttendees,
        totalCourses,
        activeCourses: activeCoursesCount,
        upcomingCourses: upcomingCoursesCount,
        waitlistCount,
        waitingCount,
        enrolledCount,
        cancelledCount,
        capacityUtilization
      },
      recentWaitlist,
      upcomingCourses,
      recentEnrollments,
      rankDistribution
    };
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    throw error;
  }
}

/**
 * Get mock dashboard data for development
 */
function getMockDashboardData(): DashboardData {
  return {
    metrics: {
      totalAttendees: 248,
      totalCourses: 12,
      activeCourses: 5,
      upcomingCourses: 5,
      waitlistCount: 35,
      waitingCount: 15,
      enrolledCount: 18,
      cancelledCount: 2,
      capacityUtilization: 78
    },
    recentWaitlist: [
      {
        id: "wl-1",
        trainingCenterId: "tc-1",
        attendeeResponse: {
          id: "att-1",
          name: "John",
          surname: "Smith",
          email: "john.smith@example.com",
          telephone: "+1234567890",
          rank: "CAPTAIN"
        },
        courseTemplateId: "ct-1",
        status: "ENROLLED",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "wl-2",
        trainingCenterId: "tc-1",
        attendeeResponse: {
          id: "att-2",
          name: "Maria",
          surname: "Garcia",
          email: "maria.garcia@example.com",
          telephone: "+1234567891",
          rank: "CHIEF_OFFICER"
        },
        courseTemplateId: "ct-2",
        status: "ENROLLED",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "wl-3",
        trainingCenterId: "tc-1",
        attendeeResponse: {
          id: "att-3",
          name: "Ahmed",
          surname: "Khan",
          email: "ahmed.khan@example.com",
          telephone: "+1234567892",
          rank: "SECOND_OFFICER"
        },
        courseTemplateId: "ct-3",
        status: "WAITING",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "wl-4",
        trainingCenterId: "tc-1",
        attendeeResponse: {
          id: "att-4",
          name: "Emma",
          surname: "Wilson",
          email: "emma.wilson@example.com",
          telephone: "+1234567893",
          rank: "THIRD_OFFICER"
        },
        courseTemplateId: "ct-4",
        status: "WAITING",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "wl-5",
        trainingCenterId: "tc-1",
        attendeeResponse: {
          id: "att-5",
          name: "Carlos",
          surname: "Rodriguez",
          email: "carlos.rodriguez@example.com",
          telephone: "+1234567894",
          rank: "CHIEF_ENGINEER"
        },
        courseTemplateId: "ct-5",
        status: "CANCELLED",
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    upcomingCourses: [
      {
        id: "c-1",
        templateId: "ct-1",
        name: "Advanced Navigation",
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        enrolledAttendees: 18,
        maxSeats: 20,
        availableSeats: 2,
        status: "SCHEDULED"
      },
      {
        id: "c-2",
        templateId: "ct-2",
        name: "Safety Procedures",
        startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        enrolledAttendees: 15,
        maxSeats: 25,
        availableSeats: 10,
        status: "SCHEDULED"
      },
      {
        id: "c-3",
        templateId: "ct-3",
        name: "Maritime Law",
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        enrolledAttendees: 12,
        maxSeats: 20,
        availableSeats: 8,
        status: "SCHEDULED"
      },
      {
        id: "c-4",
        templateId: "ct-4",
        name: "Emergency Response",
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        enrolledAttendees: 22,
        maxSeats: 25,
        availableSeats: 3,
        status: "SCHEDULED"
      },
      {
        id: "c-5",
        templateId: "ct-5",
        name: "Engine Maintenance",
        startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        enrolledAttendees: 8,
        maxSeats: 15,
        availableSeats: 7,
        status: "SCHEDULED"
      }
    ],
    recentEnrollments: [
      {
        id: "e-1",
        attendeeId: "att-1",
        attendeeName: "John Smith",
        attendeeRank: "CAPTAIN",
        courseId: "c-1",
        courseName: "Advanced Navigation",
        enrollmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "e-2",
        attendeeId: "att-2",
        attendeeName: "Maria Garcia",
        attendeeRank: "CHIEF_OFFICER",
        courseId: "c-2",
        courseName: "Safety Procedures",
        enrollmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "e-3",
        attendeeId: "att-3",
        attendeeName: "Ahmed Khan",
        attendeeRank: "SECOND_OFFICER",
        courseId: "c-3",
        courseName: "Maritime Law",
        enrollmentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "e-4",
        attendeeId: "att-4",
        attendeeName: "Emma Wilson",
        attendeeRank: "THIRD_OFFICER",
        courseId: "c-4",
        courseName: "Emergency Response",
        enrollmentDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "e-5",
        attendeeId: "att-5",
        attendeeName: "Carlos Rodriguez",
        attendeeRank: "CHIEF_ENGINEER",
        courseId: "c-5",
        courseName: "Engine Maintenance",
        enrollmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    rankDistribution: [
      { rank: "CAPTAIN", count: 35 },
      { rank: "CHIEF_OFFICER", count: 28 },
      { rank: "SECOND_OFFICER", count: 42 },
      { rank: "THIRD_OFFICER", count: 31 },
      { rank: "CHIEF_ENGINEER", count: 22 },
      { rank: "SECOND_ENGINEER", count: 18 },
      { rank: "THIRD_ENGINEER", count: 15 },
      { rank: "OTHER", count: 57 }
    ]
  };
}
