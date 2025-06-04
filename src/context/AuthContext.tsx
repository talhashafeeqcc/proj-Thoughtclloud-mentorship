import React, { createContext, useContext, useReducer, useEffect } from "react";
import { User, AuthState } from "../types";
import { getDatabase } from "../services/database/db";
import { db, auth } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// Define the context type
export interface AuthContextType {
  authState: AuthState;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
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
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  // Check for logged in user on initial load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in, get additional data from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: userData.name || "",
              role: userData.role || "mentee",
              profilePicture: userData.profilePicture || undefined,
            };

            dispatch({ type: "LOGIN_SUCCESS", payload: user });
          } else {
            // No user document found, create a basic one
            console.log("User document not found, creating a basic one");
            dispatch({ type: "LOGOUT_SUCCESS" });
          }
        } else {
          dispatch({ type: "LOGOUT_SUCCESS" });
        }
      } catch (error) {
        console.error("Error checking auth state:", error);
        dispatch({ type: "LOGOUT_SUCCESS" });
      }
    });

    return () => unsubscribe();
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

  // Login function using Firebase Auth
  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false
  ) => {
    dispatch({ type: "LOGIN_START" });

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Get additional user data from Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create a basic user document if it doesn't exist
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          name: firebaseUser.displayName || email.split("@")[0],
          role: "mentee",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      const userData = userDoc.exists()
        ? userDoc.data()
        : {
            name: firebaseUser.displayName || email.split("@")[0],
            role: "mentee",
          };

      // Create user object
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        name: userData.name || "",
        role: userData.role || "mentee",
        profilePicture: userData.profilePicture || undefined,
      };

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
        payload:
          error.message ||
          "Login failed. Please check your credentials and try again.",
      });
      throw error;
    }
  };

  // Register function using Firebase Auth
  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: "mentor" | "mentee" | "admin";
    profilePicture?: string;
  }) => {
    dispatch({ type: "REGISTER_START" });

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const firebaseUser = userCredential.user;

      // Create timestamp
      const now = Date.now();

      // Create user document in Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, {
        email: data.email,
        name: data.name,
        role: data.role,
        profilePicture: data.profilePicture || "",
        createdAt: now,
        updatedAt: now,
      });

      // Create user object
      const userData: User = {
        id: firebaseUser.uid,
        email: data.email,
        name: data.name,
        role: data.role,
        profilePicture: data.profilePicture || undefined,
      };

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

  // Logout function using Firebase Auth
  const logout = async () => {
    dispatch({ type: "LOGOUT_START" });

    try {
      // Sign out from Firebase
      await signOut(auth);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("rememberMe");

      dispatch({ type: "LOGOUT_SUCCESS" });
    } catch (error: any) {
      console.error("Logout error:", error);
      dispatch({
        type: "AUTH_ERROR",
        payload: error.message || "Logout failed.",
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
