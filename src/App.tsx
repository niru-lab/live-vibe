import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Feed from "./pages/Feed";
import Auth from "./pages/Auth";
import Discover from "./pages/Discover";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import CreatePost from "./pages/CreatePost";
import CreateCarousel from "./pages/CreateCarousel";
import Profile from "./pages/Profile";
import EventDetail from "./pages/EventDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="feyrn-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/create" element={<CreateEvent />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/create/carousel" element={<CreateCarousel />} />
              <Route path="/profile" element={<Profile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
