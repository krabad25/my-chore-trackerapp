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

export function Navbar() {
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

  // Don't display navbar on welcome and login pages
  if (location === "/" && !isAuthenticated) return null;
  if (location === "/login") return null;

  return (
    <motion.header
      className="w-full bg-background border-b shadow-sm fixed top-0 left-0 z-10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href={isAuthenticated ? (isChild ? "/chores" : "/parent") : "/"}>
          <a className="text-lg font-bold">Chore Chart</a>
        </Link>

        {isAuthenticated && (
          <div className="flex items-center gap-4">
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
                
                <DropdownMenuItem className="flex items-center gap-2 text-destructive" onClick={logout}>
                  <i className="ri-logout-box-line"></i>
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