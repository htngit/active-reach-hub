
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Settings,
  LogOut,
  User,
  CreditCard,
  Bell,
  ChevronDown,
  Cog,
  Building2,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const UserMenu = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const settingsNavItems = [
    {
      title: "Account",
      url: "/settings",
      icon: User,
    },
    {
      title: "Billing",
      url: "/settings/billing",
      icon: CreditCard,
    },
    {
      title: "Notifications",
      url: "/settings/notifications",
      icon: Bell,
    },
    {
      title: "Systems",
      url: "/settings/systems",
      icon: Cog,
    },
  ];

  const systemPagesItems = [
    {
      title: "Team Management",
      url: "/team-management",
      icon: Building2,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Settings</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {settingsNavItems.map((item) => (
          <DropdownMenuItem key={item.title} asChild>
            <Link 
              to={item.url}
              className={`w-full ${location.pathname === item.url ? 'bg-accent' : ''}`}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Settings className="mr-2 h-4 w-4" />
            <span>System Pages</span>
            <ChevronRight className="ml-auto h-4 w-4" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            {systemPagesItems.map((item) => (
              <DropdownMenuItem key={item.title} asChild>
                <Link 
                  to={item.url}
                  className={`w-full ${location.pathname === item.url ? 'bg-accent' : ''}`}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
