import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import confetti from "@/lib/confetti";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CountdownTimerProps {
  durationInMinutes: number;
  onComplete: () => void;
  choreTitle: string;
}

export function CountdownTimer({ 
  durationInMinutes, 
  onComplete,
  choreTitle
}: CountdownTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(durationInMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Calculate progress percentage
  const originalSeconds = durationInMinutes * 60;
  const progress = Math.max(0, Math.min(100, ((originalSeconds - totalSeconds) / originalSeconds) * 100));
  
  // Format the time as mm:ss
  const formattedTime = formatTime(totalSeconds);
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            // Time's up! 
            if (interval) clearInterval(interval);
            setIsRunning(false);
            setShowCelebration(true);
            confetti();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (totalSeconds === 0 && !showCelebration) {
      setShowCelebration(true);
      confetti();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, totalSeconds, showCelebration]);
  
  const handleStart = () => {
    setIsRunning(true);
  };
  
  const handlePause = () => {
    setIsRunning(false);
  };
  
  const handleReset = () => {
    setIsRunning(false);
    setTotalSeconds(durationInMinutes * 60);
    setShowCelebration(false);
  };
  
  const handleComplete = () => {
    onComplete();
  };
  
  return (
    <div className="countdown-timer bg-white p-5 rounded-xl shadow-md">
      {/* Timer Display */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2">
          {showCelebration ? "Great job!" : `Time to ${choreTitle}`}
        </h3>
        
        <div className="relative">
          <motion.div 
            className="timer-circle w-32 h-32 rounded-full bg-primary/10 mx-auto flex items-center justify-center"
            animate={{ 
              scale: isRunning ? [1, 1.05, 1] : 1,
              boxShadow: isRunning ? 
                ["0 0 0 0 rgba(var(--primary-rgb), 0.4)", "0 0 0 15px rgba(var(--primary-rgb), 0)", "0 0 0 0 rgba(var(--primary-rgb), 0)"] : 
                "0 0 0 0 rgba(var(--primary-rgb), 0)",
            }}
            transition={{ 
              repeat: isRunning ? Infinity : 0, 
              duration: 2
            }}
          >
            <span className="text-3xl font-bold">{formattedTime}</span>
          </motion.div>
        </div>
        
        <div className="mt-4">
          <Progress value={progress} className="h-3" />
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex justify-center space-x-2">
        {!showCelebration && (
          <>
            {!isRunning ? (
              <Button 
                className="bg-primary hover:bg-primary/90 text-white px-6"
                onClick={handleStart}
              >
                Start
              </Button>
            ) : (
              <Button 
                className="bg-amber-500 hover:bg-amber-600 text-white px-6"
                onClick={handlePause}
              >
                Pause
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleReset}
            >
              Reset
            </Button>
          </>
        )}
        
        {(showCelebration || totalSeconds === 0) && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white px-6"
              onClick={handleComplete}
            >
              I did it! 🎉
            </Button>
          </motion.div>
        )}
      </div>
      
      {/* Instructions */}
      {!showCelebration && (
        <p className="text-center text-sm text-gray-500 mt-4">
          {isRunning ? "Keep going! You're doing great!" : "Press Start when you're ready!"}
        </p>
      )}
    </div>
  );
}