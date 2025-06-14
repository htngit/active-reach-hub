
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/SidebarTrigger";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from './components/AppSidebar';
import { AuthProvider } from './contexts/AuthContext';
import Index from './pages/Index';
import { ContactManager } from './components/ContactManager/ContactManager';
import ProductPage from './pages/ProductPage';
import TeamManagement from './pages/TeamManagement';
import PersonalSettings from './pages/PersonalSettings';
import NotFound from './pages/NotFound';
import JoinTeamPage from './pages/JoinTeamPage';
import InvoicePage from './pages/InvoicePage';

const queryClient = new QueryClient();

const DynamicBreadcrumb = () => {
  const location = useLocation();
  
  const getBreadcrumbItems = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/':
        return { title: 'Dashboard', parent: null };
      case '/contacts':
        return { title: 'Contacts', parent: 'CRM' };
      case '/products':
        return { title: 'Products', parent: 'CRM' };
      case '/invoices':
        return { title: 'Invoices', parent: 'CRM' };
      case '/teams':
        return { title: 'Teams', parent: 'Management' };
      case '/settings':
        return { title: 'Settings', parent: 'Account' };
      default:
        if (path.startsWith('/join-team/')) {
          return { title: 'Join Team', parent: 'Teams' };
        }
        return { title: 'Page Not Found', parent: null };
    }
  };

  const breadcrumbData = getBreadcrumbItems();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbData.parent && (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">
                {breadcrumbData.parent}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbPage>{breadcrumbData.title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background font-sans antialiased">
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <div className="flex flex-1 flex-col">
                  <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <DynamicBreadcrumb />
                  </header>
                  <main className="flex-1 p-4">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/contacts" element={<ContactManager />} />
                      <Route path="/products" element={<ProductPage />} />
                      <Route path="/invoices" element={<InvoicePage />} />
                      <Route path="/teams" element={<TeamManagement />} />
                      <Route path="/settings" element={<PersonalSettings />} />
                      <Route path="/join-team/:token" element={<JoinTeamPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </div>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
