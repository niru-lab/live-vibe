import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { IconContext } from "@phosphor-icons/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SwipeBackProvider } from "@/components/layout/SwipeBackProvider";
import Feed from "./pages/Feed";
import Welcome from "./pages/Welcome";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import Onboarding from "./pages/Onboarding";
import AuthCallback from "./pages/AuthCallback";
import Discover from "./pages/Discover";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import CreatePost from "./pages/CreatePost";
import CreateCarousel from "./pages/CreateCarousel";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import EventDetail from "./pages/EventDetail";
import Messages from "./pages/Messages";
import Roomz from "./pages/Roomz";
import CreateRoom from "./pages/CreateRoom";
import RoomDetail from "./pages/RoomDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 30_000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <IconContext.Provider value={{ weight: "thin", size: 24 }}>
      <ThemeProvider defaultTheme="dark" storageKey="feyrn-theme">
        <AuthProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <OfflineBanner />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SwipeBackProvider />
                <Routes>
                  <Route path="/" element={<Feed />} />
                  <Route path="/auth" element={<Welcome />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/create" element={<CreateEvent />} />
                  <Route path="/events/:id" element={<EventDetail />} />
                  <Route path="/create" element={<CreatePost />} />
                  <Route path="/create/carousel" element={<CreateCarousel />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/u/:username" element={<UserProfile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/roomz" element={<Roomz />} />
                  <Route path="/roomz/create" element={<CreateRoom />} />
                  <Route path="/roomz/:id" element={<RoomDetail />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </IconContext.Provider>
  </QueryClientProvider>
);

export default App;
