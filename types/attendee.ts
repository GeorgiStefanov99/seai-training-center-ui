// Define the possible ranks for attendees
import { Remark } from "./remark";
import { Course } from "./course";
import { WaitlistRecord } from "./course-template";

export type AttendeeRank = 
  | "CAPTAIN"
  | "CHIEF_OFFICER"
  | "FIRST_OFFICER"
  | "SECOND_OFFICER"
  | "THIRD_OFFICER"
  | "DECK_CADET"
  | "CHIEF_ENGINEER"
  | "FIRST_ENGINEER"
  | "SECOND_ENGINEER"
  | "THIRD_ENGINEER"
  | "FOURTH_ENGINEER"
  | "ELECTRO_TECHNICAL_OFFICER"
  | "BOATSWAIN"
  | "ABLE_SEAMAN"
  | "ORDINARY_SEAMAN"
  | "CHIEF_STEWARD"
  | "STEWARD"
  | "MESSMAN"
  | "FITTER"
  | "PUMPMAN"
  | "COOK"
  | "MOTORMAN"
  | "OILER"
  | "WELDER"
  | "REFRIGERATION_ENGINEER"
  | "TRAINEE_OFFICER"
  | "RADIO_OFFICER"
  | "DECKHAND_RIVER"
  | "SAILOR_RIVER"
  | "BOSUN_RIVER"
  | "HELMSMAN_RIVER"
  | "RIVER_PILOT"
  | "CHIEF_ENGINEER_RIVER"
  | "SECOND_ENGINEER_RIVER"
  | "ASSISTANT_ENGINEER_RIVER"
  | "ELECTRICIAN_RIVER"
  | "PLUMBER_RIVER"
  | "MOTORMAN_RIVER"
  | "OILER_RIVER"
  | "CHIEF_STEWARD_RIVER"
  | "HOTEL_MANAGER"
  | "ASSISTANT_HOTEL_MANAGER"
  | "HOTEL_ADMINISTRATOR"
  | "FRONT_OFFICE_MANAGER"
  | "RECEPTION_SUPERVISOR"
  | "RECEPTIONIST"
  | "GUEST_SERVICE_AGENT"
  | "NIGHT_AUDITOR"
  | "MAITRE_D"
  | "HEAD_WAITER"
  | "RESTAURANT_SUPERVISOR"
  | "WAITER"
  | "ASSISTANT_WAITER"
  | "BAR_MANAGER"
  | "BEVERAGE_MANAGER"
  | "BARTENDER"
  | "BAR_WAITER"
  | "BAR_STEWARD"
  | "EXECUTIVE_CHEF"
  | "SOUS_CHEF"
  | "CHEF_DE_PARTIE"
  | "COMMIS_CHEF"
  | "PASTRY_CHEF"
  | "BAKER"
  | "KITCHEN_STEWARD"
  | "DISHWASHER"
  | "HOUSEKEEPING_MANAGER"
  | "CABIN_STEWARD"
  | "LAUNDRY_ATTENDANT"
  | "CLEANER"
  | "UTILITY_CLEANER"
  | "CRUISE_DIRECTOR"
  | "ACTIVITIES_MANAGER"
  | "TOUR_MANAGER"
  | "SHORE_EXCURSION_MANAGER"
  | "ENTERTAINER"
  | "PERFORMER"
  | "MUSICIAN"
  | "MASSAGE_THERAPIST"
  | "SPA_ATTENDANT"
  | "HAIRDRESSER"
  | "BEAUTY_THERAPIST"
  | "FITNESS_INSTRUCTOR"
  | "IRATA1"
  | "IRATA2"
  | "IRATA3"
  | "WIND_TURBINE_TECHNICIAN_CONSTRUCTION"
  | "WIND_TURBINE_TECHNICIAN_SERVICE"
  | "WARRANTY_SURVEYOR"
  | "ROV_PILOT"
  | "DRONE_PILOT"
  | "BATIMETRIC_SURVEYOR"
  | "CTV_DECKHAND"
  | "CTV_MASTER";

// Base attendee properties used for creating and updating
export interface AttendeeBase {
  name: string;
  surname: string;
  email: string;
  telephone: string;
  rank: AttendeeRank;
  remark?: string;
  windaId?: string;
}

// Interface for creating a new attendee (POST request)
export interface CreateAttendeeRequest extends AttendeeBase {}

// Interface for updating an existing attendee (PUT request)
export interface UpdateAttendeeRequest extends AttendeeBase {}


// Attendee courses interface
export interface GetAttendeeCourses {
  activeCourses: Course[];
  pastCourses: Course[];
}

// Basic attendee interface with core properties (GET response for getAttendeeById)
export interface Attendee extends AttendeeBase {
  id: string;
  trainingCenterId: string;
  userId?: string;
}

// Extended attendee interface with all related data (GET response for getPaginatedAttendees)
export interface AttendeeWithDetails extends Attendee {
  remarks: Remark[];
  courses: GetAttendeeCourses;
  waitlistRecords: WaitlistRecord[];
}

// Pagination parameters for requests
export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
}

// Response type for the GET attendees endpoint (old non-paginated version)
export type GetAttendeesResponse = Attendee[];

// Response type for the paginated GET attendees endpoint
export interface PaginatedAttendeesResponse {
  attendees: AttendeeWithDetails[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Parameters for attendee API requests
export interface AttendeeApiParams {
  trainingCenterId: string;
  attendeeId?: string;
}
