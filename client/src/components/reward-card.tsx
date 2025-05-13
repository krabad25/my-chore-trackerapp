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
  pendingClaim?: boolean;
}

export function RewardCard({ reward, userPoints, onClaim, pendingClaim = false }: RewardCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const canClaim = userPoints >= reward.points && !reward.claimed && !pendingClaim;
  const pointsNeeded = reward.points - userPoints;
  
  // Placeholder image based on reward type
  const getRewardImage = () => {
    // Define keywords and corresponding images
    const keywordImages: {[key: string]: string} = {
      // Food rewards
      "ice cream": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&auto=format",
      "ice-cream": "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&auto=format",
      "candy": "https://images.unsplash.com/photo-1581798459219-306262b46c3f?w=500&auto=format",
      "chocolate": "https://images.unsplash.com/photo-1511381939415-e44015466834?w=500&auto=format",
      "dessert": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format",
      "cookie": "https://images.unsplash.com/photo-1499636136210-6598fdd9d6ef?w=500&auto=format",
      "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format",
      "treat": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format",
      
      // Activities
      "screen time": "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=500&auto=format",
      "screentime": "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=500&auto=format",
      "movie": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format",
      "game": "https://images.unsplash.com/photo-1551431009-a802eeec77b1?w=500&auto=format",
      "video game": "https://images.unsplash.com/photo-1551431009-a802eeec77b1?w=500&auto=format",
      "play": "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&auto=format",
      "playtime": "https://images.unsplash.com/photo-1516627145497-ae6628953511?w=500&auto=format",
      "park": "https://images.unsplash.com/photo-1594495894542-a46cc73e081a?w=500&auto=format",
      "playground": "https://images.unsplash.com/photo-1594495894542-a46cc73e081a?w=500&auto=format",
      "outside": "https://images.unsplash.com/photo-1588075592446-265bad68d2b6?w=500&auto=format",
      
      // Items
      "toy": "https://images.unsplash.com/photo-1545558180-cde947d5a684?w=500&auto=format",
      "book": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format",
      "sticker": "https://images.unsplash.com/photo-1578307992785-594302204d80?w=500&auto=format",
      "money": "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=500&auto=format",
      "allowance": "https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=500&auto=format",
      
      // Special occasions
      "choose dinner": "https://images.unsplash.com/photo-1608835291093-394b3de6ec87?w=500&auto=format",
      "restaurant": "https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=500&auto=format",
      "movie night": "https://images.unsplash.com/photo-1585951237318-9ea5e175b891?w=500&auto=format",
      "sleepover": "https://images.unsplash.com/photo-1544007447-4716350862e5?w=500&auto=format",
      "friend": "https://images.unsplash.com/photo-1543807535-eceef0bc6341?w=500&auto=format",
    };

    // First check exact title matches
    const lowerTitle = reward.title.toLowerCase();
    if (keywordImages[lowerTitle]) {
      return keywordImages[lowerTitle];
    }
    
    // Check for keyword matches within the title
    for (const [keyword, image] of Object.entries(keywordImages)) {
      if (lowerTitle.includes(keyword)) {
        return image;
      }
    }
    
    // Specific reward titles
    if (reward.title.includes("Extra Screen Time")) {
      return keywordImages["screen time"];
    }
    if (reward.title.includes("Ice Cream")) {
      return keywordImages["ice cream"];
    }
    if (reward.title.includes("Park")) {
      return keywordImages["park"];
    }
    if (reward.title.includes("Toy")) {
      return keywordImages["toy"];
    }
    
    // Colorful default image if no match found
    return "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format";
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
      <div className="relative">
        <img 
          src={reward.imageUrl || getRewardImage()} 
          alt={reward.title} 
          className="w-full h-36 object-cover transition-transform hover:scale-105"
          onError={(e) => {
            // If image fails to load, use a colorful default
            e.currentTarget.src = "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format";
          }}
        />
        <div className="absolute top-0 right-0 bg-primary text-white px-2 py-1 rounded-bl-lg font-bold">
          {reward.points} ✨
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-base text-center">{reward.title}</h3>
        <div className="flex items-center justify-center mt-1">
          <span className="text-sm text-gray-600">Complete chores to earn this reward!</span>
        </div>
        
        {reward.claimed ? (
          <div className="w-full mt-4 bg-muted text-muted-foreground text-sm font-bold py-2 px-4 rounded-lg text-center flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Already Claimed
          </div>
        ) : pendingClaim ? (
          <div className="w-full mt-4 bg-amber-100 text-amber-700 text-sm font-bold py-2 px-4 rounded-lg text-center flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Waiting for Approval
          </div>
        ) : canClaim ? (
          <Button
            onClick={handleClaim}
            disabled={isLoading}
            className="w-full mt-4 bg-gradient-to-r from-primary to-primary-500 hover:from-primary-600 hover:to-primary-500 transition-all text-white text-sm font-bold py-3 px-4 rounded-lg shadow-md"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Claiming...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7"></circle>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                </svg>
                <span>Claim Reward</span>
              </div>
            )}
          </Button>
        ) : (
          <div className="w-full mt-4 bg-gray-200 text-gray-600 text-sm font-bold py-2 px-4 rounded-lg text-center flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Need {pointsNeeded} more points
          </div>
        )}
      </div>
    </motion.div>
  );
}
