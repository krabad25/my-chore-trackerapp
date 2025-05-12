import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { User } from "@shared/schema";

export default function Welcome() {
  const [, navigate] = useLocation();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  useEffect(() => {
    if (user?.profilePhoto) {
      setProfilePhotoUrl(user.profilePhoto);
    }
  }, [user]);
  
  const handlePhotoSuccess = (url: string) => {
    setProfilePhotoUrl(url);
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-accent to-secondary">
      <motion.div 
        className="text-center mb-10"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold font-nunito text-primary mb-2">
          {isLoading ? (
            <Skeleton className="h-12 w-64 bg-white/50" />
          ) : (
            `Welcome, ${user?.childName || "Isabela"}!`
          )}
        </h1>
        <p className="text-xl font-comic text-dark">Let's earn some rewards today!</p>
      </motion.div>
      
      <div className="photo-container relative w-40 h-40 mb-8">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-full" />
        ) : (
          <img 
            src={profilePhotoUrl || "https://i.imgur.com/kx7zcZy.png"} 
            alt={`${user?.childName || "Isabela"}'s profile photo`}
            className="w-full h-full object-cover rounded-full border-4 border-primary shadow-lg"
          />
        )}
        
        <div className="absolute bottom-0 right-0">
          <FileUpload onUploadSuccess={handlePhotoSuccess} />
        </div>
      </div>
      
      <motion.div 
        className="w-full max-w-md space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button 
          onClick={() => navigate("/chores")}
          className="w-full btn-primary text-xl py-4 px-6"
        >
          <i className="ri-check-double-line mr-2 text-2xl"></i>
          My Chores
        </Button>
        
        <Button 
          onClick={() => navigate("/rewards")}
          className="w-full btn-secondary text-xl py-4 px-6"
        >
          <i className="ri-gift-line mr-2 text-2xl"></i>
          My Rewards
        </Button>
        
        <Button 
          onClick={() => navigate("/progress")}
          className="w-full btn-accent text-xl py-4 px-6"
        >
          <i className="ri-bar-chart-line mr-2 text-2xl"></i>
          My Progress
        </Button>
        
        <Button 
          onClick={() => navigate("/parent")}
          className="mt-10 text-dark opacity-70 hover:opacity-100 text-sm flex mx-auto"
          variant="ghost"
        >
          <i className="ri-lock-line mr-1"></i>
          Parent Mode
        </Button>
      </motion.div>
    </div>
  );
}
