import { useState } from "react";
import { Chore } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ChoreItemProps {
  chore: Chore;
  onComplete: (chore: Chore, points: number) => void;
}

export function ChoreItem({ chore, onComplete }: ChoreItemProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (chore.completed || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", `/api/chores/${chore.id}/complete`, {});
      const data = await response.json();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Call the onComplete callback
      onComplete(chore, chore.points);
    } catch (error) {
      console.error("Failed to complete chore:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Placeholder image based on chore type
  const getChoreImage = () => {
    const placeholderImages = {
      "Make the bed": "https://i.imgur.com/Q9zijKf.png",
      "Put away toys": "https://i.imgur.com/RFlJt73.png",
      "Help set the table": "https://i.imgur.com/6V45cQk.png",
      "Water the plants": "https://i.imgur.com/6ngvgLf.png",
    };
    
    // @ts-ignore - using a string index
    if (placeholderImages[chore.title]) {
      // @ts-ignore - using a string index
      return placeholderImages[chore.title];
    }
    
    // Default image
    return "https://i.imgur.com/nnOvmS0.png";
  };

  return (
    <motion.div 
      className={cn("chore-card", chore.completed && "completed")}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-chore-id={chore.id}
    >
      <div className="flex items-center">
        <motion.div 
          className={cn(
            "chore-checkbox w-12 h-12 rounded-full bg-neutral border-2 border-secondary flex items-center justify-center cursor-pointer mr-4",
            isLoading && "opacity-50"
          )}
          whileTap={{ scale: 0.9 }}
          onClick={handleComplete}
        >
          <i className={cn(
            "ri-check-line text-2xl text-secondary transition-opacity", 
            chore.completed ? "opacity-100" : "opacity-0"
          )}></i>
        </motion.div>
        <div className="flex-grow">
          <h3 className="font-bold text-lg">{chore.title}</h3>
          <div className="flex items-center">
            <i className="ri-star-fill text-accent"></i>
            <span className="ml-1">{chore.points} points</span>
          </div>
        </div>
        <img 
          src={chore.imageUrl || getChoreImage()} 
          alt={chore.title} 
          className="w-16 h-16 rounded-lg object-cover"
        />
      </div>
    </motion.div>
  );
}
