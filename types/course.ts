// Time format should be a string in format HH:mm:ss

// Base course properties used for creating and updating
export interface CourseBase {
  name: string;
  startDate: string;
  endDate: string;
  startTime: string; // Format: "HH:mm:ss"
  endTime: string; // Format: "HH:mm:ss"
  price: number;
  currency: string;
  maxSeats: number;
  description: string;
  templateId?: string;
}

// Interface for creating a new course (POST request)
export interface CreateCourseRequest extends CourseBase {}

// Interface for updating an existing course (PUT request)
export interface UpdateCourseRequest extends CourseBase {}

// Full course interface with all properties (GET response)
export interface Course extends CourseBase {
  id: string;
  trainingCenterId: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  enrolledAttendees: number;
  createdAt?: string;
  updatedAt?: string;
}

// Response type for the GET courses endpoint
export type GetCoursesResponse = Course[];

// Parameters for course API requests
export interface CourseApiParams {
  trainingCenterId: string;
  courseId?: string;
  templateId?: string;
}
