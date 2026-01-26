import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/auth/Welcome";
import Onboarding from "./pages/auth/Onboarding";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import HealthQuestionnaire from "./pages/health/HealthQuestionnaire";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/dashboard/Profile";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "@/lib/database";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/questionnaire/:userType" element={<HealthQuestionnaire />} />
          <Route
            path="/dashboard"
            element={
              <Navigate to={`/dashboard/${getCurrentUser()?.userType || 'wellness'}`} replace />
            }
          />
          <Route path="/dashboard/:userType" element={<Dashboard />} />
          <Route path="/profile/:userType" element={<Profile />} />
          <Route path="/ai-assistant/:userType" element={<AIHealthAssistant />} />
          <Route path="/health-tracker/:userType" element={<HealthTracker />} />
          <Route path="/nutrition-plan/:userType" element={<NutritionPlan />} />
          <Route path="/exercise-guide/:userType" element={<ExerciseGuide />} />
          <Route path="/educational-hub/:userType" element={<EducationalHub />} />
          <Route path="/medical-centers/:userType" element={<MedicalCenters />} />
          <Route path="/mental-wellness/:userType" element={<MentalWellness />} />
          <Route path="/reminders/:userType" element={<Reminders />} />
          <Route path="/meditation/:userType" element={<Meditation />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
