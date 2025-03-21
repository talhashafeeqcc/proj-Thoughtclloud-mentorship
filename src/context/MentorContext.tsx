import React, { createContext, useContext, useReducer, useEffect } from "react";
import { Mentor, MentorFilter } from "../types";
import { getMentors, getMentorById } from "../services/mentorService";
import { getDatabase } from "../services/database/db";

// Define the context type
interface MentorContextType {
  mentors: Mentor[];
  filteredMentors: Mentor[];
  selectedMentor: Mentor | null;
  loading: boolean;
  error: string | null;
  fetchMentors: () => Promise<void>;
  fetchMentorById: (id: string) => Promise<void>;
  filterMentors: (filter: MentorFilter) => void;
}

// Create the context
const MentorContext = createContext<MentorContextType | undefined>(undefined);

// Define state type
interface MentorState {
  mentors: Mentor[];
  filteredMentors: Mentor[];
  selectedMentor: Mentor | null;
  loading: boolean;
  error: string | null;
  filter: MentorFilter | null;
}

// Define action types
type MentorAction =
  | { type: "FETCH_MENTORS_START" | "FETCH_MENTOR_START" }
  | { type: "FETCH_MENTORS_SUCCESS"; payload: Mentor[] }
  | { type: "FETCH_MENTOR_SUCCESS"; payload: Mentor }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SET_FILTER"; payload: MentorFilter }
  | { type: "CLEAR_FILTER" };

// Initial state
const initialState: MentorState = {
  mentors: [],
  filteredMentors: [],
  selectedMentor: null,
  loading: false,
  error: null,
  filter: null,
};

// Reducer function
const mentorReducer = (
  state: MentorState,
  action: MentorAction
): MentorState => {
  switch (action.type) {
    case "FETCH_MENTORS_START":
    case "FETCH_MENTOR_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "FETCH_MENTORS_SUCCESS":
      return {
        ...state,
        mentors: action.payload,
        filteredMentors: state.filter
          ? applyFilter(action.payload, state.filter)
          : action.payload,
        loading: false,
      };
    case "FETCH_MENTOR_SUCCESS":
      return {
        ...state,
        selectedMentor: action.payload,
        loading: false,
      };
    case "FETCH_ERROR":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case "SET_FILTER":
      return {
        ...state,
        filter: action.payload,
        filteredMentors: applyFilter(state.mentors, action.payload),
      };
    case "CLEAR_FILTER":
      return {
        ...state,
        filter: null,
        filteredMentors: state.mentors,
      };
    default:
      return state;
  }
};

// Helper function to apply filters
const applyFilter = (mentors: Mentor[], filter: MentorFilter): Mentor[] => {
  return mentors.filter((mentor) => {
    // Filter by expertise
    if (filter.expertise && filter.expertise.length > 0) {
      if (!mentor.expertise.some((exp) => filter.expertise!.includes(exp))) {
        return false;
      }
    }

    // Filter by price range
    if (filter.priceRange) {
      if (
        (filter.priceRange.min !== undefined &&
          mentor.sessionPrice < filter.priceRange.min) ||
        (filter.priceRange.max !== undefined &&
          mentor.sessionPrice > filter.priceRange.max)
      ) {
        return false;
      }
    }

    // Filter by availability
    if (filter.availability && filter.availability.date) {
      if (!mentor.availability) return false;

      const availableOnDate = mentor.availability.some(
        (slot) =>
          slot.date === filter.availability!.date &&
          (!filter.availability!.startTime ||
            slot.startTime >= filter.availability!.startTime) &&
          (!filter.availability!.endTime ||
            slot.endTime <= filter.availability!.endTime) &&
          !slot.isBooked
      );
      if (!availableOnDate) {
        return false;
      }
    }

    return true;
  });
};

// Provider component
export const MentorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(mentorReducer, initialState);

  // Initialize the database
  useEffect(() => {
    const initDb = async () => {
      try {
        await getDatabase();
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    };

    initDb();
  }, []);

  // Fetch all mentors
  const fetchMentors = async () => {
    dispatch({ type: "FETCH_MENTORS_START" });
    try {
      const mentors = await getMentors();
      dispatch({ type: "FETCH_MENTORS_SUCCESS", payload: mentors });
    } catch (error) {
      dispatch({
        type: "FETCH_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to fetch mentors",
      });
    }
  };

  // Fetch mentor by ID
  const fetchMentorById = async (id: string) => {
    dispatch({ type: "FETCH_MENTOR_START" });
    try {
      const mentor = await getMentorById(id);
      if (!mentor) {
        throw new Error(`Mentor with ID ${id} not found`);
      }
      dispatch({ type: "FETCH_MENTOR_SUCCESS", payload: mentor as Mentor });
    } catch (error) {
      dispatch({
        type: "FETCH_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : `Failed to fetch mentor with ID ${id}`,
      });
    }
  };

  // Filter mentors
  const filterMentors = (filter: MentorFilter) => {
    dispatch({ type: "SET_FILTER", payload: filter });
  };

  // Create the context value
  const contextValue: MentorContextType = {
    mentors: state.mentors,
    filteredMentors: state.filteredMentors,
    selectedMentor: state.selectedMentor,
    loading: state.loading,
    error: state.error,
    fetchMentors,
    fetchMentorById,
    filterMentors,
  };

  return (
    <MentorContext.Provider value={contextValue}>
      {children}
    </MentorContext.Provider>
  );
};

// Custom hook to use the mentor context
export const useMentor = (): MentorContextType => {
  const context = useContext(MentorContext);
  if (context === undefined) {
    throw new Error("useMentor must be used within a MentorProvider");
  }
  return context;
};
