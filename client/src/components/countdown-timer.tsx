import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import confetti from "@/lib/confetti";
import { formatTime } from "@/lib/utils";

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
  const totalSeconds = durationInMinutes * 60;
  const [seconds, setSeconds] = useState<number>(totalSeconds);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  
  // Calculate progress percentage
  const progress = Math.round((seconds / totalSeconds) * 100);
  
  // Format time display (e.g., "15:00")
  const timeDisplay = formatTime(seconds);
  
  // Handle timer completion
  const handleComplete = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    confetti();
    onComplete();
  }, [onComplete]);
  
  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(seconds => {
          const newSeconds = seconds - 1;
          if (newSeconds <= 0) {
            if (interval) clearInterval(interval);
            handleComplete();
            return 0;
          }
          return newSeconds;
        });
      }, 1000);
    } else if (seconds === 0) {
      handleComplete();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, seconds, handleComplete]);
  
  // Start timer
  const startTimer = () => {
    setIsActive(true);
  };
  
  // Pause timer
  const pauseTimer = () => {
    setIsActive(false);
  };
  
  // Reset timer
  const resetTimer = () => {
    setIsActive(false);
    setSeconds(totalSeconds);
    setIsCompleted(false);
  };
  
  return (
    <div className="w-full rounded-xl bg-white p-5 shadow-md">
      <h3 className="text-lg font-bold mb-2">{choreTitle}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {isCompleted 
          ? "Great job! You've completed this chore." 
          : `This activity should take about ${durationInMinutes} minute${durationInMinutes > 1 ? 's' : ''}.`
        }
      </p>
      
      {isCompleted ? (
        <motion.div 
          className="celebration-message"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center justify-center py-6">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-4xl mb-4"
            >
              🎉
            </motion.div>
            <h3 className="text-xl font-bold text-center mb-2">Congratulations!</h3>
            <p className="text-center text-sm text-muted-foreground mb-4">
              You successfully completed this timed chore!
            </p>
            <Button 
              className="w-full mt-2" 
              onClick={() => onComplete()}
            >
              Submit for Review
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="flex justify-center items-center h-24">
            <div className="text-4xl font-mono font-bold">{timeDisplay}</div>
          </div>
          
          <Progress value={progress} className="h-3 mb-4" />
          
          <div className="flex space-x-2 mt-4">
            {!isActive ? (
              <Button 
                onClick={startTimer} 
                className="w-full" 
                variant="default"
              >
                {seconds === totalSeconds ? "Start" : "Continue"}
              </Button>
            ) : (
              <Button 
                onClick={pauseTimer} 
                className="w-full" 
                variant="outline"
              >
                Pause
              </Button>
            )}
            
            <Button 
              onClick={resetTimer} 
              className="w-full" 
              variant="outline" 
              disabled={seconds === totalSeconds}
            >
              Reset
            </Button>
          </div>
        </>
      )}
    </div>
  );
}