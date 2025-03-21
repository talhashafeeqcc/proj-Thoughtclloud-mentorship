import { User, Mentor, Mentee, LoginCredentials, RegisterData } from '../types';

// Mock user data with passwords (for demo purposes only - in a real app, passwords would be hashed and not stored like this)
const users = [
  {
    id: '1',
    email: 'john.mentor@example.com',
    name: 'John Mentor',
    role: 'mentor' as const,
    profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
    password: 'password123' // In a real app, this would be hashed
  },
  {
    id: '2',
    email: 'jane.mentee@example.com',
    name: 'Jane Mentee',
    role: 'mentee' as const,
    profilePicture: 'https://randomuser.me/api/portraits/women/1.jpg',
    password: 'password123'
  },
  {
    id: '3',
    email: 'alice.mentor@example.com',
    name: 'Alice Mentor',
    role: 'mentor' as const,
    profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg',
    password: 'password123'
  }
];

// Mock mentor profiles
const mentorProfiles: Partial<Mentor>[] = [
  {
    id: '1',
    email: 'john.mentor@example.com',
    name: 'John Mentor',
    role: 'mentor',
    profilePicture: 'https://randomuser.me/api/portraits/men/1.jpg',
    expertise: ['React', 'JavaScript', 'Node.js'],
    bio: 'Senior developer with 10+ years of experience in web development.',
    sessionPrice: 75,
    availability: [
      { id: 'slot1', date: '2023-06-15', startTime: '10:00', endTime: '10:45', isBooked: false },
      { id: 'slot2', date: '2023-06-15', startTime: '11:00', endTime: '11:45', isBooked: false },
      { id: 'slot3', date: '2023-06-16', startTime: '14:00', endTime: '14:45', isBooked: false },
      { id: 'slot4', date: '2023-06-16', startTime: '15:00', endTime: '15:45', isBooked: false },
      { id: 'slot5', date: '2023-06-17', startTime: '10:00', endTime: '10:45', isBooked: false },
      { id: 'slot6', date: '2023-06-17', startTime: '11:00', endTime: '11:45', isBooked: false },
    ]
  },
  {
    id: '3',
    email: 'alice.mentor@example.com',
    name: 'Alice Mentor',
    role: 'mentor',
    profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg',
    expertise: ['Python', 'Data Science', 'Machine Learning'],
    bio: 'Data scientist with expertise in machine learning and AI.',
    sessionPrice: 90,
    availability: [
      { id: 'slot7', date: '2023-06-15', startTime: '13:00', endTime: '13:45', isBooked: false },
      { id: 'slot8', date: '2023-06-15', startTime: '14:00', endTime: '14:45', isBooked: false },
      { id: 'slot9', date: '2023-06-16', startTime: '10:00', endTime: '10:45', isBooked: false },
      { id: 'slot10', date: '2023-06-16', startTime: '11:00', endTime: '11:45', isBooked: false },
    ]
  }
];

// Get all users (without passwords)
export const getUsers = async (): Promise<User[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return users without passwords
      const safeUsers = users.map(({ password, ...user }) => user);
      resolve(safeUsers);
    }, 500);
  });
};

// Get all mentors
export const getMentors = async (): Promise<Partial<Mentor>[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mentorProfiles);
    }, 500);
  });
};

// Get mentor by ID
export const getMentorById = async (id: string): Promise<Partial<Mentor> | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mentor = mentorProfiles.find((m) => m.id === id);
      resolve(mentor || null);
    }, 300);
  });
};

// Get mentor profile by ID (alias for getMentorById for backward compatibility)
export const getMentorProfileById = async (id: string): Promise<Partial<Mentor> | null> => {
  return getMentorById(id);
};

// Get user by ID (without password)
export const getUserById = async (id: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = users.find((u) => u.id === id);
      if (user) {
        // Return user without password
        const { password, ...safeUser } = user;
        resolve(safeUser);
      } else {
        resolve(null);
      }
    }, 300);
  });
};

// Login user
export const loginUser = async (credentials: LoginCredentials): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find((u) => u.email === credentials.email);
      if (user && user.password === credentials.password) {
        // Return user without password
        const { password, ...safeUser } = user;
        resolve(safeUser);
      } else {
        reject(new Error('Invalid email or password'));
      }
    }, 500);
  });
};

// Register user
export const registerUser = async (userData: RegisterData): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if user already exists
      const existingUser = users.find((u) => u.email === userData.email);
      if (existingUser) {
        reject(new Error('User with this email already exists'));
        return;
      }

      // Create new user with password
      const newUser = {
        id: String(users.length + 1),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password: userData.password
      };

      // Add to users array
      users.push(newUser);

      // If it's a mentor, create a mentor profile
      if (userData.role === 'mentor') {
        const newMentorProfile: Partial<Mentor> = {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: 'mentor',
          expertise: [],
          bio: '',
          sessionPrice: 0,
          availability: []
        };
        mentorProfiles.push(newMentorProfile);
      }

      // Return user without password
      const { password, ...safeUser } = newUser;
      resolve(safeUser);
    }, 500);
  });
};

// Update user profile
export const updateUser = async (userId: string, profileData: Partial<User>): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const userIndex = users.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        reject(new Error('User not found'));
        return;
      }

      // Update user data (preserving password)
      const password = users[userIndex].password;
      const updatedUser = { ...users[userIndex], ...profileData, password };
      users[userIndex] = updatedUser;

      // If it's a mentor, update mentor profile as well
      if (updatedUser.role === 'mentor') {
        const mentorIndex = mentorProfiles.findIndex((m) => m.id === userId);
        if (mentorIndex !== -1) {
          mentorProfiles[mentorIndex] = { ...mentorProfiles[mentorIndex], ...profileData };
        }
      }

      // Return user without password
      const { password: _, ...safeUser } = updatedUser;
      resolve(safeUser);
    }, 500);
  });
};

// Update user profile (alias for updateUser for backward compatibility)
export const updateUserProfile = async (userId: string, profileData: Partial<User>): Promise<User> => {
  return updateUser(userId, profileData);
};

// Update mentor profile
export const updateMentorProfile = async (mentorId: string, profileData: Partial<Mentor>): Promise<Partial<Mentor>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mentorIndex = mentorProfiles.findIndex((m) => m.id === mentorId);
      if (mentorIndex === -1) {
        reject(new Error('Mentor profile not found'));
        return;
      }

      // Update mentor profile
      const updatedProfile = { ...mentorProfiles[mentorIndex], ...profileData };
      mentorProfiles[mentorIndex] = updatedProfile;

      resolve(updatedProfile);
    }, 500);
  });
};

// Get current user from localStorage
export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          resolve(user);
        } catch (error) {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    }, 300);
  });
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.removeItem('currentUser');
      resolve();
    }, 300);
  });
};
