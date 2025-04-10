import { Routes, Route } from "react-router-dom";
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
import TestPage from "./pages/TestPage";

// Import Firebase configuration
import { firebaseApp } from "./services/firebase";

function App() {
  const [firebaseError, setFirebaseError] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const initialCheckDone = useRef(false);
  // Add a ref to track component mounted state
  const isMounted = useRef(true);

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
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">
            Connecting to Firebase...
          </h2>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // If there's a Firebase error, show the error fallback component
  if (firebaseError) {
    return <DatabaseErrorFallback />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4">
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
  );
}

export default App;
