// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "mentor" | "mentee" | "admin";
  profilePicture?: string;
}

export interface Mentor extends User {
  role: "mentor";
  expertise: string[];
  bio: string;
  portfolio: PortfolioItem[];
  certifications: Certification[];
  education: Education[];
  workExperience: WorkExperience[];
  sessionPrice: number;
  availability: AvailabilitySlot[];
  ratings: Rating[];
}

export interface Mentee extends User {
  role: "mentee";
  interests: string[];
  sessions: Session[];
}

// Profile Types
export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  image?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  link?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
}

// Session Types
export interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  mentorId: string;
}

export interface Session {
  id: string;
  mentorId: string;
  menteeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "cancelled";
  paymentStatus: "pending" | "completed" | "refunded";
  paymentAmount: number;
  notes?: string;
  mentorName?: string;
  menteeName?: string;
  title?: string;
  availabilitySlotId?: string;
}

// Rating and Review Types
export interface Rating {
  id: string;
  sessionId: string;
  menteeId: string;
  score: number; // 1-5
  review: string;
  date: string;
}

// Filter Types
export interface MentorFilter {
  expertise?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  availability?: {
    date?: string;
    startTime?: string;
    endTime?: string;
  };
}

// Auth Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role: "mentor" | "mentee" | "admin";
}

// Payment Types
export interface Payment {
  id: string;
  sessionId: string;
  amount: number;
  status: "pending" | "completed" | "refunded";
  date: string;
  transactionId: string;
}

// User with password for internal use only (not for storage/display)
export interface UserWithPassword extends User {
  password: string;
}

export interface MentorProfile extends User {
  role: "mentor";
  expertise: string[];
  bio: string;
  portfolio?: PortfolioItem[];
  certifications?: Certification[];
  education?: Education[];
  workExperience?: WorkExperience[];
  sessionPrice: number;
  availability?: AvailabilitySlot[];
  ratings?: Rating[];
}
