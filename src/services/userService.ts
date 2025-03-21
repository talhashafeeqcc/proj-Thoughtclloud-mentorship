import { v4 as uuidv4 } from 'uuid';
import { User, MentorProfile } from '../types';

// Mock database
let users: User[] = [
  {
    id: '1',
    email: 'mentor@example.com',
    password: 'password123',
    name: 'John Mentor',
    role: 'mentor',
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '2',
    email: 'mentee@example.com',
    password: 'password123',
    name: 'Jane Mentee',
    role: 'mentee',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
];

// Mock mentor profiles
let mentorProfiles: MentorProfile[] = [
  {
    id: '1',
    email: 'mentor@example.com',
    password: 'password123',
    name: 'John Mentor',
    role: 'mentor',
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    bio: 'Experienced software engineer with 10+ years in the industry. Passionate about helping others grow in their careers.',
    expertise: ['JavaScript', 'React', 'Node.js', 'Career Development'],
    education: [
      {
        id: '1',
        institution: 'MIT',
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        from: '2008',
        to: '2012'
      }
    ],
    workExperience: [
      {
        id: '1',
        company: 'Google',
        position: 'Senior Software Engineer',
        from: '2015',
        to: 'Present',
        current: true,
        description: 'Leading frontend development for various projects.'
      },
      {
        id: '2',
        company: 'Facebook',
        position: 'Software Engineer',
        from: '2012',
        to: '2015',
        description: 'Worked on React core team.'
      }
    ],
    certifications: [
      {
        id: '1',
        name: 'AWS Certified Solutions Architect',
        organization: 'Amazon Web Services',
        issueDate: '2019-05-15'
      }
    ],
    sessionPrice: 75,
    availability: [
      {
        id: '1',
        date: '2023-06-15',
        startTime: '10:00',
        endTime: '10:45',
        isBooked: false
      },
      {
        id: '2',
        date: '2023-06-15',
        startTime: '11:00',
        endTime: '11:45',
        isBooked: false
      },
      {
        id: '3',
        date: '2023-06-16',
        startTime: '14:00',
        endTime: '14:45',
        isBooked: true
      }
    ],
    portfolio: [
      {
        id: '1',
        title: 'React Component Library',
        description: 'A reusable component library built with React and TypeScript.',
        link: 'https://github.com/johnmentor/react-components'
      }
    ],
    rating: 4.8,
    reviews: [
      {
        id: '1',
        menteeId: '2',
        menteeName: 'Jane Mentee',
        rating: 5,
        comment: 'John is an excellent mentor! He helped me understand complex React concepts in a simple way.',
        date: '2023-05-20'
      }
    ]
  }
];

// Get all users
export const getUsers = async (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(users);
    }, 300);
  });
};

// Get user by ID
export const getUserById = async (id: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = users.find(u => u.id === id) || null;
      resolve(user);
    }, 300);
  });
};

// Add new user
export const addUser = async (userData: User): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newUser = {
        ...userData,
        id: uuidv4()
      };
      users = [...users, newUser];
      resolve(newUser);
    }, 300);
  });
};

// Update user
export const updateUser = async (id: string, userData: Partial<User>): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = users.findIndex(u => u.id === id);
      if (index !== -1) {
        const updatedUser = { ...users[index], ...userData };
        users = [...users.slice(0, index), updatedUser, ...users.slice(index + 1)];
        resolve(updatedUser);
      } else {
        resolve(null);
      }
    }, 300);
  });
};

// Get all mentor profiles
export const getMentorProfiles = async (): Promise<MentorProfile[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mentorProfiles);
    }, 300);
  });
};

// Get mentor profile by ID
export const getMentorProfileById = async (id: string): Promise<MentorProfile | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const profile = mentorProfiles.find(p => p.id === id) || null;
      resolve(profile);
    }, 300);
  });
};

// Create or update mentor profile
export const updateMentorProfile = async (id: string, profileData: Partial<MentorProfile>): Promise<MentorProfile | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = mentorProfiles.findIndex(p => p.id === id);
      if (index !== -1) {
        const updatedProfile = { ...mentorProfiles[index], ...profileData };
        mentorProfiles = [...mentorProfiles.slice(0, index), updatedProfile, ...mentorProfiles.slice(index + 1)];
        resolve(updatedProfile);
      } else {
        // Create new profile if it doesn't exist
        const newProfile = {
          ...profileData,
          id,
          role: 'mentor',
          availability: [],
          portfolio: [],
          reviews: [],
          rating: 0
        } as MentorProfile;
        mentorProfiles = [...mentorProfiles, newProfile];
        resolve(newProfile);
      }
    }, 300);
  });
};
