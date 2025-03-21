import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState } from '../types';
import { getUsers, addUser } from '../services/userService';

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING' };

interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null
      };
    case 'LOGOUT':
      localStorage.removeItem('user');
      return {
        ...state,
        isAuthenticated: false,
        user: null
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: JSON.parse(user) });
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const users = await getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: 'Invalid credentials' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Login failed' });
    }
  };

  const register = async (userData: Partial<User>) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      const users = await getUsers();
      const existingUser = users.find(u => u.email === userData.email);
      
      if (existingUser) {
        dispatch({ type: 'AUTH_ERROR', payload: 'User already exists' });
        return;
      }
      
      const newUser = await addUser(userData as User);
      dispatch({ type: 'REGISTER_SUCCESS', payload: newUser });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: 'Registration failed' });
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{ authState, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
