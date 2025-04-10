import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Session } from "../types";
import {
  getSessions,
  createSession,
  updateSession,
  cancelSession,
  checkAndUpdateSessionStatuses,
} from "../services/sessionService";
import { useAuth } from "./AuthContext";
import { getDatabase } from "../services/database/db";

// Define the context state type
interface SessionState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

// Define the context type
interface SessionContextType {
  sessionState: SessionState;
  fetchUserSessions: (forceRefresh?: boolean) => Promise<void>;
  bookSession: (
    sessionData: Omit<Session, "id" | "status" | "paymentStatus">
  ) => Promise<Session>;
  updateSessionDetails: (
    id: string,
    updates: Partial<Session>
  ) => Promise<Session>;
  cancelUserSession: (id: string) => Promise<void>;
}

// Create the context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Define action types
type SessionAction =
  | {
    type:
    | "FETCH_SESSIONS_START"
    | "BOOK_SESSION_START"
    | "UPDATE_SESSION_START"
    | "CANCEL_SESSION_START"
    | "INIT_DB_START";
  }
  | { type: "FETCH_SESSIONS_SUCCESS"; payload: Session[] }
  | {
    type: "BOOK_SESSION_SUCCESS" | "UPDATE_SESSION_SUCCESS";
    payload: Session;
  }
  | { type: "CANCEL_SESSION_SUCCESS"; payload: string }
  | { type: "INIT_DB_SUCCESS" }
  | { type: "SESSION_ERROR"; payload: string };

// Initial state
const initialState: SessionState = {
  sessions: [],
  loading: false,
  error: null,
};

