import { useState } from "react";
import { Reward } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onClaim: (reward: Reward) => void;
}

export function RewardCard({ reward, userPoints, onClaim }: RewardCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const canClaim = userPoints >= reward.points && !reward.claimed;
  const pointsNeeded = reward.points - userPoints;
  
  // Placeholder image based on reward type
  const getRewardImage = () => {
    const placeholderImages = {
      "Extra Screen Time": "https://i.imgur.com/8e6a0Vg.png",
      "Ice Cream Treat": "https://i.imgur.com/MJ08lbY.png",
      "Trip to the Park": "https://i.imgur.com/L7gzJ7n.png",
      "New Toy": "https://i.imgur.com/eUZkSbC.png",
    };
    
    // @ts-ignore - using a string index
    if (placeholderImages[reward.title]) {
      // @ts-ignore - using a string index
      return placeholderImages[reward.title];
    }
    
    // Default image
    return "https://i.imgur.com/nnOvmS0.png";
  };
  
  const handleClaim = async () => {
    if (!canClaim || isLoading) return;
    
    // Instead of making the API call directly, we call the onClaim callback
    // to show the confirmation dialog in the parent component
    onClaim(reward);
  };

  return (
    <motion.div 
      className={cn(
        "reward-card bg-white rounded-xl shadow-md overflow-hidden transition-all",
        reward.claimed && "opacity-70"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      data-reward-id={reward.id}
    >
      <img 
        src={reward.imageUrl || getRewardImage()} 
        alt={reward.title} 
        className="w-full h-32 object-cover"
      />
      <div className="p-3">
        <h3 className="font-bold text-base">{reward.title}</h3>
        <div className="flex items-center mt-1">
          <i className="ri-star-fill text-accent"></i>
          <span className="ml-1 text-sm">{reward.points} points</span>
        </div>
        
        {reward.claimed ? (
          <div className="w-full mt-2 bg-muted text-muted-foreground text-sm font-bold py-2 px-4 rounded-lg text-center">
            Already Claimed
          </div>
        ) : canClaim ? (
          <Button
            onClick={handleClaim}
            disabled={isLoading}
            className="w-full mt-2 bg-primary hover:bg-primary/90 transition-all text-white text-sm font-bold py-2 px-4 rounded-lg"
          >
            {isLoading ? "Claiming..." : "Claim Reward"}
          </Button>
        ) : (
          <div className="w-full mt-2 bg-gray-300 text-gray-600 text-sm font-bold py-2 px-4 rounded-lg text-center">
            Need {pointsNeeded} more points
          </div>
        )}
      </div>
    </motion.div>
  );
}
