import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Events from "./pages/Events";
import Auth from "./pages/Auth";
import AdminPanel from "./pages/AdminPanel";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import ChangePassword from "./pages/ChangePassword";
import Projects from "./pages/Projects";
import CreateProject from "./pages/CreateProject";
import Stats from "./pages/Stats";
import { ClubDashboard } from "./pages/ClubDashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">Page introuvable</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/events" element={<><Navbar /><Events /></>} />
              <Route 
                path="/events/new" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <CreateEvent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/events/:id/edit" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <EditEvent />
                  </ProtectedRoute>
                } 
              />
              <Route path="/projects" element={<><Navbar /><Projects /></>} />
              <Route 
                path="/projects/new" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <CreateProject />
                  </ProtectedRoute>
                } 
              />
              <Route path="/stats" element={<><Navbar /><Stats /></>} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/edit" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <EditProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/password" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <ChangePassword />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Navbar />
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/club-dashboard" 
                element={
                  <ProtectedRoute requireRole="club">
                    <Navbar />
                    <ClubDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher-dashboard" 
                element={
                  <ProtectedRoute requireRole="enseignant">
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
