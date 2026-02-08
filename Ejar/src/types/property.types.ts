/**
 * Types matching the Django backend Property API responses
 */

export type PropertyType =
  | "apartment"
  | "house"
  | "condo"
  | "townhouse"
  | "studio"
  | "room"
  | "commercial";

export type PropertyStatus =
  | "available"
  | "rented"
  | "pending"
  | "maintenance";

export type InquiryStatus = "new" | "contacted" | "scheduled" | "closed";

export interface PropertyImage {
  id: number;
  image: string;
  caption: string;
  order: number;
  is_primary: boolean;
  uploaded_at: string;
}

export interface PropertyAmenity {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export interface Property {
  id: number;
  title: string;
  slug: string;
  description: string;
  property_type: PropertyType;
  status: PropertyStatus;
  owner: number;
  owner_email: string;
  address: string;
  location?: string;
  city: string;
  country: string;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number | string;
  security_deposit: number | string;
  parking_spaces: number;
  pets_allowed: boolean;
  furnished: boolean;
  utilities_included: boolean;
  lease_duration_months: number;
  available_from: string;
  views_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
  amenities: PropertyAmenity[];
  favorites_count: number;
  average_rating: number;
}

export interface PropertyReview {
  id: number;
  property: number;
  reviewer: number;
  reviewer_email: string;
  rating: number;
  title: string;
  comment: string;
  location_rating?: number;
  value_rating?: number;
  maintenance_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyInquiry {
  id: number;
  property: number;
  inquirer: number;
  inquirer_email: string;
  message: string;
  phone_number: string;
  preferred_move_in_date: string | null;
  status: InquiryStatus;
  created_at: string;
  updated_at: string;
}

export interface PropertyFavorite {
  id: number;
  user: number;
  user_email: string;
  property: number;
  created_at: string;
}

/** Backend query params for list endpoint */
export interface PropertyListParams {
  search?: string;
  ordering?: string;
  mine?: boolean;
  min_rent?: number;
  max_rent?: number;
  city?: string;
  property_type?: PropertyType | PropertyType[];
  status?: PropertyStatus | PropertyStatus[];
  is_featured?: boolean;
  min_bedrooms?: number;
  max_bedrooms?: number;
  bathrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  pets_allowed?: boolean;
  furnished?: boolean;
  utilities_included?: boolean;
  min_parking?: number;
  available_from?: string;
}

/** Create review payload */
export interface CreateReviewPayload {
  property: number;
  rating: number;
  title: string;
  comment: string;
  location_rating?: number;
  value_rating?: number;
  maintenance_rating?: number;
}

/** Create inquiry payload */
export interface CreateInquiryPayload {
  property: number;
  message: string;
  phone_number?: string;
  preferred_move_in_date?: string;
}
