import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "@/lib/confetti";

interface CelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  points: number;
  choreTitle?: string;
  rewardTitle?: string;
  type?: "chore" | "reward" | "approval";
  message?: string;
}

export function Celebration({ 
  isOpen, 
  onClose, 
  childName, 
  points, 
  choreTitle, 
  rewardTitle,
  type = "chore",
  message
}: CelebrationProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation when the celebration opens
      confetti();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-dark bg-opacity-70 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            {/* No need for manual confetti as we're using the confetti utility */}

            {/* Celebration card */}
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-xs w-full text-center relative overflow-hidden"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                className="mx-auto mb-4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="100" cy="100" r="90" fill="#FFD166" />
                <path
                  d="M130 80C130 96.5685 116.569 110 100 110C83.4315 110 70 96.5685 70 80C70 63.4315 83.4315 50 100 50C116.569 50 130 63.4315 130 80Z"
                  fill="#FF6B6B"
                />
                <path
                  d="M65 140C65 126.193 81.1929 115 100 115C118.807 115 135 126.193 135 140C135 153.807 118.807 165 100 165C81.1929 165 65 153.807 65 140Z"
                  fill="#4ECDC4"
                />
                <circle cx="80" cy="75" r="7" fill="white" />
                <circle cx="120" cy="75" r="7" fill="white" />
                <path
                  d="M85 95C90 105 110 105 115 95"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M150 60L170 40M150 40L170 60M30 60L50 40M30 40L50 60"
                  stroke="#FF6B6B"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M40 120L20 140M40 140L20 120M180 120L160 140M180 140L160 120"
                  stroke="#4ECDC4"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>

              <motion.h2
                className="text-2xl font-bold font-comic text-primary mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {type === "chore" && "Great Job, "}
                {type === "reward" && "Awesome, "}
                {type === "approval" && "Congratulations, "}
                {childName}!
              </motion.h2>

              <motion.p
                className="text-lg mb-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {type === "chore" && (
                  <>
                    You earned{" "}
                    <span className="font-bold text-accent">{points} points</span>{" "}
                    {choreTitle && (
                      <>
                        for completing <span className="font-bold">{choreTitle}</span>!
                      </>
                    )}
                  </>
                )}
                
                {type === "reward" && (
                  <>
                    Your request to get the{" "}
                    <span className="font-bold text-accent">{rewardTitle}</span>{" "}
                    has been sent to your parent for approval!
                  </>
                )}
                
                {type === "approval" && (
                  <>
                    Your <span className="font-bold text-accent">{rewardTitle}</span>{" "}
                    reward has been approved!
                    {points > 0 && (
                      <>
                        <br/>
                        <span className="font-bold text-accent">{points} points</span> have been used.
                      </>
                    )}
                  </>
                )}
                
                {message && (
                  <div className="mt-2 text-sm font-medium bg-primary/10 p-2 rounded">
                    {message}
                  </div>
                )}
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={onClose}
                  className="bg-primary hover:bg-primary/90 text-white text-xl font-bold py-3 px-8 rounded-xl"
                >
                  {type === "chore" && "Yay!"}
                  {type === "reward" && "Got it!"}
                  {type === "approval" && "Awesome!"}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
