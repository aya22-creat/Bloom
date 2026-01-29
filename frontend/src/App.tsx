import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/auth/Welcome";
import Onboarding from "./pages/auth/Onboarding";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import HealthQuestionnaire from "./pages/health/HealthQuestionnaire";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/dashboard/Profile";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AIHealthAssistant from "./pages/health/AIHealthAssistant";
import HealthTracker from "./pages/health/HealthTracker";
import NutritionPlan from "./pages/wellness/NutritionPlan";
import ExerciseGuide from "./pages/education/ExerciseGuide";
import EducationalHub from "./pages/education/EducationalHub";
import MedicalCenters from "./pages/health/MedicalCenters";
import MentalWellness from "./pages/wellness/MentalWellness";
import Reminders from "./pages/dashboard/Reminders";
import Meditation from "./pages/wellness/Meditation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const DashboardRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={`/dashboard/${user?.userType || 'wellness'}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Protected Routes */}
          <Route 
            path="/questionnaire/:userType" 
            element={
              <ProtectedRoute>
                <HealthQuestionnaire />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRedirect />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/:userType" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:userType" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-assistant/:userType" 
            element={
              <ProtectedRoute>
                <AIHealthAssistant />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/health-tracker/:userType" 
            element={
              <ProtectedRoute>
                <HealthTracker />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nutrition-plan/:userType" 
            element={
              <ProtectedRoute>
                <NutritionPlan />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/exercise-guide/:userType" 
            element={
              <ProtectedRoute>
                <ExerciseGuide />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/educational-hub/:userType" 
            element={
              <ProtectedRoute>
                <EducationalHub />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/medical-centers/:userType" 
            element={
              <ProtectedRoute>
                <MedicalCenters />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mental-wellness/:userType" 
            element={
              <ProtectedRoute>
                <MentalWellness />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reminders/:userType" 
            element={
              <ProtectedRoute>
                <Reminders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/meditation/:userType" 
            element={
              <ProtectedRoute>
                <Meditation />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 Route - Must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
