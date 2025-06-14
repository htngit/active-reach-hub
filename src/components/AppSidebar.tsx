
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Users,
  Package,
  FileText,
  Building2,
  ChevronDown,
  ChevronRight,
  Target,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import UserMenu from "./UserMenu";

const AppSidebar = () => {
  const location = useLocation();
  const [crmOpen, setCrmOpen] = useState(true);

  const mainNavItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Companies",
      url: "/team-management", 
      icon: Building2,
    },
  ];

  const crmNavItems = [
    {
      title: "Contacts",
      url: "/contacts",
      icon: Users,
    },
    {
      title: "Leads Distribution",
      url: "/leads-distribution",
      icon: Target,
    },
    {
      title: "Products", 
      url: "/products",
      icon: Package,
    },
    {
      title: "Invoices",
      url: "/invoices",
      icon: FileText,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Xalesin CRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <SidebarMenuItem>
                <Collapsible open={crmOpen} onOpenChange={setCrmOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {crmOpen ? (
                        <ChevronDown className="mr-2 h-4 w-4" />
                      ) : (
                        <ChevronRight className="mr-2 h-4 w-4" />
                      )}
                      <span>CRM</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {crmNavItems.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={location.pathname === item.url}>
                            <Link to={item.url}>
                              <item.icon className="mr-2 h-4 w-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
