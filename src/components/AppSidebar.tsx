import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarTrigger } from "@/components/SidebarTrigger";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useSidebar } from "@/hooks/useSidebar";
import {
  Home,
  Users,
  Package,
  Settings,
  FileText,
  Building2,
} from "lucide-react";
import { Link } from "react-router-dom";

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useSidebar();

  const navItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: Users,
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
    {
      title: "Teams",
      url: "/teams", 
      icon: Building2,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  return (
    <Sheet open={sidebarOpen} onOpenChange={closeSidebar}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="p-0">
          Open
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader className="text-left">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate your CRM and manage your data.
          </SheetDescription>
        </SheetHeader>
        <NavigationMenu>
          <NavigationMenuList>
            {navItems.map((item) => (
              <NavigationMenuItem key={item.title}>
                <Link to={item.url} onClick={closeSidebar}>
                  <Button variant="ghost" className="w-full justify-start">
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <Separator className="my-4" />
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={logout}
        >
          Log Out
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default AppSidebar;
