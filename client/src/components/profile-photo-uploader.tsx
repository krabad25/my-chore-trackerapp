import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { AvatarSelector } from "@/components/avatar-selector";

interface ProfilePhotoUploaderProps {
  user: User;
  size?: "sm" | "md" | "lg";
  showUploadButton?: boolean;
}

export function ProfilePhotoUploader({ 
  user, 
  size = "md", 
  showUploadButton = true 
}: ProfilePhotoUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const avatarSizeClass = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  }[size];

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest<{ message: string; user: User }>("/api/user/photo", {
        method: "POST",
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, browser will set it with boundary
          "Content-Type": undefined as any 
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Profile photo updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsOpen(false);
      setPreviewUrl(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to upload profile photo",
        variant: "destructive",
      });
    },
  });
  
  const avatarMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      return apiRequest<{ message: string; user: User }>(`/api/user/${user.id}/avatar`, {
        method: "PUT",
        body: JSON.stringify({ avatarUrl }),
        headers: {
          "Content-Type": "application/json"
        }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update avatar",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    // Create preview URL
    const imageUrl = URL.createObjectURL(file);
    setPreviewUrl(imageUrl);
  };

  const handleSubmit = () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast({
        title: "No File Selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("photo", fileInputRef.current.files[0]);
    uploadMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleSelectAvatar = async (avatarUrl: string) => {
    return avatarMutation.mutateAsync(avatarUrl);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Avatar 
        className={`${avatarSizeClass} cursor-pointer border-2 border-primary`}
        onClick={() => showUploadButton && setIsOpen(true)}
      >
        {user.profilePhoto ? (
          user.profilePhoto.startsWith('data:text/plain') ? (
            // For emoji avatars
            <AvatarFallback className="bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-2xl">
              {decodeURIComponent(user.profilePhoto.split(',')[1])}
            </AvatarFallback>
          ) : (
            // For regular image photos
            <AvatarImage src={user.profilePhoto} alt={user.name} />
          )
        ) : (
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(user.name)}
          </AvatarFallback>
        )}
      </Avatar>
      
      {showUploadButton && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={() => setIsOpen(true)}
        >
          <i className="ri-camera-line mr-1"></i>
          Change Photo
        </Button>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a photo or choose an avatar for your profile.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Photo</TabsTrigger>
              <TabsTrigger value="avatar">Choose Avatar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="py-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 border-2 border-primary">
                  {previewUrl ? (
                    <AvatarImage src={previewUrl} alt="Preview" />
                  ) : user.profilePhoto ? (
                    user.profilePhoto.startsWith('data:text/plain') ? (
                      // For emoji avatars
                      <AvatarFallback className="bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-4xl">
                        {decodeURIComponent(user.profilePhoto.split(',')[1])}
                      </AvatarFallback>
                    ) : (
                      // For regular image photos
                      <AvatarImage src={user.profilePhoto} alt={user.name} />
                    )
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                
                <div className="flex justify-end w-full space-x-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={uploadMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!previewUrl || uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? "Uploading..." : "Upload Photo"}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="avatar" className="py-4">
              <AvatarSelector 
                user={user} 
                onSelectAvatar={handleSelectAvatar}
                onClose={handleCancel}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}