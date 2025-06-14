import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/SidebarTrigger";
import Index from "./pages/Index";
import { LoginForm } from "./components/Auth/LoginForm";
import { ResetPassword } from "./components/Auth/ResetPassword";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider as SidebarContextProvider } from "./contexts/SidebarContext";
import TeamManagement from "./pages/TeamManagement";
import JoinTeamPage from "./pages/JoinTeamPage";
import PersonalSettings from "./pages/PersonalSettings";
import SystemsPage from "./pages/SystemsPage";
import ProductPage from "./pages/ProductPage";
import InvoicePage from "./pages/InvoicePage";
import NotFound from "./pages/NotFound";
import ContactsPage from "./pages/ContactsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SidebarContextProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/join-team" element={<JoinTeamPage />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <AppSidebar />
                    <main className="w-full">
                      <SidebarTrigger />
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/team-management" element={<TeamManagement />} />
                        <Route path="/contacts" element={<ContactsPage />} />
                        <Route path="/settings" element={<PersonalSettings />} />
                        <Route path="/settings/billing" element={<PersonalSettings />} />
                        <Route path="/settings/notifications" element={<PersonalSettings />} />
                        <Route path="/settings/systems" element={<SystemsPage />} />
                        <Route path="/products" element={<ProductPage />} />
                        <Route path="/invoices" element={<InvoicePage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </SidebarContextProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
