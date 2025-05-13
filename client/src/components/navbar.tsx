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
                <Button variant="ghost" className="h-9 w-9 p-0 rounded-full">
                  <Avatar className="h-9 w-9">
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
                  <i className="ri-user-line"></i>
                  <span>Profile</span>
                </DropdownMenuItem>
                
                {isChild && (
                  <>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/chores")}>
                      <i className="ri-calendar-todo-line"></i>
                      <span>Chores</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/rewards")}>
                      <i className="ri-gift-line"></i>
                      <span>Rewards</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/progress")}>
                      <i className="ri-bar-chart-line"></i>
                      <span>Progress</span>
                    </DropdownMenuItem>
                  </>
                )}
                
                {isParent && (
                  <>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/parent")}>
                      <i className="ri-dashboard-line"></i>
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/add-chore")}>
                      <i className="ri-add-circle-line"></i>
                      <span>Add Chore</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2" onClick={() => navigate("/add-reward")}>
                      <i className="ri-award-line"></i>
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