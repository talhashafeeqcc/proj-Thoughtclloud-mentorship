import { Session, AvailabilitySlot } from '../types';

    // Mock availability slots data
    const availabilitySlots: AvailabilitySlot[] = [
      { id: 'as-1', startTime: '10:00', endTime: '10:45', isBooked: false },
      { id: 'as-2', startTime: '11:00', endTime: '11:45', isBooked: false },
      { id: 'as-3', startTime: '14:00', endTime: '14:45', isBooked: false },
      { id: 'as-4', startTime: '15:00', endTime: '15:45', isBooked: false },
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
        status: 'upcoming',
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
        status: 'upcoming',
        title: 'Advanced State Management',
        availabilitySlotId: 'as-3',
      },
      {
        id: '3',
        mentorId: '2',
        menteeId: '1',
        mentorName: 'Jane Mentee',
        menteeName: 'John Mentor',
        date: '2023-06-17',
        startTime: '11:00',
        endTime: '11:45',
        status: 'completed',
        title: 'Career Advice',
        availabilitySlotId: 'as-2',
      },
    ];

    export const getSessions = async (userId: string, role: 'mentor' | 'mentee'): Promise<Session[]> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const filteredSessions = sessions.filter(
            (session) => (role === 'mentor' ? session.mentorId === userId : session.menteeId === userId)
          );
          resolve(filteredSessions);
        }, 300);
      });
    };

    export const bookSession = async (newSession: Omit<Session, 'id'>): Promise<Session> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Basic validation
          if (!newSession.mentorId || !newSession.menteeId) {
            reject(new Error('Mentor and mentee IDs are required.'));
            return;
          }

          if (!newSession.availabilitySlotId) {
            reject(new Error('Please select an availability slot.'));
            return;
          }

          const selectedSlot = availabilitySlots.find(slot => slot.id === newSession.availabilitySlotId);

          if (!selectedSlot) {
            reject(new Error('Invalid availability slot selected.'));
            return;
          }

          if (selectedSlot.isBooked) {
            reject(new Error('This slot is already booked.'));
            return;
          }


          const mentorExists = sessions.some((session) => session.mentorId === newSession.mentorId);
          const menteeExists = sessions.some((session) => session.menteeId === newSession.menteeId);

          if (!mentorExists) {
            reject(new Error('Selected Mentor does not exist.'))
            return;
          }

          if (!menteeExists) {
            // create a dummy mentee
            sessions.push({
              id: newSession.menteeId,
              mentorId: '0', // dummy
              menteeId: newSession.menteeId,
              mentorName: 'Dummy Mentor',
              menteeName: newSession.menteeName,
              date: new Date().toISOString().split('T')[0],
              startTime: '00:00',
              endTime: '00:00',
              status: 'completed',
              title: 'Dummy Session',
              availabilitySlotId: 'as-1' //dummy
            });
          }

          // Mark the slot as booked
          selectedSlot.isBooked = true;

          const id = String(Math.max(...sessions.map((s) => Number(s.id)), 0) + 1);
          const session = { id, ...newSession };
          sessions.push(session);
          resolve(session);
        }, 500);
      });
    };

    export const getMentorAvailability = async (mentorId: string): Promise<AvailabilitySlot[]> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // For now, return all slots. In a real app, you'd filter by mentorId and date.
          resolve(availabilitySlots.filter(slot => !slot.isBooked));
        }, 200);
      });
    };
