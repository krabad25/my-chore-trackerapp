import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Animal emoji avatars with colorful backgrounds
const avatarOptions = [
  {
    id: "avatar1",
    name: "Happy Panda",
    emoji: "🐼",
    backgroundColor: "#b6e3f4"
  },
  {
    id: "avatar2",
    name: "Playful Fox",
    emoji: "🦊",
    backgroundColor: "#ffd5dc"
  },
  {
    id: "avatar3",
    name: "Friendly Bear",
    emoji: "🐻",
    backgroundColor: "#d1d4f9"
  },
  {
    id: "avatar4",
    name: "Curious Cat",
    emoji: "🐱",
    backgroundColor: "#c0aede"
  },
  {
    id: "avatar5",
    name: "Silly Monkey",
    emoji: "🐵",
    backgroundColor: "#b6e3f4"
  },
  {
    id: "avatar6",
    name: "Bouncy Bunny",
    emoji: "🐰",
    backgroundColor: "#ffd5dc"
  },
  {
    id: "avatar7",
    name: "Playful Puppy",
    emoji: "🐶",
    backgroundColor: "#d1d4f9"
  },
  {
    id: "avatar8",
    name: "Dancing Duck",
    emoji: "🦆",
    backgroundColor: "#b6e3f4"
  },
  {
    id: "avatar9",
    name: "Brave Lion",
    emoji: "🦁",
    backgroundColor: "#ffdfbf"
  },
  {
    id: "avatar10",
    name: "Wise Owl",
    emoji: "🦉",
    backgroundColor: "#d1d4f9"
  },
  {
    id: "avatar11",
    name: "Happy Tiger",
    emoji: "🐯",
    backgroundColor: "#ffd5dc"
  },
  {
    id: "avatar12",
    name: "Magical Unicorn",
    emoji: "🦄",
    backgroundColor: "#c0aede"
  }
];

interface AvatarSelectorProps {
  user: User;
  onSelectAvatar: (avatarUrl: string) => Promise<any>;
  onClose: () => void;
}

export function AvatarSelector({ user, onSelectAvatar, onClose }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<{id: string; emoji: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleAvatarClick = (avatar: {id: string; emoji: string}) => {
    setSelectedAvatar(avatar);
  };
  
  const handleSaveAvatar = async () => {
    if (!selectedAvatar) {
      toast({
        title: "No avatar selected",
        description: "Please select an avatar first",
        variant: "destructive",
      });
      return;
    }
    
    // Create a data URL from the emoji to use as avatar
    const emojiUrl = `data:text/plain;charset=UTF-8,${encodeURIComponent(selectedAvatar.emoji)}`;
    
    setIsLoading(true);
    
    try {
      await onSelectAvatar(emojiUrl);
      toast({
        title: "Avatar updated!",
        description: "Your new avatar has been saved.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error updating avatar",
        description: "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="avatar-selector">
      <h3 className="text-2xl font-bold mb-4 text-primary">Choose Your Avatar</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6 max-h-[60vh] overflow-y-auto p-1">
        {avatarOptions.map((avatar) => (
          <motion.div
            key={avatar.id}
            className={cn(
              "avatar-option flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all",
              selectedAvatar?.id === avatar.id ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAvatarClick({id: avatar.id, emoji: avatar.emoji})}
          >
            <div 
              className="avatar-image relative w-16 h-16 rounded-full overflow-hidden mb-2 flex items-center justify-center"
              style={{ backgroundColor: avatar.backgroundColor }}
            >
              <span className="text-4xl" role="img" aria-label={avatar.name}>
                {avatar.emoji}
              </span>
            </div>
            <span className="text-sm text-center font-medium">{avatar.name}</span>
          </motion.div>
        ))}
      </div>
      
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button 
          className="bg-primary text-white"
          onClick={handleSaveAvatar}
          disabled={!selectedAvatar || isLoading}
        >
          {isLoading ? "Saving..." : "Save Avatar"}
        </Button>
      </div>
    </div>
  );
}