export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'mentor' | 'mentee';
    profilePicture?: string;
}

  export interface AvailabilitySlot {
    id: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
  }

  export interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    link: string;
  }

    export interface Education {
        id: string;
        institution: string;
        degree: string;
        fieldOfStudy: string;
        from: string;
        to: string;
    }

    export interface WorkExperience {
        id: string;
        company: string;
        position: string;
        from: string;
        to: string;
        current?: boolean;
        description?: string;
    }

    export interface Certification {
        id: string;
        name: string;
        organization: string;
        issueDate: string;
    }

export interface MentorProfile extends User {
    bio: string;
    expertise: string[];
    education: Education[];
    workExperience: WorkExperience[];
    certifications: Certification[];
    sessionPrice: number;
    availabilitySlots: AvailabilitySlot[];
    portfolio: PortfolioItem[];
    rating: number;
    reviews: Review[];
}

export interface Review {
  id: string;
  menteeId: string;
  menteeName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Session {
  id: string;
  mentorId: string;
  menteeId: string;
  mentorName: string;
  menteeName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  title: string;
  availabilitySlotId?: string;
}
