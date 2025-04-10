import type { User } from "../types";
import {
  getDocuments,
  whereEqual,
  COLLECTIONS
} from "./firebase";

interface UserDocument {
  id: string;
  email: string;
  name: string;
  role: "mentor" | "mentee" | "admin";
  password: string;
  profilePicture?: string;
  createdAt: number;
  updatedAt: number;
}

// Simple password comparison function
const comparePasswords = (plain: string, hashed: string): boolean => {
  // Check if the hashed password starts with our mock prefix
  return hashed.startsWith(`hashed_${plain}_`);
};

export const login = async (email: string, password: string, rememberMe: boolean = false): Promise<User> => {
  try {
    const users = await getDocuments<UserDocument>(
      COLLECTIONS.USERS,
      [whereEqual('email', email)]
    );

    if (users.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = users[0];
    const isValid = comparePasswords(password, user.password);

    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    // Store user data in localStorage
    const userData: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePicture: user.profilePicture,
    };

    localStorage.setItem("currentUser", JSON.stringify(userData));

    // If remember me is checked, store credentials securely
    if (rememberMe) {
      const credentials = {
        email,
        password: `hashed_${password}_${Date.now()}`, // Simple hashing for demo
      };
      localStorage.setItem("rememberedCredentials", JSON.stringify(credentials));
    }

    return userData;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Add function to check for remembered credentials
export const getRememberedCredentials = (): { email: string; password: string } | null => {
  const credentials = localStorage.getItem("rememberedCredentials");
  if (credentials) {
    try {
      return JSON.parse(credentials);
    } catch {
      return null;
    }
  }
  return null;
}; 