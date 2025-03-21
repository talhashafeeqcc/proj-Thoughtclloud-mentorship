import { Session, AvailabilitySlot } from '../types';

// Mock availability slots data
const availabilitySlots: AvailabilitySlot[] = [
  { 
    id: 'as-1', 
    date: '2023-06-15',
    startTime: '10:00', 
    endTime: '10:45', 
    isBooked: false 
  },
  { 
    id: 'as-2', 
    date: '2023-06-15',
    startTime: '11:00', 
    endTime: '11:45', 
    isBooked: false 
  },
  { 
    id: 'as-3', 
    date: '2023-06-16',
    startTime: '14:00', 
    endTime: '14:45', 
    isBooked: false 
  },
  { 
    id: 'as-4', 
    date: '2023-06-16',
    startTime: '15:00', 
    endTime: '15:45', 
    isBooked: false 
  },
];

// Mock session data
let sessions: Session[] = [
  {
    id: '1',
    mentorId: '1',
    menteeId: '2',
    mentorName: 'John Mentor',
    menteeName: 'Jane Mentee',
    date: '2023-06-15',
    startTime: '10:00',
    endTime: '10:45',
    status: 'scheduled',
    paymentStatus: 'pending',
    paymentAmount: 75,
    title: 'React Fundamentals',
    availabilitySlotId: 'as-1',
  },
  {
    id: '2',
    mentorId: '1',
    menteeId: '2',
    mentorName: 'John Mentor',
    menteeName: 'Jane Mentee',
    date: '2023-06-16',
    startTime: '14:00',
    endTime: '14:45',
    status: 'scheduled',
    paymentStatus: 'pending',
    paymentAmount: 75,
    title: 'Advanced State Management',
    availabilitySlotId: 'as-3',
  },
  {
    id: '3',
    mentorId: '3',
    menteeId: '1',
    mentorName: 'Alice Mentor',
    menteeName: 'John Mentor',
    date: '2023-06-17',
    startTime: '11:00',
    endTime: '11:45',
    status: 'completed',
    paymentStatus: 'completed',
    paymentAmount: 90,
    title: 'Career Advice',
    availabilitySlotId: 'as-2',
  },
];

// Get all sessions for a user
export const getSessions = async (userId: string): Promise<Session[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userSessions = sessions.filter(
        (session) => session.mentorId === userId || session.menteeId === userId
      );
      resolve(userSessions);
    }, 300);
  });
};

// Get session by ID
export const getSessionById = async (id: string): Promise<Session> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const session = sessions.find((s) => s.id === id);
      if (session) {
        resolve(session);
      } else {
        reject(new Error(`Session with ID ${id} not found`));
      }
    }, 300);
  });
};

// Create a new session
export const createSession = async (sessionData: Omit<Session, 'id'>): Promise<Session> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Basic validation
      if (!sessionData.mentorId || !sessionData.menteeId) {
        reject(new Error('Mentor and mentee IDs are required'));
        return;
      }

      // Generate a new ID
      const id = String(Math.max(...sessions.map((s) => Number(s.id)), 0) + 1);
      
      // Create the new session
      const newSession: Session = {
        id,
        ...sessionData,
      };
      
      // Add to sessions array
      sessions.push(newSession);
      
      // Mark the availability slot as booked
      const slotIndex = availabilitySlots.findIndex(
        (slot) => slot.id === sessionData.availabilitySlotId
      );
      
      if (slotIndex !== -1) {
        availabilitySlots[slotIndex].isBooked = true;
      }
      
      resolve(newSession);
    }, 500);
  });
};

// Update a session
export const updateSession = async (id: string, updates: Partial<Session>): Promise<Session> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const sessionIndex = sessions.findIndex((s) => s.id === id);
      if (sessionIndex === -1) {
        reject(new Error(`Session with ID ${id} not found`));
        return;
      }
      
      // Update the session
      const updatedSession = { ...sessions[sessionIndex], ...updates };
      sessions[sessionIndex] = updatedSession;
      
      resolve(updatedSession);
    }, 300);
  });
};

// Cancel a session
export const cancelSession = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const sessionIndex = sessions.findIndex((s) => s.id === id);
      if (sessionIndex === -1) {
        reject(new Error(`Session with ID ${id} not found`));
        return;
      }
      
      const session = sessions[sessionIndex];
      
      // Update session status to cancelled
      sessions[sessionIndex] = { ...session, status: 'cancelled' };
      
      // Free up the availability slot
      const slotIndex = availabilitySlots.findIndex(
        (slot) => slot.id === session.availabilitySlotId
      );
      
      if (slotIndex !== -1) {
        availabilitySlots[slotIndex].isBooked = false;
      }
      
      resolve();
    }, 300);
  });
};

// Get mentor availability
export const getMentorAvailability = async (mentorId: string): Promise<AvailabilitySlot[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real app, you'd filter by mentorId
      resolve(availabilitySlots.filter(slot => !slot.isBooked));
    }, 200);
  });
};
