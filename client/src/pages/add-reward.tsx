import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Reward title must be at least 3 characters.",
  }),
  points: z.coerce.number().min(5, {
    message: "Points must be at least 5.",
  }).max(200, {
    message: "Points cannot exceed 200.",
  }),
  imageUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddReward() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      points: 30,
      imageUrl: "",
    },
  });
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Image size should be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG, PNG and WebP images are supported",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
    form.setValue("imageUrl", "");
  };
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (selectedImage) {
        // If we have a selected file, create form data and upload
        const formData = new FormData();
        formData.append("title", values.title);
        formData.append("points", values.points.toString());
        formData.append("rewardImage", selectedImage);
        
        await apiRequest("/api/rewards/upload", {
          method: "POST",
          body: formData,
          // Don't set Content-Type header, browser will set it with boundary for multipart/form-data
        });
      } else {
        // Use regular JSON payload with imageUrl
        await apiRequest("/api/rewards", {
          method: "POST",
          body: JSON.stringify(values)
        });
      }
      
      // Invalidate rewards query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      
      toast({
        title: "Reward Added",
        description: "The new reward has been added successfully!",
      });
      
      // Navigate back to rewards page
      navigate("/rewards");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add the reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="header secondary">
        <div className="container mx-auto flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/rewards")}
            className="text-white text-2xl"
          >
            <i className="ri-arrow-left-line"></i>
          </Button>
          <h1 className="text-2xl font-bold font-nunito">Add New Reward</h1>
          <div className="w-10"></div> {/* Empty space for alignment */}
        </div>
      </header>
      
      <div className="flex-grow p-4 overflow-auto">
        <motion.div 
          className="container mx-auto max-w-md bg-white rounded-xl shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Reward Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Ice Cream Treat" 
                        {...field} 
                        className="text-lg p-6"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Points Required</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={5}
                        max={200}
                        {...field}
                        className="text-lg p-6" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <Label className="text-lg">Reward Image</Label>
                
                {imagePreview ? (
                  <div className="flex flex-col gap-2 items-center">
                    <img 
                      src={imagePreview} 
                      alt="Reward preview" 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-primary"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Image URL (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/image.png" 
                              {...field} 
                              className="text-lg p-6"
                              disabled={!!selectedImage}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="text-center my-4">
                      <p className="text-sm text-gray-500 mb-2">- OR -</p>
                      <input
                        type="file"
                        id="rewardImage"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload Image
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        JPEG, PNG or WebP (max. 10MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 text-lg py-6"
                  onClick={() => navigate("/rewards")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 btn-secondary text-lg py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Reward"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
