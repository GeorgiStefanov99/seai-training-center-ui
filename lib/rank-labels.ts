import { AttendeeRank } from "@/types/attendee";

/**
 * Maps rank codes to their human-readable display labels
 */
export const RANK_LABELS: Record<AttendeeRank, string> = {
  // Maritime deck officers
  CAPTAIN: "Master/Captain (CPT)",
  CHIEF_OFFICER: "Chief Officer (C/O)",
  FIRST_OFFICER: "First Officer",
  SECOND_OFFICER: "Second Officer (2/O)",
  THIRD_OFFICER: "Third Officer (3/O)",
  DECK_CADET: "Deck Cadet (D/C)",
  
  // Maritime engineering officers
  CHIEF_ENGINEER: "Chief Engineer (C/E)",
  FIRST_ENGINEER: "First Engineer (1/E)",
  SECOND_ENGINEER: "Second Engineer (2/E)",
  THIRD_ENGINEER: "Third Engineer (3/E)",
  FOURTH_ENGINEER: "Fourth Engineer (4/E)",
  ELECTRO_TECHNICAL_OFFICER: "Electro-Technical Officer (ETO)",
  
  // Maritime deck ratings
  BOATSWAIN: "Boatswain (BSN)",
  ABLE_SEAMAN: "Able Seaman (AB)",
  ORDINARY_SEAMAN: "Ordinary Seaman (OS)",
  
  // Maritime hotel department
  CHIEF_STEWARD: "Chief Steward (C/STW)",
  STEWARD: "Steward (STW)",
  MESSMAN: "Messman (MSN)",
  COOK: "Cook (C/K)",
  
  // Maritime engine ratings
  FITTER: "Fitter (FTR)",
  PUMPMAN: "Pumpman (P/P)",
  MOTORMAN: "Motorman (M/M)",
  OILER: "Oiler",
  WELDER: "Welder",
  REFRIGERATION_ENGINEER: "Refrigeration Engineer",
  
  // Other maritime ranks
  TRAINEE_OFFICER: "Trainee Officer",
  RADIO_OFFICER: "Radio Officer/Radio Operator",
  
  // River vessel ranks
  DECKHAND_RIVER: "Deckhand (River)",
  SAILOR_RIVER: "Sailor (River)",
  BOSUN_RIVER: "Bosun (River)",
  HELMSMAN_RIVER: "Helmsman (River)",
  RIVER_PILOT: "River Pilot",
  CHIEF_ENGINEER_RIVER: "Chief Engineer (River)",
  SECOND_ENGINEER_RIVER: "Second Engineer (River)",
  ASSISTANT_ENGINEER_RIVER: "Assistant Engineer / Engine Cadet (River)",
  ELECTRICIAN_RIVER: "Electrician (River)",
  PLUMBER_RIVER: "Plumber (River)",
  MOTORMAN_RIVER: "Motorman (River)",
  OILER_RIVER: "Oiler (River)",
  CHIEF_STEWARD_RIVER: "Chief Steward",
  
  // Hotel & hospitality ranks
  HOTEL_MANAGER: "Hotel Manager",
  ASSISTANT_HOTEL_MANAGER: "Assistant Hotel Manager",
  HOTEL_ADMINISTRATOR: "Hotel Administrator",
  FRONT_OFFICE_MANAGER: "Front Office Manager",
  RECEPTION_SUPERVISOR: "Reception Supervisor",
  RECEPTIONIST: "Receptionist",
  GUEST_SERVICE_AGENT: "Guest Service Agent",
  NIGHT_AUDITOR: "Night Auditor",
  MAITRE_D: "Maître D' / Restaurant Manager",
  HEAD_WAITER: "Head Waiter",
  RESTAURANT_SUPERVISOR: "Restaurant Supervisor",
  WAITER: "Waiter / Waitress",
  ASSISTANT_WAITER: "Assistant Waiter",
  BAR_MANAGER: "Bar Manager",
  BEVERAGE_MANAGER: "Beverage Manager",
  BARTENDER: "Bartender",
  BAR_WAITER: "Bar Waiter",
  BAR_STEWARD: "Bar Steward",
  EXECUTIVE_CHEF: "Executive Chef",
  SOUS_CHEF: "Sous Chef",
  CHEF_DE_PARTIE: "Chef de Partie",
  COMMIS_CHEF: "Commis Chef",
  PASTRY_CHEF: "Pastry Chef",
  BAKER: "Baker",
  KITCHEN_STEWARD: "Kitchen Steward",
  DISHWASHER: "Dishwasher",
  HOUSEKEEPING_MANAGER: "Housekeeping Manager",
  CABIN_STEWARD: "Cabin Steward / Stewardess",
  LAUNDRY_ATTENDANT: "Laundry Attendant",
  CLEANER: "Cleaner",
  UTILITY_CLEANER: "Utility Cleaner",
  
  // Entertainment & services
  CRUISE_DIRECTOR: "Cruise Director",
  ACTIVITIES_MANAGER: "Activities Manager",
  TOUR_MANAGER: "Tour Manager",
  SHORE_EXCURSION_MANAGER: "Shore Excursion Manager",
  ENTERTAINER: "Entertainer",
  PERFORMER: "Performer",
  MUSICIAN: "Musician",
  MASSAGE_THERAPIST: "Massage Therapist",
  SPA_ATTENDANT: "Spa Attendant",
  HAIRDRESSER: "Hairdresser",
  BEAUTY_THERAPIST: "Beauty Therapist",
  FITNESS_INSTRUCTOR: "Fitness Instructor",
  
  // Industrial & Technical ranks
  IRATA1: "IRATA 1",
  IRATA2: "IRATA 2",
  IRATA3: "IRATA 3",
  WIND_TURBINE_TECHNICIAN_CONSTRUCTION: "Wind Turbine Technician Construction",
  WIND_TURBINE_TECHNICIAN_SERVICE: "Wind Turbine Technician Service",
  WARRANTY_SURVEYOR: "Warranty Surveyor",
  ROV_PILOT: "ROV Pilot",
  DRONE_PILOT: "Drone Pilot",
  BATIMETRIC_SURVEYOR: "Batimetric Surveyor",
  CTV_DECKHAND: "CTV Deckhand",
  CTV_MASTER: "CTV Master"
};
