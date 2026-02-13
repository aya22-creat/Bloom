import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/auth/Welcome";
import Onboarding from "./pages/auth/Onboarding";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import HealthQuestionnaire from "./pages/health/HealthQuestionnaire";
import Dashboard from "./pages/dashboard/Dashboard";
import Profile from "./pages/dashboard/Profile";
import HistoryReport from "./pages/dashboard/HistoryReport";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AIHealthAssistant from "./pages/health/AIHealthAssistant";
import SelfAssessment from "./pages/health/SelfAssessment";
import HealthTracker from "./pages/health/HealthTracker";
import PatientHistory from "./pages/health/PatientHistory";
import NutritionPlan from "./pages/wellness/NutritionPlan";
import ExerciseGuide from "./pages/education/ExerciseGuide";
import AIExerciseCoach from "./pages/education/AIExerciseCoach";
import EducationalHub from "./pages/education/EducationalHub";
import ExerciseVideos from "./pages/education/ExerciseVideos";
import ThreeDGuide from "./pages/education/ThreeDGuide";
import MedicalCenters from "./pages/health/MedicalCenters";
import MentalWellness from "./pages/wellness/MentalWellness";
import CommunityForum from "./pages/wellness/CommunityForum";
import Reminders from "./pages/dashboard/Reminders";
import ReminderAction from "./pages/dashboard/ReminderAction";
import Meditation from "./pages/wellness/Meditation";
import NotFound from "./pages/NotFound";

// Course routes
import { CourseCatalog } from "./pages/education/CourseCatalog";
import { CourseDetails } from "./pages/education/CourseDetails";
import { MyCourses } from "./pages/education/MyCourses";
import { CoursePlayer } from "./pages/education/CoursePlayer";
import { PaymentSuccess } from "./pages/education/PaymentSuccess";

// Admin routes
import { AdminDashboard } from "./pages/admin/AdminDashboard";

// Community routes
import CommunityLayout from "./components/community/CommunityLayout";
import CommunityHome from "./pages/community/CommunityHome";
import SessionsList from "./pages/community/SessionsList";
import SessionDetails from "./pages/community/SessionDetails";
import NewsList from "./pages/community/NewsList";
import NewsDetails from "./pages/community/NewsDetails";

// Marketplace routes
import MarketplaceHome from "./pages/marketplace/MarketplaceHome";
import ProductDetails from "./pages/marketplace/ProductDetails";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

const DashboardRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  const validUserTypes = ['fighter', 'survivor', 'wellness'];
  const userType = validUserTypes.includes(user.userType) ? user.userType : 'wellness';
  
  return <Navigate to={`/dashboard/${userType}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login/*" element={<Login />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />
          <Route path="/sign-in" element={<Navigate to="/login" replace />} />
          <Route path="/404" element={<Navigate to="/login" replace />} />
          <Route path="/onboarding" element={<Onboarding />} />
          {/* Public AI Exercise Coach (camera/pose estimation) */}
          <Route path="/exercise-coach" element={<AIExerciseCoach />} />
          
          {/* Marketplace Routes (Public) */}
          <Route path="/marketplace" element={<MarketplaceHome />} />
          <Route path="/marketplace/product/:id" element={<ProductDetails />} />
          
          {/* Course Routes (Public) */}
          <Route path="/courses" element={<CourseCatalog />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          
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
            path="/history-report/:userType" 
            element={
              <ProtectedRoute>
                <HistoryReport />
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
            path="/self-assessment/:userType" 
            element={
              <ProtectedRoute>
                <SelfAssessment />
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
            path="/patient-history/:userType" 
            element={
              <ProtectedRoute>
                <PatientHistory />
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
            path="/exercise-coach/:userType" 
            element={
              <ProtectedRoute>
                <AIExerciseCoach />
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
            path="/3d-guide/:userType" 
            element={
              <ProtectedRoute>
                <ThreeDGuide />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/exercise-videos/:userType" 
            element={
              <ProtectedRoute>
                <ExerciseVideos />
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
            path="/community-forum/:userType" 
            element={
              <ProtectedRoute>
                <CommunityForum />
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
            path="/reminder-action/:userType/:type" 
            element={
              <ProtectedRoute>
                <ReminderAction />
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
          
          {/* Course Protected Routes */}
          <Route 
            path="/my-courses" 
            element={
              <ProtectedRoute>
                <MyCourses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/course/:id/learn" 
            element={
              <ProtectedRoute>
                <CoursePlayer />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/success" 
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Community Routes */}
          <Route path="/community" element={<CommunityLayout />}>
            <Route index element={<CommunityHome />} />
            <Route path="sessions" element={<SessionsList />} />
            <Route path="sessions/:id" element={<SessionDetails />} />
            <Route path="news" element={<NewsList />} />
            <Route path="news/:id" element={<NewsDetails />} />
          </Route>
          
          {/* Catch invalid protected routes */}
          <Route 
            path="/:invalidRoute/:userType" 
            element={
              <ProtectedRoute>
                <NotFound />
              </ProtectedRoute>
            } 
          />
          
          {/* 404 Route - Must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
