import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Session } from '../types';
import { getSessions, createSession, updateSession, cancelSession } from '../services/sessionService';
import { useAuth } from './AuthContext';

// Define the context state type
interface SessionState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

// Define the context type
interface SessionContextType {
  sessionState: SessionState;
  fetchUserSessions: () => Promise<void>;
  bookSession: (sessionData: Omit<Session, 'id' | 'status' | 'paymentStatus'>) => Promise<Session>;
  updateSessionDetails: (id: string, updates: Partial<Session>) => Promise<Session>;
  cancelUserSession: (id: string) => Promise<void>;
}

// Create the context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Define action types
type SessionAction =
  | { type: 'FETCH_SESSIONS_START' | 'BOOK_SESSION_START' | 'UPDATE_SESSION_START' | 'CANCEL_SESSION_START' }
  | { type: 'FETCH_SESSIONS_SUCCESS'; payload: Session[] }
  | { type: 'BOOK_SESSION_SUCCESS' | 'UPDATE_SESSION_SUCCESS'; payload: Session }
  | { type: 'CANCEL_SESSION_SUCCESS'; payload: string }
  | { type: 'SESSION_ERROR'; payload: string };

// Initial state
const initialState: SessionState = {
  sessions: [],
  loading: false,
  error: null,
};

// Reducer function
const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch (action.type) {
    case 'FETCH_SESSIONS_START':
    case 'BOOK_SESSION_START':
    case 'UPDATE_SESSION_START':
    case 'CANCEL_SESSION_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_SESSIONS_SUCCESS':
      return {
        ...state,
        sessions: action.payload,
        loading: false,
        error: null,
      };
    case 'BOOK_SESSION_SUCCESS':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
        loading: false,
        error: null,
      };
    case 'UPDATE_SESSION_SUCCESS':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.id ? action.payload : session
        ),
        loading: false,
        error: null,
      };
    case 'CANCEL_SESSION_SUCCESS':
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload ? { ...session, status: 'cancelled' } : session
        ),
        loading: false,
        error: null,
      };
    case 'SESSION_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

// Provider component
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionState, dispatch] = useReducer(sessionReducer, initialState);
  const { authState } = useAuth();
  const { user } = authState;

  // Fetch user sessions when user changes
  useEffect(() => {
    if (user) {
      fetchUserSessions();
    }
  }, [user]);

  // Fetch user sessions
  const fetchUserSessions = async () => {
    if (!user) return;

    dispatch({ type: 'FETCH_SESSIONS_START' });
    try {
      const sessions = await getSessions(user.id);
      dispatch({ type: 'FETCH_SESSIONS_SUCCESS', payload: sessions });
    } catch (error) {
      dispatch({
        type: 'SESSION_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to fetch sessions',
      });
    }
  };

  // Book a session
  const bookSession = async (sessionData: Omit<Session, 'id' | 'status' | 'paymentStatus'>): Promise<Session> => {
    dispatch({ type: 'BOOK_SESSION_START' });
    try {
      const newSession = await createSession({
        ...sessionData,
        status: 'scheduled',
        paymentStatus: 'pending',
      });
      dispatch({ type: 'BOOK_SESSION_SUCCESS', payload: newSession });
      return newSession;
    } catch (error) {
      dispatch({
        type: 'SESSION_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to book session',
      });
      throw error;
    }
  };

  // Update session details
  const updateSessionDetails = async (id: string, updates: Partial<Session>): Promise<Session> => {
    dispatch({ type: 'UPDATE_SESSION_START' });
    try {
      const updatedSession = await updateSession(id, updates);
      dispatch({ type: 'UPDATE_SESSION_SUCCESS', payload: updatedSession });
      return updatedSession;
    } catch (error) {
      dispatch({
        type: 'SESSION_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to update session',
      });
      throw error;
    }
  };

  // Cancel a session
  const cancelUserSession = async (id: string): Promise<void> => {
    dispatch({ type: 'CANCEL_SESSION_START' });
    try {
      await cancelSession(id);
      dispatch({ type: 'CANCEL_SESSION_SUCCESS', payload: id });
    } catch (error) {
      dispatch({
        type: 'SESSION_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to cancel session',
      });
      throw error;
    }
  };

  // Create the context value
  const contextValue: SessionContextType = {
    sessionState,
    fetchUserSessions,
    bookSession,
    updateSessionDetails,
    cancelUserSession,
  };

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>;
};

// Custom hook to use the session context
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
