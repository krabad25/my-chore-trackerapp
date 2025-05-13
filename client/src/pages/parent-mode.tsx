import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useParentAuth } from "@/hooks/use-auth";
import { User, Chore, Reward } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChoreApprovalList } from "@/components/chore-approval";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ParentMode() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const { isAuthenticated, authenticate, logout, isLoading } = useParentAuth();
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: isAuthenticated,
  });
  
  const { data: chores } = useQuery<Chore[]>({
    queryKey: ["/api/chores"],
    enabled: isAuthenticated,
  });
  
  const { data: rewards } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
    enabled: isAuthenticated,
  });
  
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      toast({
        title: "PIN Required",
        description: "Please enter your parent PIN",
        variant: "destructive",
      });
      return;
    }
    
    await authenticate(pin);
  };
  
  const handleDeleteChore = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/chores/${id}`, {});
      
      queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
      
      toast({
        title: "Chore Deleted",
        description: "The chore has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the chore",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteReward = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/rewards/${id}`, {});
      
      queryClient.invalidateQueries({ queryKey: ["/api/rewards"] });
      
      toast({
        title: "Reward Deleted",
        description: "The reward has been removed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the reward",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="header dark">
        <div className="container mx-auto flex justify-between items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (isAuthenticated) {
                logout();
              }
              navigate("/");
            }}
            className="text-white text-2xl"
          >
            <i className="ri-arrow-left-line"></i>
          </Button>
          <h1 className="text-2xl font-bold font-nunito">Parent Controls</h1>
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-white text-2xl"
              onClick={logout}
            >
              <i className="ri-logout-box-line"></i>
            </Button>
          ) : (
            <div className="w-10"></div> // Empty spacer for alignment
          )}
        </div>
      </header>
      
      <div className="flex-grow p-4 overflow-auto">
        <div className="container mx-auto max-w-md">
          {!isAuthenticated ? (
            <motion.div 
              id="parent-login" 
              className="bg-white rounded-xl shadow-md p-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-bold font-nunito text-dark mb-4">Parent Access</h2>
              <form onSubmit={handlePinSubmit}>
                <Input
                  type="password"
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-center text-xl"
                  maxLength={6}
                />
                <Button 
                  type="submit"
                  className="w-full btn-dark py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Login"}
                </Button>
              </form>
            </motion.div>
          ) : (
            <div id="parent-controls">
              {/* Child Info */}
              <motion.div 
                className="bg-white rounded-xl shadow-md p-6 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center mb-4">
                  <img 
                    src={user?.profilePhoto || "https://i.imgur.com/kx7zcZy.png"} 
                    alt={`${user?.name || "Isabela"}'s profile photo`} 
                    className="w-16 h-16 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h2 className="text-xl font-bold">{user?.name || "Isabela"}'s Account</h2>
                    <p className="text-sm text-gray-600">
                      Current points: <span className="font-bold">{user?.points || 0}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
              
              {/* Main Parent Controls */}
              <motion.div 
                className="bg-white rounded-xl shadow-md p-6 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Tabs defaultValue="manage" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="manage">Manage</TabsTrigger>
                    <TabsTrigger value="approvals">Approvals</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  
                  {/* Manage Tab - Chores and Rewards */}
                  <TabsContent value="manage" className="space-y-6">
                    {/* Manage Chores */}
                    <div>
                      <h2 className="section-title">
                        <i className="ri-list-check text-primary mr-2"></i>
                        Manage Chores
                      </h2>
                      
                      <div className="space-y-4 mb-4">
                        {chores?.map(chore => (
                          <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg" key={chore.id}>
                            <span className="font-bold">{chore.title}</span>
                            <div className="flex items-center">
                              <span>{chore.points} pts</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-2 text-gray-500"
                                onClick={() => handleDeleteChore(chore.id)}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {(chores?.length === 0) && (
                          <p className="text-center text-muted-foreground py-2">
                            No chores found
                          </p>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => navigate("/add-chore")}
                        className="w-full btn-primary"
                      >
                        Add New Chore
                      </Button>
                    </div>
                    
                    {/* Manage Rewards */}
                    <div>
                      <h2 className="section-title">
                        <i className="ri-gift-line text-secondary mr-2"></i>
                        Manage Rewards
                      </h2>
                      
                      <div className="space-y-4 mb-4">
                        {rewards?.map(reward => (
                          <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg" key={reward.id}>
                            <span className="font-bold">{reward.title}</span>
                            <div className="flex items-center">
                              <span>{reward.points} pts</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-2 text-gray-500"
                                onClick={() => handleDeleteReward(reward.id)}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {(rewards?.length === 0) && (
                          <p className="text-center text-muted-foreground py-2">
                            No rewards found
                          </p>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => navigate("/add-reward")}
                        className="w-full btn-secondary"
                      >
                        Add New Reward
                      </Button>
                    </div>
                  </TabsContent>
                  
                  {/* Approvals Tab */}
                  <TabsContent value="approvals">
                    <ChoreApprovalList />
                  </TabsContent>
                  
                  {/* Settings Tab */}
                  <TabsContent value="settings">
                    <h2 className="section-title mb-4">
                      <i className="ri-settings-4-line text-dark mr-2"></i>
                      Settings
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="daily-reminders">Daily Reminders</Label>
                        <Switch id="daily-reminders" defaultChecked />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Label htmlFor="celebrations">Celebration Animations</Label>
                        <Switch id="celebrations" defaultChecked />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span>Change Parent PIN</span>
                        <Button variant="outline" size="sm" className="text-secondary">
                          <i className="ri-lock-password-line mr-1"></i>
                          Change
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
