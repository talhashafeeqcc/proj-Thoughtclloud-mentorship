import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User, AuthState } from "../types";
import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
} from "../services/userService";
import { getDatabase } from "../services/database/db";

// Define the context type
export interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: "mentor" | "mentee" | "admin";
    profilePicture?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define action types
type AuthAction =
  | { type: "LOGIN_START" | "REGISTER_START" | "LOGOUT_START" }
  | {
      type: "LOGIN_SUCCESS" | "REGISTER_SUCCESS" | "UPDATE_USER";
      payload: User;
    }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "LOGOUT_SUCCESS" };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
    case "REGISTER_START":
    case "LOGOUT_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case "AUTH_ERROR":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "LOGOUT_SUCCESS":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  // Ensure database is initialized
  useEffect(() => {
    const initDb = async () => {
      try {
        await getDatabase();
      } catch (error) {
        console.error("Failed to initialize database:", error);
        dispatch({
          type: "AUTH_ERROR",
          payload: "Failed to initialize application. Please refresh the page.",
        });
      }
    };

    initDb();
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          console.log("Loaded user from storage:", user.id);
          dispatch({ type: "LOGIN_SUCCESS", payload: user });
        } else {
          console.log("No user found in storage");
          dispatch({ type: "LOGOUT_SUCCESS" });
        }
      } catch (error) {
        console.error("Error loading user:", error);
        dispatch({ type: "LOGOUT_SUCCESS" });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const userData = await loginUser({ email, password, rememberMe });
      // Save user to localStorage for session persistence
      localStorage.setItem("currentUser", JSON.stringify(userData));
      dispatch({ type: "LOGIN_SUCCESS", payload: userData });
    } catch (error) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error instanceof Error ? error.message : "Login failed",
      });
    }
  };

  // Register function
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: "mentor" | "mentee" | "admin";
    profilePicture?: string;
  }) => {
    dispatch({ type: "REGISTER_START" });
    try {
      const user = await registerUser(data);
      // Save user to localStorage for session persistence
      localStorage.setItem("currentUser", JSON.stringify(user));
      dispatch({ type: "REGISTER_SUCCESS", payload: user });
    } catch (error) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error instanceof Error ? error.message : "Registration failed",
      });
    }
  };

  // Logout function
  const logout = async () => {
    dispatch({ type: "LOGOUT_START" });
    try {
      await logoutUser();
      dispatch({ type: "LOGOUT_SUCCESS" });
    } catch (error) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error instanceof Error ? error.message : "Logout failed",
      });
    }
  };

  // Update user function
  const updateUser = (user: User) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
    dispatch({ type: "UPDATE_USER", payload: user });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Create the context value
  const contextValue: AuthContextType = {
    authState,
    login,
    register,
    logout,
    updateUser,
    clearError,
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
