
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/Auth/LoginForm";
import { ResetPassword } from "@/components/Auth/ResetPassword";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { ContactManager } from "@/components/ContactManager/ContactManager";
import { MapsDistribution } from "@/components/MapsDistribution/MapsDistribution";
import { PersonalSettings } from "@/components/Settings/PersonalSettings";
import { TeamManagement } from "@/components/TeamManagement/TeamManagement";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import JoinTeamPage from "./pages/JoinTeamPage";
import ProductPage from "./pages/ProductPage";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <MobileNav />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ContactManager />} />
            <Route path="/contacts" element={<ContactManager />} />
            <Route path="/maps" element={<MapsDistribution />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/products" element={<ProductPage />} />
            <Route path="/settings" element={<div className="p-6"><PersonalSettings /></div>} />
            <Route path="/join-team" element={<JoinTeamPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<AppContent />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
