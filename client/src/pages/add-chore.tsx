import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Chore title must be at least 3 characters.",
  }),
  points: z.coerce.number().min(1, {
    message: "Points must be at least 1.",
  }).max(100, {
    message: "Points cannot exceed 100.",
  }),
  frequency: z.enum(["daily", "weekly"], {
    message: "Please select a frequency.",
  }),
  imageUrl: z.string().optional(),
  // New fields for timed chores
  isDurationChore: z.boolean().default(false),
  duration: z.coerce.number().min(1).max(120).optional(),
  // Whether proof image is required for completion
  requiresProof: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddChore() {
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
      points: 5,
      frequency: "daily",
      imageUrl: "",
      isDurationChore: false,
      duration: 15,
      requiresProof: true,
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
        formData.append("frequency", values.frequency);
        formData.append("requiresProof", values.requiresProof ? "true" : "false");
        
        if (values.isDurationChore && values.duration) {
          formData.append("isDurationChore", "true");
          formData.append("duration", values.duration.toString());
        }
        
        formData.append("choreImage", selectedImage);
        
        console.log("Submitting chore with image:", {
          title: values.title,
          points: values.points,
          hasImage: !!selectedImage
        });
        
        const response = await fetch("/api/chores/upload", {
          method: "POST",
          body: formData,
          // Don't set Content-Type header for multipart/form-data
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Upload response:", data);
      } else {
        // Only include duration if this is a timed chore
        const choreData = {
          ...values,
          // If not a duration chore, don't send the duration field
          duration: values.isDurationChore ? values.duration : undefined
        };
        
        await apiRequest("/api/chores", { 
          method: "POST",
          body: JSON.stringify(choreData)
        });
      }
      
      // Invalidate chores query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      
      toast({
        title: "Chore Added",
        description: "The new chore has been added successfully!",
      });
      
      // Navigate back to chores page
      navigate("/chores");
    } catch (error) {
      console.error("Error adding chore:", error);
      toast({
        title: "Error",
        description: "Failed to add the chore. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="header primary">
        <div className="container mx-auto flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/chores")}
            className="text-white text-2xl"
          >
            <i className="ri-arrow-left-line"></i>
          </Button>
          <h1 className="text-2xl font-bold font-nunito">Add New Chore</h1>
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
                    <FormLabel className="text-lg">Chore Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Make the bed" 
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
                    <FormLabel className="text-lg">Points</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        max={100}
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Frequency</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-lg p-6">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily" className="text-lg">Daily</SelectItem>
                        <SelectItem value="weekly" className="text-lg">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <Label className="text-lg">Chore Image</Label>
                <FormDescription>
                  Adding a picture helps Isabela understand the chore visually
                </FormDescription>
                
                {imagePreview ? (
                  <div className="flex flex-col gap-2 items-center">
                    <img 
                      src={imagePreview} 
                      alt="Chore preview" 
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
                        id="choreImage"
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

              {/* Timed Chore Settings */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <h3 className="text-lg font-medium">Timed Chore Settings</h3>
                
                <FormField
                  control={form.control}
                  name="isDurationChore"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base">
                          This is a timed chore
                        </FormLabel>
                        <FormDescription>
                          Child will see a timer counting down when they do this chore
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                {form.watch("isDurationChore") && (
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            max={120}
                            {...field}
                            className="text-lg p-6" 
                          />
                        </FormControl>
                        <FormDescription>
                          Enter how long the chore should take (1-120 minutes)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              {/* Proof Settings */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                <h3 className="text-lg font-medium">Proof Settings</h3>
                
                <FormField
                  control={form.control}
                  name="requiresProof"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base">
                          Require photo proof
                        </FormLabel>
                        <FormDescription>
                          Child will need to take a photo to prove they completed this chore
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 text-lg py-6"
                  onClick={() => navigate("/chores")}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 btn-primary text-lg py-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Chore"}
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </div>
    </div>
  );
}
