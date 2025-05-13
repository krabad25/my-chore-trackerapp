import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// A selection of kid-friendly avatar options
const avatarOptions = [
  {
    id: "avatar1",
    name: "Cool Kid",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&mouth=smile"
  },
  {
    id: "avatar2",
    name: "Happy",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&mouth=smile&eyes=happy"
  },
  {
    id: "avatar3",
    name: "Superhero",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Max&mouth=smile&top=shortHair&accessories=round"
  },
  {
    id: "avatar4",
    name: "Princess",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&hairColor=pink&accessoriesColor=pink"
  },
  {
    id: "avatar5",
    name: "Scientist",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Einstein&accessories=wayfarers"
  },
  {
    id: "avatar6",
    name: "Astronaut",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Star&top=shortHair&accessories=sunglasses"
  },
  {
    id: "avatar7",
    name: "Robot",
    url: "https://api.dicebear.com/7.x/bottts/svg?seed=Robot"
  },
  {
    id: "avatar8",
    name: "Animal",
    url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fluffy&mouth=smile&top=longHair"
  }
];

interface AvatarSelectorProps {
  user: User;
  onSelectAvatar: (avatarUrl: string) => Promise<any>;
  onClose: () => void;
}

export function AvatarSelector({ user, onSelectAvatar, onClose }: AvatarSelectorProps) {
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleAvatarClick = (avatarUrl: string) => {
    setSelectedAvatarUrl(avatarUrl);
  };
  
  const handleSaveAvatar = async () => {
    if (!selectedAvatarUrl) {
      toast({
        title: "No avatar selected",
        description: "Please select an avatar first",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onSelectAvatar(selectedAvatarUrl);
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
      <h3 className="text-xl font-bold mb-4">Choose Your Avatar</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {avatarOptions.map((avatar) => (
          <motion.div
            key={avatar.id}
            className={cn(
              "avatar-option flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all",
              selectedAvatarUrl === avatar.url ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAvatarClick(avatar.url)}
          >
            <div className="avatar-image relative w-20 h-20 rounded-full overflow-hidden bg-primary/10 mb-2">
              <img 
                src={avatar.url} 
                alt={avatar.name}
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-sm text-center">{avatar.name}</span>
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
          disabled={!selectedAvatarUrl || isLoading}
        >
          {isLoading ? "Saving..." : "Save Avatar"}
        </Button>
      </div>
    </div>
  );
}