import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  // Note: requiresProof will be added in a future update
});

type FormValues = z.infer<typeof formSchema>;

export default function AddChore() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      points: 5,
      frequency: "daily",
      imageUrl: "",
      isDurationChore: false,
      duration: 15,
      // Note: requiresProof will be added in a future update
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    // Only include duration if this is a timed chore
    const choreData = {
      ...values,
      // If not a duration chore, don't send the duration field
      duration: values.isDurationChore ? values.duration : undefined
    };
    
    try {
      await apiRequest("/api/chores", { 
        method: "POST",
        body: JSON.stringify(choreData)
      });
      
      // Invalidate chores query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      
      toast({
        title: "Chore Added",
        description: "The new chore has been added successfully!",
      });
      
      // Navigate back to chores page
      navigate("/chores");
    } catch (error) {
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
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/image.png" 
                        {...field} 
                        className="text-lg p-6"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
              
              {/* Note: Photo proof option will be added in a future update */}
              
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
