import { Achievement } from "@shared/schema";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <motion.div 
      className="achievement text-center"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2",
          achievement.unlocked 
            ? "bg-secondary text-white" 
            : "bg-gray-200 text-gray-400"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <i className={`${achievement.icon} text-2xl`}></i>
      </motion.div>
      <span className={cn(
        "text-sm font-bold",
        !achievement.unlocked && "text-gray-400"
      )}>
        {achievement.title}
      </span>
    </motion.div>
  );
}
