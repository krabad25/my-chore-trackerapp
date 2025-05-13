import { useState, useEffect } from "react";
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
  const [celebrationType, setCelebrationType] = useState<"reward" | "approval">("reward");
  
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });
  
  const { data: rewardClaims = [] } = useQuery<Array<any>>({
    queryKey: ["/api/reward-claims/user"],
    enabled: !!user,
  });
  
  // Check for any approved reward claims when the page loads
  useEffect(() => {
    if (rewardClaims && rewardClaims.length > 0) {
      // Find the first approved claim that hasn't been celebrated yet
      const approvedClaim = rewardClaims.find(
        claim => claim.status === "approved" && !localStorage.getItem(`celebrated_claim_${claim.id}`)
      );
      
      if (approvedClaim && approvedClaim.reward) {
        // Set the selected reward
        setSelectedReward(approvedClaim.reward);
        
        // Set the celebration type to "approval"
        setCelebrationType("approval");
        
        // Show the celebration
        setShowCelebration(true);
        
        // Mark this claim as celebrated so we don't show it again
        localStorage.setItem(`celebrated_claim_${approvedClaim.id}`, "true");
      }
    }
  }, [rewardClaims]);
  
  const claimMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      console.log("Attempting to claim reward ID:", rewardId);
      const response = await apiRequest(`/api/rewards/${rewardId}/claim`, {
        method: "POST",
        credentials: "include"
      });
      console.log("Claim reward response:", response);
      return response;
    },
    onSuccess: (data) => {
      console.log("Reward claim successful:", data);
      setShowDialog(false);
      
      // Set the celebration type to "reward" (initial claim)
      setCelebrationType("reward");
      
      // Show celebration for submitting the claim
      setShowCelebration(true);
      
      // Show toast notification about parent approval
      toast({
        title: "Claim Submitted!",
        description: "Your reward claim has been sent to your parent for approval.",
        duration: 5000
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reward-claims/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      console.error("Failed to claim reward:", error);
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
              rewards
                // If user is a child, filter out rewards that they've claimed and have approved status
                .filter(reward => {
                  if (user?.role !== "child" || !rewardClaims) {
                    return true;
                  }
                  
                  // Check if this reward has an approved claim
                  const approvedClaim = rewardClaims.find(
                    claim => claim.rewardId === reward.id && claim.status === "approved"
                  );
                  
                  // If there's an approved claim, don't show this reward anymore
                  return !approvedClaim;
                })
                .map(reward => {
                  // Check if this reward has a pending claim
                  const hasPendingClaim = rewardClaims.some(
                    claim => claim.rewardId === reward.id && claim.status === "pending"
                  );
                  
                  return (
                    <RewardCard 
                      key={reward.id} 
                      reward={reward} 
                      userPoints={user?.points || 0}
                      onClaim={handleRewardClaim}
                      pendingClaim={hasPendingClaim}
                    />
                  );
                })
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
            <DialogTitle className="text-2xl">Request Reward</DialogTitle>
            <DialogDescription className="text-lg">
              Do you want to request this reward? Your request will be sent to your parent for approval.
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
              {claimMutation.isPending ? "Sending..." : "Request Reward"}
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
          rewardTitle={selectedReward.title}
          type={celebrationType}
        />
      )}
    </div>
  );
}
