// Database table types matching the MySQL schema

export interface Account {
  accountID: number;
  password: string;
  name: string;
  bio: string | null;
  dateOfBirth: Date | null;
  email: string;
  phoneNumber: string | null;
}

export interface Tenant {
  tenantID: number;
  accountID: number;
  isListed: boolean;
  companyName: string | null;
  availableFrom: Date | null;
  availableTo: Date | null;
}

export interface Subleasor {
  subleasorID: number;
  accountID: number;
}

export interface Property {
  propertyID: number;
  propertyName: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  yearBuilt: number | null;
  description: string | null;
}

export interface SuiteInfo {
  suiteID: number;
  propertyID: number;
  suiteNumber: string | null;
  floor: number | null;
  totalRooms: number | null;
  totalBathrooms: number | null;
  description: string | null;
}

export interface Amenity {
  amenityID: number;
  amenityName: string;
}

export interface RoomInfo {
  roomID: number;
  suiteID: number;
  subleasorID: number;
  createdAt: Date;
  isListed: boolean;
  monthlyRent: number;
  availableFrom: Date | null;
  availableTo: Date | null;
  description: string | null;
}

export interface RoomAmenity {
  roomID: number;
  amenityID: number;
}

export interface ListingPhoto {
  photoID: number;
  roomID: number;
  photoUrl: string;
}

export interface Application {
  applicationID: number;
  tenantID: number;
  roomID: number;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  appliedAt: Date;
}

export interface Contract {
  contractID: number;
  applicationID: number;
  tenantID: number;
  roomID: number;
  leaseStart: Date;
  leaseEnd: Date;
  monthlyRent: number;
  signedAt: Date;
}

// Combined types for API responses
export interface TenantWithAccount extends Tenant {
  account: Account;
}

export interface RoomWithDetails extends RoomInfo {
  suite: SuiteInfo & { property: Property };
  subleasor: Subleasor & { account: Account };
  photos: ListingPhoto[];
  amenities: Amenity[];
}

export interface RoomListItem {
  roomID: number;
  monthlyRent: number;
  availableFrom: Date | null;
  availableTo: Date | null;
  description: string | null;
  address: string;
  city: string;
  state: string;
  propertyName: string;
  subleasorName: string;
  subleasorEmail: string;
  photos: ListingPhoto[];
  amenities: Amenity[];
}

// Form data types
export interface TenantFormData {
  name: string;
  email: string;
  password: string;
  bio?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  companyName?: string;
  availableFrom?: string;
  availableTo?: string;
}

export interface RoomFormData {
  propertyName: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  yearBuilt?: number;
  propertyDescription?: string;
  suiteNumber?: string;
  floor?: number;
  totalRooms?: number;
  totalBathrooms?: number;
  suiteDescription?: string;
  monthlyRent: number;
  availableFrom?: string;
  availableTo?: string;
  roomDescription?: string;
  amenityIDs?: number[];
  photoUrls?: string[];
}

// Search filters
export interface TenantFilters {
  location?: string;
  companyName?: string;
  availableFrom?: string;
  availableTo?: string;
}

export interface RoomFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  availableFrom?: string;
  availableTo?: string;
  propertyType?: string;
  amenityIDs?: number[];
}
