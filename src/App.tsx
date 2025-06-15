
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/SidebarTrigger";
import UserMenu from "@/components/UserMenu";
import { EmailVerificationBanner } from "@/components/Auth/EmailVerificationBanner";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";

import Index from "./pages/Index";
import ContactsPage from "./pages/ContactsPage";
import InvoicePage from "./pages/InvoicePage";
import ProductPage from "./pages/ProductPage";
import LeadsDistributionPage from "./pages/LeadsDistributionPage";
import TeamManagement from "./pages/TeamManagement";
import RoleManagementPage from "./pages/RoleManagementPage";
import PersonalSettings from "./pages/PersonalSettings";
import SystemsPage from "./pages/SystemsPage";
import NotFound from "./pages/NotFound";
import JoinTeamPage from "./pages/JoinTeamPage";
import PipelinePage from "./pages/PipelinePage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <BrowserRouter>
            <SidebarProvider>
              <div className="min-h-screen flex w-full bg-background">
                <AppSidebar />
                <main className="flex-1 flex flex-col">
                  <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container flex h-14 items-center justify-between px-4">
                      <SidebarTrigger />
                      <UserMenu />
                    </div>
                  </header>
                  <EmailVerificationBanner />
                  <div className="flex-1 overflow-auto p-6">
                    <Routes>
                      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                      <Route path="/pipeline" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
                      <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
                      <Route path="/invoices" element={<ProtectedRoute><InvoicePage /></ProtectedRoute>} />
                      <Route path="/products" element={<ProtectedRoute><ProductPage /></ProtectedRoute>} />
                      <Route path="/leads-distribution" element={<ProtectedRoute><LeadsDistributionPage /></ProtectedRoute>} />
                      <Route path="/team-management" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
                      <Route path="/role-management" element={<ProtectedRoute><RoleManagementPage /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><PersonalSettings /></ProtectedRoute>} />
                      <Route path="/systems" element={<ProtectedRoute><SystemsPage /></ProtectedRoute>} />
                      <Route path="/join/:token" element={<JoinTeamPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                </main>
              </div>
            </SidebarProvider>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
