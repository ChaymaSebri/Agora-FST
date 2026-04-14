import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
//import Projects from "./pages/Projects";
import Events from "./pages/Events";
//import Stats from "./pages/Stats";
import Auth from "./pages/Auth";
//import Admin from "./pages/Admin";
//import CreateProject from "./pages/CreateProject";
import CreateEvent from "./pages/CreateEvent";
//import EditEvent from "./pages/EditEvent";
//import NotFound from "./pages/NotFound";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
//import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

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
              <Route
                path="/events"
                element={
                  <>
                    <Navbar />
                    <Events />
                  </>
                }
              />
              <Route
                path="/events/new"
                element={
                  <>
                    <Navbar />
                    <CreateEvent />
                  </>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Disabled routes (kept for later re-enable)
            <Route path="/projects" element={<ProtectedRoute><Navbar /><Projects /></ProtectedRoute>} />
            <Route path="/projects/new" element={<ProtectedRoute><Navbar /><CreateProject /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Navbar /><Events /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><Navbar /><CreateEvent /></ProtectedRoute>} />
            <Route path="/events/:id/edit" element={<ProtectedRoute><Navbar /><EditEvent /></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><Navbar /><Stats /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Navbar /><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            */}
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
