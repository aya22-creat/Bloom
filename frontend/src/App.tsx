import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import Register from "./pages/Register";
import Login from "./pages/Login";
import HealthQuestionnaire from "./pages/HealthQuestionnaire";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "@/lib/database";
import AIHealthAssistant from "./pages/AIHealthAssistant";
import HealthTracker from "./pages/HealthTracker";
import NutritionPlan from "./pages/NutritionPlan";
import ExerciseGuide from "./pages/ExerciseGuide";
import EducationalHub from "./pages/EducationalHub";
import MedicalCenters from "./pages/MedicalCenters";
import MentalWellness from "./pages/MentalWellness";
import Reminders from "./pages/Reminders";
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
