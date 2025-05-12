import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  ProgressChart, 
  CircleProgressChart 
} from "@/components/progress-chart";
import { AchievementBadge } from "@/components/achievement-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { User, Achievement, Reward, Chore } from "@shared/schema";

export default function Progress() {
  const [, navigate] = useLocation();
  
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const { data: achievements, isLoading: isLoadingAchievements } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });
  
  const { data: rewards } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });
  
  const { data: chores } = useQuery<Chore[]>({
    queryKey: ["/api/chores"],
  });
  
  // Find next available reward
  const nextReward = rewards?.find(r => 
    !r.claimed && (user?.points || 0) >= r.points
  );
  
  // Activity by day of week
  const activityData = [
    { day: "Mon", value: 30 },
    { day: "Tue", value: 75 },
    { day: "Wed", value: 100 },
    { day: "Thu", value: 60 },
    { day: "Fri", value: 45 },
    { day: "Sat", value: 10 },
    { day: "Sun", value: 10 },
  ];
  
  // Calculate stats
  const totalChores = chores?.length || 0;
  const completedChores = chores?.filter(c => c.completed).length || 0;
  const completionPercentage = totalChores > 0 
    ? Math.round((completedChores / totalChores) * 100) 
    : 0;
  
  const claimedRewards = rewards?.filter(r => r.claimed).length || 0;
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="header accent">
        <div className="container mx-auto flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="text-dark text-2xl"
          >
            <i className="ri-arrow-left-line"></i>
          </Button>
          <h1 className="text-2xl font-bold font-nunito">
            {user?.childName || "Isabela"}'s Progress
          </h1>
          <div className="flex items-center space-x-1">
            <span className="text-xl font-bold">{user?.points || 0}</span>
            <i className="ri-star-fill text-secondary"></i>
          </div>
        </div>
      </header>
      
      <div className="flex-grow p-4 overflow-auto">
        <div className="container mx-auto max-w-md">
          {/* Weekly Stats Card */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="section-title">
              <i className="ri-bar-chart-fill text-secondary mr-2"></i>
              This Week's Progress
            </h2>
            
            {/* Progress circles */}
            {isLoadingUser ? (
              <div className="flex justify-between mb-6">
                {Array(3).fill(0).map((_, i) => (
                  <div className="text-center" key={`circle-skeleton-${i}`}>
                    <Skeleton className="w-20 h-20 rounded-full mx-auto mb-2" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-between mb-6">
                <CircleProgressChart 
                  value={completionPercentage} 
                  max={100} 
                  label="Chores Done" 
                  color="text-primary"
                />
                
                <CircleProgressChart 
                  value={user?.points || 0} 
                  max={100} 
                  label="Points Earned" 
                  color="text-secondary"
                />
                
                <CircleProgressChart 
                  value={claimedRewards} 
                  max={4} 
                  label="Rewards Claimed" 
                  color="text-accent"
                />
              </div>
            )}
            
            {/* Next reward progress */}
            {nextReward && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">Next Reward: {nextReward.title}</span>
                  <span className="text-sm">{user?.points || 0}/{nextReward.points} points</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <motion.div 
                    className="bg-success rounded-full h-4 transition-all"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((user?.points || 0) / nextReward.points) * 100)}%` }}
                    transition={{ duration: 1 }}
                  ></motion.div>
                </div>
              </div>
            )}
            
            {nextReward && (
              <div className="text-center">
                <Button 
                  onClick={() => navigate("/rewards")}
                  className="bg-accent hover:bg-accent/90 transition-all text-dark font-bold py-2 px-6 rounded-lg text-lg"
                >
                  Claim Now!
                </Button>
              </div>
            )}
          </motion.div>
          
          {/* Achievements */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="section-title">
              <i className="ri-medal-line text-accent mr-2"></i>
              {user?.childName || "Isabela"}'s Achievements
            </h2>
            
            {isLoadingAchievements ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                {Array(3).fill(0).map((_, i) => (
                  <div className="achievement" key={`achievement-skeleton-${i}`}>
                    <Skeleton className="w-16 h-16 rounded-full mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                {achievements?.map(achievement => (
                  <AchievementBadge 
                    key={achievement.id} 
                    achievement={achievement} 
                  />
                ))}
              </div>
            )}
          </motion.div>
          
          {/* History Chart */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h2 className="section-title">
              <i className="ri-history-line text-primary mr-2"></i>
              Weekly Activity
            </h2>
            
            <ProgressChart data={activityData} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
