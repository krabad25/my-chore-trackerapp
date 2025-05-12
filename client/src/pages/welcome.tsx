import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
// Import Isabela's photo
import isabelaPhoto from "../assets/Isabela.jpg";

export default function Welcome() {
  const [, navigate] = useLocation();
  const [profilePhotoUrl] = useState<string>(isabelaPhoto);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-accent to-secondary">
      <motion.div 
        className="text-center mb-10"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold font-nunito text-primary mb-2">
          Welcome to Chore Chart!
        </h1>
        <p className="text-xl font-comic text-dark">Let's earn some rewards today!</p>
      </motion.div>
      
      <div className="photo-container relative w-40 h-40 mb-8">
        <img 
          src={profilePhotoUrl} 
          alt="Isabela's profile photo"
          className="w-full h-full object-cover rounded-full border-4 border-primary shadow-lg"
        />
      </div>
      
      <motion.div 
        className="w-full max-w-md space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button 
          onClick={() => navigate("/login")}
          className="w-full btn-primary text-xl py-6 px-6"
        >
          <i className="ri-login-box-line mr-2 text-2xl"></i>
          Log In
        </Button>
        
        <div className="flex justify-center gap-4 mt-6">
          <Button 
            onClick={() => navigate("/login?tab=child")}
            className="btn-secondary text-md p-3 flex-1"
            variant="outline"
          >
            <i className="ri-user-smile-line mr-2"></i>
            Kid Login
          </Button>
          
          <Button 
            onClick={() => navigate("/login?tab=parent")}
            className="btn-accent text-md p-3 flex-1"
            variant="outline"
          >
            <i className="ri-user-settings-line mr-2"></i>
            Parent Login
          </Button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-dark text-opacity-70 text-sm mb-2">
            A special chore tracker app made for Isabela!
          </p>
          <p className="text-dark text-opacity-70 text-xs">
            Track chores, earn points, and get rewards
          </p>
        </div>
      </motion.div>
    </div>
  );
}