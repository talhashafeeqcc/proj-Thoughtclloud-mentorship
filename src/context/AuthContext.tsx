import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User, AuthState } from "../types";
import { getDatabase } from "../services/database/db";
import { db } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

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

  // Check for logged in user on initial load
  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const savedUser = localStorage.getItem("currentUser");
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          dispatch({ type: "LOGIN_SUCCESS", payload: userData });
        } else {
          dispatch({ type: "LOGOUT_SUCCESS" });
        }
      } catch (error) {
        console.error("Error checking logged in user:", error);
        dispatch({ type: "LOGOUT_SUCCESS" });
      }
    };

    checkLoggedInUser();
  }, []);

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

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    dispatch({ type: "LOGIN_START" });
    
    try {
      // Query Firestore directly for the user
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error("Invalid email or password");
      }
      
      // Get the user document
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Validate password (direct comparison)
      if (userData.password !== password) {
        throw new Error("Invalid email or password");
      }
      
      // Create user object
      const user: User = {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        profilePicture: userData.profilePicture || undefined,
      };
      
      // Store in localStorage
      localStorage.setItem("currentUser", JSON.stringify(user));
      
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }
      
      dispatch({ type: "LOGIN_SUCCESS", payload: user });
    } catch (error: any) {
      console.error("Login error:", error);
      
      dispatch({ 
        type: "AUTH_ERROR", 
        payload: error.message || "Login failed. Please check your credentials and try again." 
      });
      throw error;
    }
  };

  // Register function using direct Firestore access
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: "mentor" | "mentee" | "admin";
    profilePicture?: string;
  }) => {
    dispatch({ type: "REGISTER_START" });
    
    try {
      // Check if email already exists in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", data.email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error("Email already exists. Please use a different email or try logging in.");
      }
      
      // Use database adapter to create new user
      const dbInstance = await getDatabase();
      
      // Create timestamp
      const now = Date.now();
      
      // Create user document with plain password (matching existing structure)
      const newUser = {
        email: data.email,
        name: data.name,
        role: data.role,
        password: data.password, // Store as plain text to match existing pattern
        profilePicture: data.profilePicture || "",
        createdAt: now,
        updatedAt: now
      };
      
      // Insert into database
      const userDoc = await dbInstance.users.insert(newUser);
      const user = userDoc.toJSON();
      
      // Create user object without sensitive data
      const userData: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePicture: user.profilePicture || undefined,
      };
      
      // Auto-login after registration
      localStorage.setItem("currentUser", JSON.stringify(userData));
      
      dispatch({ type: "REGISTER_SUCCESS", payload: userData });
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Provide user-friendly error message
      let errorMessage = "Registration failed. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch({ type: "AUTH_ERROR", payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    dispatch({ type: "LOGOUT_START" });
    
    try {
      // Clear user data from localStorage
      localStorage.removeItem("currentUser");
      localStorage.removeItem("rememberMe");
      
      dispatch({ type: "LOGOUT_SUCCESS" });
    } catch (error: any) {
      console.error("Logout error:", error);
      dispatch({
        type: "AUTH_ERROR",
        payload: "Logout failed. Please try again."
      });
    }
  };

  // Update user function
  const updateUser = (user: User) => {
    // Update user in localStorage
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
