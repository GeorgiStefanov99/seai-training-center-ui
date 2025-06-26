// Training Center Contact Types

// Base contact properties
export interface ContactBase {
  nameOfOrganization: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  email?: string;
  phone?: string;
}

// Interface for creating a new contact (POST request)
export interface CreateContactRequest {
  nameOfOrganization: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  email?: string;
  phone?: string;
}

// Interface for updating an existing contact (PUT request)
export interface UpdateContactRequest {
  nameOfOrganization?: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  email?: string;
  phone?: string;
}

// Contact response interface (GET response)
export interface Contact {
  id: string;
  nameOfOrganization: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  email?: string;
  phone?: string;
}

// Response type for creating a contact
export interface CreateContactResponse {
  id: string;
  nameOfOrganization: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  email?: string;
  phone?: string;
}

// Response type for getting all contacts
export type GetContactsResponse = Contact[];

// Parameters for contact API requests
export interface ContactApiParams {
  trainingCenterId: string;
  contactId?: string;
} 