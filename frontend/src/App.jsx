import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SavedInternships from "./pages/SavedInternships";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Applications from "./pages/Applications";
import Dashboard from "./pages/Dashboard";
import Resume from "./pages/Resume";
import Internships from "./pages/Internships";
import CareerIntelligence from "./pages/CareerIntelligence";
import MockInterview from "./pages/MockInterview";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Redirect home */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <Resume />
            </ProtectedRoute>
          }
        />

        <Route
          path="/internships"
          element={
            <ProtectedRoute>
              <Internships />
            </ProtectedRoute>
          }
        />

        <Route
          path="/saved-internships"
          element={
            <ProtectedRoute>
              <SavedInternships />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/career"
          element={
            <ProtectedRoute>
              <CareerIntelligence />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mock-interview"
          element={
            <ProtectedRoute>
              <MockInterview />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter"
          element={
            <ProtectedRoute>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/applications"
          element={
            <ProtectedRoute>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;