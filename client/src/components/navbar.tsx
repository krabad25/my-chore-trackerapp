import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Navbar() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isChild, isParent, user, userName, logout } = useAuth();
  const isMobile = useIsMobile();
  const [location] = useLocation();
  
  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Don't display navbar on welcome page for unauthenticated users
  if (location === "/" && !isAuthenticated) return null;

  return (
    <motion.header
      className="w-full bg-background border-b shadow-sm fixed top-0 left-0 z-10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => navigate(isAuthenticated ? (isChild ? "/chores" : "/parent") : "/")}
          className="text-lg font-bold bg-transparent border-none cursor-pointer p-0"
        >
          Chore Chart
        </button>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={logout}
              className="flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M5 22C4.44772 22 4 21.5523 4 21V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V6H18V4H6V20H18V18H20V21C20 21.5523 19.5523 22 19 22H5ZM18 16V13H11V11H18V8L23 12L18 16Z"></path>
              </svg>
              Logout
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 w-9 p-0 rounded-full border-2 border-gray-300 shadow-sm">
                  <Avatar className="h-full w-full">
                    {user?.profilePhoto ? (
                      <AvatarImage src={user.profilePhoto} alt={userName || ""} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(userName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px]">
                <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/profile")}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22H18C18 18.6863 15.3137 16 12 16C8.68629 16 6 18.6863 6 22H4ZM12 13C8.685 13 6 10.315 6 7C6 3.685 8.685 1 12 1C15.315 1 18 3.685 18 7C18 10.315 15.315 13 12 13ZM12 11C14.21 11 16 9.21 16 7C16 4.79 14.21 3 12 3C9.79 3 8 4.79 8 7C8 9.21 9.79 11 12 11Z"></path>
                  </svg>
                  <span>Profile</span>
                </DropdownMenuItem>
                
                {isChild && (
                  <>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/chores")}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M11 4H21V6H11V4ZM11 8H17V10H11V8ZM11 14H21V16H11V14ZM11 18H17V20H11V18ZM3 4H9V10H3V4ZM5 6V8H7V6H5ZM3 14H9V20H3V14ZM5 16V18H7V16H5Z"></path>
                      </svg>
                      <span>Chores</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/rewards")}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M14.0497 16.2713L12 22L9.95025 16.2713C8.9795 16.7343 7.88976 17 6.75 17C3.57421 17 1 14.4258 1 11.25C1 8.2711 3.30351 5.82147 6.1884 5.55781C8.41714 2.19264 13.5829 2.19264 15.8116 5.55781C18.6965 5.82147 21 8.2711 21 11.25C21 14.4258 18.4258 17 15.25 17C14.1102 17 13.0205 16.7343 12.0497 16.2713ZM12 14.25C14.0711 14.25 15.75 12.5711 15.75 10.5C15.75 8.42893 14.0711 6.75 12 6.75C9.92893 6.75 8.25 8.42893 8.25 10.5C8.25 12.5711 9.92893 14.25 12 14.25Z"></path>
                      </svg>
                      <span>Rewards</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/progress")}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M3 3H11V11H3V3ZM3 13H11V21H3V13ZM13 3H21V11H13V3ZM13 13H21V21H13V13Z"></path>
                      </svg>
                      <span>Progress</span>
                    </DropdownMenuItem>
                  </>
                )}
                
                {isParent && (
                  <>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/parent")}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z"></path>
                      </svg>
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/add-chore")}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path>
                      </svg>
                      <span>Add Chore</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/add-reward")}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M13 16.9385V21H11V16.9385C8.60771 16.446 7 14.4174 7 12V5H17V12C17 14.4174 15.3923 16.446 13 16.9385ZM9 7V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V7H9ZM4 3H20V5H4V3Z"></path>
                      </svg>
                      <span>Add Reward</span>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuItem className="flex items-center gap-2 text-destructive font-bold" onClick={logout}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M5 22C4.44772 22 4 21.5523 4 21V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V6H18V4H6V20H18V18H20V21C20 21.5523 19.5523 22 19 22H5ZM18 16V13H11V11H18V8L23 12L18 16Z"></path>
                  </svg>
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </motion.header>
  );
}