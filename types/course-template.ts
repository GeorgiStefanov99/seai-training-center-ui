// Define the currency options
export type Currency = "USD" | "EUR" | "BGN";

// Base course template properties used for creating and updating
export interface CourseTemplateBase {
  name: string;
  price: number;
  currency: Currency;
  maxSeats: number;
  description: string;
}

// Interface for creating a new course template (POST request)
export interface CreateCourseTemplateRequest extends CourseTemplateBase {}

// Interface for updating an existing course template (PUT request)
export interface UpdateCourseTemplateRequest extends CourseTemplateBase {}

// Full course template interface with all properties (GET response)
export interface CourseTemplate extends CourseTemplateBase {
  id: string;
  trainingCenterId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Response type for the GET course templates endpoint
export type GetCourseTemplatesResponse = CourseTemplate[];

// Parameters for course template API requests
export interface CourseTemplateApiParams {
  trainingCenterId: string;
  courseTemplateId?: string;
}

// Active course interface
export interface ActiveCourse {
  id: string;
  templateId: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  price?: number;
  currency?: Currency;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  maxSeats: number;
  availableSeats: number;
  enrolledAttendees?: number;
  description?: string;
}

// Response type for the GET active courses endpoint
export type GetActiveCoursesResponse = ActiveCourse[];

// Attendee rank type
export type AttendeeRank = "CAPTAIN" | "CHIEF_OFFICER" | "SECOND_OFFICER" | "THIRD_OFFICER" | "CHIEF_ENGINEER" | "SECOND_ENGINEER" | "THIRD_ENGINEER" | "FOURTH_ENGINEER" | "ELECTRICAL_ENGINEER" | "BOSUN" | "ABLE_SEAMAN" | "ORDINARY_SEAMAN" | "FITTER" | "OILER" | "WIPER" | "COOK" | "STEWARD" | "CADET" | "OTHER";

// Waitlist record attendee response
export interface WaitlistAttendeeResponse {
  id: string;
  name: string;
  surname: string;
  email: string;
  telephone: string;
  rank: AttendeeRank;
}

// Waitlist record status
export type WaitlistStatus = "WAITING" | "ENROLLED" | "CONFIRMED" | "CANCELLED" | "DELETED";

// Waitlist record interface
export interface WaitlistRecord {
  id: string;
  trainingCenterId: string;
  attendeeResponse: WaitlistAttendeeResponse;
  templateId?: string; // Keep for backward compatibility
  courseTemplateId: string; // Add this property to match API response
  status: WaitlistStatus;
  timestamp?: string; // Add timestamp from API response
}

// Response type for the GET waitlist records endpoint
export type GetWaitlistRecordsResponse = WaitlistRecord[];
