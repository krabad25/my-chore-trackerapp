import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChoreItem } from "@/components/chore-item";
import { Celebration } from "@/components/celebration";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Chore, User, ChoreCompletion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Chores() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedChore, setCompletedChore] = useState<Chore | null>(null);
  
  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/user"],
  });
  
  const { data: chores, isLoading: isLoadingChores } = useQuery<Chore[]>({
    queryKey: ["/api/chores"],
  });
  
  // Fetch any pending chore completions
  const { data: pendingCompletions = [] } = useQuery<ChoreCompletion[]>({
    queryKey: ["/api/chore-completions/user"],
    // If there's an error, we can still render the page
    retry: false
  });
  
  const handleChoreComplete = (chore: Chore, points: number) => {
    // Log the completion
    console.log("Chore completed callback received:", chore.id, "Points:", points);
    
    // Set the completed chore for celebration
    setCompletedChore(chore);
    
    // Add a small delay to ensure state updates properly
    setTimeout(() => {
      // Only show celebration animation when points are awarded (not for pending submissions)
      if (points > 0) {
        console.log("Showing celebration for immediate points award");
        setShowCelebration(true);
      } else {
        toast({
          title: "Chore Submitted!",
          description: "Mom or Dad will review it soon and give you points!",
        });
        
        // Let the chore-item component handle any navigation
        // Don't do any navigation here as it might conflict
        console.log("Chore submitted for review, waiting for parent approval");
      }
    }, 100);
  };
  
  const dailyChores = chores?.filter(chore => chore.frequency === "daily") || [];
  const weeklyChores = chores?.filter(chore => chore.frequency === "weekly") || [];
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="header primary">
        <div className="container mx-auto flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            className="text-white text-2xl"
          >
            <i className="ri-arrow-left-line"></i>
          </Button>
          <h1 className="text-2xl font-bold font-nunito">
            {user?.name || "Isabella"}'s Chores
          </h1>
          <div className="flex items-center space-x-1">
            <span className="text-xl font-bold">{user?.points || 0}</span>
            <i className="ri-star-fill text-accent"></i>
          </div>
        </div>
      </header>
      
      <div className="flex-grow p-4 overflow-auto">
        <div className="container mx-auto max-w-md">
          {/* Daily section */}
          <div className="mb-8">
            <h2 className="section-title">
              <i className="ri-sun-line text-warning mr-2"></i>
              Today's Chores
            </h2>
            
            {isLoadingChores ? (
              // Loading skeletons
              Array(2).fill(0).map((_, i) => (
                <div className="chore-card" key={`daily-skeleton-${i}`}>
                  <div className="flex items-center">
                    <Skeleton className="w-12 h-12 rounded-full mr-4" />
                    <div className="flex-grow">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="w-16 h-16 rounded-lg" />
                  </div>
                </div>
              ))
            ) : dailyChores.length > 0 ? (
              dailyChores.map(chore => (
                <ChoreItem 
                  key={chore.id} 
                  chore={chore} 
                  onComplete={handleChoreComplete}
                  pendingCompletions={pendingCompletions}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No daily chores found
              </p>
            )}
          </div>
          
          {/* Weekly section */}
          <div className="mb-8">
            <h2 className="section-title">
              <i className="ri-calendar-line text-secondary mr-2"></i>
              Weekly Chores
            </h2>
            
            {isLoadingChores ? (
              // Loading skeletons
              Array(2).fill(0).map((_, i) => (
                <div className="chore-card" key={`weekly-skeleton-${i}`}>
                  <div className="flex items-center">
                    <Skeleton className="w-12 h-12 rounded-full mr-4" />
                    <div className="flex-grow">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                    <Skeleton className="w-16 h-16 rounded-lg" />
                  </div>
                </div>
              ))
            ) : weeklyChores.length > 0 ? (
              weeklyChores.map(chore => (
                <ChoreItem 
                  key={chore.id} 
                  chore={chore} 
                  onComplete={handleChoreComplete}
                  pendingCompletions={pendingCompletions}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No weekly chores found
              </p>
            )}
          </div>
          
          {/* Only show Add New Chore button for parent role */}
          {user?.role === "parent" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                onClick={() => navigate("/add-chore")}
                className="add-chore-btn w-full btn-accent text-xl py-4 px-6"
              >
                <i className="ri-add-circle-line mr-2 text-2xl"></i>
                Add New Chore
              </Button>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Celebration component */}
      {completedChore && (
        <Celebration 
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          childName={user?.name || "Isabela"}
          points={completedChore.points}
          choreTitle={completedChore.title}
        />
      )}
    </div>
  );
}
