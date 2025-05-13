import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// A selection of kid-friendly animal avatar options with various positive expressions
const avatarOptions = [
  {
    id: "avatar1",
    name: "Curious Panda",
    url: "https://api.dicebear.com/7.x/thumbs/svg?seed=Panda&backgroundColor=b6e3f4,c0aede,d1d4f9&eyes=round&mouth=smile"
  },
  {
    id: "avatar2",
    name: "Mischievous Fox",
    url: "https://api.dicebear.com/7.x/thumbs/svg?seed=Fox&backgroundColor=ffdfbf,ffd5dc&eyes=wink&mouth=smirk"
  },
  {
    id: "avatar3",
    name: "Brave Bear",
    url: "https://api.dicebear.com/7.x/thumbs/svg?seed=Bear&backgroundColor=d1d4f9,c0aede&eyes=round&mouth=tongue"
  },
  {
    id: "avatar4",
    name: "Giggling Cat",
    url: "https://api.dicebear.com/7.x/thumbs/svg?seed=Kitty&backgroundColor=c0aede,ffdfbf&eyes=happy&mouth=laugh"
  },
  {
    id: "avatar5",
    name: "Silly Monkey",
    url: "https://api.dicebear.com/7.x/thumbs/svg?seed=Monkey&backgroundColor=b6e3f4,d1d4f9&eyes=wink&mouth=tongue"
  },
  {
    id: "avatar6",
    name: "Dreamy Bunny",
    url: "https://api.dicebear.com/7.x/thumbs/svg?seed=Bunny&backgroundColor=ffd5dc,ffdfbf&eyes=sleepy&mouth=smile"
  },
  {
    id: "avatar7",
    name: "Excited Puppy",
    url: "https://api.dicebear.com/7.x/thumbs/svg?seed=Puppy&backgroundColor=d1d4f9,b6e3f4&eyes=wide&mouth=tongue"
  },
  {
    id: "avatar8",
    name: "Surprised Duck",
    url: "https://api.dicebear.com/7.x/thumbs/svg?seed=Duck&backgroundColor=b6e3f4,ffdfbf&eyes=wide&mouth=surprised"
  },
  {
    id: "avatar9",
    name: "Friendly Lion",
    url: "https://api.dicebear.com/7.x/thumbs/svg?seed=Lion&backgroundColor=ffdfbf,ffd5dc&eyes=happy&mouth=smile"
  },
  {
    id: "avatar10",
    name: "Clever Owl",
    url: "https://api.dicebear.com/7.x/thumbs/svg?seed=Owl&backgroundColor=d1d4f9,c0aede&eyes=round&mouth=smirk"
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
      <h3 className="text-2xl font-bold mb-4 text-primary">Choose Your Avatar</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6 max-h-[60vh] overflow-y-auto p-1">
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
            <div className="avatar-image relative w-16 h-16 rounded-full overflow-hidden bg-primary/10 mb-2 flex items-center justify-center">
              <img 
                src={avatar.url} 
                alt={avatar.name}
                className="w-14 h-14" 
              />
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
          disabled={!selectedAvatarUrl || isLoading}
        >
          {isLoading ? "Saving..." : "Save Avatar"}
        </Button>
      </div>
    </div>
  );
}