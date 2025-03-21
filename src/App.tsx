import React from 'react';
import { Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import MentorListPage from './pages/MentorListPage';
import MentorProfilePage from './pages/MentorProfilePage';
import SessionDetails from './components/SessionDetails';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/mentors" element={<MentorListPage />} />
            <Route path="/mentors/:id" element={<MentorProfilePage />} />
            <Route path="/sessions/:id" element={<SessionDetails />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
