import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RewardCard } from "@/components/reward-card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Reward, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Rewards() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });
  
  const handleRewardClaim = (reward: Reward) => {
    toast({
      title: "Reward Claimed!",
      description: `${user?.childName || "Isabela"} has claimed ${reward.title}!`,
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="header secondary">
        <div className="container mx-auto flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="text-white text-2xl"
          >
            <i className="ri-arrow-left-line"></i>
          </Button>
          <h1 className="text-2xl font-bold font-nunito">Rewards to Earn</h1>
          <div className="flex items-center space-x-1">
            <span className="text-xl font-bold">{user?.points || 0}</span>
            <i className="ri-star-fill text-accent"></i>
          </div>
        </div>
      </header>
      
      <div className="flex-grow p-4 overflow-auto">
        <div className="container mx-auto max-w-md">
          <div className="grid grid-cols-2 gap-4">
            {isLoadingRewards ? (
              // Loading skeletons
              Array(4).fill(0).map((_, i) => (
                <div className="bg-white rounded-xl shadow-md overflow-hidden" key={`reward-skeleton-${i}`}>
                  <Skeleton className="w-full h-32" />
                  <div className="p-3">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </div>
                </div>
              ))
            ) : rewards && rewards.length > 0 ? (
              rewards.map(reward => (
                <RewardCard 
                  key={reward.id} 
                  reward={reward} 
                  userPoints={user?.points || 0}
                  onClaim={handleRewardClaim}
                />
              ))
            ) : (
              <div className="col-span-2 text-center text-muted-foreground py-8">
                No rewards found
              </div>
            )}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Button 
              onClick={() => navigate("/add-reward")}
              className="add-reward-btn w-full btn-accent text-xl py-4 px-6"
            >
              <i className="ri-add-circle-line mr-2 text-2xl"></i>
              Add New Reward
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