// Reducer function
const sessionReducer = (
  state: SessionState,
  action: SessionAction
): SessionState => {
  switch (action.type) {
    case "INIT_DB_START":
    case "FETCH_SESSIONS_START":
    case "BOOK_SESSION_START":
    case "UPDATE_SESSION_START":
    case "CANCEL_SESSION_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "INIT_DB_SUCCESS":
      return {
        ...state,
        loading: false,
      };
    case "FETCH_SESSIONS_SUCCESS":
      return {
        ...state,
        sessions: action.payload,
        loading: false,
        error: null,
      };
    case "BOOK_SESSION_SUCCESS":
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
        loading: false,
        error: null,
      };
    case "UPDATE_SESSION_SUCCESS":
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload.id ? action.payload : session
        ),
        loading: false,
        error: null,
      };
    case "CANCEL_SESSION_SUCCESS":
      return {
        ...state,
        sessions: state.sessions.map((session) =>
          session.id === action.payload
            ? { ...session, status: "cancelled" }
            : session
        ),
        loading: false,
        error: null,
      };
    case "SESSION_ERROR":
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
export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sessionState, dispatch] = useReducer(sessionReducer, initialState);
  const { authState } = useAuth();
  const { user } = authState;

  // Refs to track state without triggering re-renders
  const userIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const isDbInitializedRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Initialize database only once
  useEffect(() => {
    mountedRef.current = true;

    if (isDbInitializedRef.current) return;

    const initDb = async () => {
      dispatch({ type: "INIT_DB_START" });
      try {
        await getDatabase();
        if (mountedRef.current) {
          isDbInitializedRef.current = true;
          dispatch({ type: "INIT_DB_SUCCESS" });
        }
      } catch (error) {
        console.error(
          "Failed to initialize database in SessionContext:",
          error
        );
        if (mountedRef.current) {
          dispatch({
            type: "SESSION_ERROR",
            payload:
              error instanceof Error
                ? error.message
                : "Failed to initialize database",
          });
        }
      }
    };

    initDb();

    return () => {
      mountedRef.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const doFetchSessions = async (userId: string, forceRefresh = false) => {
    if (!mountedRef.current) return;

    // If already fetching, don't start another fetch unless forced
    if (isFetchingRef.current && !forceRefresh) return;

    // Implement a cool-down period (3 seconds) to prevent excessive refreshes
    // Skip this check if forceRefresh is true
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTimeRef.current < 3000) {
      console.log("Skipping fetch sessions due to cool-down period");
      return;
    }

    // Set the last fetch time
    lastFetchTimeRef.current = now;
    isFetchingRef.current = true;

    if (mountedRef.current) {
      dispatch({ type: "FETCH_SESSIONS_START" });
    }

    try {
      console.log("Fetching sessions for user:", userId);
      const sessions = await getSessions(userId);
      console.log(`Fetched ${sessions.length} sessions for user ${userId}`);

      if (mountedRef.current) {
        dispatch({ type: "FETCH_SESSIONS_SUCCESS", payload: sessions });
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      if (mountedRef.current) {
        dispatch({
          type: "SESSION_ERROR",
          payload:
            error instanceof Error ? error.message : "Failed to fetch sessions",
        });
      }
    } finally {
      if (mountedRef.current) {
        isFetchingRef.current = false;
      }
    }
  };

  const fetchUserSessions = useCallback(async (forceRefresh = false) => {
    if (!user || !mountedRef.current) return;

    const currentUserId = user.id;

    // If we're already fetching for this user and not forcing a refresh, return
    if (userIdRef.current === currentUserId && isFetchingRef.current && !forceRefresh) {
      return;
    }

    userIdRef.current = currentUserId;

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Schedule the fetch with a small delay to allow for batched updates
    fetchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        doFetchSessions(currentUserId, forceRefresh);
      }
    }, 50);
  }, [user]);

  // Fetch sessions when the user changes
  useEffect(() => {
    if (!user || !mountedRef.current) {
      userIdRef.current = null;
      return;
    }

    const currentUserId = user.id;

    // If user ID changed or we're forcing a refresh on mount
    if (userIdRef.current !== currentUserId) {
      userIdRef.current = currentUserId;

      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      fetchTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          doFetchSessions(currentUserId, true); // Force refresh on user change
        }
      }, 50);
    }
  }, [user]);

  // Add an interval to periodically refresh sessions
  useEffect(() => {
    if (!user) return;

    // Refresh sessions every 30 seconds to ensure data is fresh
    const intervalId = setInterval(() => {
      if (user && mountedRef.current && !isFetchingRef.current) {
        console.log("Periodic refresh of sessions");
        doFetchSessions(user.id, true);
      }
    }, 30000); // 30 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  // Add a useEffect to periodically check and update session statuses
  useEffect(() => {
    // Run once when component mounts
    const checkStatusesOnce = async () => {
      try {
        await checkAndUpdateSessionStatuses();
      } catch (error) {
        console.error("Error checking session statuses:", error);
      }
    };

    checkStatusesOnce();

    // Set up interval to check statuses every 5 minutes
    const intervalId = setInterval(async () => {
      try {
        await checkAndUpdateSessionStatuses();
        // After updating statuses, refresh the sessions
        fetchUserSessions();
      } catch (error) {
        console.error("Error in periodic session status check:", error);
      }
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [user]);

  // Book a session with proper type handling
  const bookSession = useCallback(
    async (
      sessionData: Omit<Session, "id" | "status" | "paymentStatus">
    ): Promise<Session> => {
      if (!mountedRef.current) throw new Error("Component unmounted");

      dispatch({ type: "BOOK_SESSION_START" });
      try {
        // Cast to the proper type to resolve TS error
        const dataWithRequiredFields = {
          ...sessionData,
          availabilitySlotId: sessionData.availabilitySlotId || "", // Ensure this is never undefined
          status: "scheduled" as const,
          paymentStatus: "pending" as const,
        };

        const newSession = await createSession(dataWithRequiredFields);

        if (!mountedRef.current) throw new Error("Component unmounted");

        dispatch({ type: "BOOK_SESSION_SUCCESS", payload: newSession });
        return newSession;
      } catch (error) {
        if (mountedRef.current) {
          dispatch({
            type: "SESSION_ERROR",
            payload:
              error instanceof Error ? error.message : "Failed to book session",
          });
        }
        throw error;
      }
    },
    []
  );

  // Update session details
  const updateSessionDetails = useCallback(
    async (id: string, updates: Partial<Session>): Promise<Session> => {
      if (!mountedRef.current) throw new Error("Component unmounted");

      dispatch({ type: "UPDATE_SESSION_START" });
      try {
        const updatedSession = await updateSession(id, updates);

        if (!mountedRef.current) throw new Error("Component unmounted");

        dispatch({ type: "UPDATE_SESSION_SUCCESS", payload: updatedSession });
        return updatedSession;
      } catch (error) {
        if (mountedRef.current) {
          dispatch({
            type: "SESSION_ERROR",
            payload:
              error instanceof Error
                ? error.message
                : "Failed to update session",
          });
        }
        throw error;
      }
    },
    []
  );

  // Cancel a session
  const cancelUserSession = useCallback(async (id: string): Promise<void> => {
    if (!mountedRef.current) throw new Error("Component unmounted");

    dispatch({ type: "CANCEL_SESSION_START" });
    try {
      await cancelSession(id);

      if (!mountedRef.current) throw new Error("Component unmounted");

      dispatch({ type: "CANCEL_SESSION_SUCCESS", payload: id });
    } catch (error) {
      if (mountedRef.current) {
        dispatch({
          type: "SESSION_ERROR",
          payload:
            error instanceof Error ? error.message : "Failed to cancel session",
        });
      }
      throw error;
    }
  }, []);

  // Create a stable context value with useMemo to prevent unnecessary re-renders in consumers
  const contextValue = useMemo(
    () => ({
      sessionState,
      fetchUserSessions,
      bookSession,
      updateSessionDetails,
      cancelUserSession,
    }),
    [
      sessionState,
      fetchUserSessions,
      bookSession,
      updateSessionDetails,
      cancelUserSession,
    ]
  );

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

// Custom hook to use the session context
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
