import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      points: 30,
      imageUrl: "",
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/rewards", values);
      
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
