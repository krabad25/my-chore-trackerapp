import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface FileUploadProps {
  onUploadSuccess?: (url: string) => void;
  className?: string;
}

export function FileUpload({ onUploadSuccess, className }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/user/photo", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      
      // Invalidate user data query to refetch with new photo
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      if (onUploadSuccess && data.user.profilePhoto) {
        onUploadSuccess(data.user.profilePhoto);
      }

      toast({
        title: "Photo uploaded!",
        description: "Your photo has been successfully uploaded.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={triggerFileInput}
        disabled={isUploading}
        className="bg-accent rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-accent/90"
      >
        <i className="ri-camera-line text-dark text-xl"></i>
      </Button>
    </div>
  );
}
