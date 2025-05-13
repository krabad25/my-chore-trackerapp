import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Chore, ChoreCompletion } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, Loader2, Upload, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CountdownTimer } from "@/components/countdown-timer";

interface ChoreItemProps {
  chore: Chore;
  onComplete: (chore: Chore, points: number) => void;
  pendingCompletions?: ChoreCompletion[];
}

export function ChoreItem({ chore, onComplete, pendingCompletions = [] }: ChoreItemProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if this chore has a pending completion
  const isPending = pendingCompletions.some(
    (completion) => completion.choreId === chore.id && completion.status === "pending"
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image under 5MB",
        variant: "destructive",
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTimerComplete = () => {
    setTimerCompleted(true);
  };
  
  const handleComplete = async (e?: React.MouseEvent | React.FormEvent) => {
    // If this was triggered by an event, prevent default browser behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // First, check if already completed or pending
    if (chore.completed || isPending || isLoading) {
      return;
    }
    
    // For timed chores, show the timer first
    if (chore.isDurationChore && !showTimer && !timerCompleted) {
      setShowTimer(true);
      return;
    }
    
    // For timed chores, ensure the timer is completed
    if (chore.isDurationChore && !timerCompleted && showTimer) {
      toast({
        title: "Timer not completed",
        description: "Please finish the timer before submitting",
        variant: "destructive",
      });
      return;
    }
    
    // Check if this chore requires proof
    // Use the requiresProof property from the chore object if available, otherwise default to false
    const requiresProof = chore.requiresProof === true;
    
    // If proof is required and we're not showing the photo upload yet, show it
    if (requiresProof && !showPhotoUpload) {
      setShowPhotoUpload(true);
      setShowTimer(false); // Hide timer if it was showing
      return;
    }
    
    // Make sure we have a photo for proof if required
    if (requiresProof && !fileInputRef.current?.files?.[0]) {
      toast({
        title: "Photo required",
        description: "Please take a photo to show you completed the chore",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let data;
      
      // Prepare the request based on whether proof is required
      if (requiresProof) {
        console.log("Submitting chore completion with proof image for chore ID:", chore.id);
        
        // For file uploads, we need to use direct fetch with FormData
        const formData = new FormData();
        
        // Get the file from the file input
        const fileInput = fileInputRef.current;
        const file = fileInput?.files?.[0];
        
        if (!file) {
          console.warn("No file selected, using empty blob");
          formData.append("proofImage", new Blob());
        } else {
          console.log("Adding file to form data:", file.name, file.type, file.size);
          formData.append("proofImage", file);
        }
        
        try {
          console.log("Sending form data to server...");
          
          // Use direct fetch for FormData with explicit credentials
          const response = await fetch(`/api/chores/${chore.id}/complete`, {
            method: "POST",
            body: formData,
            credentials: "include" // Important for sessions
          });
          
          // Check response status
          if (!response.ok) {
            console.error("Failed to submit chore completion:", response.status, response.statusText);
            const errorText = await response.text();
            console.error("Error response:", errorText);
            throw new Error(`Failed to submit chore completion: ${response.status} ${response.statusText}`);
          }
          
          console.log("Submission successful, parsing response...");
          
          // Parse the response data
          data = await response.json();
          console.log("Response data:", data);
        } catch (err) {
          console.error("Error during file upload:", err);
          throw err;
        }
      } else {
        console.log("Submitting chore completion without proof for chore ID:", chore.id);
        
        try {
          // For non-file uploads, use apiRequest from queryClient
          data = await apiRequest(`/api/chores/${chore.id}/complete`, {
            method: "POST",
            credentials: "include" // Ensure cookies are sent
          });
          
          console.log("Successfully completed chore without proof, response:", data);
        } catch (err) {
          console.error("Error completing chore without proof:", err);
          throw err;
        }
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Reset all states
      setShowPhotoUpload(false);
      setPhotoPreview(null);
      setShowTimer(false);
      setTimerCompleted(false);
      
      // Show success message
      toast({
        title: "Chore submitted!",
        description: requiresProof
          ? "Your chore has been submitted for review"
          : "Your chore has been completed!",
      });
      
      // Call the onComplete callback with the chore and points
      // If proof is required, no points are awarded immediately
      onComplete(chore, requiresProof ? 0 : chore.points);
      
      // Log success
      console.log("Chore completion submitted successfully:", data);
      
      // Use the redirect URL from the server if available
      if (data && data.redirectUrl) {
        console.log("Redirecting to:", data.redirectUrl);
        
        // Small delay to ensure all state updates have completed
        setTimeout(() => {
          // Use the wouter navigate function instead of manipulating the history directly
          // This ensures proper routing within the React application
          navigate(data.redirectUrl);
        }, 300);
      }
    } catch (error) {
      console.error("Failed to complete chore:", error);
      
      // Extract error message from response if possible
      let errorMessage = "Failed to submit the chore. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Show appropriate error message to user
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If the error was from a response with a specific redirectUrl, use it
      if (error instanceof Error && 'data' in error && typeof error.data === 'object' && error.data !== null) {
        const errorData = error.data as any;
        if (errorData?.redirectUrl) {
          console.log("Error response contains redirect URL:", errorData.redirectUrl);
          
          // Navigate to the specified URL after a short delay
          setTimeout(() => {
            navigate(errorData.redirectUrl);
          }, 500);
        }
      }
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
      className={cn(
        "chore-card", 
        chore.completed && "completed",
        isPending && "pending",
        showPhotoUpload && "photo-upload-active"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-chore-id={chore.id}
      onClick={(e) => {
        // Prevent any default navigation when clicking the entire card
        e.preventDefault();
        e.stopPropagation();
        
        // Don't do anything else when clicking the entire card
        // Individual elements inside will handle their own clicks
      }}
    >
      <div className="flex items-center">
        <motion.div 
          className={cn(
            "chore-checkbox w-12 h-12 rounded-full flex items-center justify-center cursor-pointer mr-4",
            isPending 
              ? "bg-amber-100 border-2 border-amber-400" 
              : chore.completed 
                ? "bg-green-100 border-2 border-green-500" 
                : "bg-neutral border-2 border-secondary",
            (isLoading || isPending) && "opacity-50 cursor-not-allowed"
          )}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => handleComplete(e)}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 text-secondary animate-spin" />
          ) : isPending ? (
            <CheckCircle className="h-6 w-6 text-amber-500" />
          ) : chore.isDurationChore && !chore.completed ? (
            <Clock className="h-5 w-5 text-secondary" />
          ) : (
            <i className={cn(
              "ri-check-line text-2xl text-secondary transition-opacity", 
              chore.completed ? "opacity-100" : "opacity-0"
            )}></i>
          )}
        </motion.div>
        
        <div className="flex-grow">
          <h3 className="font-bold text-lg">{chore.title}</h3>
          <div className="flex items-center flex-wrap">
            <i className="ri-star-fill text-accent"></i>
            <span className="ml-1 mr-2">{chore.points} points</span>
            
            {chore.isDurationChore && (
              <span className="mr-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full flex items-center">
                <Clock className="h-3 w-3 mr-1" /> {chore.duration || 5} min
              </span>
            )}
            
            {/* Show proof requirement indicator only if the chore requires proof */}
            {chore.requiresProof === true && (
              <span className="mr-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full flex items-center">
                <Camera className="h-3 w-3 mr-1" /> Photo required
              </span>
            )}
            
            {isPending && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                Waiting for review
              </span>
            )}
          </div>
        </div>
        
        <img 
          src={chore.imageUrl || getChoreImage()} 
          alt={chore.title} 
          className="w-16 h-16 rounded-lg object-cover"
        />
      </div>

      {/* Timer section for duration chores */}
      {showTimer && chore.isDurationChore && !showPhotoUpload && (
        <div className="mt-4 timer-section">
          <CountdownTimer 
            durationInMinutes={chore.duration || 5}
            onComplete={handleTimerComplete}
            choreTitle={chore.title}
          />
        </div>
      )}
      
      {/* Photo upload section */}
      {showPhotoUpload && (
        <div className="mt-4 photo-upload-section">
          <input
            type="file"
            accept="image/*" 
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          
          {photoPreview ? (
            <div className="photo-preview relative rounded-lg overflow-hidden mb-3">
              <img src={photoPreview} alt="Proof photo" className="w-full h-auto max-h-60 object-contain" />
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPhotoPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              >
                Change photo
              </Button>
            </div>
          ) : (
            <div 
              className="photo-placeholder bg-pink-100 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer mb-3"
              style={{ minHeight: "150px" }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Camera className="h-12 w-12 text-pink-500 mb-2" />
              <p className="text-center text-base font-medium text-pink-700">
                Tap here to take a photo
              </p>
              <p className="text-center text-xs text-pink-600 mt-1">
                (This will open your camera)
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              className="w-full" 
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPhotoUpload(false);
                setPhotoPreview(null);
              }}
            >
              Cancel
            </Button>
            
            <Button 
              className="w-full" 
              disabled={!photoPreview || isLoading} 
              onClick={(e) => handleComplete(e)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit for Review
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
