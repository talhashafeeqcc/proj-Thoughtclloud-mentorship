import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MentorListPage from "./pages/MentorListPage";
import MentorProfilePage from "./pages/MentorProfilePage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import PaymentPage from "./pages/PaymentPage";
import SessionDetailsPage from "./pages/SessionDetailsPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DatabaseErrorFallback from "./components/utility/DatabaseErrorFallback";
import { useEffect, useState, useRef } from "react";
import { useTheme } from "./context/ThemeContext";
import TestPage from "./pages/TestPage";
import { Helmet, HelmetProvider } from "react-helmet-async";
import StripeProvider from "./components/StripeProvider";

// Import Firebase configuration
import { firebaseApp } from "./services/firebase";

function App() {
  const [firebaseError, setFirebaseError] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const initialCheckDone = useRef(false);
  // Add a ref to track component mounted state
  const isMounted = useRef(true);
  const { mode } = useTheme();
  const location = useLocation();

  // Set dark mode class on document element
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  // Add scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // Set up mount tracking
    isMounted.current = true;

    // Only perform initialization once
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    // Initialize Firebase
    try {
      if (firebaseApp) {
        console.log("Firebase initialized successfully");

        // Short timeout to allow Firebase to connect
        setTimeout(() => {
          if (isMounted.current) {
            setInitializing(false);
          }
        }, 1000);
      } else {
        throw new Error("Firebase app not initialized");
      }
    } catch (error) {
      console.error("Firebase initialization error:", error);
      if (isMounted.current) {
        setFirebaseError(true);
        setInitializing(false);
      }
    }

    // If initialization takes too long, show error
    const timeoutId = setTimeout(() => {
      if (isMounted.current && initializing) {
        console.warn("Firebase initialization timed out");
        setFirebaseError(true);
        setInitializing(false);
      }
    }, 5000); // 5 second timeout

    return () => {
      // Handle cleanup
      isMounted.current = false;
      clearTimeout(timeoutId);
    };

    // Skip dependency array warnings - this effect should only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading state while initializing
  if (initializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 dark:text-white animate-fade-in">
            Connecting to Firebase...
          </h2>
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // If there's a Firebase error, show the error fallback component
  if (firebaseError) {
    return <DatabaseErrorFallback />;
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>MentorMatch - Find Your Perfect Mentor</title>
        <meta name="description" content="Connect with experienced professionals who can guide you through your career journey" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content={mode === 'dark' ? '#1e1e1e' : '#ffffff'} />
      </Helmet>
      <StripeProvider>
        <div className="flex flex-col min-h-screen transition-colors duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          <Navbar />
          <main className="flex-grow relative">
            {/* Background decorative elements */}
            <div className="hidden md:block absolute top-40 right-10 w-64 h-64 bg-purple-100 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-70 animate-float"></div>
            <div className="hidden md:block absolute bottom-40 left-10 w-72 h-72 bg-indigo-100 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-70 animate-float" style={{ animationDelay: "2s" }}></div>

            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/mentors" element={<MentorListPage />} />
              <Route path="/mentors/:mentorId" element={<MentorProfilePage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment/:sessionId"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sessions/:sessionId"
                element={
                  <ProtectedRoute>
                    <SessionDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test"
                element={
                  <TestPage />
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </StripeProvider>
    </HelmetProvider>
  );
}

export default App;
