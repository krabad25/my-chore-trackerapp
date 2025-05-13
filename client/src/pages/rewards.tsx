import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RewardCard } from "@/components/reward-card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Reward, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Celebration } from "@/components/celebration";

export default function Rewards() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });
  
  const claimMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      return apiRequest(`/api/rewards/${rewardId}/claim`, {
        method: "POST",
        credentials: "include"
      });
    },
    onSuccess: () => {
      setShowDialog(false);
      
      // Show celebration and update user data
      setShowCelebration(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to claim reward. Try again later.",
        variant: "destructive"
      });
    }
  });
  
  const handleRewardClaim = (reward: Reward) => {
    // For child role, show confirmation dialog
    if (user?.role === "child") {
      setSelectedReward(reward);
      setShowDialog(true);
      return;
    }
    
    // For parent role, just show notification
    toast({
      title: "Reward Claimed!",
      description: `${user?.name || "Isabela"} has claimed ${reward.title}!`,
    });
  };
  
  const confirmRewardClaim = () => {
    if (!selectedReward) return;
    
    const userPoints = user?.points ?? 0;
    
    if (userPoints >= selectedReward.points) {
      claimMutation.mutate(selectedReward.id);
    } else {
      toast({
        title: "Not Enough Points",
        description: `You need ${selectedReward.points - userPoints} more points to claim this reward.`,
        variant: "destructive"
      });
      setShowDialog(false);
    }
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
          
          {/* Only show Add New Reward button for parent role */}
          {user?.role === "parent" && (
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
          )}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Claim Reward</DialogTitle>
            <DialogDescription className="text-lg">
              Are you sure you want to claim this reward?
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="bg-muted p-4 rounded-lg flex items-center gap-4 my-4">
              <div className="bg-primary/20 rounded-full p-3">
                <i className="ri-gift-line text-3xl text-primary"></i>
              </div>
              <div>
                <h3 className="font-bold text-xl">{selectedReward.title}</h3>
                <p className="flex items-center">
                  <span className="font-bold text-lg mr-1">{selectedReward.points}</span>
                  <i className="ri-star-fill text-accent"></i> points
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-primary" 
              onClick={confirmRewardClaim} 
              disabled={claimMutation.isPending}
            >
              {claimMutation.isPending ? "Claiming..." : "Claim Reward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Celebration Modal */}
      {selectedReward && (
        <Celebration
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          childName={user?.name || "Isabela"}
          points={selectedReward.points}
          choreTitle={selectedReward.title}
        />
      )}
    </div>
  );
}
